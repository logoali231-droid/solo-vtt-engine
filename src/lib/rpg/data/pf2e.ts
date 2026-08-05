import type {
  AbilityId,
  Pf2eAncestryDef,
  Pf2eBackgroundDef,
  Pf2eClassDef,
} from "../types";

export const PF2E_SKILLS: { id: string; name: string; ability: AbilityId }[] = [
  { id: "acrobatics", name: "Acrobatics", ability: "dex" },
  { id: "arcana", name: "Arcana", ability: "int" },
  { id: "athletics", name: "Athletics", ability: "str" },
  { id: "crafting", name: "Crafting", ability: "int" },
  { id: "deception", name: "Deception", ability: "cha" },
  { id: "diplomacy", name: "Diplomacy", ability: "cha" },
  { id: "intimidation", name: "Intimidation", ability: "cha" },
  { id: "medicine", name: "Medicine", ability: "wis" },
  { id: "nature", name: "Nature", ability: "wis" },
  { id: "occultism", name: "Occultism", ability: "int" },
  { id: "performance", name: "Performance", ability: "cha" },
  { id: "religion", name: "Religion", ability: "wis" },
  { id: "society", name: "Society", ability: "int" },
  { id: "stealth", name: "Stealth", ability: "dex" },
  { id: "survival", name: "Survival", ability: "wis" },
  { id: "thievery", name: "Thievery", ability: "dex" },
];

export const PF2E_SKILL_MAP = Object.fromEntries(
  PF2E_SKILLS.map((s) => [s.id, s]),
);

export const PF2E_ANCESTRIES: Pf2eAncestryDef[] = [
  { id: "human", name: "Human", boosts: ["dex", "con"], hp: 8, size: "Medium", speed: 25, traits: ["Humanoid", "Human"], blurb: "Versatile and adaptive, humans thrive anywhere." },
  { id: "elf", name: "Elf", boosts: ["dex", "int"], hp: 6, size: "Medium", speed: 30, traits: ["Humanoid", "Elf"], blurb: "Ageless, graceful and attuned to magic." },
  { id: "dwarf", name: "Dwarf", boosts: ["con", "wis"], hp: 10, size: "Medium", speed: 20, traits: ["Humanoid", "Dwarf"], blurb: "Stout, stubborn, and carved from stone." },
  { id: "goblin", name: "Goblin", boosts: ["dex", "cha"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Goblin"], blurb: "Chaotic fire-lovers with a talent for trouble." },
  { id: "halfling", name: "Halfling", boosts: ["dex", "wis"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Halfling"], blurb: "Cheerful, lucky folk who keep their heads low." },
  { id: "orc", name: "Orc", boosts: ["str", "con"], hp: 10, size: "Medium", speed: 25, traits: ["Humanoid", "Orc"], blurb: "Fierce survivors with an unyielding will." },
];

export const PF2E_ANCESTRY_MAP = Object.fromEntries(
  PF2E_ANCESTRIES.map((a) => [a.id, a]),
);

export const PF2E_BACKGROUNDS: Pf2eBackgroundDef[] = [
  { id: "acolyte", name: "Acolyte", boosts: ["wis", "int"], skills: ["religion"], feature: "You know the rites and hierarchies of your faith." },
  { id: "criminal", name: "Criminal", boosts: ["dex", "int"], skills: ["stealth", "thievery"], feature: "You have contacts in the underworld." },
  { id: "sage", name: "Scholar", boosts: ["int", "wis"], skills: ["arcana", "occultism"], feature: "You can recall a dizzying breadth of lore." },
  { id: "soldier", name: "Soldier", boosts: ["str", "con"], skills: ["athletics", "intimidation"], feature: "You know how to fight, march and survive." },
  { id: "farmhand", name: "Farmhand", boosts: ["str", "con"], skills: ["athletics", "nature"], feature: "Hardened by honest work under open skies." },
  { id: "urchin", name: "Urchin", boosts: ["dex", "cha"], skills: ["stealth", "society"], feature: "You know the secret corners of every city." },
];

export const PF2E_BACKGROUND_MAP = Object.fromEntries(
  PF2E_BACKGROUNDS.map((b) => [b.id, b]),
);

export const PF2E_CLASSES: Pf2eClassDef[] = [
  { id: "fighter", name: "Fighter", keyAbility: "str", hp: 10, perLevel: 6, trainedSkills: ["athletics", "intimidation"], blurb: "Weapon experts unmatched in martial skill." },
  { id: "rogue", name: "Rogue", keyAbility: "dex", hp: 8, perLevel: 4, trainedSkills: ["acrobatics", "stealth", "thievery", "society"], blurb: "Skirmishers who strike where it hurts." },
  { id: "wizard", name: "Wizard", keyAbility: "int", hp: 6, perLevel: 4, trainedSkills: ["arcana", "occultism", "society"], blurb: "Scholars of the arcane arts." },
  { id: "cleric", name: "Cleric", keyAbility: "wis", hp: 8, perLevel: 4, trainedSkills: ["religion", "medicine", "society"], blurb: "Divine spellcasters of faith." },
  { id: "ranger", name: "Ranger", keyAbility: "dex", hp: 10, perLevel: 6, trainedSkills: ["athletics", "nature", "survival", "stealth"], blurb: "Hunters who master terrain and prey." },
  { id: "bard", name: "Bard", keyAbility: "cha", hp: 8, perLevel: 4, trainedSkills: ["performance", "diplomacy", "occultism", "society"], blurb: "Performers who weave magic into song." },
  { id: "monk", name: "Monk", keyAbility: "dex", hp: 10, perLevel: 6, trainedSkills: ["acrobatics", "athletics", "stealth"], blurb: "Masters of unarmed combat and ki." },
  { id: "alchemist", name: "Alchemist", keyAbility: "int", hp: 8, perLevel: 4, trainedSkills: ["crafting", "medicine", "nature", "occultism"], blurb: "Scientists of explosives and elixirs." },
  { id: "barbarian", name: "Barbarian", keyAbility: "str", hp: 12, perLevel: 6, trainedSkills: ["athletics", "intimidation", "nature", "survival"], blurb: "Rage-driven warriors." },
  { id: "sorcerer", name: "Sorcerer", keyAbility: "cha", hp: 6, perLevel: 4, trainedSkills: ["arcana", "diplomacy", "society"], blurb: "Magic in the blood." },
  { id: "champion", name: "Champion", keyAbility: "str", hp: 10, perLevel: 6, trainedSkills: ["religion", "athletics", "diplomacy"], blurb: "Holy warriors of a cause." },
  { id: "druid", name: "Druid", keyAbility: "wis", hp: 8, perLevel: 4, trainedSkills: ["nature", "medicine", "survival", "religion"], blurb: "Guardians of the natural world." },
];

export const PF2E_CLASS_MAP = Object.fromEntries(
  PF2E_CLASSES.map((c) => [c.id, c]),
);

export const PF2E_ARMORS: { id: string; name: string; acBonus: number; note?: string }[] = [
  { id: "none", name: "Unarmored", acBonus: 0 },
  { id: "leather", name: "Leather Armor", acBonus: 1 },
  { id: "studded", name: "Studded Leather", acBonus: 2 },
  { id: "scale", name: "Scale Mail", acBonus: 3 },
  { id: "splint", name: "Splint Mail", acBonus: 5 },
  { id: "plate", name: "Full Plate", acBonus: 6, note: "Str 18" },
];

export const PF2E_ARMOR_MAP = Object.fromEntries(
  PF2E_ARMORS.map((a) => [a.id, a]),
);
