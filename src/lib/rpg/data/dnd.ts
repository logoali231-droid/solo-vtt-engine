// ============================================================================
// Oraculum — D&D 5e database.
// Core races/classes/subclasses/backgrounds + Tasha's Cauldron of Everything
// (TCoE) options: Artificer, custom ancestry, and TCoE subclasses.
// ============================================================================

import type {
  AbilityId,
  ArmorDef,
  BackgroundDef,
  ClassDef,
  DnDCharacter,
  RaceDef,
  SubraceDef,
  WeaponDef,
} from "../types";

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export const DND_SKILLS: { id: string; name: string; ability: AbilityId }[] = [
  { id: "acrobatics", name: "Acrobatics", ability: "dex" },
  { id: "animal-handling", name: "Animal Handling", ability: "wis" },
  { id: "arcana", name: "Arcana", ability: "int" },
  { id: "athletics", name: "Athletics", ability: "str" },
  { id: "deception", name: "Deception", ability: "cha" },
  { id: "history", name: "History", ability: "int" },
  { id: "insight", name: "Insight", ability: "wis" },
  { id: "intimidation", name: "Intimidation", ability: "cha" },
  { id: "investigation", name: "Investigation", ability: "int" },
  { id: "medicine", name: "Medicine", ability: "wis" },
  { id: "nature", name: "Nature", ability: "int" },
  { id: "perception", name: "Perception", ability: "wis" },
  { id: "performance", name: "Performance", ability: "cha" },
  { id: "persuasion", name: "Persuasion", ability: "cha" },
  { id: "religion", name: "Religion", ability: "int" },
  { id: "sleight-of-hand", name: "Sleight of Hand", ability: "dex" },
  { id: "stealth", name: "Stealth", ability: "dex" },
  { id: "survival", name: "Survival", ability: "wis" },
];

export const SKILL_MAP = Object.fromEntries(DND_SKILLS.map((s) => [s.id, s]));

// ---------------------------------------------------------------------------
// Races (core six)
// ---------------------------------------------------------------------------

export const RACES: RaceDef[] = [
  {
    id: "human",
    name: "Human",
    size: "Medium",
    speed: 30,
    asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    languages: ["Common"],
    traits: [{ name: "Versatile", summary: "+1 to every ability score." }],
    blurb: "Ambitious, adaptable and endlessly varied — humans are everywhere.",
  },
  {
    id: "elf",
    name: "Elf",
    size: "Medium",
    speed: 30,
    asi: { dex: 2 },
    languages: ["Common", "Elvish"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Fey Ancestry", summary: "Advantage vs charm; immunity to magical sleep." },
      { name: "Trance", summary: "Meditate 4 hours instead of sleep." },
    ],
    blurb: "Graceful, centuries-old, and attuned to the Feywild's magic.",
  },
  {
    id: "dwarf",
    name: "Dwarf",
    size: "Medium",
    speed: 25,
    asi: { con: 2 },
    languages: ["Common", "Dwarvish"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Dwarven Resilience", summary: "Advantage on saves vs poison; resistance to poison damage.", mechanic: "poison-resistance" },
      { name: "Stonecunning", summary: "Proficiency in History checks about stonework." },
    ],
    blurb: "Sturdy, stubborn master smiths of the deep mountains.",
  },
  {
    id: "halfling",
    name: "Halfling",
    size: "Small",
    speed: 25,
    asi: { dex: 2 },
    languages: ["Common", "Halfling"],
    traits: [
      { name: "Lucky", summary: "Reroll a natural 1 on an attack, check or save.", mechanic: "lucky" },
      { name: "Brave", summary: "Advantage on saves vs being frightened." },
      { name: "Halfling Nimbleness", summary: "Move through the space of larger creatures." },
    ],
    blurb: "Small folk with oversized hearts and improbable luck.",
  },
  {
    id: "dragonborn",
    name: "Dragonborn",
    size: "Medium",
    speed: 30,
    asi: { str: 2, cha: 1 },
    languages: ["Common", "Draconic"],
    traits: [
      { name: "Draconic Ancestry", summary: "Choose a dragon kind; gain a breath weapon and damage resistance." },
      { name: "Breath Weapon", summary: "Action: exhale destructive energy in a cone or line." },
      { name: "Damage Resistance", summary: "Resistance to your ancestry's damage type." },
    ],
    blurb: "Proud dragon-kin carrying the elemental fire of their bloodline.",
  },
  {
    id: "tiefling",
    name: "Tiefling",
    size: "Medium",
    speed: 30,
    asi: { cha: 2, int: 1 },
    languages: ["Common", "Infernal"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Hellish Resistance", summary: "Resistance to fire damage." },
      { name: "Infernal Legacy", summary: "Thaumaturgy cantrip; Hellish Rebuke at 3rd; Darkness at 5th." },
    ],
    blurb: "Bound to infernal bloodlines, walking the line between worlds.",
  },
  {
    id: "gnome",
    name: "Gnome",
    size: "Small",
    speed: 25,
    asi: { int: 2, dex: 1 },
    languages: ["Common", "Gnomish"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Gnome Cunning", summary: "Advantage on Int, Wis and Cha saves vs magic." },
      { name: "Artificer's Lore", summary: "Double proficiency on History checks about magic items or technology." },
    ],
    blurb: "Curious inventors with a talent for tinkering and illusion.",
  },
  {
    id: "half-elf",
    name: "Half-Elf",
    size: "Medium",
    speed: 30,
    asi: { cha: 2, dex: 1, con: 1 },
    languages: ["Common", "Elvish"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Fey Ancestry", summary: "Advantage vs charm; immunity to magical sleep." },
      { name: "Skill Versatility", summary: "Proficiency in any two skills." },
    ],
    blurb: "Bridges between two worlds, charming and adaptable.",
  },
  {
    id: "half-orc",
    name: "Half-Orc",
    size: "Medium",
    speed: 30,
    asi: { str: 2, con: 1 },
    languages: ["Common", "Orc"],
    traits: [
      { name: "Darkvision", summary: "See in dim light as bright, darkness as dim (60 ft).", mechanic: "darkvision" },
      { name: "Relentless Endurance", summary: "Drop to 1 HP instead of 0 once per long rest." },
      { name: "Savage Attacks", summary: "Extra weapon die on critical hits." },
    ],
    blurb: "Fierce survivors carrying the strength of their orc kin.",
  },
  {
    id: "custom-lineage",
    name: "Custom Lineage (TCoE)",
    size: "Medium",
    speed: 30,
    asi: {},
    languages: ["Common"],
    traits: [
      { name: "Custom Origin", summary: "+2 to one ability of your choice (set below)." },
      { name: "Feat", summary: "Gain a feat at 1st level (choose one in the Talents step)." },
      { name: "Variable Trait", summary: "Darkvision 60 ft or a skill proficiency of your choice." },
    ],
    blurb: "A Tasha's Cauldron lineage of your own making.",
  },
];

