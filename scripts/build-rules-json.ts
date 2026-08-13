// ============================================================================
// Oraculum — Master rules JSON builder.
//
// Consolidates EVERY rules/data module in the app into ONE self-contained
// master file per RPG system (GURPS, D&D 5e, Pathfinder 2e). The output is
// plain JSON so it can be fed directly to AI training pipelines.
//
//   bun run scripts/build-rules-json.ts
//
// Outputs:
//   rules/gurps.json    — all GURPS rules, life-sim extensions, fantasy magic,
//                         cyber hacking, shop tables, bestiary & conditions.
//   rules/dnd5e.json    — all D&D 5e races/subraces/classes/subclasses (incl.
//                         TCoE), backgrounds, feats, weapons, armor, spells,
//                         slot tables, enchanting, bestiary & conditions.
//   rules/pf2e.json     — all PF2e ancestries/heritages/backgrounds/feats/
//                         classes, weapons, armor, gear, bestiary & conditions.
// ============================================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "rules");
const GENERATED_AT = new Date().toISOString();

// ---------------------------------------------------------------------------
// Shared engine pieces (dice math used by all systems)
// ---------------------------------------------------------------------------
import { d, abilityMod, pf2eOutcome, pfTierBonus, resolve3d6, resolveD20Check, gurpsThrust, gurpsSwing } from "../src/lib/rpg/dice";

// ---------------------------------------------------------------------------
// D&D 5e
// ---------------------------------------------------------------------------
import {
  DND_SKILLS,
  RACES,
  SUBRACES,
  BACKGROUNDS,
  FEATS,
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_SLOTS,
  WEAPONS,
  ARMORS,
  CLASSES,
  profBonusForLevel,
  spellSlotsFor,
  raceTotalAsi,
} from "../src/lib/rpg/data/dnd";
import { SPELLS, KNOWN_SPELLS_BY_CLASS } from "../src/lib/rpg/data/spells";
import { CONDITIONS } from "../src/lib/rpg/data/conditions";
import { DND_RARITY_LABELS, ENCHANT_TIERS, ENCHANT_PROPERTIES } from "../src/lib/rpg/data/dnd-shop";
import { ENCOUNTER_DIFFICULTIES, ENEMY_TABLES } from "../src/lib/rpg/data/enemies";
import { dndTestCases, dndRulesContext } from "../src/lib/rpg/data/adventure-samples";

// ---------------------------------------------------------------------------
// Pathfinder 2e
// ---------------------------------------------------------------------------
import {
  PF2E_SKILLS,
  PF2E_ANCESTRIES,
  PF2E_HERITAGES,
  PF2E_BACKGROUNDS,
  PF2E_FEATS,
  PF2E_CLASSES,
  PF2E_ARMORS,
  PF2E_WEAPONS,
  PF2E_GEAR,
} from "../src/lib/rpg/data/pf2e";
import { pf2eDataset, pf2eRulesContext } from "../src/lib/rpg/data/adventure-samples";

// ---------------------------------------------------------------------------
// GURPS (core + life & livelihood + fantasy + cyber + shop)
// ---------------------------------------------------------------------------
import {
  GURPS_SKILLS,
  GURPS_ARMORS,
  GURPS_ADVANTAGES,
  GURPS_DISADVANTAGES,
  GURPS_ATTRIBUTE_UPGRADE_COST,
  gurpsSkillLevel,
  gurpsSkillUpgradeCost,
  gurpsAttributeCost,
} from "../src/lib/rpg/data/gurps";
import {
  GURPS_EXTENSION_SKILLS,
  GURPS_WEALTH_TIERS,
  GURPS_JOBS,
  GURPS_BUSINESSES,
  GURPS_RELATIONSHIP_STAGES,
  GURPS_CYBERWARE,
  GURPS_HACK_TARGETS,
  GURPS_HOLDINGS,
  GURPS_UNIVERSITIES,
  GURPS_DEGREES,
  GURPS_SOCIAL_CIRCLES,
  GURPS_SOCIAL_EVENTS,
  GURPS_NOBLE_TITLES,
  GURPS_COURT_POSITIONS,
  GURPS_NETDECKS,
  GURPS_PROGRAMS,
  GURPS_CORP_LADDER,
  GURPS_STANDARD_INCOME,
  gurpsRulesContext,
} from "../src/lib/rpg/data/gurps-extensions";
import {
  GURPS_CYBER_GEAR,
  GURPS_ICE,
  GURPS_NETRUNS,
  gurpsCyberRulesContext,
} from "../src/lib/rpg/data/gurps-cyber";
import {
  GURPS_MAGIC_COLLEGES,
  GURPS_SPELLS,
  GURPS_REAGENTS,
  GURPS_ALCHEMY_RECIPES,
  GURPS_FORGE_RECIPES,
  GURPS_TERRAINS,
  GURPS_WEATHER,
  gurpsFantasyRulesContext,
} from "../src/lib/rpg/data/gurps-fantasy";
import {
  GURPS_QUALITY_LABELS,
  GURPS_SHOP_WEAPONS,
  GURPS_SHOP_ARMORS,
  GURPS_SHOP_GEAR,
} from "../src/lib/rpg/data/gurps-shop";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Serialize a function to source text so the exact math ships with the JSON. */
function src(fn: (...args: never[]) => unknown): string {
  return fn.toString();
}

