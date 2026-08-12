// ============================================================================
// Puzzle Creator — rules-governed, AI-narrated.
//
// The RULES are always local: which checks solve the puzzle, their DCs / skill
// targets, consequences and rewards are computed here from the hero's system
// and level. The AI is only asked to NARRATE the flavor (the setup description
// and the in-world outcome of each roll) — it never decides whether a check
// passes or what the DC is. In Local mode the flavor falls back to the
// template below, so puzzles work fully offline.
// ============================================================================

import type { AbilityId, GameSystem, GurpsCharacter, PfRank } from "./types";
import { GURPS_SKILL_MAP } from "./data/gurps";

/**
 * GURPS skill level for the hero (same curve as gurpsSkillLevel): the puzzle
 * targets the character's ACTUAL trained skill rather than a fixed number, so
 * the check stays rules-compliant and scales with the hero.
 */
function gurpsPuzzleLevel(
  c: GurpsCharacter,
  skillId: string,
  fallbackStat: "st" | "dx" | "iq" | "ht",
): number {
  const trained = c.skills.find((s) => s.id === skillId);
  const stat = c.attributes[fallbackStat];
  if (!trained || trained.points <= 0) return stat - 5; // untrained default
  const def = GURPS_SKILL_MAP[skillId];
  const offset = def?.difficulty === "easy" ? 0 : def?.difficulty === "hard" ? -2 : -1;
  if (trained.points === 1) return stat + offset;
  if (trained.points === 2) return stat + offset + 1;
  if (trained.points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((trained.points - 4) / 4);
}

/** Best trained magic/arcane skill level (Pyre, Frost, Gale, Verdant, Veil,
 *  Spirit, Alchemy) — used by the arcane GURPS puzzle. Falls back to IQ−5. */
function gurpsArcaneLevel(c: GurpsCharacter): number {
  const arcane = [
    "pyre-magic",
    "frost-magic",
    "gale-magic",
    "verdant-magic",
    "veil-magic",
    "spirit-magic",
    "alchemy",
  ];
  let best = c.attributes.iq - 5;
  for (const id of arcane) {
    const lv = gurpsPuzzleLevel(c, id, "iq");
    if (lv > best) best = lv;
  }
  return best;
}

export interface PuzzleCheck {
  /** Short player-facing action, e.g. "Study the seals". */
  label: string;
  /** The roll as it appears on the dice card, e.g. "Intelligence (Investigation)". */
  rollLabel: string;
  /** d20 systems: target DC. */
  dc?: number;
  /** D&D 5e ability. */
  ability?: AbilityId;
  /** D&D 5e skill id (adds proficiency). */
  skill?: string;
  /** PF2e proficiency rank. */
  rank?: PfRank;
  /** GURPS: 3d6 under this target. */
  gurpsTarget?: number;
}

export interface PuzzleSpec {
  id: string;
  title: string;
  kind: string;
  /** Local flavor — used by the offline narrator and as fallback text. */
  intro: string;
  /** The two sequential checks that solve the puzzle. */
  checks: PuzzleCheck[];
  consequenceHp: number;
  consequenceText: string;
  rewardXp: number;
  /** Structured prompt handed to the live AI so it writes the in-world scene. */
  aiPrompt: string;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** D&D 5e / PF2e DC curve — modest at level 1, sharp at high level. */
function d20Dc(level: number): number {
  return 12 + Math.floor(level / 3);
}

interface Template {
  title: string;
  kind: string;
  intro: string;
  build: (level: number, gurps?: GurpsCharacter) => PuzzleCheck[];
  consequenceHp: (level: number) => number;
  consequenceText: string;
  rewardXp: (level: number) => number;
  aiScene: (title: string, intro: string, checks: string) => string;
}

const DND_TEMPLATES: Template[] = [
  {
    title: "The Runic Door",
    kind: "Arcane lock",
    intro: "A door of black iron bars the way, its surface crawling with faint runes that shift when you look at them. The mechanism wants a password — but the runes refuse to speak it plainly.",
    build: (lv) => [
      { label: "Study the runes", rollLabel: "Intelligence (Investigation)", ability: "int", skill: "investigation", dc: d20Dc(lv), proficient: true },
      { label: "Speak the arcane sequence", rollLabel: "Intelligence (Arcana)", ability: "int", skill: "arcana", dc: d20Dc(lv) + 2, proficient: true },
    ],
    consequenceHp: (lv) => 2 + lv,
    consequenceText: "The ward backfires — a burst of force throws you across the passage.",
    rewardXp: (lv) => 25 + lv * 10,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the DC or the answer.`,
  },
  {
    title: "The Chamber of Echoes",
    kind: "Pattern lock",
    intro: "Eight crystal prisms hang in a vaulted chamber. Each sings a different note when touched, and the floor is marked with the ghost of a sequence that fades as you approach.",
    build: (lv) => [
      { label: "Listen to the resonance", rollLabel: "Wisdom (Perception)", ability: "wis", skill: "perception", dc: d20Dc(lv), proficient: true },
      { label: "Replay the melody", rollLabel: "Dexterity (Sleight of Hand)", ability: "dex", skill: "sleight-of-hand", dc: d20Dc(lv) + 2, proficient: true },
    ],
    consequenceHp: (lv) => 2 + lv,
    consequenceText: "The prisms scream in discord — shards of sound lash at you.",
    rewardXp: (lv) => 25 + lv * 10,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the DC or the answer.`,
  },
  {
    title: "The Weeping Idol",
    kind: "Riddle guardian",
    intro: "A stone idol kneels before a sealed vault, tears of amber running down its cheeks. Its lips move in a whisper — it will only answer a question asked a certain way.",
    build: (lv) => [
      { label: "Read the idol's intent", rollLabel: "Wisdom (Insight)", ability: "wis", skill: "insight", dc: d20Dc(lv), proficient: true },
      { label: "Offer the correct ritual", rollLabel: "Intelligence (Religion)", ability: "int", skill: "religion", dc: d20Dc(lv) + 2, proficient: true },
    ],
    consequenceHp: (lv) => 2 + lv,
    consequenceText: "The idol's amber tears harden into razors — a volley of needles whips past you.",
    rewardXp: (lv) => 25 + lv * 10,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the DC or the answer.`,
  },
];

const PF2E_TEMPLATES: Template[] = [
  {
    title: "The Clockwork Vault",
    kind: "Mechanical lock",
    intro: "A vault of interlocking brass plates hums with ticking pressure. Eight dials ring its face, each engraved with a constellation that does not match any sky you know.",
    build: (lv) => [
      { label: "Study the mechanism", rollLabel: "Perception", ability: "wis", rank: "trained", dc: d20Dc(lv), proficient: true },
      { label: "Disarm the tumblers", rollLabel: "Thievery", ability: "dex", rank: "trained", dc: d20Dc(lv) + 2, proficient: true },
    ],
    consequenceHp: (lv) => 3 + Math.floor(lv / 2),
    consequenceText: "A spring-loaded blade snaps out — the vault marks your attempt with a wound.",
    rewardXp: (lv) => 20 + lv * 8,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the DC or the answer.`,
  },
  {
    title: "The Eldritch Circuit",
    kind: "Runic matrix",
    intro: "A floating ring of runes orbits a pillar of violet light. Each rune hums with a different resonance; some pulse in time with your heartbeat, and the wrong touch could collapse the whole matrix.",
    build: (lv) => [
      { label: "Decipher the resonance", rollLabel: "Arcana", ability: "int", rank: "trained", dc: d20Dc(lv), proficient: true },
      { label: "Re-align the runes", rollLabel: "Occultism", ability: "int", rank: "trained", dc: d20Dc(lv) + 2, proficient: true },
    ],
    consequenceHp: (lv) => 3 + Math.floor(lv / 2),
    consequenceText: "The matrix collapses in a silent pulse of violet force that hammers into you.",
    rewardXp: (lv) => 20 + lv * 8,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the DC or the answer.`,
  },
];

const GURPS_TEMPLATES: Template[] = [
  {
    title: "The Mechanized Gate",
    kind: "Mechanical lock",
    intro: "A heavy gate of interlocked gears and pressure pins blocks the corridor. The lock is hand-built, stubborn, and full of small deliberate traps for anyone who pries without understanding.",
    // Targets use the hero's ACTUAL skills: Professional Skill for the
    // mechanism, Lockpicking for the pins — untrained heroes fall back to the
    // raw attribute default, so the DC scales with who you built.
    build: (_lv, gurps) =>
      gurps
        ? [
            { label: "Study the mechanism", rollLabel: "Mechanic (IQ)", gurpsTarget: gurpsPuzzleLevel(gurps, "professional-skill", "iq") },
            { label: "Pick the pins", rollLabel: "Lockpicking (DX)", gurpsTarget: gurpsPuzzleLevel(gurps, "lockpicking", "dx") },
          ]
        : [
            { label: "Study the mechanism", rollLabel: "Mechanic (IQ)", gurpsTarget: 11 },
            { label: "Pick the pins", rollLabel: "Lockpicking (DX)", gurpsTarget: 10 },
          ],
    consequenceHp: () => 2,
    consequenceText: "A counterweight slams down and catches you across the ribs.",
    rewardXp: () => 1,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the target numbers or the answer.`,
  },
  {
    title: "The Glyph Sequence",
    kind: "Arcane matrix",
    intro: "Nine floating glyphs orbit a stone seal, each humming on a different frequency. The sequence is half-memorized in a faded manual — but half is guesswork, and a wrong guess burns.",
    // Deciphering the manual uses the hero's best trained magic/alchemy skill;
    // tracing the sequence is a straight IQ roll.
    build: (_lv, gurps) =>
      gurps
        ? [
            { label: "Decipher the manual", rollLabel: "Arcane Lore (IQ)", gurpsTarget: gurpsArcaneLevel(gurps) },
            { label: "Trace the sequence", rollLabel: "IQ roll", gurpsTarget: gurps.attributes.iq },
          ]
        : [
            { label: "Decipher the manual", rollLabel: "Occultism (IQ)", gurpsTarget: 11 },
            { label: "Trace the sequence", rollLabel: "IQ roll", gurpsTarget: 10 },
          ],
    consequenceHp: () => 2,
    consequenceText: "The glyphs flare white-hot and scorch your arms.",
    rewardXp: () => 1,
    aiScene: (t, intro, checks) =>
      `A puzzle blocks the way: "${t}". ${intro} The local rules say it needs: ${checks}. Describe the mechanism in vivid, in-world detail and drop a single subtle clue — but never reveal the target numbers or the answer.`,
  },
];

function templatePool(system: GameSystem): Template[] {
  return system === "dnd5e" ? DND_TEMPLATES : system === "pf2e" ? PF2E_TEMPLATES : GURPS_TEMPLATES;
}

/**
 * Generate a fully local, rules-complete puzzle for the hero's system.
 * Pass the GURPS character so its puzzle checks target the hero's actual
 * trained skills (untrained heroes use raw-attribute defaults).
 */
export function generatePuzzle(
  system: GameSystem,
  level: number,
  gurps?: GurpsCharacter,
): PuzzleSpec {
  const pool = templatePool(system);
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  const checks = tpl.build(level, gurps);
  const checksText = checks.map((c) => `${c.label} (${c.rollLabel}${c.dc ? `, DC ${c.dc}` : c.gurpsTarget ? `, target ${c.gurpsTarget}` : ""})`).join("; then ");
  return {
    id: uid(),
    title: tpl.title,
    kind: tpl.kind,
    intro: tpl.intro,
    checks,
    consequenceHp: tpl.consequenceHp(level),
    consequenceText: tpl.consequenceText,
    rewardXp: tpl.rewardXp(level),
    aiPrompt: tpl.aiScene(tpl.title, tpl.intro, checksText),
  };
}