export const RACE_MAP = Object.fromEntries(RACES.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------
// Subraces (PHB) — elves, dwarves, halflings, human variant, dragonborn ancestry
// ---------------------------------------------------------------------------

export const SUBRACES: SubraceDef[] = [
  // Human
  { id: "human-standard", raceId: "human", name: "Standard Human", asi: {}, traits: [], blurb: "The versatile default — +1 to every ability score." },
  { id: "human-variant", raceId: "human", name: "Human Variant", asi: {}, variantHuman: true, traits: [
    { name: "Two +1s", summary: "+1 to two different ability scores of your choice." },
    { name: "Bonus Skill", summary: "Proficiency in one skill of your choice." },
    { name: "Bonus Feat", summary: "A feat of your choice at 1st level (pick one in the Talents step)." },
  ], blurb: "Driven and adaptable — a free feat, a skill, and two +1s." },
  // Elf
  { id: "elf-high", raceId: "elf", name: "High Elf", asi: { int: 1 }, traits: [
    { name: "Cantrip", summary: "Know one cantrip from the wizard spell list." },
    { name: "Elf Weapon Training", summary: "Proficiency with longsword, shortsword, shortbow and longbow." },
  ], blurb: "The spell-weaving elves of the great cities." },
  { id: "elf-wood", raceId: "elf", name: "Wood Elf", asi: { wis: 1 }, speed: 35, traits: [
    { name: "Mask of the Wild", summary: "Hide while lightly obscured by natural phenomena." },
    { name: "Elf Weapon Training", summary: "Proficiency with longsword, shortsword, shortbow and longbow." },
  ], blurb: "Fleet forest elves, at home among the trees." },
  { id: "elf-drow", raceId: "elf", name: "Drow (Dark Elf)", asi: { cha: 1 }, traits: [
    { name: "Superior Darkvision", summary: "Darkvision 120 ft.", mechanic: "darkvision" },
    { name: "Sunlight Sensitivity", summary: "Disadvantage on attacks and Perception in sunlight." },
    { name: "Drow Magic", summary: "Dancing Lights cantrip; Faerie Fire and Darkness at higher levels." },
  ], blurb: "The dark elves of the Underdark." },
  // Dwarf
  { id: "dwarf-hill", raceId: "dwarf", name: "Hill Dwarf", asi: { wis: 1 }, traits: [
    { name: "Dwarven Toughness", summary: "+1 maximum HP per level." },
  ], blurb: "Hill clan dwarves, tough as the stone itself." },
  { id: "dwarf-mountain", raceId: "dwarf", name: "Mountain Dwarf", asi: { str: 2 }, traits: [
    { name: "Dwarven Armor Training", summary: "Proficiency with light and medium armor." },
  ], blurb: "Dour warriors of the mountains, born with steel in hand." },
  // Halfling
  { id: "halfling-lightfoot", raceId: "halfling", name: "Lightfoot Halfling", asi: { cha: 1 }, traits: [
    { name: "Naturally Stealthy", summary: "Hide even when only obscured by a larger creature." },
  ], blurb: "Quiet, curious and nearly impossible to pin down." },
  { id: "halfling-stout", raceId: "halfling", name: "Stout Halfling", asi: { con: 1 }, traits: [
    { name: "Stout Resilience", summary: "Advantage on poison saves; resistance to poison damage." },
  ], blurb: "Hardy folk with a taste for ale and a resistance to poison." },
  // Dragonborn ancestries (breath weapon + resistance)
  { id: "dragonborn-black", raceId: "dragonborn", name: "Black Dragon", asi: {}, traits: [{ name: "Acid Breath", summary: "5 × 30 ft line of acid (DC 8 + Con + prof)." }, { name: "Acid Resistance", summary: "Resistance to acid damage." }], blurb: "Corrosive acid in a line." },
  { id: "dragonborn-blue", raceId: "dragonborn", name: "Blue Dragon", asi: {}, traits: [{ name: "Lightning Breath", summary: "5 × 30 ft line of lightning (DC 8 + Con + prof)." }, { name: "Lightning Resistance", summary: "Resistance to lightning damage." }], blurb: "Crackling lightning in a line." },
  { id: "dragonborn-green", raceId: "dragonborn", name: "Green Dragon", asi: {}, traits: [{ name: "Poison Breath", summary: "15 ft cone of poison (DC 8 + Con + prof)." }, { name: "Poison Resistance", summary: "Resistance to poison damage." }], blurb: "Choking poison in a cone." },
  { id: "dragonborn-red", raceId: "dragonborn", name: "Red Dragon", asi: {}, traits: [{ name: "Fire Breath", summary: "15 ft cone of fire (DC 8 + Con + prof)." }, { name: "Fire Resistance", summary: "Resistance to fire damage." }], blurb: "Scorching fire in a cone." },
  { id: "dragonborn-white", raceId: "dragonborn", name: "White Dragon", asi: {}, traits: [{ name: "Cold Breath", summary: "15 ft cone of cold (DC 8 + Con + prof)." }, { name: "Cold Resistance", summary: "Resistance to cold damage." }], blurb: "Bitter cold in a cone." },
  { id: "dragonborn-brass", raceId: "dragonborn", name: "Brass Dragon", asi: {}, traits: [{ name: "Fire Breath", summary: "5 × 30 ft line of fire (DC 8 + Con + prof)." }, { name: "Fire Resistance", summary: "Resistance to fire damage." }], blurb: "Line of searing flame." },
  { id: "dragonborn-bronze", raceId: "dragonborn", name: "Bronze Dragon", asi: {}, traits: [{ name: "Lightning Breath", summary: "5 × 30 ft line of lightning (DC 8 + Con + prof)." }, { name: "Lightning Resistance", summary: "Resistance to lightning damage." }], blurb: "Line of forking lightning." },
  { id: "dragonborn-copper", raceId: "dragonborn", name: "Copper Dragon", asi: {}, traits: [{ name: "Acid Breath", summary: "5 × 30 ft line of acid (DC 8 + Con + prof)." }, { name: "Acid Resistance", summary: "Resistance to acid damage." }], blurb: "Line of caustic acid." },
  { id: "dragonborn-gold", raceId: "dragonborn", name: "Gold Dragon", asi: {}, traits: [{ name: "Fire Breath", summary: "15 ft cone of fire (DC 8 + Con + prof)." }, { name: "Fire Resistance", summary: "Resistance to fire damage." }], blurb: "Cone of brilliant flame." },
  { id: "dragonborn-silver", raceId: "dragonborn", name: "Silver Dragon", asi: {}, traits: [{ name: "Cold Breath", summary: "15 ft cone of cold (DC 8 + Con + prof)." }, { name: "Cold Resistance", summary: "Resistance to cold damage." }], blurb: "Cone of biting cold." },
];

export const SUBRACE_MAP = Object.fromEntries(SUBRACES.map((s) => [s.id, s]));

/** The canonical subrace for a race when none was chosen (keeps classic ASIs). */
export function defaultSubraceId(raceId: string): string | null {
  switch (raceId) {
    case "human":
      return "human-standard";
    case "elf":
      return "elf-high";
    case "dwarf":
      return "dwarf-hill";
    case "halfling":
      return "halfling-lightfoot";
    case "dragonborn":
      return "dragonborn-red";
    default:
      return null;
  }
}

/** Resolve a race's total ASI — race + subrace (Human Variant replaces +1-all). */
export function raceTotalAsi(
  raceId: string,
  subraceId?: string | null,
): Partial<Record<AbilityId, number>> {
  const race = RACE_MAP[raceId];
  const effective = subraceOf(raceId, subraceId);
  if (effective?.variantHuman) return {};
  const out: Partial<Record<AbilityId, number>> = { ...race.asi };
  for (const [k, v] of Object.entries(effective?.asi ?? {})) {
    out[k as AbilityId] = (out[k as AbilityId] ?? 0) + (v as number);
  }
  return out;
}

/** Resolve the subrace for display — falls back to the race's canonical subrace. */
export function subraceOf(
  raceId: string,
  subraceId?: string | null,
): SubraceDef | null {
  const id = subraceId ?? defaultSubraceId(raceId);
  return id ? SUBRACE_MAP[id] ?? null : null;
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: "acolyte",
    name: "Acolyte",
    skills: ["insight", "religion"],
    feature: {
      name: "Shelter of the Faithful",
      summary: "You can receive free healing and care at temples of your faith.",
    },
    equipment: ["Holy symbol", "Prayer book", "5 sticks of incense", "15 gp"],
    blurb: "You have spent your life in service to a temple.",
  },
  {
    id: "charlatan",
    name: "Charlatan",
    skills: ["deception", "sleight-of-hand"],
    feature: {
      name: "False Identity",
      summary: "You have a forged identity and the paperwork to back it.",
    },
    equipment: ["Fine clothes", "Disguise kit", "Forged papers", "15 gp"],
    blurb: "You are a master of cons, forgery and misdirection.",
  },
  {
    id: "criminal",
    name: "Criminal",
    skills: ["deception", "stealth"],
    feature: {
      name: "Criminal Contact",
      summary: "You have a reliable contact in the underworld.",
    },
    equipment: ["Crowbar", "Dark common clothes", "15 gp"],
    blurb: "You have a history of breaking the law, for better or worse.",
  },
  {
    id: "entertainer",
    name: "Entertainer",
    skills: ["acrobatics", "performance"],
    feature: {
      name: "By Popular Demand",
      summary: "You can always find a place to perform and be paid for it.",
    },
    equipment: ["Musical instrument", "Costume", "8 gp"],
    blurb: "You make your living delighting audiences.",
  },
  {
    id: "folk-hero",
    name: "Folk Hero",
    skills: ["animal-handling", "survival"],
    feature: {
      name: "Rustic Hospitality",
      summary: "Common folk will shelter and feed you without question.",
    },
    equipment: ["Shovel", "Iron pot", "Common clothes", "10 gp"],
    blurb: "A humble beginning made famous by a deed.",
  },
  {
    id: "guild-artisan",
    name: "Guild Artisan",
    skills: ["insight", "persuasion"],
    feature: {
      name: "Guild Membership",
      summary: "Your guild provides lodging, work and contacts.",
    },
    equipment: ["Guild signet", "Artisan's tools", "15 gp"],
    blurb: "A craftsman sworn to the rules of your guild.",
  },
  {
    id: "hermit",
    name: "Hermit",
    skills: ["medicine", "religion"],
    feature: {
      name: "Discovery",
      summary: "Your secluded life led to a unique discovery.",
    },
    equipment: ["Scroll case of notes", "Winter blanket", "5 gp"],
    blurb: "You withdrew from the world — and found something in the silence.",
  },
  {
    id: "noble",
    name: "Noble",
    skills: ["history", "persuasion"],
    feature: {
      name: "Position of Privilege",
      summary: "Nobles defer to you and common folk give you passage.",
    },
    equipment: ["Signet ring", "Fine clothes", "25 gp"],
    blurb: "Born to wealth, title and influence.",
  },
  {
    id: "outlander",
    name: "Outlander",
    skills: ["athletics", "survival"],
    feature: {
      name: "Wanderer",
      summary: "You always remember geography and can find food and water.",
    },
    equipment: ["Staff", "Hunting trap", "Animal trophy", "10 gp"],
    blurb: "Raised far from civilization, at home in the wild.",
  },
  {
    id: "sage",
    name: "Sage",
    skills: ["arcana", "history"],
    feature: {
      name: "Researcher",
      summary: "You know where to find obscure lore and can usually recall it.",
    },
    equipment: ["Ink & quill", "Small knife", "Letter from dead colleague", "10 gp"],
    blurb: "You spent years learning the lore of the realms.",
  },
  {
    id: "sailor",
    name: "Sailor",
    skills: ["athletics", "perception"],
    feature: {
      name: "Ship's Passage",
      summary: "You can arrange free passage on sailing vessels.",
    },
    equipment: ["Belaying pin", "50 ft of silk rope", "10 gp"],
    blurb: "You earned your keep on the open sea.",
  },
  {
    id: "soldier",
    name: "Soldier",
    skills: ["athletics", "intimidation"],
    feature: {
      name: "Military Rank",
      summary: "Soldiers recognize you as one of their own and may defer to you.",
    },
    equipment: ["Insignia of rank", "Trophy from a fallen enemy", "Deck of cards", "10 gp"],
    blurb: "You were trained for war and have seen battle.",
  },
  {
    id: "urchin",
    name: "Urchin",
    skills: ["sleight-of-hand", "stealth"],
    feature: {
      name: "City Secrets",
      summary: "You know the shortcuts, safe houses and sewers of cities.",
    },
    equipment: ["Small knife", "Map of your city", "Pet mouse", "10 gp"],
    blurb: "You grew up on the streets, quick and resourceful.",
  },
];

export const BACKGROUND_MAP = Object.fromEntries(
  BACKGROUNDS.map((b) => [b.id, b]),
);

// ---------------------------------------------------------------------------
// Feats / Talents (core + Tasha's Cauldron of Everything)
// ---------------------------------------------------------------------------

export interface FeatDef {
  id: string;
  name: string;
  source: "PHB" | "XGtE" | "TCoE";
  summary: string;
  effects?: {
    asi?: Partial<Record<AbilityId, number>>;
    skillProfs?: string[];
    expertise?: string[];
    toolProfs?: string[];
    saveProf?: AbilityId;
    hpPerLevel?: number;
    initiative?: number;
    speed?: number;
  };
}

