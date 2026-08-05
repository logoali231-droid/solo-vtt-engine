// ============================================================================
// Oraculum — Solo Tabletop RPG Engine. Shared type definitions.
// ============================================================================

export type GameSystem = "dnd5e" | "pf2e" | "gurps";

export const SYSTEMS: {
  id: GameSystem;
  name: string;
  short: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "dnd5e",
    name: "Dungeons & Dragons 5e",
    short: "D&D 5e",
    tagline: "The classic. Advantage, spell slots & critical hits.",
    description:
      "Full core rulebook database plus Tasha's Cauldron of Everything — custom ancestry, Artificer, and the TCoE subclasses.",
  },
  {
    id: "pf2e",
    name: "Pathfinder 2e",
    short: "PF2e",
    tagline: "Tactical. Three-action economy & four degrees of success.",
    description:
      "Four-tier proficiency tracking (Trained / Expert / Master / Legendary) and the iconic 3-Action economy.",
  },
  {
    id: "gurps",
    name: "GURPS 4e",
    short: "GURPS",
    tagline: "Point-buy realism. Roll 3d6 under the skill target.",
    description:
      "Character-point budgeting, attribute-driven skills and the 3d6 bell-curve resolution engine.",
  },
];

export type AbilityId = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITIES: AbilityId[] = ["str", "dex", "con", "int", "wis", "cha"];

export const ABILITY_LABELS: Record<AbilityId, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export type AbilityScores = Record<AbilityId, number>;

export type Outcome =
  | "critical-success"
  | "success"
  | "failure"
  | "critical-failure";

export type RollModifierSource =
  | "ability"
  | "proficiency"
  | "tier"
  | "condition"
  | "feature"
  | "equipment"
  | "other";

export interface RollModifierLine {
  label: string;
  value: number;
  source: RollModifierSource;
}

export type DiceKind =
  | "attack"
  | "save"
  | "skill"
  | "check"
  | "damage"
  | "heal"
  | "reaction"
  | "oracle"
  | "custom";

