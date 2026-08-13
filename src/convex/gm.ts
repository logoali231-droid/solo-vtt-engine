import { action } from "./_generated/server.js";
import { v } from "convex/values";
import { dndRulesContext, pf2eRulesContext } from "../lib/rpg/data/adventure-samples";
import { GM_AUTHORITY_RULES } from "../lib/rpg/cheatGuard";
import { parseHordeStatus } from "../lib/rpg/gm/providers";

/** Shared storytelling voice — mirrors gm/live.ts so the server action and the
 *  client-side providers narrate the same warm, reactive, generous way. The
 *  key contract: the narrator must visibly react to what the player wrote. */
const GM_VOICE_RULES = [
  "VOICE: You are a warm, masterful tabletop GM telling a story to one dear friend — cinematic, immediate and emotionally alive. Use concrete sensory detail (light, sound, smell, texture, weather), varied sentence rhythm, and real feeling: fear, hunger, awe, grief, humor. The world feels inhabited, and it feels like it is responding to THIS player, right now.",
  "REACT: Always react directly to what the player just wrote. Mirror their exact action, question or idea back into the scene, honor its intent, and give it visible consequences — an NPC's changed face, a shift in the air, a door standing ajar. Never ignore, genericize or soften the player's move, and never write a reply that could have been written without knowing what they said.",
  "LENGTH: Write one substantial passage of 3-6 paragraphs — enough to live in the moment. No padding, no recaps, no filler: every sentence advances or deepens the scene. Vary your endings: sometimes a single evocative question, sometimes a charged beat or a choice laid bare. Do not end every reply with a question.",
  "NO OOC: Never use bullet points, lists, headings, emojis, dice notation, or out-of-character commentary. Stay in the fiction.",
].join(" ");

// Live Game Master completion endpoint — multi-provider router.
//   - "openai" (default): OpenAI chat completions. The key lives server-side:
//     OPENAI_API_KEY (set in the Keys/API keys UI).
//   - "horde": AI Horde — 100% free, community-hosted GPUs, NO key required
//     (anonymous works; an optional registered key raises queue priority).
//   - "auto": use OpenAI when OPENAI_API_KEY is configured, otherwise fall back
//     to AI Horde so the built-in provider always has a working backend.
// Returns { ok, text, code?, detail? } in every path.

export const HORDE_DEFAULT_MODEL = "koboldcpp/L3-8B-Stheno-v3.2-IQ3_S-imat";

const HORDE_API = "https://aihorde.net/api/v2";
const HORDE_TIMEOUT_MS = 4 * 60 * 1000; // queues can be long — give up after 4 min
const HORDE_POLL_MS = 2000;

/** Serialize system+user turns into the ChatML-style prompt Horde models expect. */
function hordePrompt(system: string, user: string): string {
  return [
    `<|im_start|>system\n${system}\n<|im_end|>`,
    `<|im_start|>user\n${user}\n<|im_end|>`,
    "<|im_start|>assistant\n",
  ].join("\n");
}

/** Live availability check — AI Horde is an open volunteer network: a model
 *  only works while a worker is currently hosting it. GET /status/models
 *  returns exactly what is running right now. No auth required. */
export const hordeStatus = action({
  args: {
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    try {
      const res = await fetch(`${HORDE_API}/status/models`, {
        headers: { "Client-Agent": "Oraculum-SoloVTT/1.0" },
      });
      if (!res.ok) {
        return {
          ok: false,
          code: `horde_status_${res.status}`,
          detail: `AI Horde status check failed (${res.status})`,
          selected: null,
          models: [],
        };
      }
      const raw = await res.json();
      return {
        ok: true,
        checkedAt: Date.now(),
        ...parseHordeStatus(raw, args.model),
      };
    } catch (err) {
      return {
        ok: false,
        code: "network_error",
        detail: err instanceof Error ? err.message : String(err),
        selected: null,
        models: [],
      };
    }
  },
});