function writeMaster(fileName: string, payload: Record<string, unknown>): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(payload, null, 2);
  writeFileSync(join(OUT_DIR, fileName), json, "utf8");
  const kb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`  ✓ ${fileName} (${kb} KB)`);
}

// ---------------------------------------------------------------------------
// D&D 5e master
// ---------------------------------------------------------------------------

const dnd5e: Record<string, unknown> = {
  schema: "oraculum-rules-master",
  schema_version: 1,
  system: "dnd5e",
  system_name: "Dungeons & Dragons 5th Edition (with Tasha's Cauldron of Everything)",
  generated_at: GENERATED_AT,
  description:
    "Complete consolidated D&D 5e rules database for the Oraculum solo VTT engine: core races, subraces, TCoE custom lineage, all classes (including Artificer) with TCoE subclasses, backgrounds, feats, point-buy/standard-array ability generation, spell slot progression, weapons, armor, spells, enchanting, encounter tables and conditions.",

  core_mechanics: {
    dice_engine:
      "Every roll uses Math.floor(Math.random() * sides) + 1. Ability checks, saving throws and attack rolls are 1d20 + modifier + proficiency bonus vs a Target Difficulty Class (DC). A natural 20 on the kept die is a critical success, a natural 1 a critical failure (in the binary d20 resolution). With Advantage roll two d20 and keep the higher; with Disadvantage keep the lower; if both apply they cancel to a single roll.",
    ability_modifier: "Ability modifier = Math.floor((score - 10) / 2).",
    proficiency_bonus:
      "Proficiency bonus scales with level: 1-4 → +2, 5-8 → +3, 9-12 → +4, 13-16 → +5, 17-20 → +6.",
    ability_generation:
      "Two modes: 27-Point Buy (scores cost points 8=0, 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9, minimum 8, maximum 15 before racials) or Standard Array (15, 14, 13, 12, 10, 8).",
    tasha_customization:
      "With Tasha's Origin Customization toggled on, the player manually assigns a +2 and a +1 to any two ability scores instead of the fixed racial defaults. The TCoE Custom Lineage race grants +2 to one chosen ability, a feat at 1st level, and darkvision or a skill proficiency.",
    spell_slots:
      "Full casters (bard, cleric, druid, sorcerer, wizard) use the full caster slot table; half casters (artificer, paladin, ranger) use the half caster table; warlocks use Pact Magic slots (2 slots of the listed level). Artificers track Infusions instead of spell slots at low level.",
    conditions:
      "Conditions mechanically feed the dice engine: Blinded/Poisoned/Prone/Restrained grant disadvantage on attack rolls, Prone/Stunned grant advantage to attacks against you, Stunned auto-fails Str/Dex saves and checks, Restrained sets speed to 0.",
    enchanting:
      "Weapons, armor and shields can be enchanted by an Artificer with an Intelligence check vs a DC that scales with the enchant tier; magic weapons add a bonus to attack and damage, magic armor adds to AC.",
  },

  formulas: {
    d20_roll: src(d),
    ability_modifier: src(abilityMod),
    d20_check_resolution: src(resolveD20Check),
    proficiency_bonus_for_level: src(profBonusForLevel),
    spell_slots_for_class: src(spellSlotsFor),
    race_total_asi: src(raceTotalAsi),
  },

  rules_text: dndRulesContext(),

  data: {
    skills: DND_SKILLS,
    races: RACES,
    subraces: SUBRACES,
    backgrounds: BACKGROUNDS,
    feats: FEATS,
    full_caster_slots: FULL_CASTER_SLOTS,
    half_caster_slots: HALF_CASTER_SLOTS,
    pact_slots: PACT_SLOTS,
    weapons: WEAPONS,
    armors: ARMORS,
    classes: CLASSES,
    spells: SPELLS,
    known_spells_by_class: KNOWN_SPELLS_BY_CLASS,
    conditions: CONDITIONS,
    enchant_rarity_labels: DND_RARITY_LABELS,
    enchant_tiers: ENCHANT_TIERS,
    enchant_properties: ENCHANT_PROPERTIES,
    encounter_difficulties: ENCOUNTER_DIFFICULTIES,
    enemies: ENEMY_TABLES.dnd5e,
  },

  training_corpus: dndTestCases,
};

