import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "../character";
import type { AdventureState, GmSettings, GmTurn } from "../types";
import { campaignBriefing, gurpsLifeModeOf, prefsOf } from "../types";
import { payloadToJson, serializeAdventure } from "../serializer";
import { dndRulesContext, pf2eRulesContext } from "../data/adventure-samples";
import { gurpsRulesContext } from "../data/gurps-extensions";
import { territoriesContext } from "../data/territory";
import { GM_AUTHORITY_RULES } from "../cheatGuard";
import {
  MAX_RECENT_MESSAGES,
  narratorLengthRule,
  openingLengthRule,
  streamChatWithProvider,
  type ChatMessage,
} from "./providers";
import { localRespond } from "./local";

export interface GmReply {
  text: string;
  usedFallback: boolean;
  /** When usedFallback is true in live mode: why the live AI was unavailable
   *  (provider error, bad key, CORS, empty reply…). Surfaced in the log so a
   *  silent local-narrator takeover is never mistaken for the real AI. */
  fallbackReason?: string;
}

/** Shared storytelling voice — keeps every AI backend (the server action and
 *  all client-side providers) narrating the same warm, reactive, generous way.
 *  The key contract: the narrator must visibly react to what the player wrote,
 *  never genericize it. Length follows the player's Narrator Length setting. */
function gmVoiceRules(length: GmSettings["narratorLength"]): string {
  return [
    "VOICE: You are a warm, masterful tabletop GM telling a story to one dear friend — cinematic, immediate and emotionally alive. Use concrete sensory detail (light, sound, smell, texture, weather), varied sentence rhythm, and real feeling: fear, hunger, awe, grief, humor. The world feels inhabited, and it feels like it is responding to THIS player, right now.",
    "REACT: Always react directly to what the player just wrote. Mirror their exact action, question or idea back into the scene, honor its intent, and give it visible consequences — an NPC's changed face, a shift in the air, a door standing ajar. Never ignore, genericize or soften the player's move, and never write a reply that could have been written without knowing what they said.",
    "FIRST SENTENCE RULE: Your opening sentence must directly engage the player's latest move — name it, answer it, or show its immediate effect. Never open with scenery, weather or atmosphere; the world's response to the player comes first, texture second.",
    "BRIEF INPUT: If the player writes something short, casual or in-character speech — a greeting (\"Sup?\"), a quip, a nod, \"let's go\", a single word — treat it as the character speaking or acting in-world. The NPC or world must respond to those exact words: answer a greeting with a greeting, follow \"let's go\" by actually setting out together. A brief line is still a move; it is never permission to monologue past it.",
    "NO STEAMROLL: If an NPC asked the player a question or is waiting on them, and the player replies in any way, that exchange must land before anything new happens. Never resume a prepared speech, skip past the player's words, or introduce a new event that overrides an unanswered input.",
    narratorLengthRule(length),
    "ENDINGS: Vary your endings: sometimes a single evocative question, sometimes a charged beat or a choice laid bare. Do not end every reply with a question.",
    "NO OOC: Never use bullet points, lists, headings, emojis, dice notation, or out-of-character commentary. Stay in the fiction.",
  ].join(" ");
}

function languageInstruction(language: GmSettings["language"]): string {
  return language === "pt-BR"
    ? "Escreva sempre em português brasileiro, em prosa vívida e envolvente — e reaja diretamente ao que o jogador escreveu, nunca com respostas genéricas."
    : "Always respond in English.";
}

