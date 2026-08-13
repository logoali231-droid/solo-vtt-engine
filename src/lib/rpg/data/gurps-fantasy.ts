// ============================================================================
// Oraculum — GURPS-style FANTASY / MEDIEVAL expansion.
//
// ORIGINAL CONTENT. Published fantasy RPG supplements (GURPS Magic, Fantasy,
// Low-Tech, etc.) are closed-copyright, so this module builds the SAME design
// language — 3d6 roll-under vs a skill target, fatigue (FP) costs, margins of
// success, critical-failure mishaps — with entirely original colleges,
// spells, reagents, recipes, and travel tables. Nothing here is copied from
// the books.
//
// Domains: Arcana (6 original colleges) · Alchemy · Crafting · Wilderness.
// ============================================================================

import type { GurpsCharacter } from "../types";

/** GURPS skill level from attribute + difficulty + invested points
 *  (inlined to keep this module free of the core data module — the same
 *  math used by gurpsSkillLevel). */
function gurpsLevel(stat: number, difficulty: "easy" | "average" | "hard", points: number): number {
  const offset = difficulty === "easy" ? 0 : difficulty === "average" ? -1 : -2;
  if (points <= 0) return stat - 5;
  if (points === 1) return stat + offset;
  if (points === 2) return stat + offset + 1;
  if (points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((points - 4) / 4);
}

export type GurpsMagicCollegeId =
  | "pyre"
  | "frost"
  | "gale"
  | "verdant"
  | "veil"
  | "spirit";

export interface GurpsMagicCollegeDef {
  id: GurpsMagicCollegeId;
  name: string;
  /** Controlling skill id — trained like any other GURPS skill (IQ/Hard). */
  skillId: string;
  summary: string;
  /** gp cost to learn a spell of this college from a teacher. */
  trainingCost: number;
}

export const GURPS_MAGIC_COLLEGES: GurpsMagicCollegeDef[] = [
  { id: "pyre", name: "Pyre", skillId: "pyre-magic", trainingCost: 40, summary: "Fire and heat — lances, wards, and the warmth of the hearth." },
  { id: "frost", name: "Frost", skillId: "frost-magic", trainingCost: 40, summary: "Ice and chill — darts, shells of rime, and frozen ground." },
  { id: "gale", name: "Gale", skillId: "gale-magic", trainingCost: 40, summary: "Wind and weather — blades of air, leaping, thunder." },
  { id: "verdant", name: "Verdant", skillId: "verdant-magic", trainingCost: 40, summary: "Growth and life — snares of thorn, mending, the green tongue." },
  { id: "veil", name: "Veil", skillId: "veil-magic", trainingCost: 50, summary: "Illusion and stealth — blinks, phantoms, and silence." },
  { id: "spirit", name: "Spirit", skillId: "spirit-magic", trainingCost: 50, summary: "Mind and soul — reading thoughts, resolve, sight beyond." },
];

export const GURPS_MAGIC_COLLEGE_MAP = Object.fromEntries(
  GURPS_MAGIC_COLLEGES.map((c) => [c.id, c]),
);

export interface GurpsSpellDef {
  id: string;
  name: string;
  college: GurpsMagicCollegeId;
  /** Fatigue points spent to cast. */
  energy: number;
  castTime: string;
  duration: string;
  range: string;
  summary: string;
  /** Mechanical effect — how the engine/narrator resolves a successful cast. */
  effect: string;
}

export const GURPS_SPELLS: GurpsSpellDef[] = [
  // ---- Pyre ----
  { id: "ember-lance", name: "Ember Lance", college: "pyre", energy: 1, castTime: "1 second", duration: "Instant", range: "20 yd", summary: "A searing bolt of fire, 2d burn.", effect: "Hurled flame: 2d burn damage to one target that is not dodging behind cover." },
  { id: "cinder-ward", name: "Cinder Ward", college: "pyre", energy: 2, castTime: "1 second", duration: "1 minute", range: "Self", summary: "A ring of fire that bars approach.", effect: "A wall of flame surrounds you: anyone who enters takes 1d+1 burn; you gain DR 1 vs cold." },
  { id: "hearth-pulse", name: "Hearth Pulse", college: "pyre", energy: 1, castTime: "10 seconds", duration: "1 hour", range: "Touch", summary: "Warmth, cooking flame, and light without fuel.", effect: "A steady, smokeless flame: lights camp, cooks food, and keeps one person warm in the cold." },
  { id: "flame-lash", name: "Flame Lash", college: "pyre", energy: 2, castTime: "1 second", duration: "1 minute", range: "5 yd", summary: "A whip of living fire that entangles and burns.", effect: "A fire-whip: one target within 5 yd takes 1d+1 burn and must win a ST contest or be held; burning again each turn they stay held." },
  // ---- Frost ----
  { id: "frost-nail", name: "Frost Nail", college: "frost", energy: 1, castTime: "1 second", duration: "Instant", range: "20 yd", summary: "A razor icicle, 1d+2 cold.", effect: "A frozen spike: 1d+2 cold damage; a victim reduced below 1/3 HP is slowed (half Move) for a minute." },
  { id: "rime-shell", name: "Rime Shell", college: "frost", energy: 2, castTime: "2 seconds", duration: "10 minutes", range: "Self", summary: "Armor of ice, DR 2, resistant to fire.", effect: "A crackling shell of ice: DR 2 against all damage, DR 4 against fire. Shatters if it stops 6+ damage in one blow." },
  { id: "chilling-grasp", name: "Chilling Grasp", college: "frost", energy: 1, castTime: "1 second", duration: "Instant", range: "Touch", summary: "Touch that drains heat and strength.", effect: "Touch attack: 1d cold damage and the target loses 1 FP; a critical success drains 2 FP instead." },
  { id: "glaze-veil", name: "Glaze Veil", college: "frost", energy: 1, castTime: "2 seconds", duration: "10 minutes", range: "10 yd", summary: "Freezes the ground slick under your foes.", effect: "A 5-yd patch of black ice: anyone crossing must make a DX roll or fall (lose their next action)." },
  // ---- Gale ----
  { id: "wind-blade", name: "Wind Blade", college: "gale", energy: 1, castTime: "1 second", duration: "Instant", range: "15 yd", summary: "An invisible cutting gust, 1d cut.", effect: "A razor edge of air: 1d cutting damage that ignores DR 1 or less (cloth and light leather)." },
  { id: "sky-leap", name: "Sky Leap", college: "gale", energy: 2, castTime: "1 second", duration: "1 second", range: "Self", summary: "A gust hurls you up and across.", effect: "You are launched up to 10 yd in any direction — cross a chasm, reach a ledge, or soften a fall (halve fall damage)." },
  { id: "storm-call", name: "Storm Call", college: "gale", energy: 3, castTime: "2 seconds", duration: "Instant", range: "20 yd", summary: "A thunderclap that deafens and knocks back.", effect: "Loud thunder: everyone within 5 yd makes a HT roll or is deafened (1 minute) and thrown back 1d yards, taking 1d-2 from the fall." },
  { id: "breeze-whisper", name: "Breeze Whisper", college: "gale", energy: 1, castTime: "1 second", duration: "1 minute", range: "100 yd", summary: "Carries your words — or snuffs a flame.", effect: "Your whispered words travel on the wind to one ear within 100 yd; you may also snuff candles and small fires." },
  // ---- Verdant ----
  { id: "thorn-snare", name: "Thorn Snare", college: "verdant", energy: 1, castTime: "2 seconds", duration: "1 minute", range: "10 yd", summary: "Roots and thorns entangle a target.", effect: "A patch of grasping roots: one target must win a DX contest or be held fast; escaping takes a second contest or cutting free." },
  { id: "sap-mend", name: "Sap Mend", college: "verdant", energy: 2, castTime: "3 seconds", duration: "Instant", range: "Touch", summary: "Green fire knits flesh — 1d+1 HP.", effect: "Wounds close and blood stops: heals 1d+1 HP to one living creature (not undead or constructs)." },
  { id: "beast-speech", name: "Beast Speech", college: "verdant", energy: 1, castTime: "1 second", duration: "10 minutes", range: "Self", summary: "Speak with animals; they react kindly.", effect: "You understand and can be understood by animals; they react at +2 and will answer simple questions honestly." },
  { id: "leaf-cloak", name: "Leaf Cloak", college: "verdant", energy: 1, castTime: "2 seconds", duration: "1 hour", range: "Self", summary: "Blend into wild growth, +3 Stealth.", effect: "Leaves and bark cling to you: +3 to Stealth rolls in natural terrain, +1 in settled areas." },
  // ---- Veil ----
  { id: "glimmerstep", name: "Glimmerstep", college: "veil", energy: 2, castTime: "1 second", duration: "Instant", range: "5 yd", summary: "Blink across a room through shimmering light.", effect: "You vanish and reappear up to 5 yd away — escape a grapple, cross a barrier, or reach a lever." },
  { id: "phantom-shape", name: "Phantom Shape", college: "veil", energy: 2, castTime: "2 seconds", duration: "1 minute", range: "10 yd", summary: "A false double of you or an ally.", effect: "An illusory copy of one person stands and moves as you direct: foes must win a Per roll or waste attacks on it." },
  { id: "silence-pall", name: "Silence Pall", college: "veil", energy: 1, castTime: "1 second", duration: "10 minutes", range: "Touch", summary: "Dampen all sound from a person.", effect: "A bubble of silence around one person: +4 to Stealth and they cannot be heard shouting or screaming." },
  { id: "veil-of-dusk", name: "Veil of Dusk", college: "veil", energy: 2, castTime: "2 seconds", duration: "1 minute", range: "Self", summary: "Woven shadow makes you hard to see.", effect: "Shadows cling to you: -4 to rolls made to spot you; attacks against you are at -2 unless you act openly." },
  // ---- Spirit ----
  { id: "mind-tap", name: "Mind Tap", college: "spirit", energy: 2, castTime: "2 seconds", duration: "Concentration", range: "5 yd", summary: "Read the surface thoughts of one mind.", effect: "A Will contest: win and you read the target's surface thoughts; lose and they feel a cold prickle of being watched." },
  { id: "iron-resolve", name: "Iron Resolve", college: "spirit", energy: 1, castTime: "1 second", duration: "1 scene", range: "Self", summary: "Steel your will, +2 Will.", effect: "Your mind hardens: +2 to Will and to resist fear, torture, and mind-affecting effects for the rest of the scene." },
  { id: "wraith-sight", name: "Wraith Sight", college: "spirit", energy: 1, castTime: "1 second", duration: "10 minutes", range: "Self", summary: "See spirits, hidden auras, and lies.", effect: "You perceive spirits, magical auras, and invisible beings; +3 to Detect Lies while active." },
  { id: "soul-cord", name: "Soul Cord", college: "spirit", energy: 2, castTime: "3 seconds", duration: "Concentration", range: "Touch", summary: "Hold a dying soul to its body.", effect: "A dying creature stops bleeding and cannot die while you concentrate; on release they remain stable but unconscious." },
];

export const GURPS_SPELL_MAP = Object.fromEntries(
  GURPS_SPELLS.map((s) => [s.id, s]),
);

/** Spell skill level: the college's trained skill, else an IQ-4 default. */
export function gurpsSpellSkillLevel(c: GurpsCharacter, collegeId: GurpsMagicCollegeId): number {
  const college = GURPS_MAGIC_COLLEGE_MAP[collegeId];
  if (!college) return c.attributes.iq - 4;
  const trained = c.skills.find((s) => s.id === college.skillId);
  if (!trained) return c.attributes.iq - 4;
  return gurpsLevel(c.attributes.iq, "hard", trained.points);
}

/** Total FP available to spend on magic (FP max − fatigue damage). */
export function gurpsMaxFp(c: GurpsCharacter): number {
  return Math.max(1, c.attributes.ht - (c.state?.fpDamage ?? 0));
}

/** Critical-failure mishap table (original, d6). */
export function gurpsSpellMishap(): { label: string; effect: string; extraFp: number } {
  const r = 1 + Math.floor(Math.random() * 6);
  switch (r) {
    case 1:
      return { label: "Backlash", effect: "The power snaps back — you take 1d-2 damage and the energy is spent.", extraFp: 0 };
    case 2:
      return { label: "Wild Surge", effect: "The spell fires wildly at a random nearby target or location — friendly fire is possible.", extraFp: 0 };
    case 3:
      return { label: "Attention", effect: "A bright flash and thunderclap mark the spot — everyone within 50 yd knows you cast.", extraFp: 0 };
    case 4:
      return { label: "Burnout", effect: "That college goes dark in your mind — you cannot cast it again until you rest.", extraFp: 0 };
    case 5:
      return { label: "Drain", effect: "The casting saps you dry — lose 2 extra FP.", extraFp: 2 };
    case 6:
      return { label: "Tainted", effect: "Something wrong clings to your magic — -1 on all spell rolls until you rest.", extraFp: 0 };
  }
  return { label: "Backlash", effect: "The power snaps back.", extraFp: 0 };
}

// ---------------------------------------------------------------------------
// Alchemy — original reagents and recipes. Brewing rolls 3d6 vs Alchemy (IQ/Hard).
// ---------------------------------------------------------------------------

export interface GurpsReagentDef {
  id: string;
  name: string;
  cost: number;
  summary: string;
}

export const GURPS_REAGENTS: GurpsReagentDef[] = [
  { id: "ember-moss", name: "Ember Moss", cost: 2, summary: "Glows faintly warm; holds heat for hours." },
  { id: "frost-petal", name: "Frost Petal", cost: 2, summary: "Crysanthemum of ice; cold to the touch." },
  { id: "gale-seed", name: "Gale Seed", cost: 2, summary: "Rattles in the pod; whispers when shaken." },
  { id: "rootbark", name: "Rootbark", cost: 2, summary: "Tough, astringent bark from deep roots." },
  { id: "moon-salt", name: "Moon Salt", cost: 3, summary: "Crystalline salt gathered under the full moon." },
  { id: "veil-ash", name: "Veil Ash", cost: 3, summary: "Grey ash from a fire that burned without smoke." },
];

export const GURPS_REAGENT_MAP = Object.fromEntries(
  GURPS_REAGENTS.map((r) => [r.id, r]),
);

export interface GurpsAlchemyRecipeDef {
  id: string;
  name: string;
  /** Reagent ids required (one unit each). */
  reagents: string[];
  /** Additional gp cost for base materials. */
  cost: number;
  /** Brew time. */
  time: string;
  summary: string;
  effect: string;
}

export const GURPS_ALCHEMY_RECIPES: GurpsAlchemyRecipeDef[] = [
  { id: "healing-draught", name: "Healing Draught", reagents: ["rootbark", "moon-salt"], cost: 3, time: "1 hour", summary: "Drink to heal 1d+1 HP.", effect: "Restores 1d+1 HP when drunk." },
  { id: "ember-oil", name: "Ember Oil", reagents: ["ember-moss"], cost: 2, time: "1 hour", summary: "Coat a weapon: +1 fire damage on the next hit.", effect: "The next weapon hit deals +1 fire damage." },
  { id: "nightveil-unguent", name: "Nightveil Unguent", reagents: ["veil-ash", "frost-petal"], cost: 3, time: "2 hours", summary: "Rub on skin: +2 Stealth in darkness for an hour.", effect: "+2 to Stealth in darkness for one hour." },
  { id: "truth-tincture", name: "Truth Tincture", reagents: ["moon-salt", "rootbark"], cost: 4, time: "2 hours", summary: "A sip grants +3 to Detect Lies for an hour.", effect: "+3 to Detect Lies for one hour." },
  { id: "ghostlight-tonic", name: "Ghostlight Tonic", reagents: ["veil-ash", "moon-salt"], cost: 3, time: "2 hours", summary: "See invisible beings for 10 minutes.", effect: "You see invisible and ethereal beings for 10 minutes." },
  { id: "iron-bitter", name: "Iron Bitter", reagents: ["rootbark", "gale-seed"], cost: 3, time: "1 hour", summary: "Toughens the drinker: DR 1 for 10 minutes.", effect: "DR 1 against all damage for 10 minutes." },
  { id: "wakewort-draught", name: "Wakewort Draught", reagents: ["gale-seed"], cost: 2, time: "30 minutes", summary: "No sleep for a day — then pay the debt.", effect: "You need no sleep for 24 hours; afterward you must sleep twice as long or gain 2 FP debt." },
  { id: "venom-salve", name: "Venom Salve", reagents: ["frost-petal", "veil-ash"], cost: 3, time: "2 hours", summary: "Coat a blade: HT-2 or take 1d toxic.", effect: "The next hit forces a HT roll at -2 or the victim takes 1d toxic damage." },
  { id: "menders-balm", name: "Mender's Balm", reagents: ["rootbark", "ember-moss", "moon-salt"], cost: 5, time: "3 hours", summary: "Cures poison and disease.", effect: "Cures one poison or disease afflicting the user." },
  { id: "foemans-folly", name: "Foeman's Folly", reagents: ["veil-ash", "gale-seed", "moon-salt"], cost: 6, time: "3 hours", summary: "Dose food or drink: target's next roll is at -2.", effect: "A creature that consumes it makes its next skill roll at -2." },
];

export const GURPS_ALCHEMY_MAP = Object.fromEntries(
  GURPS_ALCHEMY_RECIPES.map((r) => [r.id, r]),
);

/** Alchemy skill level — trained, else IQ-4 default. */
export function gurpsAlchemyLevel(c: GurpsCharacter): number {
  const trained = c.skills.find((s) => s.id === "alchemy");
  if (!trained) return c.attributes.iq - 4;
  return gurpsLevel(c.attributes.iq, "hard", trained.points);
}

// ---------------------------------------------------------------------------
// Forging / crafting — original smith-work recipes. Rolls 3d6 vs Smith (IQ/Average).
// ---------------------------------------------------------------------------

export interface GurpsForgeRecipeDef {
  id: string;
  name: string;
  /** Material cost in gp. */
  cost: number;
  time: string;
  summary: string;
  effect: string;
}

export const GURPS_FORGE_RECIPES: GurpsForgeRecipeDef[] = [
  { id: "smithing-knife", name: "Smithing Knife", cost: 5, time: "1 day", summary: "A fine blade — +1 to Knife.", effect: "A well-balanced knife: +1 to Knife skill when used." },
  { id: "forged-sword", name: "Forged Sword", cost: 15, time: "3 days", summary: "A quality blade — +1 damage with Broadsword.", effect: "A balanced broadsword: +1 damage when used." },
  { id: "hunting-bow", name: "Hunting Bow", cost: 10, time: "2 days", summary: "A reliable bow — +1 to Bow.", effect: "+1 to Bow skill when used." },
  { id: "iron-shield", name: "Iron Shield", cost: 12, time: "2 days", summary: "A solid shield — +1 Parry.", effect: "+1 to Parry when carried." },
  { id: "chain-repairs", name: "Chain Repairs", cost: 5, time: "1 day", summary: "Restore armor to full DR.", effect: "Repairs one damaged armor piece to full DR." },
  { id: "armor-plate", name: "Armor Plate", cost: 20, time: "4 days", summary: "Bolt plates onto armor — DR +1.", effect: "Permanently increases worn armor's DR by 1 (once per armor)." },
  { id: "travelers-kit", name: "Traveler's Kit", cost: 8, time: "1 day", summary: "Cooking, tinder and repair gear — +1 Survival.", effect: "+1 to Survival rolls while camping." },
  { id: "lock-trap-kit", name: "Lock & Trap Kit", cost: 10, time: "2 days", summary: "Fine tools — +1 to Lockpicking and Traps.", effect: "+1 to Lockpicking and Traps rolls." },
];

export const GURPS_FORGE_MAP = Object.fromEntries(
  GURPS_FORGE_RECIPES.map((f) => [f.id, f]),
);

/** Smith skill level — trained, else IQ-3 default. */
export function gurpsSmithLevel(c: GurpsCharacter): number {
  const trained = c.skills.find((s) => s.id === "smith");
  if (!trained) return c.attributes.iq - 3;
  return gurpsLevel(c.attributes.iq, "average", trained.points);
}

// ---------------------------------------------------------------------------
// Travel & wilderness — original tables. Miles per day by terrain, weather
// modifiers, foraging and hunting yields.
// ---------------------------------------------------------------------------

export interface GurpsTerrainDef {
  id: string;
  name: string;
  milesPerDay: number;
  note: string;
}

export const GURPS_TERRAINS: GurpsTerrainDef[] = [
  { id: "road", name: "Road", milesPerDay: 24, note: "Hard-packed, waymarked, relatively safe." },
  { id: "trail", name: "Trail", milesPerDay: 16, note: "A footpath through the wild." },
  { id: "forest", name: "Forest", milesPerDay: 12, note: "Thick woods, slow going off the paths." },
  { id: "hills", name: "Hills", milesPerDay: 10, note: "Rising ground and long valleys." },
  { id: "mountain", name: "Mountains", milesPerDay: 6, note: "Passes, scree and thin air." },
  { id: "swamp", name: "Swamp", milesPerDay: 8, note: "Mire, reeds and biting insects." },
  { id: "desert", name: "Desert", milesPerDay: 12, note: "Water is everything; shade is a rumor." },
];

export const GURPS_TERRAIN_MAP = Object.fromEntries(
  GURPS_TERRAINS.map((t) => [t.id, t]),
);

export interface GurpsWeatherDef {
  id: string;
  name: string;
  /** Multiplier on miles/day. */
  speedMult: number;
  /** Penalty to outdoor skill rolls (Survival, Navigation, Vision). */
  penalty: number;
}

export const GURPS_WEATHER: GurpsWeatherDef[] = [
  { id: "clear", name: "Clear", speedMult: 1, penalty: 0 },
  { id: "overcast", name: "Overcast", speedMult: 1, penalty: 0 },
  { id: "rain", name: "Rain", speedMult: 0.75, penalty: -1 },
  { id: "storm", name: "Storm", speedMult: 0.5, penalty: -2 },
  { id: "fog", name: "Fog", speedMult: 0.75, penalty: -1 },
  { id: "scorch", name: "Scorching / Blizzard", speedMult: 0.6, penalty: -1 },
];

export const GURPS_WEATHER_MAP = Object.fromEntries(
  GURPS_WEATHER.map((w) => [w.id, w]),
);

export function gurpsTravelSpeed(terrainId: string, weatherId: string): number {
  const t = GURPS_TERRAIN_MAP[terrainId] ?? GURPS_TERRAINS[1];
  const w = GURPS_WEATHER_MAP[weatherId] ?? GURPS_WEATHER[0];
  return Math.max(1, Math.round(t.milesPerDay * w.speedMult));
}

/** Random weather roll (d6 → index into GURPS_WEATHER). */
export function gurpsRandomWeather(): GurpsWeatherDef {
  const r = 1 + Math.floor(Math.random() * 6);
  return GURPS_WEATHER[Math.min(r, GURPS_WEATHER.length) - 1];
}

/** Foraging yield (food units — 1 unit feeds one person for a day). */
export function gurpsForageYield(margin: number, outcome: string): { food: number; note: string } {
  if (outcome === "critical-success") return { food: 4, note: "A windfall — berries, roots, and a full pot." };
  if (outcome === "critical-failure") return { food: 0, note: "A bad turn — you disturb a nest of angry wildlife and come back empty-handed." };
  if (margin >= 5) return { food: 3, note: "Plenty — the land provides." };
  if (margin >= 0) return { food: 2, note: "A solid day's gathering." };
  if (margin >= -3) return { food: 1, note: "Scraps — enough to keep hunger at bay." };
  return { food: 0, note: "Nothing worth eating today." };
}

/** Hunting yield — gp value of meat and pelts. */
export function gurpsHuntYield(margin: number, outcome: string): { gp: number; note: string } {
  if (outcome === "critical-success") return { gp: 12, note: "A prize kill — prime meat and a fine pelt (+12 gp)." };
  if (outcome === "critical-failure") return { gp: 0, note: "The quarry turns on you — you barely escape with your life." };
  if (margin >= 0) return { gp: 6, note: "A clean kill — meat for the pot and a few coins of pelt (+6 gp)." };
  return { gp: 0, note: "No sign of game today." };
}

// ---------------------------------------------------------------------------
// AI rules corpus — fed to the GM so it narrates magic/alchemy/forging/travel
// faithfully. Magic is a medieval-world feature; the caller gates by mode.
// ---------------------------------------------------------------------------

export function gurpsFantasyRulesContext(): string {
  return [
    "GURPS-STYLE FANTASY / MEDIEVAL EXPANSION (original mechanics — 3d6 roll-under vs skill targets, FP costs, margins of success).",
    "MAGIC: six original colleges — Pyre (fire), Frost (ice), Gale (wind), Verdant (nature), Veil (illusion), Spirit (mind). Each is a trained skill (IQ/Hard); untrained casters use IQ-4. Casting costs fatigue (FP) and rolls 3d6 vs the college skill. A critical failure triggers a mishap table (backlash, wild surge, attention, burnout, drain, or tainted).",
    "ALCHEMY: brewing rolls 3d6 vs Alchemy (IQ/Hard). Recipes need specific reagents (Ember Moss, Frost Petal, Gale Seed, Rootbark, Moon Salt, Veil Ash) plus base materials in gp; success creates the potion, failure wastes the materials.",
    "SMITHING: forging rolls 3d6 vs Smith (IQ/Average) with a material cost and a forging time of days; forged gear grants small permanent bonuses.",
    "TRAVEL: terrain sets miles per day (road 24, trail 16, forest 12, hills 10, mountain 6, swamp 8, desert 12) modified by weather (rain ×0.75, storm ×0.5, fog ×0.75, scorch/blizzard ×0.6). Foraging and hunting roll 3d6 vs Survival and yield food or gp.",
    "Magic, alchemy, reagents and monster encounters exist only in worlds where the fantasy life is real — honor the LIFE MODE TAG and never invent magical solutions in a world without them.",
  ].join("\n");
}
