// ============================================================================
// Oraculum — Skill intent detection.
// Maps free-text player commands ("I go investigate the warehouse") to the
// rules-compliant check for the active system, so the dice engine resolves the
// outcome instead of the GM inventing one. Returns a RollRequest that flows
// through the exact same engine path as a sheet click (conditions, proficiency,
// ranks, DC and advantage/disadvantage all apply).
// ============================================================================

import { getDndDerived, getGurpsDerived, getPf2eDerived } from "./character";
import { GURPS_SKILL_MAP } from "./data/gurps";
import { PF2E_SKILL_MAP } from "./data/pf2e";
import type {
  AbilityId,
  AdventureState,
  DnDCharacter,
  GurpsCharacter,
  Pf2eCharacter,
} from "./types";
import type { RollRequest } from "@/pages/game/types";

interface SkillRule {
  /** Skill id, or "" for a plain attribute roll (GURPS). */
  skill: string;
  ability: AbilityId;
  label: string;
  re: RegExp;
}

/** GURPS attribute codes (the roll engine only needs gurpsTarget, not ability). */
type GurpsAttr = "st" | "dx" | "iq" | "ht";

interface GurpsRule {
  /** Skill id, or "" for a plain attribute roll. */
  skill: string;
  ability: GurpsAttr;
  label: string;
  re: RegExp;
}

// ---------------------------------------------------------------------------
// D&D 5e — PHB skills. Ordered: more specific patterns win first.
// ---------------------------------------------------------------------------
const DND_RULES: SkillRule[] = [
  { skill: "sleight-of-hand", ability: "dex", label: "Sleight of Hand", re: /pickpocket|pick (a |the )?pocket|pick (the )?lock|lockpick|sleight|\bpalm\b/ },
  { skill: "stealth", ability: "dex", label: "Stealth", re: /\bsneak\b|\bhide\b|\bcreep\b|stealth|slip past|move silently|conceal/ },
  { skill: "investigation", ability: "int", label: "Investigation", re: /investigat|examin|inspect|\bdeduc|figure out|\bclues?\b|look into|search (the|a|this|for)|scour/ },
  { skill: "perception", ability: "wis", label: "Perception", re: /look around|look for|\bspot\b|\bnotice\b|\blisten\b|\bhear\b|\bwatch\b|\bscan\b|\bpeer\b|perceiv|sense motive/ },
  { skill: "athletics", ability: "str", label: "Athletics", re: /\bclimb\b|\bjump\b|\bswim\b|\blift\b|\bpush\b|\bpull\b|break (down|open)|force (open|the door)|grapple|\bshove\b|\bdrag\b/ },
  { skill: "acrobatics", ability: "dex", label: "Acrobatics", re: /\bbalance\b|\btumble\b|\bdodge\b|somersault|squeeze through/ },
  { skill: "persuasion", ability: "cha", label: "Persuasion", re: /persuad|convinc|negotiat|barter|\bcharm\b|sweet-?talk|talk (down|into)|bargain/ },
  // Animal Handling sits BEFORE Intimidation: "calm the frightened horse" is
  // handling the animal, not intimidating it. It needs a handling ACTION plus
  // an animal, so "recall knowledge about this beast" still routes to Nature.
  { skill: "animal-handling", ability: "wis", label: "Animal Handling", re: /\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b.*\b(animal|beast|horse|creature)\b|\b(animal|beast|horse|creature)\b.*\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b/ },
  { skill: "intimidation", ability: "cha", label: "Intimidation", re: /intimidat|threaten|\bscare\b|\bfrighten\b|menace|browbeat/ },
  { skill: "deception", ability: "cha", label: "Deception", re: /\blie\b|\bbluff\b|deceiv|mislead|disguise|pretend|feign/ },
  { skill: "insight", ability: "wis", label: "Insight", re: /\binsight\b|read (him|her|them|the room)|gauge|sense (his|her|their)/ },
  { skill: "survival", ability: "wis", label: "Survival", re: /\btrack\b|\bforage\b|\bhunt\b|navigat|follow (the )?trail|find (food|water|shelter)/ },
  { skill: "arcana", ability: "int", label: "Arcana", re: /recall (knowledge|lore).*(magic|arcane|spell|eldritch)|\barcan|magic|magical|arcane|identify (the )?spell|eldritch/ },
  { skill: "nature", ability: "int", label: "Nature", re: /recall (knowledge|lore).*(beast|animal|plant|nature)|\bnature\b|plants?\b|animals?\b|beasts?\b|weather patterns|herbs/ },
  { skill: "religion", ability: "int", label: "Religion", re: /recall (knowledge|lore).*(undead|god|holy|faith)|\breligion|\bgods?\b|undead|\bholy\b|rites?\b|temples?\b/ },
  { skill: "history", ability: "int", label: "History", re: /recall (knowledge|lore)|\bhistory\b|\blore\b|recall|ancient|kingdom|noble/ },
  { skill: "medicine", ability: "wis", label: "Medicine", re: /\bmedicine\b|\bheal\b|\btreat\b|diagnos|poison|wound|bandage|stabiliz/ },
  { skill: "performance", ability: "cha", label: "Performance", re: /\bperform|\bplay\b|\bsing\b|\bact\b|entertain|instrument/ },
];