function buildSystemPrompt(
  settings: GmSettings,
  adventure: AdventureState,
  payload: string,
  history: string[],
  lorebook: string,
  learned: string,
  memory: string,
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
    GM_AUTHORITY_RULES,
    "Narrate in second-person, in-world prose — never out of character. The player acts and the engine rolls; you bring the world to life around their choices.",
    gmVoiceRules(settings.narratorLength),
    languageInstruction(settings.language),
    "",
    adventure.system === "dnd5e"
      ? `D&D 5E RULES REFERENCE (grounds every narration in the real rules):\n${dndRulesContext()}`
      : adventure.system === "pf2e"
        ? `PATHFINDER 2E RULES & REFERENCE CORPUS (grounds every narration in the real rules):\n${pf2eRulesContext()}`
        : `GURPS RULES REFERENCE (grounds every narration in the real rules, incl. the Life & Livelihood extension):\n${gurpsRulesContext(gurpsLifeModeOf(adventure.character.adventurePrefs))}`,
    "",
    lorebook
      ? `WORLD LOREBOOK (facts about this campaign — use them when relevant):\n${lorebook}`
      : "",
    learned
      ? `LEARNED MEMORY (facts the engine has observed about this player and campaign across interactions. Treat them as established and let them shape your narration — echo callbacks, honor declared preferences, stay consistent with named NPCs and past outcomes):\n${learned}`
      : "",
    memory
      ? `SESSION MEMORY (condensed recap of the story so far — keep continuity with it):\n${memory}`
      : "",
    adventure.territories?.length
      ? territoriesContext(adventure.territories, settings.language)
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
  // Rules-governed puzzle: the spec (title, description, required checks) is
  // local fact — the AI writes the in-world flavor and one clue, but the DCs
  // and targets are decided by the rules engine, never by the model.
  if (turn.puzzle) {
    return `A puzzle blocks the way: ${turn.puzzle}.\n\nDescribe the mechanism vividly, in-world, in the voice of the current scene. Drop exactly one subtle clue. Never state the DC, the target number, or the answer outright — the player must earn it with checks.`;
  }
  if (turn.playerText && turn.dice) {
    // The engine already resolved a check — the AI must narrate that outcome.
    return `${turn.playerText}\n\n(dice result: ${turn.dice.label} — ${turn.dice.breakdown} — the outcome is already determined, narrate it faithfully)\n\nReact to the player's move specifically and narrate this resolved outcome with feeling — don't just report the numbers.`;
  }
  if (turn.playerText) {
    return `THE PLAYER'S MOVE:\n${turn.playerText}\n\nReact to this specific move: your FIRST sentence must engage it directly (answer spoken words with spoken words, show an action landing), then carry the scene forward from it. If the move is brief or casual, treat it as the character speaking/acting in-world and have the world respond to those exact words — do not steamroll past it with atmosphere or a new monologue. Never give a generic reply that could have been written without reading what they wrote. Finish your final sentence — never cut off mid-thought.`;
  }
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
    ...(adventure.territories?.length
      ? ["", territoriesContext(adventure.territories, settings.language)]
      : []),
    "",
    `${openingLengthRule(settings.narratorLength)} Place the hero at the edge of the story, introduce the setting and the first thread, and end with the immediate scene in motion. No question, no summary, no dice.`,
  ].join("\n");
  return [
    {
      role: "system",
      content: [
        "You are the opening narrator for a solo tabletop RPG running inside Oraculum, a strict rules engine.",
        `Ruleset: ${rules}.`,
        GM_AUTHORITY_RULES,
        gmVoiceRules(settings.narratorLength),
        openingLengthRule(settings.narratorLength),
        "Ground every detail in the campaign briefing below — honor the chosen tone, genre, setting, style, villain, stakes and company.",
        "Place the hero at the threshold of the story, show the setting and the first thread, then leave the scene in motion.",
        "Do not end with a question. Do not summarize the plot. Never roll dice yourself.",
        ...(adventure.system === "dnd5e"
          ? [`Rules reference: ${dndRulesContext()}`]
          : adventure.system === "pf2e"
            ? [`Rules reference: ${pf2eRulesContext()}`]
            : [`Rules reference: ${gurpsRulesContext(gurpsLifeModeOf(adventure.character.adventurePrefs))}`]),
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
    if (settings.provider === "builtin" || settings.provider === "horde") {
      const payload = payloadToJson(serializeAdventure(adventure));
      const brief = campaignBriefing(prefsOf(adventure.character.adventurePrefs));
      const res = await generate({
        payload,
        history: [brief],
        model: settings.model || undefined,
        language: settings.language,
        system: adventure.system,
        provider: settings.provider === "horde" ? "horde" : "auto",
        apiKey: settings.apiKey || undefined,
        opening: true,
        length: settings.narratorLength,
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
    let failReason = "";
    const fallback = (): GmReply => {
      const text = localRespond(turn, adventure, settings.language);
      onDelta(text);
      return { text, usedFallback: true, fallbackReason: failReason || undefined };
    };
    if (adventure.gmMode !== "live") return fallback();

    const payload = payloadToJson(serializeAdventure(adventure));
    const history = buildHistory(adventure);
    try {
      if (settings.provider === "builtin" || settings.provider === "horde") {
        const res = await generate({
          payload,
          history,
          model: settings.model || undefined,
          language: settings.language,
          system: adventure.system,
          provider: settings.provider === "horde" ? "horde" : "auto",
          apiKey: settings.apiKey || undefined,
          length: settings.narratorLength,
          learned: turn.learned || undefined,
          memory: adventure.memory || undefined,
        });
        if (res.ok && res.text) {
          onDelta(res.text);
          return { text: res.text, usedFallback: false };
        }
        failReason =
          res.code === "not_configured"
            ? "built-in provider not configured"
            : `${res.code}${res.detail ? ` — ${res.detail.slice(0, 160)}` : ""}`;
      } else {
        const system = buildSystemPrompt(
          settings,
          adventure,
          payload,
          history,
          turn.lorebook ?? "",
          turn.learned ?? "",
          adventure.memory ?? "",
        );
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
        failReason = "provider returned an empty response";
      }
    } catch (err) {
      failReason = err instanceof Error ? err.message : String(err);
      // fall through to the local narrator
    }
    return fallback();
  }

  return { respond, streamRespond, streamAiOpening };
}
