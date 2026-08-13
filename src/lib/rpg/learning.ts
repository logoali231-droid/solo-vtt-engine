// ============================================================================
// Oraculum — Code-based learning engine ("GM that learns").
//
// The AI models themselves are stateless: no fine-tuning, no reinforcement.
// Instead this module makes the game *mechanically* learn from every
// interaction, the same way a real GM takes notes at the table:
//
//   1. EXTRACT — after each player move + GM reply, deterministic rules pull
//      structured facts out of the conversation (stances/preferences the
//      player declared, resolved check outcomes, NPCs the story introduced,
//      enemies defeated).
//   2. CONSOLIDATE — facts merge by key; repetition raises confidence,
//      staleness decays it, and the list is capped so it can't grow forever.
//   3. INJECT — the surviving facts are compiled into a compact context block
//      that is fed into EVERY subsequent GM prompt (client providers and the
//      Convex action alike), so the narrator visibly remembers and adapts to
//      what has already happened and how the player plays.
//
// Everything is deterministic, cheap (runs in <1ms), and pure — no LLM calls,
// so it works for every provider including the free/local ones.
// ============================================================================

import type { AdventureState, DiceResult, LearnedFact, LearnedFactCategory } from "./types";
import { estimateTokens } from "./gm/providers";

export const MAX_LEARNED_FACTS = 60;
export const MAX_LEARNED_TOKENS = 700;

// ---------------------------------------------------------------------------
// Extractors — high-precision rules, not NLP guesswork
// ---------------------------------------------------------------------------

/** First-person verbs that reveal a player stance, mapped to 3rd-person forms. */
const STANCE_VERBS: Record<string, string> = {
  want: "wants",
  wish: "wishes",
  hope: "hopes",
  prefer: "prefers",
  need: "needs",
  refuse: "refuses",
  avoid: "avoids",
  hate: "hates",
  love: "loves",
  trust: "trusts",
  distrust: "distrusts",
  fear: "fears",
  seek: "seeks",
  plan: "plans",
  intend: "intends",
  vow: "vows",
  promise: "promises",
  swear: "swears",
  believe: "believes",
  suspect: "suspects",
  doubt: "doubts",
};

