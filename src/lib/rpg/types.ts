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
  /** Why advantage was granted automatically (e.g. "unseen attacker"). */
  advSources?: string[];
  /** Why disadvantage was granted automatically (e.g. "can't see the target"). */
  disSources?: string[];
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
  /** GURPS only — the Life & Livelihood world tag. Selects which era of the
   *  life-sim (jobs, universities, social scenes, cyber, medieval holdings)
   *  exists in this campaign. "all" keeps every era available. */
  lifeMode?: GurpsLifeMode;
}

/** Which era of the GURPS Life & Livelihood extension this campaign runs in.
 *  The tag at Adventure Setup completely re-frames the life-sim: jobs,
 *  universities, social circles/events, businesses, cyber and medieval content
 *  all filter to the chosen world. */
export type GurpsLifeMode = "medieval" | "modern" | "cyber" | "all";

export const GURPS_LIFE_MODES: { id: GurpsLifeMode; name: string; tagline: string; summary: string }[] = [
  {
    id: "medieval",
    name: "Fantasy / Medieval",
    tagline: "Castles, guilds & courts",
    summary: "Field hands and falconers, monastery scriptoria and guild colleges, fiefs and titles, court service and tavern circles. No phones, no chrome — the social ladder runs on land, oaths and favor.",
  },
  {
    id: "modern",
    name: "Modern / Social",
    tagline: "Careers, university & city life",
    summary: "Clerks, lawyers, journalists and professors; city universities, polytechnics and student debt; social clubs, galas and fight nights. The daily grind of a contemporary social-engineering life.",
  },
  {
    id: "cyber",
    name: "Cyberpunk",
    tagline: "Netrunning, corps & chrome",
    summary: "Corp drones and netrunners, corporate academies and grid universities, netdecks, ICE, chrome and the corporate ladder. The Grid is the frontier and the corps own the skyline.",
  },
  {
    id: "all",
    name: "Everything / Mixed",
    tagline: "Every era at once",
    summary: "The full Life & Livelihood sandbox — medieval holdings and cyber decks, monasteries and megacorps all exist in one living world. Whatever the story reaches for is there.",
  },
];

/** Resolve a stored life-mode tag safely — anything unset or unknown falls
 *  back to "all" (the full sandbox, and the behavior of older saves). */