export const FEATS: FeatDef[] = [
  { id: "actor", name: "Actor", source: "PHB", summary: "+1 Charisma. Master impersonation and mimic voices; advantage on Deception/Performance when passing yourself off.", effects: { asi: { cha: 1 } } },
  { id: "alert", name: "Alert", source: "PHB", summary: "+5 initiative. You can't be surprised while conscious.", effects: { initiative: 5 } },
  { id: "athlete", name: "Athlete", source: "PHB", summary: "+1 Str or Dex. Climb at full speed; standing from prone costs 5 ft; long jumps need no run-up.", effects: { asi: { str: 1 } } },
  { id: "chef", name: "Chef (TCoE)", source: "TCoE", summary: "+1 Con or Wis. Cook up temp-HP treats; with an hour of cooking, allies gain 1d8 temp HP." },
  { id: "crusher", name: "Crusher (TCoE)", source: "TCoE", summary: "+1 Str or Con. Bludgeoning hits push targets; critical hits grant advantage to your allies.", effects: { asi: { str: 1 } } },
  { id: "defensive-duelist", name: "Defensive Duelist", source: "PHB", summary: "+1 Dex. When hit with a melee attack while wielding a finesse weapon, add proficiency to AC as a reaction.", effects: { asi: { dex: 1 } } },
  { id: "dungeon-delver", name: "Dungeon Delver", source: "PHB", summary: "Advantage on Perception/Investigation to find traps and on saves vs traps; resistance to trap damage." },
  { id: "durable", name: "Durable", source: "PHB", summary: "+1 Con. Hit dice regain a minimum of twice your Con modifier.", effects: { asi: { con: 1 } } },
  { id: "eldritch-adept", name: "Eldritch Adept (TCoE)", source: "TCoE", summary: "Gain one warlock Eldritch Invocation you qualify for." },
  { id: "fey-touched", name: "Fey Touched (TCoE)", source: "TCoE", summary: "+1 Int, Wis or Cha. Learn Misty Step and one 1st-level divination/enchantment spell — cast once per long rest.", effects: { asi: { int: 1 } } },
  { id: "great-weapon-master", name: "Great Weapon Master", source: "PHB", summary: "−5 to hit for +10 damage with heavy weapons; bonus attack on a crit or kill." },
  { id: "keen-mind", name: "Keen Mind", source: "PHB", summary: "+1 Int. Perfect recall of anything you've seen in the past month.", effects: { asi: { int: 1 } } },
  { id: "lucky", name: "Lucky", source: "PHB", summary: "Three luck points per long rest to reroll attack rolls, checks or saves." },
  { id: "mage-slayer", name: "Mage Slayer", source: "PHB", summary: "Attack casters as a reaction; disadvantage on their concentration saves; advantage on saves vs their spells." },
  { id: "metamagic-adept", name: "Metamagic Adept (TCoE)", source: "TCoE", summary: "Learn two Metamagic options and gain 2 sorcery points." },
  { id: "mobile", name: "Mobile", source: "PHB", summary: "+10 ft speed. Dashing ignores difficult terrain; no opportunity attacks from creatures you attack.", effects: { speed: 10 } },
  { id: "observant", name: "Observant", source: "PHB", summary: "+1 Int or Wis. +5 to passive Perception and Investigation; read lips.", effects: { asi: { wis: 1 } } },
  { id: "piercer", name: "Piercer (TCoE)", source: "TCoE", summary: "+1 Str or Dex. Piercing crits add an extra damage die; reroll a piercing damage die once per turn.", effects: { asi: { dex: 1 } } },
  { id: "poisoner", name: "Poisoner (TCoE)", source: "TCoE", summary: "Ignore poison resistance; apply poison to a weapon as a bonus action; craft poisons." },
  { id: "resilient", name: "Resilient", source: "PHB", summary: "+1 to one ability and proficiency in its saving throw.", effects: { asi: { con: 1 }, saveProf: "con" } },
  { id: "sentinel", name: "Sentinel", source: "PHB", summary: "Opportunity attacks drop speed to 0; attack enemies that attack your allies as a reaction." },
  { id: "shadow-touched", name: "Shadow Touched (TCoE)", source: "TCoE", summary: "+1 Int, Wis or Cha. Learn Invisibility and one 1st-level illusion/necromancy spell — cast once per long rest.", effects: { asi: { int: 1 } } },
  { id: "sharpshooter", name: "Sharpshooter", source: "PHB", summary: "Ranged attacks ignore cover; −5 to hit for +10 damage; long range no penalty." },
  { id: "skill-expert", name: "Skill Expert (TCoE)", source: "TCoE", summary: "+1 to any ability. Proficiency in one skill and expertise in one skill you're proficient in.", effects: { asi: { dex: 1 }, skillProfs: ["perception"], expertise: ["perception"] } },
  { id: "skilled", name: "Skilled", source: "PHB", summary: "Proficiency in three skills of your choice.", effects: { skillProfs: ["insight", "investigation", "survival"] } },
  { id: "slasher", name: "Slasher (TCoE)", source: "TCoE", summary: "+1 Str or Dex. Slashing crits give the target disadvantage; reduce a target's speed by 10 ft on hit.", effects: { asi: { str: 1 } } },
  { id: "spell-sniper", name: "Spell Sniper", source: "PHB", summary: "Double spell-cantrip range; ranged spell attacks ignore half and three-quarters cover." },
  { id: "tavern-brawler", name: "Tavern Brawler", source: "PHB", summary: "+1 Str or Con. Improvised weapons and unarmed strikes use d4s; grapple as a bonus action after a hit.", effects: { asi: { str: 1 } } },
  { id: "telekinetic", name: "Telekinetic (TCoE)", source: "TCoE", summary: "+1 Int, Wis or Cha. Mage Hand you can cast invisibly; shove creatures with a bonus action.", effects: { asi: { int: 1 } } },
  { id: "telepathic", name: "Telepathic (TCoE)", source: "TCoE", summary: "+1 Int, Wis or Cha. Detect Thoughts once per rest; speak telepathically.", effects: { asi: { int: 1 } } },
  { id: "tough", name: "Tough", source: "PHB", summary: "Your HP maximum increases by 2 per level.", effects: { hpPerLevel: 2 } },
  { id: "war-caster", name: "War Caster", source: "PHB", summary: "Advantage on concentration saves; cast with hands full; cast a spell as an opportunity attack." },
];

export const FEAT_MAP = Object.fromEntries(FEATS.map((f) => [f.id, f]));

// ---------------------------------------------------------------------------
// Spell slot progression tables
// ---------------------------------------------------------------------------

// Full casters: bard, cleric, druid, sorcerer, wizard
export const FULL_CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

// Half casters: artificer, paladin, ranger
export const HALF_CASTER_SLOTS: number[][] = [
  [0, 0, 0, 0, 0], // 1
  [2, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0], // 5
  [4, 2, 0, 0, 0], // 6
  [4, 3, 0, 0, 0], // 7
  [4, 3, 0, 0, 0], // 8
  [4, 3, 2, 0, 0], // 9
  [4, 3, 2, 0, 0], // 10
  [4, 3, 3, 0, 0], // 11
  [4, 3, 3, 0, 0], // 12
  [4, 3, 3, 1, 0], // 13
  [4, 3, 3, 1, 0], // 14
  [4, 3, 3, 2, 0], // 15
  [4, 3, 3, 2, 0], // 16
  [4, 3, 3, 3, 1], // 17
  [4, 3, 3, 3, 1], // 18
  [4, 3, 3, 3, 2], // 19
  [4, 3, 3, 3, 2], // 20
];

