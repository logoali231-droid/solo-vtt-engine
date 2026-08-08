import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "../character";
import type { AdventureState, GmSettings, GmTurn } from "../types";
import { campaignBriefing, prefsOf } from "../types";
import { payloadToJson, serializeAdventure } from "../serializer";
import { dndRulesContext } from "../data/adventure-samples";
import { MAX_RECENT_MESSAGES, streamChatWithProvider, type ChatMessage } from "./providers";
import { localRespond } from "./local";

export interface GmReply {
  text: string;
  usedFallback: boolean;
}

function languageInstruction(language: GmSettings["language"]): string {
  return language === "pt-BR"
    ? "Narre sempre em português brasileiro, com tom envolvente e imagens vívidas."
    : "Always respond in English.";
}

function buildSystemPrompt(
  settings: GmSettings,
  adventure: AdventureState,
  payload: string,
  history: string[],
  lorebook: string,
): string {
  const rules =
    adventure.system === "dnd5e"
      ? "D&D 5e (PHB + Xanathar's + Tasha's Cauldron of Everything)"
      : adventure.system === "pf2e"
        ? "Pathfinder 2e (Core Rulebook)"
        : "GURPS 4e (Basic Set)";
  return [
    "You are the Game Master for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
    `Ruleset: ${rules}. The player acts and the engine rolls dice — you never roll yourself.`,
    "Honor the JSON adventure state exactly: HP, AC, spell slots, resources, conditions and outcomes (critical/success/failure).",
    "Narrate in vivid second-person prose, 2-5 short paragraphs, advancing the scene. NPCs have desires and secrets.",
    "End each response with a single evocative question or hook for the player's next move.",
    languageInstruction(settings.language),
    "",
    adventure.system === "dnd5e" ? `D&D 5E RULES REFERENCE (grounds every narration in the real rules):\n${dndRulesContext()}` : "",
    "",
    lorebook
      ? `WORLD LOREBOOK (facts about this campaign — use them when relevant):\n${lorebook}`
      : "",
    "",
    "RECENT HISTORY (the story so far):",
    history.slice(-MAX_RECENT_MESSAGES).join("\n") || "(the adventure just began)",
    "",
    "ADVENTURE STATE (strict JSON — the single source of truth for mechanics):",
    payload,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUserPrompt(turn: GmTurn): string {
  if (turn.playerText && turn.dice) {
    // The engine already resolved a check — the AI must narrate that outcome.
    return `${turn.playerText}\n\n(dice result: ${turn.dice.label} — ${turn.dice.breakdown} — the outcome is already determined, narrate it faithfully)`;
  }
  if (turn.playerText) return turn.playerText;
  if (turn.action) return `(the player takes the action "${turn.action}")`;
  if (turn.dice) {
    return `(dice result: ${turn.dice.label} — ${turn.dice.breakdown})`;
  }
  return "(the player waits for the scene to advance)";
}

function buildHistory(adventure: AdventureState): string[] {
  return adventure.logs
    .filter((l) => l.kind === "gm" || l.kind === "player" || l.kind === "combat")
    .slice(-14)
    .map((l) => l.text);
}

/** Short human-readable descriptor of the hero, for the AI opening scene. */
function characterDescriptor(adventure: AdventureState): string {
  const c = adventure.character;
  if (c.system === "dnd5e") {
    const d = getDndDerived(c);
    return `${c.name}, a level ${c.level} ${d.raceName} ${d.className} (${d.subclassName})`;
  }
  if (c.system === "pf2e") {
    const d = getPf2eDerived(c);
    return `${c.name}, a level ${c.level} ${d.ancestryName} ${d.className}`;
  }
  return `${c.name}, a ${getGurpsDerived(c).pointTotal}-point GURPS adventurer`;
}

function buildOpeningMessages(
  settings: GmSettings,
  adventure: AdventureState,
): ChatMessage[] {
  const brief = campaignBriefing(prefsOf(adventure.character.adventurePrefs));
  const rules =
    adventure.system === "dnd5e"
      ? "D&D 5e (PHB + Xanathar's + Tasha's Cauldron of Everything)"
      : adventure.system === "pf2e"
        ? "Pathfinder 2e (Core Rulebook)"
        : "GURPS 4e (Basic Set)";
  const hero = characterDescriptor(adventure);
  const userContent = [
    `Ruleset: ${rules}.`,
    `Hero: ${hero}.`,
    "",
    "CAMPAIGN BRIEFING (from the player's Adventure Setup — honor every choice):",
    brief,
    "",
    "Write the opening scene of this campaign: 2-4 vivid second-person paragraphs that place the hero at the edge of the story, introduce the setting and the first thread, and end with the immediate scene in motion. No question, no summary, no dice.",
  ].join("\n");
  return [
    {
      role: "system",
      content: [
        "You are the opening narrator for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
        `Ruleset: ${rules}.`,
        "Write the opening scene of this campaign: 2-4 vivid second-person paragraphs.",
        "Ground every detail in the campaign briefing below — honor the chosen tone, genre, setting, style, villain, stakes and company.",
        "Place the hero at the threshold of the story, show the setting and the first thread, then leave the scene in motion.",
        "Do not end with a question. Do not summarize the plot. Never roll dice yourself.",
        languageInstruction(settings.language),
      ].join(" "),
    },
    { role: "user", content: userContent },
  ];
}

/** Live GM: routes to the configured provider via the Convex action (builtin)
 *  or direct client-side calls (Groq / Gemini / HF / OpenRouter / Ollama).
 *  Falls back to the local narrator when unconfigured or on any error, so the
 *  game never dead-ends. All provider config lives in localStorage. */
export function useGmClient(settings: GmSettings) {
  const generate = useAction(api.gm.generate);

  async function respond(
    turn: GmTurn,
    adventure: AdventureState,
  ): Promise<GmReply> {
    return streamRespond(turn, adventure, () => undefined);
  }

  /** Generate the campaign's opening scene from the AI, grounded in the
   *  Adventure Setup choices. Throws on any failure so the caller keeps the
   *  local template opening untouched. */
  async function streamAiOpening(
    adventure: AdventureState,
    onDelta: (text: string) => void,
  ): Promise<GmReply> {
    if (settings.provider === "builtin") {
      const payload = payloadToJson(serializeAdventure(adventure));
      const brief = campaignBriefing(prefsOf(adventure.character.adventurePrefs));
      const res = await generate({
        payload,
        history: [brief],
        model: settings.model || undefined,
        language: settings.language,
        system: adventure.system,
        opening: true,
      });
      if (res.ok && res.text) {
        onDelta(res.text);
        return { text: res.text, usedFallback: false };
      }
      throw new Error(
        res.code === "not_configured"
          ? "builtin provider not configured"
          : res.detail || res.code,
      );
    }
    const messages = buildOpeningMessages(settings, adventure);
    let acc = "";
    const text = await streamChatWithProvider(settings, messages, (chunk) => {
      acc += chunk;
      onDelta(acc);
    });
    if (!text) throw new Error("empty opening from provider");
    return { text, usedFallback: false };
  }

  /** Same as respond, but streams tokens to onDelta as they arrive (typing
   *  effect in the narrative hub). onDelta receives the accumulated text. */
  async function streamRespond(
    turn: GmTurn,
    adventure: AdventureState,
    onDelta: (text: string) => void,
  ): Promise<GmReply> {
    const fallback = (): GmReply => {
      const text = localRespond(turn, adventure, settings.language);
      onDelta(text);
      return { text, usedFallback: true };
    };
    if (adventure.gmMode !== "live") return fallback();

    const payload = payloadToJson(serializeAdventure(adventure));
    const history = buildHistory(adventure);
    try {
      if (settings.provider === "builtin") {
        const res = await generate({
          payload,
          history,
          model: settings.model || undefined,
          language: settings.language,
          system: adventure.system,
        });
        if (res.ok && res.text) {
          onDelta(res.text);
          return { text: res.text, usedFallback: false };
        }
      } else {
        const system = buildSystemPrompt(settings, adventure, payload, history, turn.lorebook ?? "");
        const messages = [
          { role: "system" as const, content: system },
          { role: "user" as const, content: buildUserPrompt(turn) },
        ];
        let acc = "";
        const text = await streamChatWithProvider(settings, messages, (chunk) => {
          // onDelta receives the full accumulated text so the log entry can
          // be replaced wholesale (cheap and avoids ordering bugs).
          acc += chunk;
          onDelta(acc);
        });
        if (text) return { text, usedFallback: false };
      }
    } catch {
      // fall through to the local narrator
    }
    return fallback();
  }

  return { respond, streamRespond, streamAiOpening };
}
