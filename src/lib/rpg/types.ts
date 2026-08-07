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
// Character identity & appearance (shared across systems)
// ---------------------------------------------------------------------------

export interface CharacterIdentity {
  gender: string;
  pronouns: string;
  sexuality: string;
  age: string;
  height: string;
  weight: string;
  eyeColor: string;
  hairColor: string;
  skinColor: string;
  personality: string;
  features: string;
}

export const DEFAULT_IDENTITY: CharacterIdentity = {
  gender: "",
  pronouns: "they/them",
  sexuality: "",
  age: "",
  height: "",
  weight: "",
  eyeColor: "",
  hairColor: "",
  skinColor: "",
  personality: "",
  features: "",
};

export function identityOf(
  identity: Partial<CharacterIdentity> | undefined,
): CharacterIdentity {
  return { ...DEFAULT_IDENTITY, ...(identity ?? {}) };
}

// ---------------------------------------------------------------------------
// Adventure preferences (player-authored campaign directives for the GM)
// ---------------------------------------------------------------------------

export interface AdventurePrefs {
  genre: string;
  tone: string;
  style: string;
  setting: string;
  difficulty: string;
  focus: string;
  magicLevel: string;
  worldEra: string;
  companions: string;
  villain: string;
  stakes: string;
  pace: string;
  narrator: string;
  premise: string;
}

export const DEFAULT_ADVENTURE_PREFS: AdventurePrefs = {
  genre: "high fantasy",
  tone: "heroic & epic",
  style: "sandbox",
  setting: "wilderness",
  difficulty: "standard",
  focus: "balanced",
  magicLevel: "standard fantasy",
  worldEra: "medieval",
  companions: "true solo",
  villain: "ancient evil",
  stakes: "a community",
  pace: "steady",
  narrator: "vivid literary",
  premise: "",
};

export function prefsOf(
  prefs: Partial<AdventurePrefs> | undefined,
): AdventurePrefs {
  return { ...DEFAULT_ADVENTURE_PREFS, ...(prefs ?? {}) };
}

const SETTING_LOCATIONS: Record<string, string> = {
  village: "A quiet village on the frontier",
  "town / city": "The crowded streets of the capital",
  tavern: "A tavern at the edge of the map",
  wilderness: "The untamed wilds",
  "dungeon entrance": "The mouth of a forgotten dungeon",
  "castle / court": "The seat of a wary lord",
  "frontier outpost": "A frontier outpost",
  ship: "The deck of a trading vessel",
  academy: "The halls of an arcane academy",
  undercity: "The lamplit tunnels beneath the city",
};

const STYLE_QUESTS: Record<string, string> = {
  "dungeon crawl": "Descend into the depths and find what stirs below",
  "mystery & investigation": "Uncover the truth behind the strange occurrences",
  heist: "Steal the prize that everyone is watching",
  "political intrigue": "Navigate a court where every smile hides a blade",
  "war campaign": "Survive the storm of war that is coming",
  exploration: "Chart what no map has ever recorded",
  survival: "Endure the wilds and find safe ground",
  sandbox: "Answer the call of the open road",
  "monster hunt": "Hunt the creature plaguing the land",
  "epic quest": "Walk the path the prophecy has laid at your feet",
  "settlement building": "Build something that outlasts the chaos",
};

/** Turn the player's setup choices into the opening scene of the campaign. */
export function adventureScene(prefs: AdventurePrefs): {
  title: string;
  location: string;
  quest: string;
  hook: string;
} {
  const location = SETTING_LOCATIONS[prefs.setting] ?? "The Old Watchtower Road";
  const quest = STYLE_QUESTS[prefs.style] ?? "Find the sealed door beneath the hills";
  const title = `A ${prefs.tone} ${prefs.genre} tale`;
  const hook = VILLAIN_HOOKS[prefs.villain] ?? "trouble is brewing on the horizon";
  return { title, location, quest, hook };
}

const VILLAIN_HOOKS: Record<string, string> = {
  "personal rival": "a face from your past is pulling the strings",
  "criminal syndicate": "a shadowy syndicate runs the roads and the courts",
  "corrupt authority": "the powers that be are rotten to the core",
  "ancient evil": "something ancient and patient stirs in the depths",
  "monstrous threat": "a monster is devouring the land, one settlement at a time",
  "rival adventurer": "a rival adventurer wants what you want — and wants it first",
  "the wilds themselves": "the wilds themselves have turned against the people",
  "a dark prophecy": "a dark prophecy is coming due, and it names you",
};

