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

export interface Pf2eHeritageDef {
  id: string;
  name: string;
  ancestryId?: string; // undefined = universal heritage
  summary: string;
  feat?: string;
}

export const PF2E_HERITAGES: Pf2eHeritageDef[] = [
  { id: "standard", name: "Standard Heritage", summary: "No special heritage — the pure traits of your ancestry." },
  { id: "versatile", name: "Versatile Heritage", summary: "You gain one 1st-level general feat of your choice.", feat: "General feat" },
  // Human
  { id: "skilled-human", name: "Skilled Heritage", ancestryId: "human", summary: "You gain training in one additional skill of your choice.", feat: "Additional trained skill" },
  { id: "wintertouched-human", name: "Wintertouched Human", ancestryId: "human", summary: "Cold resistance 5 and training in Survival.", feat: "Cold resistance" },
  { id: "double-heart", name: "Double-Hearted", ancestryId: "human", summary: "Extraordinary endurance: you gain 8 additional Hit Points.", feat: "+8 HP" },
  // Elf
  { id: "cavern-elf", name: "Cavern Elf", ancestryId: "elf", summary: "Darkvision and a sensitivity to sunlight." },
  { id: "woodland-elf", name: "Woodland Elf", ancestryId: "elf", summary: "Stealth in forests and the ability to hide in brush.", feat: "Nature-adapted" },
  { id: "seer-elf", name: "Seer Elf", ancestryId: "elf", summary: "You can glimpse strands of fate — cast augury-like insight." },
  // Dwarf
  { id: "forge-dwarf", name: "Forge Dwarf", ancestryId: "dwarf", summary: "Fire resistance and expertise in crafting and metalwork.", feat: "Fire resistance" },
  { id: "rock-dwarf", name: "Rock Dwarf", ancestryId: "dwarf", summary: "Stonecunning and darkvision from a life under the mountain." },
  { id: "strong-blood-dwarf", name: "Strong-Blooded Dwarf", ancestryId: "dwarf", summary: "+2 to saving throws against poison and disease." },
  // Goblin
  { id: "razor-goblin", name: "Razor-Tooth Goblin", ancestryId: "goblin", summary: "A biting jaw attack — deal 1d6 piercing damage." },
  { id: "snow-goblin", name: "Snow Goblin", ancestryId: "goblin", summary: "Cold resistance, sure footing on ice and snow stealth." },
  { id: "tail-whisker-goblin", name: "Tail and Whisker Goblin", ancestryId: "goblin", summary: "Exaggerated ears and tail — +1 to Stealth and Perception." },
  // Halfling
  { id: "twilight-halfling", name: "Twilight Halfling", ancestryId: "halfling", summary: "See in the dark like a twilight cat — low-light vision." },
  { id: "nomadic-halfling", name: "Nomadic Halfling", ancestryId: "halfling", summary: "Acclimatize to the weather of any region." },
  { id: "jumpy-halfling", name: "Jumpy Halfling", ancestryId: "halfling", summary: "Startling reactions: you are never flat-footed while conscious." },
  // Orc
  { id: "badlands-orc", name: "Badlands Orc", ancestryId: "orc", summary: "Heat resistance and survival training for the wastes." },
  { id: "winter-orc", name: "Winter Orc", ancestryId: "orc", summary: "Cold resistance and unshakeable tundra instincts." },
  { id: "hold-scarred-orc", name: "Hold-Scarred Orc", ancestryId: "orc", summary: "Scars of old battles — +2 Hit Points per level." },
];

export const PF2E_HERITAGE_MAP = Object.fromEntries(
  PF2E_HERITAGES.map((h) => [h.id, h]),
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