// ---------------------------------------------------------------------------
// Pathfinder 2e — Remaster skill names + Perception (investigating uses it).
// ---------------------------------------------------------------------------
const PF2E_RULES: SkillRule[] = [
  { skill: "thievery", ability: "dex", label: "Thievery", re: /pickpocket|pick (a |the )?pocket|pick (the )?lock|lockpick|sleight|\bpalm\b|disable (the )?trap/ },
  { skill: "stealth", ability: "dex", label: "Stealth", re: /\bsneak\b|\bhide\b|\bcreep\b|stealth|slip past|move silently|conceal/ },
  { skill: "perception", ability: "wis", label: "Perception (Investigate)", re: /investigat|examin|inspect|\bdeduc|figure out|\bclues?\b|look into|search (the|a|this|for)|scour/ },
  { skill: "perception", ability: "wis", label: "Perception", re: /look around|look for|\bspot\b|\bnotice\b|\blisten\b|\bhear\b|\bwatch\b|\bscan\b|\bpeer\b|perceiv|sense motive/ },
  { skill: "athletics", ability: "str", label: "Athletics", re: /\bclimb\b|\bjump\b|\bswim\b|\blift\b|\bpush\b|\bpull\b|break (down|open)|force (open|the door)|grapple|\bshove\b|\bdrag\b/ },
  { skill: "acrobatics", ability: "dex", label: "Acrobatics", re: /\bbalance\b|\btumble\b|\bdodge\b|somersault|squeeze through/ },
  { skill: "diplomacy", ability: "cha", label: "Diplomacy", re: /persuad|convinc|negotiat|barter|\bcharm\b|sweet-?talk|talk (down|into)|bargain/ },
  // PF2e folds animal handling into Nature (Handle an Animal) — before
  // Intimidation so "calm the frightened horse" is Nature, not Intimidation.
  { skill: "nature", ability: "wis", label: "Nature (Handle an Animal)", re: /\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b.*\b(animal|beast|horse|creature)\b|\b(animal|beast|horse|creature)\b.*\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b/ },
  { skill: "intimidation", ability: "cha", label: "Intimidation", re: /intimidat|threaten|\bscare\b|\bfrighten\b|menace|browbeat/ },
  { skill: "deception", ability: "cha", label: "Deception", re: /\blie\b|\bbluff\b|deceiv|mislead|disguise|pretend|feign/ },
  { skill: "survival", ability: "wis", label: "Survival", re: /\btrack\b|\bforage\b|\bhunt\b|navigat|follow (the )?trail|find (food|water|shelter)/ },
  { skill: "arcana", ability: "int", label: "Arcana", re: /recall (knowledge|lore).*(magic|arcane|spell|eldritch)|\barcan|magic|magical|arcane|identify (the )?spell|eldritch/ },
  { skill: "occultism", ability: "int", label: "Occultism", re: /recall (knowledge|lore).*(occult|ghost|spirit|curse|astral)|occult|ghost|spirit|curse|haunt|astral/ },
  { skill: "nature", ability: "wis", label: "Nature", re: /recall (knowledge|lore).*(beast|animal|plant|nature)|\bnature\b|plants?\b|animals?\b|beasts?\b|weather patterns|herbs/ },
  { skill: "religion", ability: "wis", label: "Religion", re: /recall (knowledge|lore).*(undead|god|holy|faith)|\breligion|\bgods?\b|undead|\bholy\b|rites?\b|temples?\b/ },
  { skill: "society", ability: "int", label: "Society", re: /recall (knowledge|lore)|\bhistory\b|\blore\b|recall|ancient|kingdom|noble|etiquette|court/ },
  { skill: "crafting", ability: "int", label: "Crafting", re: /\bcraft|\bforge\b|repair|smith/ },
  { skill: "medicine", ability: "wis", label: "Medicine", re: /\bmedicine\b|\bheal\b|\btreat\b|diagnos|poison|wound|bandage|stabiliz/ },
  { skill: "performance", ability: "cha", label: "Performance", re: /\bperform|\bplay\b|\bsing\b|\bact\b|entertain|instrument/ },
];