// ---------------------------------------------------------------------------
// Pathfinder 2e master
// ---------------------------------------------------------------------------

const pf2e: Record<string, unknown> = {
  schema: "oraculum-rules-master",
  schema_version: 1,
  system: "pf2e",
  system_name: "Pathfinder 2nd Edition",
  generated_at: GENERATED_AT,
  description:
    "Complete consolidated Pathfinder 2e rules database for the Oraculum solo VTT engine: ancestries, heritages, backgrounds, ancestry/general/skill feats, the twelve Player Core classes, weapons, armor, adventuring gear, the 4-tier proficiency system, the 3-action economy, the four-degrees-of-success evaluation matrix, encounter tables and conditions.",

  core_mechanics: {
    dice_engine:
      "Every roll uses Math.floor(Math.random() * sides) + 1. Checks are 1d20 + ability modifier + proficiency bonus vs a DC.",
    proficiency_tiers:
      "Proficiency ranks add a level-scaled bonus: Untrained +0, Trained 2+level, Expert 4+level, Master 6+level, Legendary 8+level.",
    degrees_of_success:
      "The result is evaluated against the DC on a 4-degree matrix: +10 or more over the DC is a Critical Success, 0 to +9 a Success, -1 to -10 a Failure, and more than 10 below a Critical Failure. A natural 20 shifts the degree one step up, a natural 1 shifts it one step down (never a raw auto-win/loss).",
    action_economy: "Each turn the character has 3 actions to spend on actions, strikes, spells and movement; a turn resets the tracker to 3.",
    conditions:
      "Common adverse conditions apply a status penalty: -2 for Blinded/Poisoned/Prone/Restrained, -3 for Stunned; Blinded also gives a -2 penalty and stunned auto-fails checks.",
  },

  formulas: {
    d20_roll: src(d),
    ability_modifier: src(abilityMod),
    d20_check_resolution: src(resolveD20Check),
    pf2e_degree_matrix: src(pf2eOutcome),
    proficiency_tier_bonus: src(pfTierBonus),
  },

  rules_text: pf2eRulesContext(),

  data: {
    skills: PF2E_SKILLS,
    ancestries: PF2E_ANCESTRIES,
    heritages: PF2E_HERITAGES,
    backgrounds: PF2E_BACKGROUNDS,
    feats: PF2E_FEATS,
    classes: PF2E_CLASSES,
    armors: PF2E_ARMORS,
    weapons: PF2E_WEAPONS,
    gear: PF2E_GEAR,
    conditions: CONDITIONS,
    encounter_difficulties: ENCOUNTER_DIFFICULTIES,
    enemies: ENEMY_TABLES.pf2e,
  },

  training_corpus: pf2eDataset,
};

// ---------------------------------------------------------------------------
// GURPS master
// ---------------------------------------------------------------------------