export function gurpsLifeModeOf(prefs: Partial<AdventurePrefs> | undefined): GurpsLifeMode {
  const m = prefs?.lifeMode;
  return m === "medieval" || m === "modern" || m === "cyber" ? m : "all";
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
  lifeMode: "all",
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
  /** Your attack rolls have advantage (e.g. invisible / unseen attacker). */
  attackAdvantage?: boolean;
  /** Attack rolls made against you have disadvantage (e.g. invisible). */
  attacksAgainstDisadvantage?: boolean;
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
  /** Magic-weapon enchantment applied to this attack (shop gear). */
  enchant?: number;
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
  /** Magic-weapon enchantment bought from the shop (+N to attack/damage). */
  magicWeaponBonus?: number;
  /** Magic-armor enchantment bought from the shop (+N to AC). */
  magicArmorBonus?: number;
  /** Magic-shield enchantment bought from the shop (+N to AC when equipped). */
  magicShieldBonus?: number;
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
  /** Spoken languages at character creation. */
  languages?: string[];
  /** Level-1 ancestry feat ids available to this ancestry. */
  feats?: string[];
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

export type Pf2eFeatKind = "ancestry" | "general" | "skill";

export interface Pf2eFeatDef {
  id: string;
  name: string;
  kind: Pf2eFeatKind;
  /** Minimum level (1 for every 1st-level feat here). */
  level: number;
  traits: string[];
  summary: string;
  /** For ancestry feats — the ancestry it belongs to. */
  ancestryId?: string;
}

export interface Pf2eWeaponDef {
  id: string;
  name: string;
  category: "simple" | "martial";
  hands: 1 | 2;
  /** Damage dice, e.g. "1d6". */
  damageDice: string;
  damageType: "P" | "S" | "B";
  traits: string[];
  /** Price in silver pieces. */
  price: number;
  bulk: string;
}

export interface Pf2eGearDef {
  id: string;
  name: string;
  category: "weapon" | "armor" | "adventuring" | "tool" | "consumable";
  /** Price in silver pieces. */
  price: number;
  bulk: string;
  summary: string;
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
  /** Chosen feat ids (ancestry + general + skill) at level 1. */
  feats?: string[];
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
  /** Life & Livelihood extension state — jobs, wealth, business, relationships,
   *  cyberware and holdings. Original mechanics built on GURPS logic. */
  ext?: GurpsExtensionState;
  state: {
    hpDamage: number;
    fpDamage: number;
    conditions: string[];
  };
}

// ---------------------------------------------------------------------------
// GURPS Life & Livelihood extension (original mechanics in GURPS style)
// ---------------------------------------------------------------------------

export interface GurpsExtensionState {
  /** Active job id (see GURPS_JOBS). */
  jobId?: string;
  /** Wealth tier id (see GURPS_WEALTH_TIERS). */
  wealthTierId?: string;
  /** Owned business id (see GURPS_BUSINESSES) — paid for from the wallet. */
  businessId?: string;
  /** Installed cyberware ids (see GURPS_CYBERWARE). */
  cyberware: string[];
  /** Current relationship stage id (see GURPS_RELATIONSHIP_STAGES). */
  relationshipStage?: string;
  /** Name of the current romantic interest / partner. */
  relationshipName?: string;
  /** Held fief id (see GURPS_HOLDINGS). */
  holdingId?: string;
  // --- Education (original GURPS-style mechanics) ---
  /** Enrolled university id (see GURPS_UNIVERSITIES). */
  universityId?: string;
  /** Pursued degree id (see GURPS_DEGREES). */
  degreeId?: string;
  /** 0–100 progress toward the degree's exam. */
  studyProgress?: number;
  /** Whether the degree has been completed. */
  graduated?: boolean;
  /** Outstanding tuition debt in gp. */
  studentDebt?: number;
  /** Scholarship covering tuition. */
  scholarship?: boolean;
  // --- Social life (original mechanics) ---
  /** 0–100 renown in the local social world. */
  reputation?: number;
  /** Joined social circle id (see GURPS_SOCIAL_CIRCLES). */
  socialCircleId?: string;
  /** Acquired contacts (names/roles, player-written). */
  contacts: string[];
  // --- Medieval deep ---
  /** Purchased noble title id (see GURPS_NOBLE_TITLES). */
  titleId?: string;
  /** Held court position id (see GURPS_COURT_POSITIONS). */
  courtPositionId?: string;
  // --- Cyber deep ---
  /** Owned netdeck id (see GURPS_NETDECKS). */
  netdeckId?: string;
  /** Loaded program ids (see GURPS_PROGRAMS). */
  programs: string[];
  /** Current corp ladder rank id (see GURPS_CORP_LADDER). */
  corpPositionId?: string;
  // --- Fantasy / Arcana (original magic, alchemy, crafting) ---
  /** Learned spell ids (see GURPS_SPELLS). */
  spells: string[];
  /** Owned reagent ids (see GURPS_REAGENTS) — one entry per unit. */
  reagents: string[];
  /** Brewed potion ids (see GURPS_ALCHEMY_RECIPES). */
  potions: string[];
  /** Forged item ids (see GURPS_FORGE_RECIPES). */
  crafted: string[];
  // --- Cyber / Futuristic gear ---
  /** Owned gear ids (see GURPS_CYBER_GEAR). */
  gear: string[];
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
  /** Active conditions on this foe — feed the auto advantage/disadvantage engine (e.g. prone, restrained). */
  conditions?: string[];
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
// Currency — a mechanical wallet tracked independently of the story's gold.
// 1 gp = 10 sp = 100 cp (D&D 5e / PF2e standard). The Pf2e shop stores item
// prices in sp using the app's display convention (100 sp = 1 gp), so the
// helpers below keep wallet math consistent with the price tags the player
// sees.
// ---------------------------------------------------------------------------

export interface Wallet {
  gp: number;
  sp: number;
  cp: number;
}

export const EMPTY_WALLET: Wallet = { gp: 0, sp: 0, cp: 0 };

/** Total value of the wallet expressed in silver pieces (app display unit). */
export function walletToSp(w: Wallet): number {
  return w.gp * 100 + w.sp + Math.floor(w.cp / 10);
}

/** Convert a raw sp amount (app display unit) back into a normalized wallet. */
export function spToWallet(sp: number): Wallet {
  const safe = Math.max(0, Math.floor(sp));
  return { gp: Math.floor(safe / 100), sp: safe % 100, cp: 0 };
}

/** Human-readable wallet, e.g. "12 gp, 5 sp, 3 cp" (or "0 gp" when empty). */
export function fmtWallet(w: Wallet): string {
  const parts: string[] = [];
  if (w.gp > 0) parts.push(`${w.gp} gp`);
  if (w.sp > 0) parts.push(`${w.sp} sp`);
  if (w.cp > 0) parts.push(`${w.cp} cp`);
  return parts.length > 0 ? parts.join(", ") : "0 gp";
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

// ---------------------------------------------------------------------------
// Territory generator (kingdoms, countries, companies, societies - built with
// the Territory Generator in the game's World tab and fed to the GM)
// ---------------------------------------------------------------------------

export type TerritoryKind =
  | "kingdom"
  | "country"
  | "city"
  | "company"
  | "society"
  | "guild"
  | "faction"
  | "cult"
  | "house"
  | "tribe";

/** Which flavor of content a territory draws from. Fantasy for D&D 5e and
 *  PF2e; GURPS follows the Life Mode tag (medieval -> fantasy, modern -> modern,
 *  cyber -> cyber, all -> random per territory). */
export type TerritoryEra = "fantasy" | "modern" | "cyber";

export interface Territory {
  id: string;
  kind: TerritoryKind;
  era: TerritoryEra;
  name: string;
  ruler: string;
  government: string;
  scale: string;
  economy: string;
  military: string;
  trait: string;
  culture: string;
  magicTech: string;
  factions: string[];
  conflict: string;
  secret: string;
  relations: string;
  note: string;
  lang: "en" | "pt-BR";
  updatedAt: number;
}

export interface AdventureState {
  id?: string; // stable id used by the Adventures library (backfilled on save if missing)
  system: GameSystem;
  character: Character;
  logs: LogEntry[];
  diceLog: DiceResult[];
  sceneTitle: string;
  location: string;
  quest: string[];
  enemies: EnemyState[];
  companions?: Companion[]; // party members, rolled with the same dice engine
  territories?: Territory[]; // generated kingdoms/countries/companies/societies
  gmMode: "local" | "live";
  aiIntroPending?: boolean; // true while the AI opening scene has not been generated yet
  xp?: number;
  gold?: number; // story/campaign gold (display + narrative); wallet is the mechanical purse
  wallet?: Wallet; // mechanical currency used by the shop, independent of story context
  inventory?: InventoryItem[];
  memory?: string; // auto-generated session summary injected into the GM context
  createdAt: number;
  updatedAt: number;
}

/** Library entry for a saved adventure session (see storage.ts). */
export interface AdventureRecord {
  id: string;
  label: string;
  system: GameSystem;
  character: Character;
  adventure: AdventureState;
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