// Warlock pact magic: [slots, slot level]
export const PACT_SLOTS: [number, number][] = [
  [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5],
  [2, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

export function profBonusForLevel(level: number): number {
  return level <= 4 ? 2 : level <= 8 ? 3 : level <= 12 ? 4 : level <= 16 ? 5 : 6;
}

export function spellSlotsFor(klass: ClassDef, level: number): {
  slots: number[];
  pact: { count: number; slotLevel: number } | null;
} {
  if (klass.casterType === "pact") {
    const [count, slotLevel] = PACT_SLOTS[Math.min(level, 20) - 1];
    return { slots: [], pact: { count, slotLevel } };
  }
  if (klass.casterType === "full") {
    return { slots: FULL_CASTER_SLOTS[Math.min(level, 20) - 1], pact: null };
  }
  if (klass.casterType === "half") {
    return { slots: HALF_CASTER_SLOTS[Math.min(level, 20) - 1], pact: null };
  }
  return { slots: [], pact: null };
}

// ---------------------------------------------------------------------------
// Weapons & armor
// ---------------------------------------------------------------------------

export const WEAPONS: WeaponDef[] = [
  { id: "unarmed", name: "Unarmed Strike", count: 1, sides: 1, ability: "str", properties: ["—"] },
  { id: "dagger", name: "Dagger", count: 1, sides: 4, ability: "dex", finesse: true, range: "20/60", properties: ["Finesse", "Light", "Thrown"] },
  { id: "shortsword", name: "Shortsword", count: 1, sides: 6, ability: "dex", finesse: true, range: "—", properties: ["Finesse", "Light"] },
  { id: "rapier", name: "Rapier", count: 1, sides: 8, ability: "dex", finesse: true, range: "—", properties: ["Finesse"] },
  { id: "longsword", name: "Longsword", count: 1, sides: 8, ability: "str", range: "—", properties: ["Versatile (1d10)"] },
  { id: "greataxe", name: "Greataxe", count: 1, sides: 12, ability: "str", twoHanded: true, range: "—", properties: ["Heavy", "Two-Handed"] },
  { id: "quarterstaff", name: "Quarterstaff", count: 1, sides: 6, ability: "str", range: "—", properties: ["Versatile (1d8)"] },
  { id: "handaxe", name: "Handaxe", count: 1, sides: 6, ability: "str", range: "20/60", properties: ["Light", "Thrown"] },
  { id: "longbow", name: "Longbow", count: 1, sides: 8, ability: "dex", twoHanded: true, range: "150/600", properties: ["Heavy", "Two-Handed", "Ranged"] },
  { id: "shortbow", name: "Shortbow", count: 1, sides: 6, ability: "dex", twoHanded: true, range: "80/320", properties: ["Two-Handed", "Ranged"] },
  { id: "light-crossbow", name: "Light Crossbow", count: 1, sides: 8, ability: "dex", twoHanded: true, range: "80/320", properties: ["Ranged", "Loading"] },
];

export const WEAPON_MAP = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

export const ARMORS: ArmorDef[] = [
  { id: "none", name: "Unarmored", acKind: "none", baseAc: 10 },
  { id: "leather", name: "Leather Armor", acKind: "light", baseAc: 11 },
  { id: "studded", name: "Studded Leather", acKind: "light", baseAc: 12 },
  { id: "scale", name: "Scale Mail", acKind: "medium", baseAc: 14, dexCap: 2, stealthDis: true },
  { id: "half-plate", name: "Half Plate", acKind: "medium", baseAc: 15, dexCap: 2, stealthDis: true },
  { id: "chain", name: "Chain Mail", acKind: "heavy", baseAc: 16, stealthDis: true, note: "Str 13 to wear" },
];

export const ARMOR_MAP = Object.fromEntries(ARMORS.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Classes — core twelve + Tasha's ARTIFICER, with TCoE subclasses
// ---------------------------------------------------------------------------

const SKILL_SETS = {
  fighter: ["acrobatics", "animal-handling", "athletics", "history", "insight", "intimidation", "perception", "survival"],
  rogue: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight-of-hand", "stealth"],
  wizard: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
  cleric: ["history", "insight", "medicine", "persuasion", "religion"],
  paladin: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
  barbarian: ["animal-handling", "athletics", "intimidation", "nature", "perception", "survival"],
  bard: ["acrobatics", "animal-handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight-of-hand", "stealth", "survival"],
  druid: ["arcana", "animal-handling", "insight", "medicine", "nature", "perception", "religion", "survival"],
  ranger: ["animal-handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
  sorcerer: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
  warlock: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
  monk: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
  artificer: ["arcana", "history", "investigation", "medicine", "nature", "perception", "sleight-of-hand"],
};

// ---------------------------------------------------------------------------
// Artificer (TCoE)
// ---------------------------------------------------------------------------

const artificerSubclasses = [
  {
    id: "alchemist",
    name: "Alchemist",
    source: "TCoE" as const,
    blurb: "Master of transmutation, brewing experimental elixirs.",
    features: [
      { id: "elixir", name: "Experimental Elixir", level: 3, rest: "long", summary: "Brew random beneficial elixirs; can grant temporary HP (1d6 + Int).", hook: { kind: "tempHp", die: 6, ability: "int" } },
      { id: "alchemist-savant", name: "Alchemical Savant", level: 5, summary: "Add Int to damage of spells using your alchemist's supplies." },
      { id: "restorative-reagents", name: "Restorative Reagents", level: 9, summary: "Administer elixirs as a bonus action; healing bonus." },
    ],
  },
  {
    id: "armorer",
    name: "Armorer",
    source: "TCoE" as const,
    blurb: "Engineers an Arcane Armor that turns defense into offense.",
    features: [
      { id: "arcane-armor", name: "Arcane Armor", level: 3, summary: "Armor becomes a power suit — weapons within it use Intelligence.", hook: { kind: "narrative" } },
      { id: "thunder-gauntlets", name: "Thunder Gauntlets", level: 3, summary: "Gauntlet strikes: on hit, the target has disadvantage attacking anyone but you.", hook: { kind: "extraDamage", die: 0, times: "always" } },
      { id: "guardian-model", name: "Guardian Model", level: 3, summary: "Gain a defensive field; Thunder Gauntlets taunt struck foes." },
      { id: "armor-modifications", name: "Armor Modifications", level: 9, summary: "Infuse armor with extra properties." },
    ],
  },
  {
    id: "artillerist",
    name: "Artillerist",
    source: "TCoE" as const,
    blurb: "Wields a magical cannon as a focus for destructive energy.",
    features: [
      { id: "eldritch-cannon", name: "Eldritch Cannon", level: 3, rest: "long", summary: "Summon a tiny cannon; its Force Ballista adds 1d8 force to an attack.", hook: { kind: "extraDamage", die: 8, times: "oncePerTurn" } },
      { id: "arcane-firearm", name: "Arcane Firearm", level: 5, summary: "Spell attacks gain +1d8 damage." },
      { id: "explosive-cannon", name: "Explosive Cannon", level: 9, summary: "Your cannon detonates for AoE force damage." },
    ],
  },
  {
    id: "battle-smith",
    name: "Battle Smith",
    source: "TCoE" as const,
    blurb: "A master smith fighting beside a magically-animated Steel Defender.",
    features: [
      { id: "steel-defender", name: "Steel Defender", level: 3, summary: "A loyal construct ally fights at your side and can be healed.", hook: { kind: "narrative" } },
      { id: "battle-ready", name: "Battle Ready", level: 3, summary: "Attack with magic weapons using Intelligence instead of Str/Dex.", hook: { kind: "narrative" } },
      { id: "arcane-jolt", name: "Arcane Jolt", level: 9, rest: "long", summary: "On a hit, deal 2d6 extra damage or heal 2d6." },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// All classes
// ---------------------------------------------------------------------------

export const CLASSES: ClassDef[] = [
  {
    id: "artificer",
    name: "Artificer",
    hitDie: 8,
    primaryAbility: "int",
    saves: ["con", "int"],
    skillOptions: SKILL_SETS.artificer,
    skillCount: 2,
    spellAbility: "int",
    casterType: "half",
    subclassLevel: 3,
    blurb: "A tinker-mage who infuses magic into objects (TCoE).",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
        { id: "light-crossbow", label: "Light crossbow & 20 bolts" },
      ],
      defaultWeapon: "quarterstaff",
      armorOptions: [
        { id: "leather", label: "Leather armor" },
        { id: "scale", label: "Scale mail" },
      ],
      defaultArmor: "leather",
      packOptions: ["Dungeoneer's pack"],
      extras: ["Thieves' tools", "Tinker's tools"],
    },
    resources: [
      { id: "infusions", label: "Infusions", rest: "long", max: (c) => (c.level >= 20 ? 6 : c.level >= 18 ? 6 : c.level >= 14 ? 5 : c.level >= 10 ? 4 : c.level >= 6 ? 3 : 2), note: "Known / active" },
      { id: "flash-of-genius", label: "Flash of Genius", rest: "long", max: (c) => Math.max(1, Math.floor((c.baseScores.int + (raceTotalAsi(c.raceId, c.subraceId).int ?? 0) - 10) / 2)) },
    ],
    features: [
      { id: "magical-tinkering", name: "Magical Tinkering", level: 1, summary: "Imbue tiny objects with minor magical effects." },
      { id: "spellcasting-art", name: "Spellcasting", level: 1, summary: "Half-caster prepared spells from the Artificer list (Int)." },
      { id: "infuse", name: "Infuse Item", level: 2, rest: "long", summary: "Create or replicate a magic item; replenished on a long rest.", uses: (c) => (c.level >= 20 ? 6 : c.level >= 18 ? 6 : c.level >= 14 ? 5 : c.level >= 10 ? 4 : c.level >= 6 ? 3 : 2) },
      { id: "tool-proficiency", name: "Tool Proficiency", level: 1, summary: "Proficiency with thieves' tools, tinker's tools, and one artisan tool." },
      { id: "flash-of-genius", name: "Flash of Genius", level: 7, rest: "long", summary: "When you or a nearby ally fails a check or save, add your Int modifier instead.", hook: { kind: "addFlat", label: "Flash of Genius", flat: (c) => Math.max(1, Math.floor((c.baseScores.int + (raceTotalAsi(c.raceId, c.subraceId).int ?? 0) - 10) / 2)) } },
      { id: "spell-storing-item", name: "Spell-Storing Item", level: 11, summary: "Store a 2nd-level spell in an object for repeated casting." },
      { id: "soul-of-artifice", name: "Soul of Artifice", level: 20, summary: "+1 to all saves per infused item; survive at 1 HP." },
    ],
    subclasses: [...artificerSubclasses] as unknown as ClassDef["subclasses"],
  },
  {
    id: "fighter",
    name: "Fighter",
    hitDie: 10,
    primaryAbility: "str",
    saves: ["str", "con"],
    skillOptions: SKILL_SETS.fighter,
    skillCount: 2,
    subclassLevel: 3,
    blurb: "Peerless master of weapons and armor.",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "longsword", label: "Martial weapon + shield" },
        { id: "greataxe", label: "Two martial weapons (greataxe)" },
      ],
      defaultWeapon: "longsword",
      armorOptions: [
        { id: "chain", label: "Chain mail" },
        { id: "leather", label: "Leather armor + longbow" },
      ],
      defaultArmor: "chain",
      shieldInKit: true,
      packOptions: ["Dungeoneer's pack", "Explorer's pack"],
      extras: ["Light crossbow & 20 bolts"],
    },
    resources: [
      { id: "second-wind", label: "Second Wind", rest: "short", max: () => 1 },
      { id: "action-surge", label: "Action Surge", rest: "short", max: (c) => (c.level >= 17 ? 2 : 1) },
    ],
    features: [
      { id: "fighting-style", name: "Fighting Style", level: 1, summary: "Choose a fighting style that sharpens your combat." },
      { id: "second-wind", name: "Second Wind", level: 1, rest: "short", summary: "Bonus action to regain 1d10 + fighter level HP.", uses: () => 1, hook: { kind: "healDie", die: 10, count: 1, ability: undefined } },
      { id: "action-surge", name: "Action Surge", level: 2, rest: "short", summary: "Take one additional action on your turn.", uses: (c) => (c.level >= 17 ? 2 : 1) },
      { id: "extra-attack", name: "Extra Attack", level: 5, summary: "Attack twice when you take the Attack action." },
      { id: "indomitable", name: "Indomitable", level: 9, rest: "long", summary: "Reroll a failed saving throw.", uses: (c) => (c.level >= 17 ? 3 : c.level >= 13 ? 2 : 1) },
    ],
    subclasses: [
      { id: "champion", name: "Champion", source: "PHB", blurb: "Unmatched physical prowess and critical hits.", features: [
        { id: "improved-critical", name: "Improved Critical", level: 3, summary: "Critical hits on a roll of 19-20." },
        { id: "remarkable-athlete", name: "Remarkable Athlete", level: 7, summary: "Half proficiency on Str/Dex/Con checks." },
        { id: "superior-critical", name: "Superior Critical", level: 15, summary: "Critical hits on a roll of 18-20." },
      ]},
      { id: "battle-master", name: "Battle Master", source: "PHB", blurb: "Maneuvers that bend the flow of battle.", features: [
        { id: "combat-superiority", name: "Combat Superiority", level: 3, rest: "short", summary: "Superiority dice (1d8) fuel maneuvers like Precision Attack and Trip Attack." },
        { id: "maneuvers", name: "Student of War", level: 3, summary: "Proficiency in one artisan's tool." },
        { id: "know-your-enemy", name: "Know Your Enemy", level: 7, summary: "Study a creature to learn its capabilities." },
      ]},
      { id: "eldritch-knight", name: "Eldritch Knight", source: "PHB", blurb: "Blends weaponcraft with abjuration magic.", features: [
        { id: "spellcasting-ek", name: "Spellcasting", level: 3, summary: "Wizard spells of the abjuration and evocation schools." },
        { id: "weapon-bond", name: "Weapon Bond", level: 3, summary: "Summon your bonded weapon as a bonus action." },
        { id: "war-magic", name: "War Magic", level: 7, summary: "Make a weapon attack after casting a cantrip." },
      ]},
      { id: "psi-warrior", name: "Psi Warrior", source: "TCoE", blurb: "Fights with psionic energy (Tasha's).", features: [
        { id: "psionic-power", name: "Psionic Power", level: 3, rest: "long", summary: "A pool of d6s (2× prof bonus) to boost checks, damage or defense.", uses: (c) => 2 * profBonusForLevel(c.level), hook: { kind: "addDie", die: 6, label: "Psionic Energy" } },
        { id: "telekinetic-movement", name: "Telekinetic Movement", level: 7, summary: "Move objects or creatures with your mind." },
        { id: "bulwark-of-force", name: "Bulwark of Force", level: 15, summary: "Shield allies in a dome of force." },
      ]},
      { id: "rune-knight", name: "Rune Knight", source: "TCoE", blurb: "Carves giant runes that swell his might (Tasha's).", features: [
        { id: "giants-might", name: "Giant's Might", level: 3, rest: "long", summary: "Grow to Large: advantage on Str checks/saves, +1d6 damage once per turn.", uses: (c) => c.level >= 15 ? 3 : 2, hook: { kind: "extraDamage", die: 6, times: "oncePerTurn" } },
        { id: "rune-carver", name: "Rune Carver", level: 3, summary: "Inscribe magical runes on objects — Cloud, Stone, Fire." },
        { id: "runic-shield", name: "Runic Shield", level: 7, summary: "Use a reaction to deflect an attack to a nearby creature." },
      ]},
      { id: "samurai", name: "Samurai", source: "XGtE", blurb: "Iron discipline of the katana and the bow.", features: [
        { id: "fighting-spirit", name: "Fighting Spirit", level: 3, rest: "long", summary: "Grant yourself advantage on all attacks until end of turn.", uses: (c) => c.level >= 10 ? 3 : 2, hook: { kind: "advantageOn", checks: "attack" } },
        { id: "elegant-courtier", name: "Elegant Courtier", level: 7, summary: "Proficiency in Persuasion; add Wis to it." },
      ]},
    ],
  },
  {
    id: "rogue",
    name: "Rogue",
    hitDie: 8,
    primaryAbility: "dex",
    saves: ["dex", "int"],
    skillOptions: SKILL_SETS.rogue,
    skillCount: 4,
    subclassLevel: 3,
    blurb: "Skirmisher, infiltrator and master of sneak attacks.",

    startingWealth: { dice: "4d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "rapier", label: "Rapier" },
        { id: "shortsword", label: "Shortsword" },
      ],
      defaultWeapon: "rapier",
      secondWeaponOptions: [
        { id: "shortbow", label: "Shortbow & 20 arrows" },
        { id: "shortsword", label: "Second shortsword" },
      ],
      defaultSecondWeapon: "shortbow",
      armorOptions: [{ id: "leather", label: "Leather armor" }],
      defaultArmor: "leather",
      packOptions: ["Burglar's pack", "Dungeoneer's pack", "Explorer's pack"],
      extras: ["2 × Dagger", "Thieves' tools"],
    },
    resources: [],
    features: [
      { id: "expertise", name: "Expertise", level: 1, summary: "Double proficiency on two chosen skills." },
      { id: "sneak-attack", name: "Sneak Attack", level: 1, summary: "Once per turn, deal extra dice when you have advantage or an ally is adjacent.", hook: { kind: "extraDamage", die: 6, times: "oncePerTurn" } },
      { id: "thieves-cant", name: "Thieves' Cant", level: 1, summary: "A secret language of the underworld." },
      { id: "cunning-action", name: "Cunning Action", level: 2, summary: "Dash, Disengage or Hide as a bonus action." },
      { id: "uncanny-dodge", name: "Uncanny Dodge", level: 5, summary: "Halve damage from an attack you can see." },
      { id: "evasion", name: "Evasion", level: 7, summary: "No damage on successful Dex saves; half on failure." },
    ],
    subclasses: [
      { id: "thief", name: "Thief", source: "PHB", blurb: "A classic pickpocket and climber.", features: [
        { id: "fast-hands", name: "Fast Hands", level: 3, summary: "Use objects as a bonus action." },
        { id: "second-story-work", name: "Second-Story Work", level: 3, summary: "Climb speed equal to walking speed." },
        { id: "supreme-sneak", name: "Supreme Sneak", level: 9, summary: "Advantage on Stealth when moving half speed." },
      ]},
      { id: "assassin", name: "Assassin", source: "PHB", blurb: "Deadly strikes against the unprepared.", features: [
        { id: "assassinate", name: "Assassinate", level: 3, summary: "Advantage on attacks vs creatures that haven't acted; crits on surprise." },
        { id: "infiltration-expertise", name: "Infiltration Expertise", level: 9, summary: "Craft false identities with ease." },
      ]},
      { id: "arcane-trickster", name: "Arcane Trickster", source: "PHB", blurb: "Rogue with a wizard's cantrips up the sleeve.", features: [
        { id: "mage-hand", name: "Mage Hand Legerdemain", level: 3, summary: "Invisible, untraceable Mage Hand." },
        { id: "magical-ambush", name: "Magical Ambush", level: 9, summary: "Disadvantage on saves vs your spells when hidden." },
      ]},
      { id: "soulknife", name: "Soulknife", source: "TCoE", blurb: "Psionic blades of pure will (Tasha's).", features: [
        { id: "psionic-power", name: "Psionic Power", level: 3, rest: "long", summary: "Psionic Energy dice (2× prof) to boost d20 rolls or return after a miss.", uses: (c) => 2 * profBonusForLevel(c.level), hook: { kind: "addDie", die: 6, label: "Psionic Energy" } },
        { id: "psychic-blades", name: "Psychic Blades", level: 3, summary: "Summon blades of psychic energy — 1d6, thrown at 60 ft." },
        { id: "soul-blades", name: "Soul Blades", level: 9, summary: "Blades ignore armor and shields partially; telepathic sight." },
      ]},
      { id: "phantom", name: "Phantom", source: "TCoE", blurb: "Feeds on the souls of the fallen (Tasha's).", features: [
        { id: "wails-from-grave", name: "Wails from the Grave", level: 3, summary: "When you damage a creature, half-prof-bonus necrotic damage to another nearby.", hook: { kind: "extraDamage", die: 0, times: "oncePerTurn" } },
        { id: "whispers-of-dead", name: "Whispers of the Dead", level: 9, summary: "Gain a skill proficiency after a short rest." },
      ]},
    ],
  },
  {
    id: "wizard",
    name: "Wizard",
    hitDie: 6,
    primaryAbility: "int",
    saves: ["int", "wis"],
    skillOptions: SKILL_SETS.wizard,
    skillCount: 2,
    spellAbility: "int",
    casterType: "full",
    subclassLevel: 2,
    blurb: "Scholars who command reality through study.",

    startingWealth: { dice: "4d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "quarterstaff", label: "Quarterstaff" },
        { id: "dagger", label: "Dagger" },
      ],
      defaultWeapon: "quarterstaff",
      armorOptions: [{ id: "none", label: "Unarmored" }],
      defaultArmor: "none",
      packOptions: ["Scholar's pack", "Explorer's pack"],
      extras: ["Spellbook", "Arcane focus"],
    },
    resources: [
      { id: "arcane-recovery", label: "Arcane Recovery", rest: "long", max: () => 1 },
    ],
    features: [
      { id: "spellcasting-wiz", name: "Spellcasting", level: 1, summary: "Prepared spells from your spellbook (Int)." },
      { id: "arcane-recovery", name: "Arcane Recovery", level: 1, rest: "long", summary: "Regain spell slots worth up to half your level.", uses: () => 1 },
      { id: "cantrips", name: "Cantrips", level: 1, summary: "Five cantrips at 1st level, growing to six." },
      { id: "spell-mastery", name: "Spell Mastery", level: 18, summary: "Cast two 1st- and 2nd-level spells at will." },
    ],
    subclasses: [
      { id: "abjuration", name: "School of Abjuration", source: "PHB", blurb: "Arcane wards and counterspells.", features: [
        { id: "arcane-ward", name: "Arcane Ward", level: 2, summary: "A magical ward absorbs damage equal to 2× level + Int." },
        { id: "projected-ward", name: "Projected Ward", level: 6, summary: "Transfer your ward's protection to an ally." },
      ]},
      { id: "conjuration", name: "School of Conjuration", source: "PHB", blurb: "Summons and teleportation.", features: [
        { id: "minor-conjuration", name: "Minor Conjuration", level: 2, summary: "Conjure a small object that lasts 1 hour." },
        { id: "benign-transposition", name: "Benign Transposition", level: 6, summary: "Teleport-swap with a nearby creature." },
      ]},
      { id: "divination", name: "School of Divination", source: "PHB", blurb: "Seers and portents.", features: [
        { id: "portent", name: "Portent", level: 2, summary: "Roll two d20s each day; replace any roll with them.", hook: { kind: "addDie", die: 20, label: "Portent" } },
        { id: "expert-divination", name: "Expert Divination", level: 6, summary: "Cast divination spells cheaply; regain slots." },
      ]},
      { id: "enchantment", name: "School of Enchantment", source: "PHB", blurb: "Masters of charms and commands.", features: [
        { id: "hypnotic-gaze", name: "Hypnotic Gaze", level: 2, summary: "Charm a creature for one turn." },
        { id: "instinctive-charm", name: "Instinctive Charm", level: 6, summary: "Turn an attack against an attacker." },
      ]},
      { id: "evocation", name: "School of Evocation", source: "PHB", blurb: "Destructive forces, precisely aimed.", features: [
        { id: "sculpt-spells", name: "Sculpt Spells", level: 2, summary: "Protect allies from your evocation spells." },
        { id: "potent-cantrip", name: "Potent Cantrip", level: 6, summary: "Cantrips deal half damage on a failed save." },
      ]},
      { id: "illusion", name: "School of Illusion", source: "PHB", blurb: "Deception woven from light and shadow.", features: [
        { id: "illusory-script", name: "Illusory Script", level: 2, summary: "Write messages that appear only to chosen readers." },
        { id: "malleable-illusions", name: "Malleable Illusions", level: 6, summary: "Reshape your illusions on the fly." },
      ]},
      { id: "necromancy", name: "School of Necromancy", source: "PHB", blurb: "The unquiet science of life and death.", features: [
        { id: "grim-harvest", name: "Grim Harvest", level: 2, summary: "Regain HP when you slay with necromancy." },
        { id: "undead-thralls", name: "Undead Thralls", level: 6, summary: "Animate the dead more durably." },
      ]},
      { id: "transmutation", name: "School of Transmutation", source: "PHB", blurb: "Changes the substance of reality.", features: [
        { id: "minor-alchemy", name: "Minor Alchemy", level: 2, summary: "Transmute materials for up to 1 hour." },
        { id: "transmuters-stone", name: "Transmuter's Stone", level: 6, summary: "Create a stone granting speed, resists or HP." },
      ]},
      { id: "bladesinging", name: "Bladesinging", source: "TCoE", blurb: "Elven sword-dance magic (Tasha's).", features: [
        { id: "bladesong", name: "Bladesong", level: 2, rest: "short", summary: "Enter a trance of grace: +Int to AC, advantage on Dexterity checks, concentration saves.", uses: (c) => c.level >= 10 ? 3 : 2, hook: { kind: "acBonus", value: (c) => Math.max(1, Math.floor((c.baseScores.int + (raceTotalAsi(c.raceId, c.subraceId).int ?? 0) - 10) / 2)) } },
        { id: "extra-attack-bs", name: "Extra Attack", level: 6, summary: "Attack twice; weave a cantrip between strikes." },
        { id: "song-of-defense", name: "Song of Defense", level: 10, summary: "Spend a slot to reduce damage taken." },
      ]},
      { id: "order-of-scribes", name: "Order of Scribes", source: "TCoE", blurb: "Manifest magic as living ink (Tasha's).", features: [
        { id: "awakened-spellbook", name: "Awakened Spellbook", level: 2, summary: "Your spellbook is a sentient conduit — change damage types of your spells." },
        { id: "manifest-mind", name: "Manifest Mind", level: 6, summary: "Cast spells from your manifested spellbook's location." },
        { id: "one-with-word", name: "One with the Word", level: 14, summary: "Briefly become your spellbook to escape death." },
      ]},
    ],
  },
  {
    id: "cleric",
    name: "Cleric",
    hitDie: 8,
    primaryAbility: "wis",
    saves: ["wis", "cha"],
    skillOptions: SKILL_SETS.cleric,
    skillCount: 2,
    spellAbility: "wis",
    casterType: "full",
    subclassLevel: 1,
    blurb: "Channel divine power in the service of a god.",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "quarterstaff", label: "Mace" },
        { id: "longsword", label: "Warhammer" },
      ],
      defaultWeapon: "quarterstaff",
      armorOptions: [
        { id: "scale", label: "Scale mail" },
        { id: "chain", label: "Chain mail" },
        { id: "leather", label: "Leather armor" },
      ],
      defaultArmor: "scale",
      shieldInKit: true,
      packOptions: ["Priest's pack", "Explorer's pack"],
      extras: ["Holy symbol", "Light crossbow & 20 bolts"],
    },
    resources: [
      { id: "channel-divinity", label: "Channel Divinity", rest: "short", max: (c) => (c.level >= 6 ? 2 : 1) },
    ],
    features: [
      { id: "spellcasting-clr", name: "Spellcasting", level: 1, summary: "Prepared divine spells (Wis)." },
      { id: "channel-divinity", name: "Channel Divinity", level: 2, rest: "short", summary: "Turn Undead or your domain's power.", uses: (c) => (c.level >= 6 ? 2 : 1) },
      { id: "destroy-undead", name: "Destroy Undead", level: 5, summary: "Undead of CR below a threshold are destroyed." },
      { id: "divine-intervention", name: "Divine Intervention", level: 10, rest: "long", summary: "Call upon your deity's direct aid.", uses: () => 1 },
    ],
    subclasses: [
      { id: "life", name: "Life Domain", source: "PHB", blurb: "The healing hand of the divine.", features: [
        { id: "disciple-of-life", name: "Disciple of Life", level: 1, summary: "Healing spells restore extra HP." },
        { id: "preserve-life", name: "Preserve Life", level: 2, summary: "Channel Divinity: heal up to 5× level HP." },
        { id: "divine-strike-life", name: "Divine Strike", level: 8, summary: "Add radiant damage to weapon hits." },
      ]},
      { id: "light", name: "Light Domain", source: "PHB", blurb: "Burning away darkness and undeath.", features: [
        { id: "radiance", name: "Radiance of the Dawn", level: 2, summary: "Channel Divinity: burst of sunlight vs undead." },
        { id: "potent-spellcasting", name: "Potent Spellcasting", level: 8, summary: "Add Wis to cantrip damage." },
      ]},
      { id: "trickery", name: "Trickery Domain", source: "PHB", blurb: "Gods of mischief and shadows.", features: [
        { id: "blessing-trickster", name: "Blessing of the Trickster", level: 1, summary: "Grant advantage on Stealth to an ally." },
        { id: "invoke-duplicity", name: "Invoke Duplicity", level: 2, summary: "Create an illusory duplicate of yourself." },
      ]},
      { id: "war", name: "War Domain", source: "PHB", blurb: "Clergy of battle and conquest.", features: [
        { id: "war-priest", name: "War Priest", level: 1, summary: "Extra attack with a weapon as a bonus action." },
        { id: "guided-strike", name: "Guided Strike", level: 2, summary: "Channel Divinity: +10 to an attack roll." },
        { id: "divine-strike-war", name: "Divine Strike", level: 8, summary: "Add radiant damage to weapon hits." },
      ]},
      { id: "forge", name: "Forge Domain", source: "XGtE", blurb: "Smiths blessed by the fire of creation.", features: [
        { id: "blessing-of-forge", name: "Blessing of the Forge", level: 1, summary: "Grant a +1 magic weapon or armor." },
        { id: "artisans-blessing", name: "Artisan's Blessing", level: 2, summary: "Channel Divinity: craft nonmagical items." },
        { id: "divine-strike-forge", name: "Divine Strike", level: 8, summary: "Add fire damage to weapon hits." },
      ]},
      { id: "twilight", name: "Twilight Domain", source: "TCoE", blurb: "The gentle twilight between day and night (Tasha's).", features: [
        { id: "twilight-sanctuary", name: "Twilight Sanctuary", level: 2, summary: "Channel Divinity: allies gain 1d6+level temporary HP each round.", hook: { kind: "tempHp", die: 6 } },
        { id: "steps-of-night", name: "Steps of Night", level: 6, summary: "Fly in dim light or darkness." },
        { id: "divine-strike-twilight", name: "Divine Strike", level: 8, summary: "Add radiant damage to weapon hits." },
      ]},
      { id: "grave", name: "Grave Domain", source: "XGtE", blurb: "Keepers of the line between life and death.", features: [
        { id: "circle-of-mortality", name: "Circle of Mortality", level: 1, summary: "Healing a dying creature restores maximum die values." },
        { id: "path-to-grave", name: "Path to the Grave", level: 2, summary: "Channel Divinity: mark a foe — next hit deals double damage." },
      ]},
    ],
  },
  {
    id: "paladin",
    name: "Paladin",
    hitDie: 10,
    primaryAbility: "str",
    saves: ["wis", "cha"],
    skillOptions: SKILL_SETS.paladin,
    skillCount: 2,
    spellAbility: "cha",
    casterType: "half",
    subclassLevel: 3,
    blurb: "A holy knight bound by oath.",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "longsword", label: "Martial weapon + shield" },
        { id: "greataxe", label: "Two martial weapons (greataxe)" },
      ],
      defaultWeapon: "longsword",
      armorOptions: [{ id: "chain", label: "Chain mail" }],
      defaultArmor: "chain",
      shieldInKit: true,
      packOptions: ["Priest's pack", "Explorer's pack"],
      extras: ["5 × Javelin", "Holy symbol"],
    },
    resources: [
      { id: "lay-on-hands", label: "Lay on Hands pool", rest: "long", max: (c) => c.level * 5, note: "hp of healing" },
    ],
    features: [
      { id: "divine-sense", name: "Divine Sense", level: 1, summary: "Sense celestials, fiends and undead nearby." },
      { id: "lay-on-hands", name: "Lay on Hands", level: 1, rest: "long", summary: "Heal a total of 5× level HP per day, cures diseases.", uses: (c) => c.level * 5 },
      { id: "fighting-style-pal", name: "Fighting Style", level: 2, summary: "Choose a combat fighting style." },
      { id: "divine-smite", name: "Divine Smite", level: 2, summary: "On a hit, spend a spell slot: 2d8 + 1d8 per higher slot radiant.", hook: { kind: "extraDamage", die: 8, times: "oncePerTurn" } },
      { id: "extra-attack-pal", name: "Extra Attack", level: 5, summary: "Attack twice with the Attack action." },
      { id: "aura-of-protection", name: "Aura of Protection", level: 6, summary: "You and nearby allies add your Cha to all saving throws." },
    ],
    subclasses: [
      { id: "devotion", name: "Oath of Devotion", source: "PHB", blurb: "The classic knight's oath.", features: [
        { id: "sacred-weapon", name: "Sacred Weapon", level: 3, summary: "Channel Divinity: add Cha to attack rolls, shed light." },
        { id: "turn-unholy", name: "Turn the Unholy", level: 3, summary: "Channel Divinity: turn fiends and undead." },
        { id: "aura-of-devotion", name: "Aura of Devotion", level: 7, summary: "Immunity to charm for you and nearby allies." },
      ]},
      { id: "ancients", name: "Oath of the Ancients", source: "PHB", blurb: "Guardians of nature and light.", features: [
        { id: "nature-wrath", name: "Nature's Wrath", level: 3, summary: "Channel Divinity: restrain a foe with vines." },
        { id: "ancients-ward", name: "Aura of Warding", level: 7, summary: "Resistance to spell damage for nearby allies." },
      ]},
      { id: "vengeance", name: "Oath of Vengeance", source: "PHB", blurb: "Hunters of the wicked.", features: [
        { id: "abjure-enemy", name: "Abjure Enemy", level: 3, summary: "Channel Divinity: frighten or paralyze a foe." },
        { id: "vow-enmity", name: "Vow of Enmity", level: 3, summary: "Channel Divinity: advantage on attacks vs one foe.", hook: { kind: "advantageOn", checks: "attack" } },
        { id: "relentless-avenger", name: "Relentless Avenger", level: 7, summary: "Move as a reaction when an enemy provokes." },
      ]},
      { id: "conquest", name: "Oath of Conquest", source: "XGtE", blurb: "Rule through terror.", features: [
        { id: "conquering-presence", name: "Conquering Presence", level: 3, summary: "Channel Divinity: frighten nearby creatures." },
        { id: "aura-of-conquest", name: "Aura of Conquest", level: 7, summary: "Frightened enemies in your aura are restrained." },
      ]},
    ],
  },
  {
    id: "barbarian",
    name: "Barbarian",
    hitDie: 12,
    primaryAbility: "str",
    saves: ["str", "con"],
    skillOptions: SKILL_SETS.barbarian,
    skillCount: 2,
    subclassLevel: 3,
    blurb: "Primal fury channeled into combat.",

    startingWealth: { dice: "2d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "greataxe", label: "Greataxe" },
        { id: "longsword", label: "Martial melee weapon" },
      ],
      defaultWeapon: "greataxe",
      armorOptions: [{ id: "none", label: "Unarmored (Unarmored Defense)" }],
      defaultArmor: "none",
      packOptions: ["Explorer's pack"],
      extras: ["2 × Handaxe", "4 × Javelin"],
    },
    resources: [
      { id: "rage", label: "Rage", rest: "long", max: (c) => (c.level >= 20 ? 6 : c.level >= 17 ? 6 : c.level >= 12 ? 5 : c.level >= 6 ? 4 : c.level >= 3 ? 3 : 2) },
    ],
    features: [
      { id: "rage", name: "Rage", level: 1, rest: "long", summary: "Enter a rage: advantage on Str checks/saves, +2 damage with Str attacks.", uses: (c) => (c.level >= 20 ? 6 : c.level >= 17 ? 6 : c.level >= 12 ? 5 : c.level >= 6 ? 4 : c.level >= 3 ? 3 : 2), hook: { kind: "status", status: "raging" } },
      { id: "unarmored-defense", name: "Unarmored Defense", level: 1, summary: "AC = 10 + Dex + Con while unarmored." },
      { id: "reckless-attack", name: "Reckless Attack", level: 2, summary: "Toggle: advantage on attack rolls; attacks against you have advantage.", hook: { kind: "status", status: "reckless" } },
      { id: "danger-sense", name: "Danger Sense", level: 2, summary: "Advantage on Dex saves vs visible dangers." },
      { id: "extra-attack-barb", name: "Extra Attack", level: 5, summary: "Attack twice with the Attack action." },
      { id: "brutal-critical", name: "Brutal Critical", level: 9, summary: "Extra weapon die on critical hits." },
    ],
    subclasses: [
      { id: "berserker", name: "Path of the Berserker", source: "PHB", blurb: "Fury without limit.", features: [
        { id: "frenzy", name: "Frenzy", level: 3, summary: "Attack as a bonus action while raging; gain exhaustion after." },
        { id: "mindless-rage", name: "Mindless Rage", level: 6, summary: "Immune to charm and frighten while raging." },
        { id: "intimidating-presence", name: "Intimidating Presence", level: 10, summary: "Frighten a creature with your fury." },
      ]},
      { id: "totem", name: "Path of the Totem Warrior", source: "PHB", blurb: "Spirit-guided warrior.", features: [
        { id: "spirit-seeker", name: "Spirit Seeker", level: 3, summary: "Beast Sense and Speak with Animals rituals." },
        { id: "totem-spirit", name: "Totem Spirit", level: 3, summary: "Bear: resistance while raging; Wolf: pack tactics; Eagle: dodge as bonus." },
        { id: "aspect-beast", name: "Aspect of the Beast", level: 6, summary: "Wild senses — eagle vision, bear strength." },
      ]},
      { id: "zealot", name: "Path of the Zealot", source: "XGtE", blurb: "Chosen of a god, relentless in faith.", features: [
        { id: "divine-fury", name: "Divine Fury", level: 3, summary: "+1d6 radiant or necrotic damage while raging.", hook: { kind: "extraDamage", die: 6, times: "oncePerTurn" } },
        { id: "warrior-dead", name: "Warrior of the Gods", level: 3, summary: "Revival spells cost no material components." },
        { id: "fanatical-focus", name: "Fanatical Focus", level: 6, summary: "Reroll a failed save while raging." },
      ]},
      { id: "ancestral", name: "Path of the Ancestral Guardian", source: "XGtE", blurb: "Shielded by ancestral spirits.", features: [
        { id: "ancestral-protectors", name: "Ancestral Protectors", level: 3, summary: "Taunt: a struck foe has disadvantage attacking anyone but you." },
        { id: "spirit-shield", name: "Spirit Shield", level: 6, summary: "Reduce damage to allies as a reaction." },
      ]},
    ],
  },
  {
    id: "bard",
    name: "Bard",
    hitDie: 8,
    primaryAbility: "cha",
    saves: ["dex", "cha"],
    skillOptions: SKILL_SETS.bard,
    skillCount: 3,
    spellAbility: "cha",
    casterType: "full",
    subclassLevel: 3,
    blurb: "Charismatic performers weaving magic through art.",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "rapier", label: "Rapier" },
        { id: "longsword", label: "Longsword" },
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
      ],
      defaultWeapon: "rapier",
      armorOptions: [{ id: "leather", label: "Leather armor" }],
      defaultArmor: "leather",
      packOptions: ["Diplomat's pack", "Entertainer's pack"],
      extras: ["Dagger"],
    },
    resources: [
      { id: "bardic-inspiration", label: "Bardic Inspiration", rest: "long", max: (c) => Math.max(1, Math.floor((c.baseScores.cha + (RACE_MAP[c.raceId].asi.cha ?? 0) - 10) / 2)) },
    ],
    features: [
      { id: "bardic-inspiration", name: "Bardic Inspiration", level: 1, rest: "long", summary: "Bonus action: grant an ally a d6 (grows with level) to add to a roll.", uses: (c) => Math.max(1, Math.floor((c.baseScores.cha + (RACE_MAP[c.raceId].asi.cha ?? 0) - 10) / 2)), hook: { kind: "addDie", die: 6, label: "Bardic Inspiration" } },
      { id: "spellcasting-bard", name: "Spellcasting", level: 1, summary: "Charisma-based bard spells." },
      { id: "jack-of-all-trades", name: "Jack of All Trades", level: 2, summary: "Add half proficiency to non-proficient checks." },
      { id: "font-of-inspiration", name: "Font of Inspiration", level: 5, summary: "Bardic Inspiration recharges on a short rest." },
      { id: "countercharm", name: "Countercharm", level: 6, summary: "Advantage vs charm and frighten for nearby allies." },
    ],
    subclasses: [
      { id: "lore", name: "College of Lore", source: "PHB", blurb: "Keepers of stories and secrets.", features: [
        { id: "bonus-proficiencies", name: "Bonus Proficiencies", level: 3, summary: "Three extra skill proficiencies." },
        { id: "cutting-words", name: "Cutting Words", level: 3, summary: "Spend inspiration to subtract from an enemy's roll." },
        { id: "peerless-skill", name: "Peerless Skill", level: 14, summary: "Add your inspiration to your own ability checks." },
      ]},
      { id: "valor", name: "College of Valor", source: "PHB", blurb: "Battle-bards who fight as they sing.", features: [
        { id: "combat-inspiration", name: "Combat Inspiration", level: 3, summary: "Inspiration dice add to damage or AC." },
        { id: "extra-attack-bard", name: "Extra Attack", level: 6, summary: "Attack twice; still cast and sing." },
        { id: "battle-magic", name: "Battle Magic", level: 14, summary: "Weapon attack after casting a bard spell." },
      ]},
      { id: "swords", name: "College of Swords", source: "XGtE", blurb: "Dueling dancers.", features: [
        { id: "blade-flourish", name: "Blade Flourish", level: 3, summary: "Spend inspiration for flourishes: damage or mobility." },
        { id: "extra-attack-swords", name: "Extra Attack", level: 6, summary: "Attack twice." },
      ]},
      { id: "eloquence", name: "College of Eloquence", source: "TCoE", blurb: "Silver tongues (Tasha's).", features: [
        { id: "silver-tongue", name: "Silver Tongue", level: 3, summary: "Persuasion and Deception rolls of 9 or lower count as 10." },
        { id: "unsettling-words", name: "Unsettling Words", level: 3, summary: "Subtract inspiration die from a foe's save." },
        { id: "universal-speech", name: "Universal Speech", level: 6, summary: "Be understood by any creature that speaks a language." },
      ]},
    ],
  },
  {
    id: "druid",
    name: "Druid",
    hitDie: 8,
    primaryAbility: "wis",
    saves: ["int", "wis"],
    skillOptions: SKILL_SETS.druid,
    skillCount: 2,
    spellAbility: "wis",
    casterType: "full",
    subclassLevel: 2,
    blurb: "Guardians of nature with wild-shape magic.",

    startingWealth: { dice: "2d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "shortsword", label: "Scimitar" },
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
      ],
      defaultWeapon: "shortsword",
      armorOptions: [{ id: "leather", label: "Leather armor" }],
      defaultArmor: "leather",
      shieldInKit: true,
      packOptions: ["Explorer's pack"],
      extras: ["Druidic focus"],
    },
    resources: [
      { id: "wild-shape", label: "Wild Shape", rest: "short", max: () => 2 },
    ],
    features: [
      { id: "druidic", name: "Druidic", level: 1, summary: "A secret language of druids." },
      { id: "wild-shape", name: "Wild Shape", level: 2, rest: "short", summary: "Transform into beasts; recharges on a short rest.", uses: () => 2 },
      { id: "timeless-body", name: "Timeless Body", level: 18, summary: "Aging slowed to a crawl." },
    ],
    subclasses: [
      { id: "land", name: "Circle of the Land", source: "PHB", blurb: "Wardens of sacred terrain.", features: [
        { id: "natural-recovery", name: "Natural Recovery", level: 2, summary: "Regain spell slots during a short rest." },
        { id: "land-aura", name: "Land's Stride", level: 6, summary: "Move through difficult terrain unimpeded." },
      ]},
      { id: "moon", name: "Circle of the Moon", source: "PHB", blurb: "Masters of wild shape.", features: [
        { id: "combat-wild-shape", name: "Combat Wild Shape", level: 2, summary: "Wild shape as a bonus action; shapes heal on transform." },
        { id: "elemental-forms", name: "Elemental Wild Shape", level: 10, summary: "Transform into elementals." },
      ]},
      { id: "spores", name: "Circle of Spores", source: "XGtE", blurb: "Fungal decay and rebirth.", features: [
        { id: "symbiotic-entity", name: "Symbiotic Entity", level: 2, summary: "Gain temp HP and weapon attacks add 1d6 necrotic.", hook: { kind: "tempHp", die: 6 } },
        { id: "spreading-spores", name: "Halo of Spores", level: 2, summary: "Damage nearby creatures with spores." },
        { id: "fungal-infestation", name: "Fungal Infestation", level: 6, summary: "Raise fallen foes as zombies." },
      ]},
      { id: "stars", name: "Circle of Stars", source: "TCoE", blurb: "Draw power from constellations (Tasha's).", features: [
        { id: "star-map", name: "Star Map", level: 2, summary: "Conjure a star chart; Guidance and Guiding Bolt bonuses." },
        { id: "star-form", name: "Star Form", level: 2, summary: "Archer, Chalice or Dragon form — bonus damage, healing or concentration." },
        { id: "cosmic-omen", name: "Cosmic Omen", level: 6, summary: "Weal or woe: bonus to your or an enemy's next roll." },
      ]},
    ],
  },
  {
    id: "ranger",
    name: "Ranger",
    hitDie: 10,
    primaryAbility: "dex",
    saves: ["str", "dex"],
    skillOptions: SKILL_SETS.ranger,
    skillCount: 3,
    spellAbility: "wis",
    casterType: "half",
    subclassLevel: 3,
    blurb: "Trackers and hunters of the wilds.",

    startingWealth: { dice: "5d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "shortsword", label: "Two shortswords" },
        { id: "longbow", label: "Longbow & 20 arrows" },
      ],
      defaultWeapon: "longbow",
      armorOptions: [
        { id: "scale", label: "Scale mail" },
        { id: "leather", label: "Leather armor" },
      ],
      defaultArmor: "scale",
      packOptions: ["Dungeoneer's pack", "Explorer's pack"],
      extras: ["20 × Arrows"],
    },
    resources: [],
    features: [
      { id: "favored-enemy", name: "Favored Enemy", level: 1, summary: "Bonus damage and tracking vs a chosen enemy type." },
      { id: "natural-explorer", name: "Natural Explorer", level: 1, summary: "Expert navigation in your favored terrain." },
      { id: "fighting-style-rgr", name: "Fighting Style", level: 2, summary: "Archery or two-weapon fighting." },
      { id: "extra-attack-rgr", name: "Extra Attack", level: 5, summary: "Attack twice with the Attack action." },
      { id: "lands-stride", name: "Land's Stride", level: 8, summary: "Ignore difficult terrain; immune to plant hazards." },
    ],
    subclasses: [
      { id: "hunter", name: "Hunter", source: "PHB", blurb: "The classic wilderness warrior.", features: [
        { id: "hunters-prey", name: "Hunter's Prey", level: 3, summary: "Colossus Slayer: +1d8 vs wounded foes.", hook: { kind: "extraDamage", die: 8, times: "oncePerTurn" } },
        { id: "defensive-tactics", name: "Defensive Tactics", level: 7, summary: "Escape the Horde, Steel Will or Multiattack Defense." },
        { id: "multiattack", name: "Multiattack", level: 11, summary: "Volley or Whirlwind Attack." },
      ]},
      { id: "beast-master", name: "Beast Master", source: "PHB", blurb: "Bound to a loyal animal companion.", features: [
        { id: "animal-companion", name: "Ranger's Companion", level: 3, summary: "A loyal beast fights alongside you." },
        { id: "exceptional-training", name: "Exceptional Training", level: 7, summary: "Your companion acts more freely." },
        { id: "share-spells", name: "Share Spells", level: 15, summary: "Spells affecting you also affect your companion." },
      ]},
      { id: "gloom-stalker", name: "Gloom Stalker", source: "XGtE", blurb: "Hunters of the dark.", features: [
        { id: "dread-ambusher", name: "Dread Ambusher", level: 3, summary: "Extra attack +1d8 damage on the first round of combat." },
        { id: "umbral-sight", name: "Umbral Sight", level: 3, summary: "Invisible to darkvision in darkness." },
        { id: "iron-mind", name: "Iron Mind", level: 7, summary: "Advantage on Wisdom saves." },
      ]},
      { id: "fey-wanderer", name: "Fey Wanderer", source: "TCoE", blurb: "Wanderers blessed by the Feywild (Tasha's).", features: [
        { id: "fey-reinforcements", name: "Dreadful Strikes", level: 3, summary: "Your attacks deal extra psychic damage to marked foes.", hook: { kind: "extraDamage", die: 4, times: "oncePerTurn" } },
        { id: "otherworldly-glamour", name: "Otherworldly Glamour", level: 3, summary: "Add Wis to Charisma checks." },
        { id: "fey-wanderer-aura", name: "Beguiling Twist", level: 7, summary: "Redirect charm or frighten effects." },
      ]},
    ],
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    hitDie: 6,
    primaryAbility: "cha",
    saves: ["con", "cha"],
    skillOptions: SKILL_SETS.sorcerer,
    skillCount: 2,
    spellAbility: "cha",
    casterType: "full",
    subclassLevel: 1,
    blurb: "Innate magic flowing through blood and soul.",

    startingWealth: { dice: "3d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "light-crossbow", label: "Light crossbow & 20 bolts" },
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
      ],
      defaultWeapon: "light-crossbow",
      armorOptions: [{ id: "none", label: "Unarmored" }],
      defaultArmor: "none",
      packOptions: ["Dungeoneer's pack", "Explorer's pack"],
      extras: ["2 × Dagger", "Arcane focus"],
    },
    resources: [
      { id: "sorcery-points", label: "Sorcery Points", rest: "long", max: (c) => c.level },
    ],
    features: [
      { id: "spellcasting-sorc", name: "Spellcasting", level: 1, summary: "Charisma-based sorcerer spells." },
      { id: "font-of-magic", name: "Font of Magic", level: 2, summary: "Sorcery points equal to level; convert to/from slots." },
      { id: "metamagic", name: "Metamagic", level: 3, summary: "Twinned, Quickened, Subtle and Careful Spell." },
    ],
    subclasses: [
      { id: "draconic", name: "Draconic Bloodline", source: "PHB", blurb: "A dragon's essence in your veins.", features: [
        { id: "draconic-resilience", name: "Draconic Resilience", level: 1, summary: "Base AC 13 + Dex; +1 HP per level." },
        { id: "elemental-affinity", name: "Elemental Affinity", level: 6, summary: "Add Cha to damage of your element; resist it." },
        { id: "dragon-wings", name: "Dragon Wings", level: 14, summary: "Grow wings; fly at will." },
      ]},
      { id: "wild-magic", name: "Wild Magic", source: "PHB", blurb: "Chaos itself flows through you.", features: [
        { id: "wild-magic-surge", name: "Wild Magic Surge", level: 1, summary: "Spells may trigger a surge from the Wild Magic table." },
        { id: "tides-of-chaos", name: "Tides of Chaos", level: 1, rest: "long", summary: "Advantage on one roll; the DM may surge you.", uses: () => 1 },
        { id: "bend-luck", name: "Bend Luck", level: 6, summary: "Spend 2 sorcery points to alter a roll by 1d4." },
      ]},
      { id: "aberrant-mind", name: "Aberrant Mind", source: "TCoE", blurb: "Psionic powers from beyond (Tasha's).", features: [
        { id: "psionic-spells", name: "Psionic Spells", level: 1, summary: "Psionic spell list — cast with sorcery points cheaply." },
        { id: "telepathic-speech", name: "Telepathic Speech", level: 1, summary: "Communicate telepathically with nearby creatures." },
        { id: "psychic-defense", name: "Psychic Defenses", level: 6, summary: "Resistance to psychic damage; advantage on mental saves." },
      ]},
      { id: "clockwork-soul", name: "Clockwork Soul", source: "TCoE", blurb: "A shard of cosmic order (Tasha's).", features: [
        { id: "restore-balance", name: "Restore Balance", level: 1, summary: "Bonus action: cancel advantage or disadvantage nearby." },
        { id: "bastion-of-law", name: "Bastion of Law", level: 6, summary: "Accumulate a ward of magical damage absorption." },
        { id: "trance-of-order", name: "Trance of Order", level: 14, summary: "Roll all d20s as 10 for a minute." },
      ]},
      { id: "divine-soul", name: "Divine Soul", source: "XGtE", blurb: "A spark of a god's power.", features: [
        { id: "divine-magic", name: "Divine Magic", level: 1, summary: "Cleric spell list access; resistance of your choice." },
        { id: "empowered-healing", name: "Empowered Healing", level: 6, summary: "Reroll healing dice." },
        { id: "angelic-form", name: "Angelic Form", level: 14, summary: "Gain spectral wings; fly." },
      ]},
      { id: "storm", name: "Storm Sorcery", source: "XGtE", blurb: "The tempest lives within.", features: [
        { id: "tempestuous-magic", name: "Tempestuous Magic", level: 1, summary: "Fly 10 ft as a bonus action after casting." },
        { id: "heart-of-storm", name: "Heart of the Storm", level: 6, summary: "Deal lightning/thunder damage when casting." },
        { id: "storm-fury", name: "Storm's Fury", level: 14, summary: "Blast creatures that strike you." },
      ]},
    ],
  },
  {
    id: "warlock",
    name: "Warlock",
    hitDie: 8,
    primaryAbility: "cha",
    saves: ["wis", "cha"],
    skillOptions: SKILL_SETS.warlock,
    skillCount: 2,
    spellAbility: "cha",
    casterType: "pact",
    subclassLevel: 1,
    blurb: "Pact-bound wielders of eldritch power.",

    startingWealth: { dice: "4d4", mult: 10 },
    startingGear: {
      weaponOptions: [
        { id: "light-crossbow", label: "Light crossbow & 20 bolts" },
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
      ],
      defaultWeapon: "light-crossbow",
      armorOptions: [{ id: "leather", label: "Leather armor" }],
      defaultArmor: "leather",
      packOptions: ["Scholar's pack", "Dungeoneer's pack"],
      extras: ["2 × Dagger", "Arcane focus"],
    },
    resources: [],
    features: [
      { id: "pact-magic", name: "Pact Magic", level: 1, summary: "Short-rest spell slots from your patron." },
      { id: "eldritch-invocations", name: "Eldritch Invocations", level: 2, summary: "Customize your pact with invocations." },
      { id: "pact-boon", name: "Pact Boon", level: 3, summary: "Chain, Blade, Tome or Talisman." },
      { id: "mystic-arcanum", name: "Mystic Arcanum", level: 11, summary: "One 6th-level spell per long rest." },
    ],
    subclasses: [
      { id: "archfey", name: "The Archfey", source: "PHB", blurb: "A bargain with the Feywild.", features: [
        { id: "fey-presence", name: "Fey Presence", level: 1, summary: "Frighten or charm creatures in a 10-ft burst." },
        { id: "misty-escape", name: "Misty Escape", level: 6, summary: "Vanish into mist when damaged." },
      ]},
      { id: "fiend", name: "The Fiend", source: "PHB", blurb: "A pact with the lower planes.", features: [
        { id: "dark-ones-blessing", name: "Dark One's Blessing", level: 1, summary: "Gain temp HP when you reduce a foe to 0." },
        { id: "dark-ones-own-luck", name: "Dark One's Own Luck", level: 6, summary: "Add 1d10 to a failed ability check." },
        { id: "hurl-through-hell", name: "Hurl Through Hell", level: 14, summary: "Send a foe through the abyss for 10d10 psychic." },
      ]},
      { id: "great-old-one", name: "The Great Old One", source: "PHB", blurb: "Whispers from beyond the stars.", features: [
        { id: "awakened-mind", name: "Awakened Mind", level: 1, summary: "Telepathy with any creature you can see." },
        { id: "entropic-ward", name: "Entropic Ward", level: 6, summary: "Reaction: disadvantage on an attack against you." },
        { id: "thought-shield", name: "Thought Shield", level: 10, summary: "Resistance to psychic; reflect mind reading." },
      ]},
      { id: "hexblade", name: "The Hexblade", source: "XGtE", blurb: "A sentient weapon of the Shadowfell.", features: [
        { id: "hexblades-curse", name: "Hexblade's Curse", level: 1, rest: "short", summary: "Curse a foe: crit on 19-20, bonus damage.", uses: () => 1 },
        { id: "hex-warrior", name: "Hex Warrior", level: 1, summary: "Use Cha for attacks with your pact weapon." },
        { id: "accursed-specter", name: "Accursed Specter", level: 6, summary: "Raise the slain as a specter." },
      ]},
      { id: "celestial", name: "The Celestial", source: "XGtE", blurb: "A radiant patron of light.", features: [
        { id: "healing-light", name: "Healing Light", level: 1, summary: "Healing dice pool (1d6s) usable as bonus actions." },
        { id: "radiant-soul", name: "Radiant Soul", level: 6, summary: "Resistance to radiant; add Cha to radiant damage." },
      ]},
      { id: "genie", name: "The Genie", source: "TCoE", blurb: "A pact with a powerful genie (Tasha's).", features: [
        { id: "genies-vessel", name: "Genie's Vessel", level: 1, summary: "A vessel of elemental power; bottle respite." },
        { id: "genies-wrath", name: "Genie's Wrath", level: 1, summary: "Add your proficiency to one damage roll per turn." },
        { id: "elemental-gift", name: "Elemental Gift", level: 6, summary: "Resistance to your patron's element." },
      ]},
    ],
  },
  {
    id: "monk",
    name: "Monk",
    hitDie: 8,
    primaryAbility: "dex",
    saves: ["str", "dex"],
    skillOptions: SKILL_SETS.monk,
    skillCount: 2,
    subclassLevel: 3,
    blurb: "Masters of unarmed combat and ki.",

    startingWealth: { dice: "5d4", mult: 1 },
    startingGear: {
      weaponOptions: [
        { id: "shortsword", label: "Shortsword" },
        { id: "quarterstaff", label: "Simple weapon (quarterstaff)" },
      ],
      defaultWeapon: "shortsword",
      armorOptions: [{ id: "none", label: "Unarmored (Unarmored Defense)" }],
      defaultArmor: "none",
      packOptions: ["Dungeoneer's pack", "Explorer's pack"],
      extras: ["10 × Dart"],
    },
    resources: [
      { id: "ki", label: "Ki Points", rest: "short", max: (c) => c.level },
    ],
    features: [
      { id: "martial-arts", name: "Martial Arts", level: 1, summary: "Unarmed strikes and monk weapons scale with level." },
      { id: "ki", name: "Ki", level: 2, rest: "short", summary: "Ki points fuel Flurry, Step, Strike and Dodge.", uses: (c) => c.level },
      { id: "unarmored-movement", name: "Unarmored Movement", level: 2, summary: "Speed increases as you level." },
      { id: "deflect-missiles", name: "Deflect Missiles", level: 3, summary: "Catch or deflect ranged attacks." },
      { id: "stunning-strike", name: "Stunning Strike", level: 5, summary: "Spend 1 ki: a hit may stun the target." },
      { id: "evasion-monk", name: "Evasion", level: 7, summary: "No damage on successful Dex saves." },
    ],
    subclasses: [
      { id: "open-hand", name: "Way of the Open Hand", source: "PHB", blurb: "The classical martial artist.", features: [
        { id: "open-hand-tech", name: "Open Hand Technique", level: 3, summary: "Flurry hits may knock prone, push or strip reactions." },
        { id: "tranquility", name: "Tranquility", level: 11, summary: "Sanctuary effect between rests." },
      ]},
      { id: "shadow", name: "Way of Shadow", source: "PHB", blurb: "Ninja arts of darkness.", features: [
        { id: "shadow-arts", name: "Shadow Arts", level: 3, summary: "Cast Darkness, Darkvision, Pass Without Trace with ki." },
        { id: "shadow-step", name: "Shadow Step", level: 6, summary: "Teleport between shadows." },
        { id: "cloak-of-shadows", name: "Cloak of Shadows", level: 11, summary: "Turn invisible in darkness." },
      ]},
      { id: "mercy", name: "Way of Mercy", source: "TCoE", blurb: "Healers and executioners of equal skill (Tasha's).", features: [
        { id: "hand-of-harm", name: "Hand of Harm", level: 3, summary: "Spend 1 ki: extra necrotic damage on a strike.", hook: { kind: "extraDamage", die: 6, times: "oncePerTurn" } },
        { id: "hand-of-healing", name: "Hand of Healing", level: 3, summary: "Spend 1 ki to heal with a touch." },
        { id: "physicians-touch", name: "Physician's Touch", level: 6, summary: "Heal or harm without ki; cure diseases." },
      ]},
      { id: "kensei", name: "Way of the Kensei", source: "XGtE", blurb: "Monks of the blade.", features: [
        { id: "kensei-weapons", name: "Kensei Weapons", level: 3, summary: "Chosen weapons become monk weapons; bonus AC while unarmed." },
        { id: "deft-strike", name: "Deft Strike", level: 6, summary: "Spend 1 ki for extra damage with a kensei weapon." },
        { id: "sharpen-blade", name: "Sharpen the Blade", level: 11, summary: "Spend ki to give a weapon a magic bonus." },
      ]},
    ],
  },
];

