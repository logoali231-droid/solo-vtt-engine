import type { GurpsSkillDef } from "../types";

// Skill list: name, controlling attribute, difficulty.
export const GURPS_SKILLS: GurpsSkillDef[] = [
  { id: "brawling", name: "Brawling", stat: "dx", difficulty: "easy" },
  { id: "knife", name: "Knife", stat: "dx", difficulty: "easy" },
  { id: "shortsword", name: "Shortsword", stat: "dx", difficulty: "average" },
  { id: "broadsword", name: "Broadsword", stat: "dx", difficulty: "average" },
  { id: "axe-mace", name: "Axe/Mace", stat: "dx", difficulty: "average" },
  { id: "spear", name: "Spear", stat: "dx", difficulty: "average" },
  { id: "polearm", name: "Polearm", stat: "dx", difficulty: "average" },
  { id: "bow", name: "Bow", stat: "dx", difficulty: "average" },
  { id: "crossbow", name: "Crossbow", stat: "dx", difficulty: "easy" },
  { id: "guns", name: "Guns", stat: "dx", difficulty: "easy" },
  { id: "thrown-weapon", name: "Thrown Weapon", stat: "dx", difficulty: "easy" },
  { id: "acrobatics", name: "Acrobatics", stat: "dx", difficulty: "hard" },
  { id: "climbing", name: "Climbing", stat: "dx", difficulty: "average" },
  { id: "stealth", name: "Stealth", stat: "dx", difficulty: "average" },
  { id: "driving", name: "Driving", stat: "dx", difficulty: "average" },
  { id: "sleight-of-hand", name: "Sleight of Hand", stat: "dx", difficulty: "hard" },
  { id: "lockpicking", name: "Lockpicking", stat: "iq", difficulty: "average" },
  { id: "traps", name: "Traps", stat: "iq", difficulty: "average" },
  { id: "survival", name: "Survival", stat: "iq", difficulty: "average" },
  { id: "first-aid", name: "First Aid", stat: "iq", difficulty: "easy" },
  { id: "tactics", name: "Tactics", stat: "iq", difficulty: "hard" },
  { id: "strategy", name: "Strategy", stat: "iq", difficulty: "hard" },
  { id: "current-affairs", name: "Current Affairs", stat: "iq", difficulty: "easy" },
  { id: "area-knowledge", name: "Area Knowledge", stat: "iq", difficulty: "easy" },
  { id: "hiking", name: "Hiking", stat: "ht", difficulty: "average" },
  { id: "running", name: "Running", stat: "ht", difficulty: "hard" },
  { id: "swimming", name: "Swimming", stat: "ht", difficulty: "easy" },
  { id: "brawling-dx", name: "—", stat: "dx", difficulty: "easy" },
];

export const GURPS_SKILL_MAP = Object.fromEntries(
  GURPS_SKILLS.map((s) => [s.id, s]),
);

export const GURPS_ARMORS: { id: string; name: string; dr: number; note?: string }[] = [
  { id: "none", name: "No Armor", dr: 0 },
  { id: "leather-jacket", name: "Leather Jacket", dr: 1, note: "Torso, arms" },
  { id: "chainmail", name: "Chainmail Hauberk", dr: 3, note: "Torso" },
  { id: "plate", name: "Plate Cuirass", dr: 5, note: "Torso" },
  { id: "knight", name: "Full Plate", dr: 6, note: "Whole body" },
];

export const GURPS_ARMOR_MAP = Object.fromEntries(
  GURPS_ARMORS.map((a) => [a.id, a]),
);

/** Skill level given controlling attribute and invested points. */
export function gurpsSkillLevel(
  stat: number,
  difficulty: "easy" | "average" | "hard",
  points: number,
): number {
  const offset = difficulty === "easy" ? 0 : difficulty === "average" ? -1 : -2;
  if (points <= 0) return stat - 5; // default
  if (points === 1) return stat + offset;
  if (points === 2) return stat + offset + 1;
  if (points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((points - 4) / 4);
}

/** Attribute cost: base 10, each ±1 costs/refunds 10 points. */
export function gurpsAttributeCost(attributes: {
  st: number;
  dx: number;
  iq: number;
  ht: number;
}): number {
  return (
    (attributes.st - 10) * 10 +
    (attributes.dx - 10) * 10 +
    (attributes.iq - 10) * 10 +
    (attributes.ht - 10) * 10
  );
}
