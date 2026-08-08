import { action } from "./_generated/server.js";
import { v } from "convex/values";
import { dndRulesContext } from "../lib/rpg/data/adventure-samples";

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
          max_length: 650,
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
          "Write the opening scene of this campaign: 2-4 vivid second-person paragraphs.",
          "Ground the scene in the ADVENTURE STATE and RECENT HISTORY (the player's campaign briefing) below — honor the chosen tone, genre, setting, style, villain, stakes and company.",
          "Place the hero at the threshold of the story, show the setting and the first thread, then leave the scene in motion.",
          "Do not end with a question. Do not summarize the plot. Never roll dice yourself; the engine rolls.",
          lang === "pt-BR"
            ? "Escreva sempre em português brasileiro, com tom envolvente e imagens vívidas."
            : "Always respond in English.",
        ].join(" ")
      : [
          "You are the Game Master for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
          "The player supplies actions and dice results. You provide vivid, second-person narration in 2-5 short paragraphs.",
          "Respect the mechanics in the payload exactly: honor success/failure/critical outcomes, DCs, HP, spell slots, conditions and resources.",
          "Keep continuity with the history. Advance a believable fantasy scene. Never roll dice yourself; the engine rolls.",
          "End each response with a single evocative question or hook for the player's next move.",
          lang === "pt-BR"
            ? "Narre sempre em português brasileiro, com tom envolvente e imagens vívidas."
            : "Always respond in English.",
          args.system === "dnd5e"
            ? `\n\nD&D 5E RULES REFERENCE (grounds every narration in the real rules):\n${dndRulesContext()}`
            : null,
        ]
          .filter((x): x is string => !!x)
          .join(" ");

    const user = [
      args.opening ? "OPENING SCENE REQUEST — write the opening of this campaign now." : null,
      "ADVENTURE STATE (strict JSON):",
      args.payload,
      "",
      "RECENT HISTORY:",
      args.history.slice(-16).join("\n") || "(the adventure just began)",
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
          max_tokens: 650,
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