export const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

// Artificer's Battle Smith / other subclasses using Int for attacks:
export function attackAbilityFor(
  c: DnDCharacter,
  weapon: WeaponDef,
): AbilityId {
  const klass = CLASS_MAP[c.classId];
  if (
    klass.id === "artificer" &&
    c.subclassId === "battle-smith" &&
    weapon.id !== "unarmed"
  ) {
    return "int";
  }
  if (weapon.finesse) {
    // Pick the higher EFFECTIVE score (Tasha's custom origin, variant-human
    // +1/+1 and feat ASIs all feed the real final scores — mirroring
    // character.ts finalScores()).
    const effective = (a: AbilityId): number => {
      let score = c.baseScores[a];
      if (c.customOrigin) {
        if (c.originFirst === a) score += 2;
        if (c.originSecond === a) score += 1;
      } else if (c.subraceId === "human-variant") {
        if (c.originFirst === a) score += 1;
        if (c.originSecond === a) score += 1;
      } else {
        const asi = raceTotalAsi(c.raceId, c.subraceId);
        score += asi[a] ?? 0;
      }
      for (const featId of c.feats) {
        const featAsi = FEAT_MAP[featId]?.effects?.asi;
        if (featAsi) score += featAsi[a] ?? 0;
      }
      return score;
    };
    return effective("dex") >= effective("str") ? "dex" : "str";
  }
  return weapon.ability;
}