/** AI Horde async-job completion: submit, then poll until finished/timeout. */
async function hordeGenerate(
  system: string,
  user: string,
  model: string,
  apiKey: string,
): Promise<{ ok: boolean; text?: string; code?: string; detail?: string }> {
  // The v2 API requires an `apikey` header; anonymous users use the special
  // 0000000000 token. A free registered key at aihorde.net raises priority.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Agent": "Oraculum-SoloVTT/1.0",
  };
  headers.apikey = apiKey || "0000000000";
  try {
    const submit = await fetch(`${HORDE_API}/generate/text/async`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt: hordePrompt(system, user),
        params: {
          max_length: 850,
          temperature: 1,
          n: 1,
          top_p: 0.9,
          rep_pen: 1.08,
        },
        models: [model],
      }),
    });
    if (!submit.ok) {
      const body = await submit.json().catch(() => null);
      return {
        ok: false,
        code: `horde_http_${submit.status}`,
        detail: body?.message ?? submit.statusText,
      };
    }
    const job = await submit.json();
    if (!job?.id) {
      return { ok: false, code: "horde_no_job", detail: "AI Horde did not return a job id" };
    }

    const deadline = Date.now() + HORDE_TIMEOUT_MS;
    for (;;) {
      const statusRes = await fetch(`${HORDE_API}/generate/text/status/${job.id}`);
      if (!statusRes.ok) {
        return { ok: false, code: `horde_status_${statusRes.status}` };
      }
      const status = await statusRes.json();
      if (status?.message) {
        return { ok: false, code: "horde_rejected", detail: String(status.message) };
      }
      const text: string = status?.generations?.[0]?.text ?? "";
      if (status?.finished) {
        const trimmed = text.trim();
        if (!trimmed) return { ok: false, code: "horde_empty" };
        return { ok: true, text: trimmed };
      }
      if (Date.now() > deadline) {
        return {
          ok: false,
          code: "horde_timeout",
          detail:
            "AI Horde is still queued (the network is busy). Try a smaller model or try again later.",
        };
      }
      await new Promise((r) => setTimeout(r, HORDE_POLL_MS));
    }
  } catch (err) {
    return {
      ok: false,
      code: "network_error",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export const generate = action({
  args: {
    payload: v.string(), // strict serialized adventure JSON (see src/lib/rpg/serializer.ts)
    history: v.array(v.string()), // recent narrative/player log lines (or the campaign briefing for the opening scene)
    model: v.optional(v.string()), // model id for the selected backend
    language: v.optional(v.string()), // "en" | "pt-BR"
    system: v.optional(v.string()), // "dnd5e" | "pf2e" | "gurps" — gates the injected rules corpus
    provider: v.optional(v.string()), // "auto" | "openai" | "horde"
    apiKey: v.optional(v.string()), // optional AI Horde key (priority); OpenAI uses the env key
    opening: v.optional(v.boolean()), // true = generate the campaign's AI opening scene
  },
  handler: async (_ctx, args) => {
    const lang = args.language === "pt-BR" ? "pt-BR" : "en";
    const provider =
      args.provider === "openai" || args.provider === "horde"
        ? args.provider
        : process.env.OPENAI_API_KEY
          ? "openai"
          : "horde";

    const system = args.opening
      ? [
          "You are the opening narrator for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
          GM_AUTHORITY_RULES,
          GM_VOICE_RULES,
          "Write the opening scene of this campaign: a vivid second-person passage of 3-5 paragraphs rich with sensory detail.",
          "Ground the scene in the ADVENTURE STATE and RECENT HISTORY (the player's campaign briefing) below — honor the chosen tone, genre, setting, style, villain, stakes and company.",
          "Place the hero at the threshold of the story, show the setting and the first thread, then leave the scene in motion.",
          "Do not end with a question. Do not summarize the plot. Never roll dice yourself; the engine rolls.",
          ...(args.system === "dnd5e"
            ? [`\n\nD&D 5E RULES REFERENCE (grounds every narration in the real rules):\n${dndRulesContext()}`]
            : args.system === "pf2e"
              ? [`\n\nPATHFINDER 2E RULES & REFERENCE CORPUS (grounds every narration in the real rules):\n${pf2eRulesContext()}`]
              : []),
          lang === "pt-BR"
            ? "Escreva sempre em português brasileiro, com tom envolvente e imagens vívidas."
            : "Always respond in English.",
        ].join(" ")
      : [
          "You are the Game Master for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
          GM_AUTHORITY_RULES,
          "The player supplies actions and dice results; you narrate them in vivid second-person prose. Never roll dice yourself; the engine rolls.",
          "Respect the mechanics in the payload exactly: honor success/failure/critical outcomes, DCs, HP, spell slots, conditions and resources. Keep continuity with the history.",
          GM_VOICE_RULES,
          lang === "pt-BR"
            ? "Narre sempre em português brasileiro, com tom envolvente e imagens vívidas."
            : "Always respond in English.",
          args.system === "dnd5e"
            ? `\n\nD&D 5E RULES REFERENCE (grounds every narration in the real rules):\n${dndRulesContext()}`
            : args.system === "pf2e"
              ? `\n\nPATHFINDER 2E RULES & REFERENCE CORPUS (grounds every narration in the real rules):\n${pf2eRulesContext()}`
              : null,
        ]
          .filter((x): x is string => !!x)
          .join(" ");

    // The last history line is the player's most recent move — surface it
    // explicitly so the narrator always reacts to what was just written
    // instead of treating it as one more log entry.
    const latestMove = args.opening ? undefined : args.history[args.history.length - 1];
    const user = [
      args.opening ? "OPENING SCENE REQUEST — write the opening of this campaign now." : null,
      "ADVENTURE STATE (strict JSON):",
      args.payload,
      "",
      "RECENT HISTORY:",
      args.history.slice(-16, args.opening ? undefined : -1).join("\n") || "(the adventure just began)",
      ...(latestMove
        ? [
            "",
            "THE PLAYER'S LATEST MOVE (react to this specifically — mirror it, honor its intent, and let the world visibly respond):",
            latestMove,
          ]
        : []),
      "",
      "Respond with your GM narration only.",
    ]
      .filter((x): x is string => !!x)
      .join("\n");

    if (provider === "horde") {
      const model =
        args.model && args.model !== "gpt-4o-mini" ? args.model : HORDE_DEFAULT_MODEL;
      return hordeGenerate(system, user, model, args.apiKey ?? "");
    }

    // OpenAI backend — key is read server-side only.
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { ok: false, code: "not_configured" };
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: args.model || "gpt-4o-mini",
          temperature: 1,
          max_tokens: 850,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, code: `http_${res.status}`, detail: body.slice(0, 300) };
      }

      const data = await res.json();
      const text: string =
        data?.choices?.[0]?.message?.content?.trim?.() ?? "";
      if (!text) return { ok: false, code: "empty_response" };
      return { ok: true, text };
    } catch (err) {
      return {
        ok: false,
        code: "network_error",
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