// ---------------------------------------------------------------------------
// GURPS 4e — skills from the sheet's list; everything else falls back to the
// controlling attribute (search/investigate is an IQ roll, breaking is ST, …).
// ---------------------------------------------------------------------------
const GURPS_RULES: GurpsRule[] = [
  { skill: "lockpicking", ability: "iq", label: "Lockpicking", re: /pick (the )?lock|lockpick/ },
  { skill: "sleight-of-hand", ability: "dx", label: "Sleight of Hand", re: /pickpocket|pick (a )?pocket|\bpalm\b|sleight/ },
  { skill: "stealth", ability: "dx", label: "Stealth", re: /\bsneak\b|\bhide\b|\bcreep\b|stealth|slip past|move silently|conceal/ },
  { skill: "climbing", ability: "dx", label: "Climbing", re: /\bclimb\b|\bscale\b/ },
  { skill: "traps", ability: "iq", label: "Traps", re: /trap|tripwire|disarm/ },
  { skill: "survival", ability: "iq", label: "Survival", re: /\btrack\b|\bforage\b|\bhunt\b|navigat|follow (the )?trail|find (food|water|shelter)/ },
  { skill: "first-aid", ability: "iq", label: "First Aid", re: /\bheal\b|\btreat\b|bandage|stabiliz|medicine|wound/ },
  { skill: "acrobatics", ability: "dx", label: "Acrobatics", re: /\bbalance\b|\btumble\b|\bdodge\b|somersault|squeeze through/ },
  { skill: "swimming", ability: "ht", label: "Swimming", re: /\bswim\b/ },
  { skill: "running", ability: "ht", label: "Running", re: /\brun\b|\bchase\b|\bsprint\b/ },
  { skill: "driving", ability: "dx", label: "Driving", re: /\bdrive\b|\bdriving\b|vehicle|carriage|reins|\bsteer\b/ },
  { skill: "strategy", ability: "iq", label: "Strategy", re: /strateg|war plan|long-?term plan/ },
  { skill: "current-affairs", ability: "iq", label: "Current Affairs", re: /current affairs|\bnews\b|\bgossip\b|\brumor\b|politics/ },
  { skill: "area-knowledge", ability: "iq", label: "Area Knowledge", re: /geograph|area knowledge|\blandmark|surrounding region/ },
  { skill: "hiking", ability: "ht", label: "Hiking", re: /\bhike\b|\bhiking\b|\btrek\b|long march|forced march/ },
  { skill: "tactics", ability: "iq", label: "Tactics", re: /ambush|tactic|plan (an|the)|strateg/ },
  { skill: "", ability: "iq", label: "IQ Roll (Investigate)", re: /investigat|examin|inspect|\bdeduc|figure out|\bclues?\b|search (the|a|this|for)|scour|recall|remember/ },
  { skill: "", ability: "iq", label: "IQ Roll (Persuade)", re: /persuad|convinc|negotiat|barter|\bcharm\b|sweet-?talk|bargain|fast-?talk/ },
  { skill: "", ability: "iq", label: "IQ Roll (Animal Handling)", re: /\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b.*\b(animal|beast|horse|creature)\b|\b(animal|beast|horse|creature)\b.*\b(calm|soothe|ride|handle|train|feed|groom|mount|lead|pet|tame|coax)\b/ },
  { skill: "", ability: "iq", label: "IQ Roll (Intimidate)", re: /intimidat|threaten|\bscare\b|\bfrighten\b|menace|browbeat/ },
  { skill: "", ability: "iq", label: "IQ Roll (Deceive)", re: /\blie\b|\bbluff\b|deceiv|mislead|disguise|pretend|feign/ },
  { skill: "", ability: "iq", label: "IQ Roll (Insight)", re: /\binsight\b|read (him|her|them|the room)|gauge|sense (his|her|their)/ },
  { skill: "", ability: "st", label: "ST Roll (Force)", re: /\blift\b|\bpush\b|break (down|open)|force (open|the door)|grapple|\bshove\b|\bdrag\b|bend/ },
  { skill: "", ability: "dx", label: "DX Roll (Reflex)", re: /\bjump\b|catch (it|the|a)|dive/ },
  { skill: "", ability: "ht", label: "HT Roll (Endure)", re: /hold (my|your) breath|resist|endure|exertion/ },
];