const gurps: Record<string, unknown> = {
  schema: "oraculum-rules-master",
  schema_version: 1,
  system: "gurps",
  system_name: "GURPS (Generic Universal RolePlaying System, 4th-edition style)",
  generated_at: GENERATED_AT,
  description:
    "Complete consolidated GURPS rules database for the Oraculum solo VTT engine: attributes (ST/DX/IQ/HT), the full skill list with controlling attributes and difficulties, advantages and disadvantages with character-point costs, armor with DR, the 3d6 roll-under resolution with margins, the Life & Livelihood extension (jobs, wealth tiers, businesses, relationships, education, social life), the fantasy expansion (six magic colleges, alchemy, smithing, travel, weather), the cyber expansion (gear, ICE, netrunning, programs, the corporate ladder), the shop tables (weapons, armor, gear, quality tiers), the bestiary and conditions.",

  core_mechanics: {
    dice_engine:
      "Every roll uses Math.floor(Math.random() * sides) + 1. Skill checks roll 3d6 and must roll UNDER or EQUAL to the effective skill target (roll-under bell curve). The Margin of Success/Failure is target − total (positive = success margin, negative = failure margin).",
    criticals:
      "3-4 is always a critical success; 5 is a critical success at effective skill 15+; 18 always critical-fails; 17 critical-fails at effective skill 15 or less.",
    attributes:
      "Primary attributes ST, DX, IQ, HT are centered on 10. Each ±1 point costs or refunds 10 character points (custom rate). GURPS_ATTRIBUTE_UPGRADE_COST = 10.",
    skill_math:
      "Skill level = controlling attribute + difficulty offset (Easy 0, Average −1, Hard −2) plus the point-investment curve: 1 point → +0, 2 → +1, 4 → +2, then +1 per additional 4 points. Untrained skills default to attribute − 5.",
    advantages_disadvantages:
      "Advantages cost positive points (many are per-level); disadvantages have negative points that refund into the character budget. Examples: Combat Reflexes 15 pts (+1 to active defenses), Luck 15 pts, Weapon Master 45 pts.",
    damage: "GURPS thrust and swing damage derive from ST (thrust and swing tables included below in formulas).",
    conditions: "Common adverse conditions apply a flat skill penalty: −2 (Poisoned, Prone, Restrained), −3 (Blinded, Stunned).",
    life_and_livelihood:
      "The life-sim extension adds jobs (monthly work roll vs the job's skill), wealth tiers with income and cost of living, businesses with monthly profit rolls, relationships advanced by reaction rolls, education (universities, degrees, exams), social circles and events with a 0-100 reputation, medieval holdings and noble titles, and a cyber layer (netrunning vs Hacking with ICE penalties, programs, the corporate ladder).",
  },

  formulas: {
    d6_roll: src(d),
    ability_modifier: src(abilityMod),
    gurps_3d6_resolution: src(resolve3d6),
    thrust_damage: src(gurpsThrust),
    swing_damage: src(gurpsSwing),
    skill_level: src(gurpsSkillLevel),
    skill_upgrade_cost: src(gurpsSkillUpgradeCost),
    attribute_cost: src(gurpsAttributeCost),
  },

  rules_text: [gurpsRulesContext(), gurpsFantasyRulesContext(), gurpsCyberRulesContext()].join("\n\n"),

  data: {
    skills: GURPS_SKILLS,
    extension_skills: GURPS_EXTENSION_SKILLS,
    armors: GURPS_ARMORS,
    advantages: GURPS_ADVANTAGES,
    disadvantages: GURPS_DISADVANTAGES,
    attribute_upgrade_cost: GURPS_ATTRIBUTE_UPGRADE_COST,
    wealth_tiers: GURPS_WEALTH_TIERS,
    jobs: GURPS_JOBS,
    businesses: GURPS_BUSINESSES,
    relationship_stages: GURPS_RELATIONSHIP_STAGES,
    cyberware: GURPS_CYBERWARE,
    hack_targets: GURPS_HACK_TARGETS,
    holdings: GURPS_HOLDINGS,
    universities: GURPS_UNIVERSITIES,
    degrees: GURPS_DEGREES,
    social_circles: GURPS_SOCIAL_CIRCLES,
    social_events: GURPS_SOCIAL_EVENTS,
    noble_titles: GURPS_NOBLE_TITLES,
    court_positions: GURPS_COURT_POSITIONS,
    netdecks: GURPS_NETDECKS,
    programs: GURPS_PROGRAMS,
    corp_ladder: GURPS_CORP_LADDER,
    standard_income: GURPS_STANDARD_INCOME,
    cyber_gear: GURPS_CYBER_GEAR,
    ice: GURPS_ICE,
    netruns: GURPS_NETRUNS,
    magic_colleges: GURPS_MAGIC_COLLEGES,
    spells: GURPS_SPELLS,
    reagents: GURPS_REAGENTS,
    alchemy_recipes: GURPS_ALCHEMY_RECIPES,
    forge_recipes: GURPS_FORGE_RECIPES,
    terrains: GURPS_TERRAINS,
    weather: GURPS_WEATHER,
    shop_quality_labels: GURPS_QUALITY_LABELS,
    shop_weapons: GURPS_SHOP_WEAPONS,
    shop_armors: GURPS_SHOP_ARMORS,
    shop_gear: GURPS_SHOP_GEAR,
    conditions: CONDITIONS,
    encounter_difficulties: ENCOUNTER_DIFFICULTIES,
    enemies: ENEMY_TABLES.gurps,
  },
};

// ---------------------------------------------------------------------------
// Write everything
// ---------------------------------------------------------------------------

console.log("Building master rules JSON → rules/");
writeMaster("dnd5e.json", dnd5e);
writeMaster("pf2e.json", pf2e);
writeMaster("gurps.json", gurps);
console.log("Done.");
