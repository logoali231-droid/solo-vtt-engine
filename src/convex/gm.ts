import { action } from "./_generated/server.js";
import { v } from "convex/values";

// Live Game Master completion endpoint (OpenAI-compatible chat completions).
// The API key lives server-side: OPENAI_API_KEY (set in the Keys/API keys UI).
export const generate = action({
  args: {
    payload: v.string(), // strict serialized adventure JSON (see src/lib/rpg/serializer.ts)
    history: v.array(v.string()), // recent narrative/player log lines (or the campaign briefing for the opening scene)
    model: v.optional(v.string()), // OpenAI model id
    language: v.optional(v.string()), // "en" | "pt-BR"
    opening: v.optional(v.boolean()), // true = generate the campaign's AI opening scene
  },
  handler: async (_ctx, args) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { ok: false, code: "not_configured" };
    }

    const lang = args.language === "pt-BR" ? "pt-BR" : "en";
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
        ].join(" ");

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