/** Commands with dedicated flows — never hijack these into skill rolls.
 *  Word-boundary + verb-aware so common false positives like "search the
 *  rest of the warehouse" or "track the goblin camp" still auto-roll.
 *  Bare "rest"/"camp" as nouns are fine; only the rest/camp actions are
 *  excluded ("take a rest", "make camp", "sleep"), and meta commands. */
const EXCLUDE =
  /(\b(?:take a|have a|need a)?(?:short|long)?\s*rest\b(?!\s+of)|\bmake camp\b|\b(?:set up|pitch) camp\b|\bsleep\b|meditat|\bsettle in\b|heal (up|me|myself)|\bcast(?:ing)?\b|oracle|oráculo|oraculo|\bnpc\b|status|inventory|inventário|recap|companion|companheir|attack|fight|strike|shoot|charge|engage|help|who am i|where am i|quem sou|onde estou)/i;

function matchRule<T extends { re: RegExp }>(rules: T[], text: string): T | null {
  return rules.find((r) => r.re.test(text)) ?? null;
}

/**
 * Detect the skill/ability check implied by a free-text command.
 * Returns a RollRequest ready for the dice engine, or null when the text is
 * not a check (questions, rests, combat, meta commands, plain narration).
 */
export function detectSkillCheck(
  text: string,
  adventure: AdventureState,
): RollRequest | null {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.endsWith("?") || EXCLUDE.test(trimmed)) {
    return null;
  }
  const lower = trimmed.toLowerCase();

  if (adventure.system === "dnd5e") {
    const rule = matchRule(DND_RULES, lower);
    if (!rule) return null;
    const c = adventure.character as DnDCharacter;
    const d = getDndDerived(c);
    const trained = d.skills.find((s) => s.id === rule.skill);
    return {
      label: trained?.name ?? rule.label,
      kind: "skill",
      ability: rule.ability,
      skill: rule.skill,
      proficient: trained?.proficient ?? false,
      suppressCritNarrate: true,
    };
  }

  if (adventure.system === "pf2e") {
    const rule = matchRule(PF2E_RULES, lower);
    if (!rule) return null;
    const c = adventure.character as Pf2eCharacter;
    const isPerception = rule.skill === "perception";
    const rank = isPerception
      ? c.perceptionRank
      : c.skillRanks[rule.skill] ?? "untrained";
    const def = PF2E_SKILL_MAP[rule.skill];
    return {
      label: isPerception ? rule.label : def?.name ?? rule.label,
      kind: "skill",
      ability: rule.ability,
      skill: rule.skill,
      rank,
      suppressCritNarrate: true,
    };
  }

  // GURPS
  const rule = matchRule(GURPS_RULES, lower);
  if (!rule) return null;
  const c = adventure.character as GurpsCharacter;
  const d = getGurpsDerived(c);
  if (rule.skill) {
    const trained = d.skills.find((s) => s.id === rule.skill);
    const target = trained?.level ?? c.attributes[rule.ability] - 5;
    const def = GURPS_SKILL_MAP[rule.skill];
    return {
      label: `${def?.name ?? rule.label} (${target})`,
      kind: "skill",
      skill: rule.skill,
      gurpsTarget: target,
      suppressCritNarrate: true,
    };
  }
  const target = c.attributes[rule.ability];
  return {
    label: `${rule.label} (${target})`,
    kind: "check",
    gurpsTarget: target,
    suppressCritNarrate: true,
  };
}