export interface DiceResult {
  id: string;
  label: string;
  system: GameSystem;
  kind: DiceKind;
  rolls: number[];
  diceNotation: string;
  modifiers: RollModifierLine[];
  total: number;
  target?: number;
  outcome: Outcome;
  margin?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: boolean;
  breakdown: string;
  featureUsed?: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Conditions (shared across systems, system-aware effects)
// ---------------------------------------------------------------------------

export interface ConditionEffect {
  // D&D 5e
  attackDisadvantage?: boolean;
  attacksAgainstAdvantage?: boolean;
  abilityCheckDisadvantage?: boolean;
  saveDisadvantage?: boolean;
  dexSaveDisadvantage?: boolean;
  autoFailStrDexSaves?: boolean;
  autoFailSightChecks?: boolean;
  speedZero?: boolean;
  // Pathfinder 2e (status penalty)
  pf2ePenalty?: number;
  // GURPS (flat penalty)
  gurpsPenalty?: number;
}

export interface ConditionDef {
  id: string;
  name: string;
  summary: string;
  effects: ConditionEffect;
}

// ---------------------------------------------------------------------------
// D&D 5e
// ---------------------------------------------------------------------------

export interface TraitDef {
  name: string;
  summary: string;
  mechanic?: "darkvision" | "poison-resistance" | "lucky";
}

export interface RaceDef {
  id: string;
  name: string;
  size: string;
  speed: number;
  asi: Partial<Record<AbilityId, number>>;
  languages: string[];
  traits: TraitDef[];
  blurb: string;
}

export type FeatureHook =
  | { kind: "addDie"; die: number; label: string }
  | {
      kind: "addFlat";
      label: string;
      flat: number | ((c: DnDCharacter) => number);
    }
  | { kind: "tempHp"; die: number; ability?: AbilityId }
  | { kind: "extraDamage"; die: number; times?: "oncePerTurn" | "always" }
  | { kind: "advantageOn"; checks: "str" | "attack" | "all" }
  | { kind: "acBonus"; value: number | ((c: DnDCharacter) => number) }
  | { kind: "healDie"; die: number; count?: number; ability?: AbilityId }
  | { kind: "status"; status: "raging" | "bladesong" | "reckless" | "mighty" }
  | { kind: "narrative" };

export interface FeatureDef {
  id: string;
  name: string;
  level: number;
  summary: string;
  rest?: "short" | "long" | "none";
  uses?: (c: DnDCharacter) => number;
  hook?: FeatureHook;
}

export interface ResourceDef {
  id: string;
  label: string;
  rest: "short" | "long" | "none";
  max: (c: DnDCharacter) => number;
  note?: string;
}

export type DnDClassId =
  | "artificer"
  | "barbarian"
  | "bard"
  | "cleric"
  | "druid"
  | "fighter"
  | "monk"
  | "paladin"
  | "ranger"
  | "rogue"
  | "sorcerer"
  | "warlock"
  | "wizard";

export interface SubclassDef {
  id: string;
  name: string;
  source: "PHB" | "XGtE" | "TCoE";
  blurb: string;
  features: FeatureDef[];
}

export interface ClassDef {
  id: DnDClassId;
  name: string;
  hitDie: number;
  primaryAbility: AbilityId;
  saves: AbilityId[];
  skillOptions: string[];
  skillCount: number;
  spellAbility?: AbilityId;
  casterType?: "full" | "half" | "pact";
  subclassLevel: number;
  features: FeatureDef[];
  resources: ResourceDef[];
  subclasses: SubclassDef[];
  blurb: string;
}

export interface BackgroundDef {
  id: string;
  name: string;
  skills: string[];
  feature: { name: string; summary: string };
  equipment: string[];
  blurb: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  count: number;
  sides: number;
  ability: AbilityId;
  finesse?: boolean;
  twoHanded?: boolean;
  range?: string;
  properties: string[];
}

export interface ArmorDef {
  id: string;
  name: string;
  acKind: "none" | "light" | "medium" | "heavy";
  baseAc: number;
  dexCap?: number;
  stealthDis?: boolean;
  note?: string;
}

export interface AttackDef {
  id: string;
  name: string;
  weaponId: string;
  count: number;
  sides: number;
  ability: AbilityId;
  range?: string;
  properties: string[];
}

export interface PendingBonus {
  id: string;
  label: string;
  featureId: string;
  die?: number;
  flat?: number;
  kind: "addDie" | "addFlat";
}

export interface DnDCharacter {
  system: "dnd5e";
  name: string;
  level: number;
  raceId: string;
  customOrigin: boolean;
  originFirst: AbilityId;
  originSecond: AbilityId;
  classId: DnDClassId;
  subclassId: string;
  backgroundId: string;
  baseScores: AbilityScores;
  chosenSkills: string[];
  weaponId: string;
  armorId: string;
  shield: boolean;
  state: {
    hpDamage: number;
    tempHp: number;
    resourceUses: Record<string, number>;
    spellSlotsUsed: number[];
    pactUsed: number;
    infusionsUsed: number;
    conditions: string[];
    pending: PendingBonus[];
    damagePending: PendingBonus[];
    activeStatus: string[];
  };
}

// ---------------------------------------------------------------------------
// Pathfinder 2e
// ---------------------------------------------------------------------------

export type PfRank = "untrained" | "trained" | "expert" | "master" | "legendary";

export const PF_RANKS: PfRank[] = [
  "untrained",
  "trained",
  "expert",
  "master",
  "legendary",
];

export interface Pf2eAncestryDef {
  id: string;
  name: string;
  boosts: AbilityId[];
  hp: number;
  size: string;
  speed: number;
  traits: string[];
  blurb: string;
}

export interface Pf2eClassDef {
  id: string;
  name: string;
  keyAbility: AbilityId;
  hp: number;
  perLevel: number;
  trainedSkills: string[];
  blurb: string;
}

export interface Pf2eBackgroundDef {
  id: string;
  name: string;
  boosts: AbilityId[];
  skills: string[];
  feature: string;
}

export interface Pf2eCharacter {
  system: "pf2e";
  name: string;
  level: number;
  ancestryId: string;
  classId: string;
  backgroundId: string;
  scores: AbilityScores;
  freeBoosts: AbilityId[];
  skillRanks: Record<string, PfRank>;
  saveRanks: Record<AbilityId, PfRank>;
  perceptionRank: PfRank;
  armorId: string;
  state: {
    hpDamage: number;
    actions: number;
    conditions: string[];
  };
}

// ---------------------------------------------------------------------------
// GURPS
// ---------------------------------------------------------------------------

export interface GurpsSkillDef {
  id: string;
  name: string;
  stat: "st" | "dx" | "iq" | "ht";
  difficulty: "easy" | "average" | "hard";
}

export interface GurpsCharacter {
  system: "gurps";
  name: string;
  attributes: { st: number; dx: number; iq: number; ht: number };
  skills: { id: string; points: number }[];
  armorId: string;
  points: { attributes: number; skills: number; budget: number };
  state: {
    hpDamage: number;
    fpDamage: number;
    conditions: string[];
  };
}

// ---------------------------------------------------------------------------
// Adventure / game session state
// ---------------------------------------------------------------------------

export type Character = DnDCharacter | Pf2eCharacter | GurpsCharacter;

export interface EnemyState {
  id: string;
  name: string;
  ac: number;
  hp: number;
  maxHp: number;
  attackBonus: number;
  damage: string;
}

export interface LogEntry {
  id: string;
  kind: "system" | "player" | "gm" | "dice" | "combat";
  text: string;
  dice?: DiceResult;
  timestamp: number;
}

export interface AdventureState {
  system: GameSystem;
  character: Character;
  logs: LogEntry[];
  diceLog: DiceResult[];
  sceneTitle: string;
  location: string;
  quest: string[];
  enemies: EnemyState[];
  gmMode: "local" | "live";
  createdAt: number;
  updatedAt: number;
}

export interface GmTurn {
  playerText?: string;
  dice?: DiceResult;
  action?: string;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