const STANCE_RE =
  /\bI(?:'d| would)? (?:really |definitely |absolutely |always |never )?(want|wish|hope|prefer|need|refuse|avoid|hate|love|trust|distrust|fear|seek|plan|intend|vow|promise|swear|believe|suspect|doubt)\b/i;

/** "I want X" sentences → durable preference/behavior facts. */
function extractStances(playerText: string | undefined, now: number): LearnedFact[] {
  if (!playerText) return [];
  const out: LearnedFact[] = [];
  for (const raw of playerText.split(/(?<=[.!?])\s+/)) {
    const sentence = raw.replace(/^["'*\-–—\s]*/, "").trim();
    if (!STANCE_RE.test(sentence)) continue;
    // Rebuild the sentence in third person: "I want to find the temple" →
    // "The hero wants to find the temple".
    const hero = sentence.replace(/^I(?:'d| would)?\b/, "the hero");
    let text = hero
      // Conjugate the first stance verb to 3rd person: "the hero want" → "the hero wants".
      .replace(/\b(want|wish|hope|prefer|need|refuse|avoid|hate|love|trust|distrust|fear|seek|plan|intend|vow|promise|swear|believe|suspect|doubt)\b/gi, (v) => {
        const conj = STANCE_VERBS[v.toLowerCase()];
        return conj ?? v;
      })
      // Multi-clause sentences keep a second "I" — normalize to stay in 3rd person.
      .replace(/\sI(?=\s)/gi, " the hero");
    if (!/^the hero\b/i.test(text)) continue;
    // Drop trivial statements that carry no information.
    if (text.length < 18) continue;
    if (/(the hero (wants|needs|hopes) (to go|to leave|to rest|out|to stop|more))\.?$/i.test(text)) continue;
    text = text.charAt(0).toUpperCase() + text.slice(1);
    text = text.replace(/[.!?]+$/, "") + ".";
    const isHabit = /always|never/i.test(sentence);
    out.push(
      fact(
        isHabit ? "behavior" : "preference",
        text,
        now,
        text.toLowerCase().replace(/\s+/g, " "),
      ),
    );
  }
  return out;
}

const OUTCOME_KINDS = new Set(["skill", "save", "check", "attack"]);

/** Resolved dice results → durable outcome facts ("failed a Stealth check"). */
function extractOutcomes(dice: DiceResult | undefined, now: number): LearnedFact[] {
  if (!dice || !OUTCOME_KINDS.has(dice.kind)) return [];
  const verb =
    dice.outcome === "critical-success"
      ? "critically succeeded"
      : dice.outcome === "success"
        ? "succeeded"
        : dice.outcome === "critical-failure"
          ? "critically failed"
          : "failed";
  const dc = typeof dice.target === "number" ? ` (DC ${dice.target})` : "";
  const text = `The hero ${verb} a ${dice.label.toLowerCase()} check${dc}.`;
  return [
    fact("outcome", text, now, `${dice.outcome}::${dice.label.toLowerCase()}`),
  ];
}

const SPEECH_VERB_RE =
  /\b(?:says|said|asks|asked|tells|told|calls|called|greets|greeted|meets|met|names|named|introduces|introduced|addresses|addressed|follows|followed|befriends|befriended)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/g;

/** Names that are clearly treated as NPCs (speech verbs or recurring across logs). */
function extractNpcs(
  gmText: string | undefined,
  adventure: AdventureState,
  now: number,
): LearnedFact[] {
  const candidates = new Map<string, number>();
  const consider = (name: string) => {
    const n = name.trim();
    if (n.length < 2 || n.length > 28) return;
    if (NPC_STOPLIST.has(n.toLowerCase())) return;
    if (n.toLowerCase() === adventure.character.name.toLowerCase()) return;
    candidates.set(n.toLowerCase(), (candidates.get(n.toLowerCase()) ?? 0) + 1);
  };

  if (gmText) {
    for (const m of gmText.matchAll(SPEECH_VERB_RE)) consider(m[1]);
  }
  // Recurring capitalized names across the last 12 narrative entries also
  // qualify (an NPC the story keeps coming back to).
  const window = adventure.logs
    .filter((l) => l.kind === "gm" || l.kind === "player")
    .slice(-12)
    .map((l) => l.text);
  for (const text of [...window, gmText ?? ""]) {
    for (const m of text.matchAll(/[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?/g)) {
      const token = m[0];
      if (token.startsWith("The ")) continue;
      consider(token);
    }
  }

  const out: LearnedFact[] = [];
  for (const [key, count] of candidates) {
    if (count < 2) continue; // must recur or be dialog-tagged
    const display = key
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    out.push(
      fact("npc", `The hero has interacted with ${display}.`, now, `npc::${key}`),
    );
  }
  return out;
}

const KILL_RE =
  /\b(?:defeat(?:ed|s)?|slain|kill(?:ed|s)?|vanquish(?:ed|es)?|best(?:ed|s)?)\s+(?:(?:the|a|an|his|her|its|their|your)\s+)?(?:[a-z]+(?:\s+[a-z]+)*\s+)*([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/g;

/** Named kills in the GM text or combat log → combat facts. */
function extractKills(
  gmText: string | undefined,
  adventure: AdventureState,
  now: number,
): LearnedFact[] {
  const out: LearnedFact[] = [];
  const seen = new Set<string>();
  const absorb = (text: string) => {
    for (const m of text.matchAll(KILL_RE)) {
      const name = m[1];
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (name.toLowerCase() === adventure.character.name.toLowerCase()) continue;
      out.push(
        fact("combat", `The hero defeated ${name} in combat.`, now, `combat::${key}`),
      );
    }
  };
  absorb(gmText ?? "");
  for (const l of adventure.logs.slice(-8)) {
    if (l.kind === "combat") absorb(l.text);
  }
  return out;
}

const NPC_STOPLIST = new Set([
  "the", "and", "but", "or", "so", "yet", "for", "nor", "not", "no", "yes",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
  "my", "your", "her", "his", "its", "our", "their", "a", "an", "to", "of",
  "in", "on", "at", "by", "with", "from", "as", "is", "are", "was", "were",
  "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "can", "could", "should", "may", "might", "must", "there", "here",
  "now", "then", "when", "where", "why", "how", "one", "two", "first", "last",
  "oh", "ah", "well", "ok", "okay", "hey", "good", "great", "fine", "right",
  "gm", "ai", "dc", "hp", "ac", "xp", "d&d", "pf2e", "gurps", "oraculum",
  "horde", "groq", "ollama", "gemini", "openai", "openrouter", "huggingface",
  "convex", "freebuff", "google", "january", "february", "march", "april",
  "may", "june", "july", "august", "september", "october", "november",
  "december", "monday", "tuesday", "wednesday", "thursday", "friday",
  "saturday", "sunday", "english", "portuguese", "hero", "heroes", "player",
  "god", "gods", "world", "dungeon", "village", "town", "city", "tavern",
  "castle", "king", "queen", "lord", "lady", "knight", "guard", "captain",
  "priest", "wizard", "mage", "rogue", "fighter", "cleric", "druid", "bard",
  "ranger", "sorcerer", "warlock", "monk", "paladin", "barbarian", "artificer",
]);

function fact(
  category: LearnedFactCategory,
  text: string,
  now: number,
  key: string,
): LearnedFact {
  return {
    id: `${category}-${key.replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`,
    category,
    text,
    confidence: 0.45,
    firstSeen: now,
    lastSeen: now,
    count: 1,
    key,
  };
}

// ---------------------------------------------------------------------------
// Consolidation — merge, reinforce, decay, cap
// ---------------------------------------------------------------------------

/** Score used for ordering: confidence weighted by recency (fresh beats old). */
function score(f: LearnedFact, now: number): number {
  const ageDays = (now - f.lastSeen) / 86_400_000;
  const recency = Math.max(0.5, 1 - ageDays / 7);
  return f.confidence * recency;
}

export function consolidateFacts(
  existing: LearnedFact[],
  fresh: LearnedFact[],
  now: number,
  cap = MAX_LEARNED_FACTS,
): LearnedFact[] {
  const map = new Map<string, LearnedFact>();
  for (const f of existing) map.set(f.key, f);
  for (const f of fresh) {
    const prev = map.get(f.key);
    if (prev) {
      prev.count += 1;
      prev.lastSeen = now;
      prev.confidence = Math.min(0.95, prev.confidence + 0.12);
      if (f.text !== prev.text && prev.count > 1) prev.text = f.text;
    } else {
      map.set(f.key, { ...f });
    }
  }
  const list = [...map.values()];
  // Gentle decay: facts untouched for over an hour lose a little confidence.
  for (const f of list) {
    const staleH = (now - f.lastSeen) / 3_600_000;
    if (staleH > 1) f.confidence = Math.max(0.2, f.confidence - 0.04 * Math.floor(staleH));
  }
  list.sort((a, b) => score(b, now) - score(a, now));
  return list.slice(0, cap);
}

// ---------------------------------------------------------------------------
// Compilation — the block that gets injected into every GM prompt
// ---------------------------------------------------------------------------

export function compileLearnedContext(
  facts: LearnedFact[],
  now = Date.now(),
  maxTokens = MAX_LEARNED_TOKENS,
): string {
  if (facts.length === 0) return "";
  const sorted = [...facts].sort((a, b) => score(b, now) - score(a, now));
  const lines: string[] = [];
  let budget = maxTokens;
  for (const f of sorted) {
    const line = `• ${f.text}`;
    const cost = estimateTokens(line);
    if (budget - cost < 0) break;
    budget -= cost;
    lines.push(line);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Public entry point — run after every player move + GM reply
// ---------------------------------------------------------------------------

export function learnFromInteraction(input: {
  playerText?: string;
  dice?: DiceResult;
  gmText?: string;
  adventure: AdventureState;
  existing: LearnedFact[];
  now?: number;
}): LearnedFact[] {
  const now = input.now ?? Date.now();
  const fresh: LearnedFact[] = [
    ...extractStances(input.playerText, now),
    ...extractOutcomes(input.dice, now),
    ...extractNpcs(input.gmText, input.adventure, now),
    ...extractKills(input.gmText, input.adventure, now),
  ];
  if (fresh.length === 0) return input.existing;
  return consolidateFacts(input.existing, fresh, now);
}
