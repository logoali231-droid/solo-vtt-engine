import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import type { AdventureState, GmSettings, GmTurn } from "../types";
import { payloadToJson, serializeAdventure } from "../serializer";
import { chatWithProvider, MAX_RECENT_MESSAGES } from "./providers";
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
    if (adventure.gmMode !== "live") {
      return { text: localRespond(turn, adventure, settings.language), usedFallback: true };
    }
    const payload = payloadToJson(serializeAdventure(adventure));
    const history = buildHistory(adventure);
    try {
      if (settings.provider === "builtin") {
        const res = await generate({
          payload,
          history,
          model: settings.model || undefined,
          language: settings.language,
        });
        if (res.ok && res.text) {
          return { text: res.text, usedFallback: false };
        }
      } else {
        const system = buildSystemPrompt(settings, adventure, payload, history, turn.lorebook ?? "");
        const messages = [
          { role: "system" as const, content: system },
          { role: "user" as const, content: buildUserPrompt(turn) },
        ];
        const text = await chatWithProvider(settings, messages);
        if (text) return { text, usedFallback: false };
      }
    } catch {
      // fall through to the local narrator
    }
    return { text: localRespond(turn, adventure, settings.language), usedFallback: true };
  }

  return { respond };
}