const COMPANION_LINES: Record<string, string> = {
  "true solo": "You walk this road alone.",
  "one companion": "A single trusted companion shares your road.",
  "small band": "A small band of allies shares your road.",
  "as the adventure evolves":
    "Your company is not fixed — companions will be introduced organically as the adventure unfolds, never decided up front.",
  "dice decides":
    "Your company is decided by dice — whenever fate offers a companion, the oracle rolls to see if they join and who they are.",
};

/** A full campaign directive — the exact briefing the Game Master follows when
 *  it opens your story. Built from every Adventure Setup choice so the player
 *  sees (and can fine-tune) exactly what the GM will read. */
export function campaignBriefing(prefs: AdventurePrefs): string {
  const scene = adventureScene(prefs);
  const companions = COMPANION_LINES[prefs.companions] ?? "You walk this road alone.";
  const parts = [
    `${scene.title.charAt(0).toUpperCase()}${scene.title.slice(1)}.`,
    `You begin near ${scene.location.toLowerCase()}.`,
    `Your first thread: ${scene.quest}.`,
    `Behind it all, ${scene.hook}.`,
  ];
  if (prefs.magicLevel) parts.push(`Magic runs ${prefs.magicLevel}.`);
  if (prefs.worldEra) parts.push(`The age is ${prefs.worldEra}.`);
  parts.push(companions);
  if (prefs.stakes) parts.push(`What hangs in the balance: ${prefs.stakes}.`);
  if (prefs.focus) parts.push(`The story leans ${prefs.focus}.`);
  if (prefs.difficulty) parts.push(`Difficulty: ${prefs.difficulty}.`);
  if (prefs.pace) parts.push(`The narrative moves at a ${prefs.pace} pace.`);
  if (prefs.narrator) parts.push(`The narrator's voice: ${prefs.narrator}.`);
  if (prefs.premise) parts.push(`The hook you planted: ${prefs.premise}.`);
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Game Master settings (AI provider configuration — localStorage only)
// ---------------------------------------------------------------------------

export type GmLanguage = "en" | "pt-BR";

export type GmProviderId =
  | "builtin"
  | "groq"
  | "gemini"
  | "openrouter"
  | "huggingface"
  | "ollama"
  | "gradio"
  | "horde";

export interface GmSettings {
  provider: GmProviderId;
  model: string;
  apiKey: string;
  baseUrl: string; // used by local / ollama-style endpoints
  language: GmLanguage;
  temperature: number;
}

// New players start on AI Horde — 100% free, no key, unlimited community GPUs.
// The built-in (platform-key) provider and the other free providers remain one
// tap away in GM Settings.
export const DEFAULT_GM_SETTINGS: GmSettings = {
  provider: "horde",
  model: "koboldcpp/L3-8B-Stheno-v3.2-IQ3_S-imat",
  apiKey: "",
  baseUrl: "http://localhost:11434",
  language: "en",
  temperature: 1,
};

// ---------------------------------------------------------------------------
// Screen-time ads (monetization — localStorage only, never the database)
// ---------------------------------------------------------------------------

export type AdsProviderId = "demo" | "adsense" | "iframe" | "script";

export interface AdsSettings {
  /** Master switch — a premium tier could set this to false. */
  enabled: boolean;
  /** demo = built-in sponsor cards (works with zero accounts); adsense = Google AdSense slot; iframe = any ad network display URL; script = paste any ad network script tag. */
  provider: AdsProviderId;
  /** Screen-time refresh interval in seconds (demo, iframe + script only; AdSense must stay static per Google policy). */
  refreshSeconds: number;
  /** AdSense publisher ID, e.g. ca-pub-1234567890. */
  adsenseClient: string;
  /** AdSense slot ID (numeric). */
  adsenseSlot: string;
  /** Any ad network iframe/display URL (PropellerAds, Venatus, Setupad, Playwire, …). */
  iframeUrl: string;
  /** Any ad network script tag (Adsterra banners, Monetag in-page push, PropellerAds on-page push, …). */
  adScript: string;
}

export const DEFAULT_ADS_SETTINGS: AdsSettings = {
  enabled: true,
  provider: "demo",
  refreshSeconds: 30,
  adsenseClient: "",
  adsenseSlot: "",
  iframeUrl: "",
  adScript: "",
};

// ---------------------------------------------------------------------------
// Lorebook (per-campaign world facts injected into the GM context)
// ---------------------------------------------------------------------------

export interface LorebookEntry {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  updatedAt: number;
}

export interface SavedCharacterRecord {
  id: string;
  label: string;
  system: GameSystem;
  character: Character;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Companions (party members — statted and rolled with the same engine)
// ---------------------------------------------------------------------------

export interface Companion {
  id: string;
  name: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  attackBonus: number;
  damage: string; // "1d6+2"
  // GURPS: attribute block (HP = ST, attack = 3d6 under skill target)
  attributes?: { st: number; dx: number; iq: number; ht: number };
  skillTarget?: number;
  notes?: string;
  createdAt: number;
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

export interface SubraceDef {
  id: string;
  raceId: string;
  name: string;
  /** Ability increases on top of the race's base ASI. */
  asi: Partial<Record<AbilityId, number>>;
  traits: TraitDef[];
  blurb: string;
  /** Overrides the race's walking speed (e.g. Wood Elf 35 ft). */
  speed?: number;
  /** Human Variant: replaces the +1-all ASI with two chosen +1s + a feat. */
  variantHuman?: boolean;
}

export interface ClassStartingGear {
  /** Primary weapon choice (ids from WEAPONS). */
  weaponOptions: { id: string; label: string }[];
  defaultWeapon: string;
  /** Optional second weapon slot (e.g. Rogue's shortbow vs shortsword). */
  secondWeaponOptions?: { id: string; label: string }[];
  defaultSecondWeapon?: string | null;
  /** Armor choice (ids from ARMORS). */
  armorOptions: { id: string; label: string }[];
  defaultArmor: string;
  /** Whether the class kit includes a shield the player can toggle. */
  shieldInKit?: boolean;
  /** Pack choices — one is placed in the inventory. */
  packOptions: string[];
  /** Fixed items placed in the inventory ("2 × Dagger" = qty 2). */
  extras: string[];
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
  /** PHB starting wealth roll, e.g. { dice: "5d4", mult: 10 } = 5d4 × 10 gp. */
  startingWealth?: { dice: string; mult: number };
  /** PHB starting equipment — weapon/armor/pack choices the wizard presents. */
  startingGear?: ClassStartingGear;
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
  /** PHB subrace (e.g. Wood Elf, Human Variant) — falls back to the race default. */
  subraceId?: string | null;
  customOrigin: boolean;
  originFirst: AbilityId;
  originSecond: AbilityId;
  classId: DnDClassId;
  subclassId: string;
  backgroundId: string;
  baseScores: AbilityScores;
  chosenSkills: string[];
  expertiseSkills: string[];
  feats: string[];
  weaponId: string;
  armorId: string;
  shield: boolean;
  /** Class starting wealth (gold) and equipment, seeded into the adventure. */
  startingGold?: number;
  startingInventory?: InventoryItem[];
  identity?: Partial<CharacterIdentity>;
  adventurePrefs?: Partial<AdventurePrefs>;
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
  /** Player Core quick equipment package — placed in the starting inventory. */
  startingItems?: string[];
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
  heritageId?: string;
  classId: string;
  backgroundId: string;
  scores: AbilityScores;
  freeBoosts: AbilityId[];
  skillRanks: Record<string, PfRank>;
  saveRanks: Record<AbilityId, PfRank>;
  perceptionRank: PfRank;
  armorId: string;
  /** Player Core: every 1st-level hero starts with 15 gp + the class kit. */
  startingGold?: number;
  startingInventory?: InventoryItem[];
  identity?: Partial<CharacterIdentity>;
  adventurePrefs?: Partial<AdventurePrefs>;
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
  advantages: { id: string; points: number }[];
  disadvantages?: { id: string; points: number }[];
  armorId: string;
  identity?: Partial<CharacterIdentity>;
  adventurePrefs?: Partial<AdventurePrefs>;
  points: { attributes: number; advantages: number; skills: number; disadvantages?: number; budget: number };
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
  // Kill rewards — awarded automatically when the foe is slain.
  xp?: number;
  gold?: number;
  loot?: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
}

// ---------------------------------------------------------------------------
// D&D 5e spellbook (curated; see data/dnd.ts for the full list)
// ---------------------------------------------------------------------------

export interface SpellDef {
  id: string;
  name: string;
  level: number; // 0 = cantrip
  school: string;
  range: string;
  cast: string;
  concentration?: boolean;
  ritual?: boolean;
  /** Requires a spell attack roll vs the target's AC. */
  attack?: boolean;
  /** Saving-throw spell — the target rolls against the caster's spell save DC. */
  save?: AbilityId;
  /** Auto-hits (e.g. Magic Missile) — no roll needed. */
  autoHit?: boolean;
  damage?: string;
  healDice?: string;
  description: string;
  classes: DnDClassId[];
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
  companions?: Companion[]; // party members, rolled with the same dice engine
  gmMode: "local" | "live";
  aiIntroPending?: boolean; // true while the AI opening scene has not been generated yet
  xp?: number;
  gold?: number;
  inventory?: InventoryItem[];
  memory?: string; // auto-generated session summary injected into the GM context
  createdAt: number;
  updatedAt: number;
}

export interface GmTurn {
  playerText?: string;
  dice?: DiceResult;
  action?: string;
  lorebook?: string; // compiled lorebook context for the live GM
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
