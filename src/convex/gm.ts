import { action } from "./_generated/server.js";
import { v } from "convex/values";

// Live Game Master completion endpoint (OpenAI-compatible chat completions).
// The API key lives server-side: OPENAI_API_KEY (set in the Keys/API keys UI).
export const generate = action({
  args: {
    payload: v.string(), // strict serialized adventure JSON (see src/lib/rpg/serializer.ts)
    history: v.array(v.string()), // recent narrative/player log lines
    model: v.optional(v.string()), // OpenAI model id
    language: v.optional(v.string()), // "en" | "pt-BR"
  },
  handler: async (_ctx, args) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { ok: false, code: "not_configured" };
    }

    const lang = args.language === "pt-BR" ? "pt-BR" : "en";
    const system = [
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
      "ADVENTURE STATE (strict JSON):",
      args.payload,
      "",
      "RECENT HISTORY:",
      args.history.slice(-16).join("\n") || "(the adventure just began)",
      "",
      "Respond with your GM narration only.",
    ].join("\n");

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
