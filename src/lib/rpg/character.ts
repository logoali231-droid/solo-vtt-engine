// ============================================================================
// Oraculum — character derived-stat builder for all three systems.
// ============================================================================

import type {
  AbilityId,
  AttackDef,
  ConditionEffect,
  DnDCharacter,
  FeatureDef,
  GameSystem,
  GurpsCharacter,
  Pf2eCharacter,
  PfRank,
  RollModifierLine,
} from "./types";
import { ABILITIES } from "./types";
import { abilityMod, pfTierBonus } from "./dice";
import { GURPS_CYBERWARE_MAP } from "./data/gurps-extensions";
import {
  ARMOR_MAP,
  attackAbilityFor,
  BACKGROUND_MAP,
  CLASS_MAP,
  DND_SKILLS,
  FEAT_MAP,
  profBonusForLevel,
  raceTotalAsi,
  RACE_MAP,
  spellSlotsFor,
  subraceOf,
  WEAPON_MAP,
} from "./data/dnd";
import {
  GURPS_ADVANTAGE_MAP,
  GURPS_ARMOR_MAP,
  GURPS_DISADVANTAGE_MAP,
  GURPS_SKILL_MAP,
  gurpsSkillLevel,
} from "./data/gurps";
import { gurpsSwing, gurpsThrust } from "./dice";
import {
  PF2E_ANCESTRY_MAP,
  PF2E_ARMOR_MAP,
  PF2E_BACKGROUND_MAP,
  PF2E_CLASS_MAP,
  PF2E_HERITAGE_MAP,
} from "./data/pf2e";

// ---------------------------------------------------------------------------
// D&D 5e
// ---------------------------------------------------------------------------

export interface DndDerived {
  raceName: string;
  className: string;
  subclassName: string;
  backgroundName: string;
  scores: DnDCharacter["baseScores"];
  mods: Record<AbilityId, number>;
  profBonus: number;
  hpMax: number;
  ac: number;
  initiative: number;
  speed: number;
  darkvision: boolean;
  spellSlots: number[];
  pact: { count: number; slotLevel: number } | null;
  infusions: number;
  spellAbility: AbilityId | null;
  savingThrows: {
    ability: AbilityId;
    label: string;
    proficient: boolean;
    total: number;
  }[];
  skills: {
    id: string;
    name: string;
    ability: AbilityId;
    proficient: boolean;
    expert: boolean;
    total: number;
  }[];
  attacks: AttackDef[];
  features: FeatureDef[];
  feats: { id: string; name: string; source: string; summary: string }[];
  expertiseSkills: string[];
}

export function finalScores(c: DnDCharacter): Record<AbilityId, number> {
  const scores = { ...c.baseScores };
  if (c.customOrigin) {
    scores[c.originFirst] += 2;
    scores[c.originSecond] += 1;
  } else if (c.subraceId === "human-variant") {
    // Variant human replaces the +1-all with two chosen +1s.
    scores[c.originFirst] += 1;
    scores[c.originSecond] += 1;
  } else {
    const asi = raceTotalAsi(c.raceId, c.subraceId);
    for (const a of ABILITIES) {
      scores[a] += asi[a] ?? 0;
    }
  }
  // Feat / Talent ability score increases (ASI feats from PHB + TCoE)
  for (const featId of c.feats) {
    const asi = FEAT_MAP[featId]?.effects?.asi;
    if (asi) {
      for (const a of ABILITIES) scores[a] += asi[a] ?? 0;
    }
  }
  return scores;
}

/** Ability-score increases contributed by the chosen feats. */
export function featAsiBonuses(c: DnDCharacter): Partial<Record<AbilityId, number>> {
  const out: Partial<Record<AbilityId, number>> = {};
  for (const featId of c.feats) {
    const asi = FEAT_MAP[featId]?.effects?.asi;
    if (!asi) continue;
    for (const a of ABILITIES) {
      if (asi[a]) out[a] = (out[a] ?? 0) + (asi[a] ?? 0);
    }
  }
  return out;
}

export function getDndDerived(c: DnDCharacter): DndDerived {
  const race = RACE_MAP[c.raceId];
  const klass = CLASS_MAP[c.classId];
  const subclass = klass.subclasses.find((s) => s.id === c.subclassId);
  const background = BACKGROUND_MAP[c.backgroundId];
  const scores = finalScores(c);
  const mods = Object.fromEntries(
    ABILITIES.map((a) => [a, abilityMod(scores[a])]),
  ) as Record<AbilityId, number>;
  const profBonus = profBonusForLevel(c.level);

  const featEffects = c.feats.map((f) => FEAT_MAP[f]).filter((f): f is NonNullable<typeof f> => !!f);

  // HP: max hit die at level 1, average growth after + Tough etc.
  const avg = Math.floor(klass.hitDie / 2) + 1;
  const hpMax =
    klass.hitDie +
    mods.con +
    Math.max(0, c.level - 1) * (avg + mods.con) +
    featEffects.reduce((a, f) => a + (f.effects?.hpPerLevel ?? 0) * c.level, 0);

  const armor = ARMOR_MAP[c.armorId];
  let ac: number;
  if (c.armorId === "none") {
    ac = 10 + mods.dex;
    // Barbarian unarmored defense
    if (klass.id === "barbarian") ac = 10 + mods.dex + mods.con;
    if (klass.id === "monk") ac = 10 + mods.dex + mods.wis;
  } else if (armor.acKind === "light") {
    ac = armor.baseAc + mods.dex;
  } else if (armor.acKind === "medium") {
    ac = armor.baseAc + Math.min(mods.dex, armor.dexCap ?? 2);
  } else {
    ac = armor.baseAc;
  }
  // Draconic resilience
  if (klass.id === "sorcerer" && c.subclassId === "draconic" && c.armorId === "none") {
    ac = 13 + mods.dex;
  }
  // Bladesong active
  if (c.state.activeStatus.includes("bladesong")) {
    ac += Math.max(1, mods.int);
  }
  if (c.shield) ac += 2 + (c.magicShieldBonus ?? 0);
  // Magic armor bought from the shop — +N to AC while worn.
  ac += c.magicArmorBonus ?? 0;

  const initiative =
    mods.dex + featEffects.reduce((a, f) => a + (f.effects?.initiative ?? 0), 0);
  const speed =
    (subraceOf(c.raceId, c.subraceId)?.speed ?? race.speed) +
    featEffects.reduce((a, f) => a + (f.effects?.speed ?? 0), 0);

  const { slots, pact } = spellSlotsFor(klass, c.level);
  const infusions =
    klass.id === "artificer"
      ? c.level >= 20 ? 6 : c.level >= 18 ? 6 : c.level >= 14 ? 5 : c.level >= 10 ? 4 : c.level >= 6 ? 3 : 2
      : 0;

  const saveProfs = new Set<AbilityId>([
    ...klass.saves,
    ...featEffects.flatMap((f) => (f.effects?.saveProf ? [f.effects.saveProf] : [])),
  ]);
  const savingThrows = ABILITIES.map((ability) => {
    const proficient = saveProfs.has(ability);
    return {
      ability,
      label: ABILITIES.find((a) => a === ability) ?? ability,
      proficient,
      total: mods[ability] + (proficient ? profBonus : 0),
    };
  });

  const profSkills = new Set([
    ...c.chosenSkills,
    ...background.skills,
    ...featEffects.flatMap((f) => f.effects?.skillProfs ?? []),
  ]);
  const expertiseSet = new Set([
    ...c.expertiseSkills,
    ...featEffects.flatMap((f) => f.effects?.expertise ?? []),
  ]);
  const skills = DND_SKILLS.map((s) => {
    const proficient = profSkills.has(s.id);
    const expert = proficient && expertiseSet.has(s.id);
    return {
      id: s.id,
      name: s.name,
      ability: s.ability,
      proficient,
      expert,
      total: mods[s.ability] + (proficient ? profBonus * (expert ? 2 : 1) : 0),
    };
  });

  const weapon = WEAPON_MAP[c.weaponId];
  const ability = attackAbilityFor(c, weapon);
  const attacks: AttackDef[] = [
    {
      id: weapon.id,
      name: weapon.name,
      weaponId: weapon.id,
      count: weapon.count,
      sides: weapon.sides,
      ability,
      range: weapon.range,
      properties: weapon.properties,
      // Magic-weapon enchantment bought from the shop — +N to hit & damage.
      enchant: c.magicWeaponBonus ?? 0,
    },
  ];

  // Extra Attack
  if (
    c.level >= 5 &&
    ["fighter", "barbarian", "paladin", "ranger", "monk"].includes(klass.id)
  ) {
    attacks[0] = { ...attacks[0], count: 2 };
  }
  if (klass.id === "rogue") {
    const sneak = Math.ceil(c.level / 2);
    if (sneak > 1) {
      attacks.push({
        id: "sneak-attack",
        name: "Sneak Attack (bonus)",
        weaponId: weapon.id,
        count: sneak,
        sides: 6,
        ability,
        properties: ["Once per turn"],
      });
    }
  }

  const sub = subraceOf(c.raceId, c.subraceId);
  const features = [
    ...(sub?.traits ?? []).map((t) => ({
      id: `subrace-${t.name}`,
      name: t.name,
      level: 1,
      summary: t.summary,
    })),
    ...klass.features.filter((f) => f.level <= c.level),
    ...(subclass?.features.filter((f) => f.level <= c.level) ?? []),
  ];

  return {
    raceName: race.name,
    className: klass.name,
    subclassName: subclass?.name ?? "—",
    backgroundName: background.name,
    scores,
    mods,
    profBonus,
    hpMax,
    ac,
    initiative,
    speed,
    darkvision:
      race.traits.some((t) => t.mechanic === "darkvision") ||
      (sub?.traits.some((t) => t.mechanic === "darkvision") ?? false),
    spellSlots: slots,
    pact,
    infusions,
    spellAbility: klass.spellAbility ?? null,
    savingThrows,
    skills,
    attacks,
    features,
    feats: c.feats.map((f) => {
      const def = FEAT_MAP[f];
      return {
        id: f,
        name: def?.name ?? f,
        source: def?.source ?? "PHB",
        summary: def?.summary ?? "",
      };
    }),
    expertiseSkills: c.expertiseSkills,
  };
}

// ---------------------------------------------------------------------------
// Pathfinder 2e
// ---------------------------------------------------------------------------

export interface Pf2eDerived {
  ancestryName: string;
  heritageName: string;
  className: string;
  backgroundName: string;
  mods: Record<AbilityId, number>;
  hpMax: number;
  ac: number;
  classDC: number;
  perception: number;
  tierLabel: (rank: string) => string;
}

export function getPf2eDerived(c: Pf2eCharacter): Pf2eDerived {
  const mods = Object.fromEntries(
    ABILITIES.map((a) => [a, abilityMod(c.scores[a])]),
  ) as Record<AbilityId, number>;
  const ancestry = PF2E_ANCESTRY_MAP[c.ancestryId];
  const klass = PF2E_CLASS_MAP[c.classId];
  const background = PF2E_BACKGROUND_MAP[c.backgroundId];
  const level = c.level;

  const hpMax = ancestry.hp + klass.hp + mods.con;
  const armor = PF2E_ARMOR_MAP[c.armorId];
  const armorRank: PfRank = c.saveRanks.str === "untrained" && c.armorId !== "none" ? "trained" : c.saveRanks.str; // reuse a rank slot heuristically
  const dexToAc = Math.min(mods.dex, armor.dexCap ?? 99);
  const ac = 10 + dexToAc + pfTierBonus(armorRank, level) + armor.acBonus;
  const perception = pfTierBonus(c.perceptionRank, level) + mods.wis;
  const classDC = 10 + pfTierBonus("trained", level) + mods[klass.keyAbility];

  return {
    ancestryName: ancestry.name,
    heritageName: c.heritageId ? PF2E_HERITAGE_MAP[c.heritageId]?.name ?? c.heritageId : "",
    className: klass.name,
    backgroundName: background.name,
    mods,
    hpMax,
    ac,
    classDC,
    perception,
    tierLabel: (rank) => rankLabel(rank),
  };
}

function rankLabel(rank: string): string {
  switch (rank) {
    case "trained": return "Trained";
    case "expert": return "Expert";
    case "master": return "Master";
    case "legendary": return "Legendary";
    default: return "Untrained";
  }
}

// ---------------------------------------------------------------------------
// GURPS
// ---------------------------------------------------------------------------

export interface GurpsDerived {
  hpMax: number;
  fpMax: number;
  basicSpeed: number;
  move: number;
  dodge: number;
  dr: number;
  skills: { id: string; name: string; stat: number; level: number; points: number }[];
  advantages: GurpsAdvantageView[];
  disadvantages: GurpsAdvantageView[];
  advPoints: number;
  disadvPoints: number;
  pointTotal: number;
  /** ST-derived melee damage — thrust (dagger, spear) and swing (sword, axe). */
  thrust: { notation: string; flat: number };
  swing: { notation: string; flat: number };
}

export interface GurpsAdvantageView {
  id: string;
  name: string;
  points: number;
  summary: string;
}

export function getGurpsDerived(c: GurpsCharacter): GurpsDerived {
  const hpMax = c.attributes.st;
  const fpMax = c.attributes.ht;
  const basicSpeed = (c.attributes.dx + c.attributes.ht) / 4;
  const move = Math.max(1, Math.floor(basicSpeed));
  const advantages: GurpsAdvantageView[] = c.advantages.map((a) => {
    const def = GURPS_ADVANTAGE_MAP[a.id];
    return {
      id: a.id,
      name: def?.name ?? a.id,
      points: a.points,
      summary: def?.summary ?? "",
    };
  });
  const dodge =
    move + 3 + advantages.reduce((a, x) => a + (GURPS_ADVANTAGE_MAP[x.id]?.effects?.dodge ?? 0), 0);
  const cyberwareDr = (c.ext?.cyberware ?? []).reduce(
    (a, w) => a + (GURPS_CYBERWARE_MAP[w]?.dr ?? 0),
    0,
  );
  const dr =
    (GURPS_ARMOR_MAP[c.armorId]?.dr ?? 0) +
    advantages.reduce((a, x) => a + (GURPS_ADVANTAGE_MAP[x.id]?.effects?.dr ?? 0), 0) +
    cyberwareDr;
  const skills = c.skills.map((s) => {
    const def = GURPS_SKILL_MAP[s.id];
    const stat =
      def.stat === "st"
        ? c.attributes.st
        : def.stat === "dx"
          ? c.attributes.dx
          : def.stat === "ht"
            ? c.attributes.ht
            : c.attributes.iq;
    return {
      id: s.id,
      name: def?.name ?? s.id,
      stat,
      level: gurpsSkillLevel(stat, def?.difficulty ?? "average", s.points),
      points: s.points,
    };
  });
  const disadvantages: GurpsAdvantageView[] = (c.disadvantages ?? []).map((a) => {
    const def = GURPS_DISADVANTAGE_MAP[a.id];
    return {
      id: a.id,
      name: def?.name ?? a.id,
      points: a.points,
      summary: def?.summary ?? "",
    };
  });
  const advPoints = c.advantages.reduce((a, s) => a + s.points, 0);
  const disadvPoints = (c.disadvantages ?? []).reduce((a, s) => a + s.points, 0);
  const pointTotal =
    (c.attributes.st - 10) * 10 +
    (c.attributes.dx - 10) * 10 +
    (c.attributes.iq - 10) * 10 +
    (c.attributes.ht - 10) * 10 +
    advPoints +
    disadvPoints +
    c.skills.reduce((a, s) => a + s.points, 0);
  return {
    hpMax,
    fpMax,
    basicSpeed,
    move,
    dodge,
    dr,
    skills,
    pointTotal,
    advantages,
    disadvantages,
    advPoints,
    disadvPoints,
    thrust: gurpsThrust(c.attributes.st),
    swing: gurpsSwing(c.attributes.st),
  };
}

// ---------------------------------------------------------------------------
// Condition → roll modifiers (system-aware)
// ---------------------------------------------------------------------------

export interface RollContext {
  kind: "attack" | "save" | "check" | "sight";
  ability?: AbilityId;
}

export interface RollConditionResult {
  advantage: boolean;
  disadvantage: boolean;
  autoFail: boolean;
  flatPenalty: number;
  lines: RollModifierLine[];
  sources: string[];
}

export function applyConditions(
  system: GameSystem,
  conditionIds: string[],
  ctx: RollContext,
  effects: Record<string, ConditionEffect>,
): RollConditionResult {
  const res: RollConditionResult = {
    advantage: false,
    disadvantage: false,
    autoFail: false,
    flatPenalty: 0,
    lines: [],
    sources: [],
  };
  for (const id of conditionIds) {
    const e = effects[id];
    if (!e) continue;
    res.sources.push(id);
    if (system === "dnd5e") {
      if (ctx.kind === "attack" && e.attackDisadvantage) res.disadvantage = true;
      if (ctx.kind === "attack" && e.attackAdvantage) res.advantage = true;
      if (ctx.kind === "check" && e.abilityCheckDisadvantage) res.disadvantage = true;
      if (ctx.kind === "save") {
        if (e.saveDisadvantage) res.disadvantage = true;
        if (e.dexSaveDisadvantage && ctx.ability === "dex") res.disadvantage = true;
        if (e.autoFailStrDexSaves && (ctx.ability === "str" || ctx.ability === "dex")) res.autoFail = true;
      }
      if (ctx.kind === "sight" && e.autoFailSightChecks) res.autoFail = true;
      // Reckless / rage advantage handled elsewhere
      if (e.attacksAgainstAdvantage) {
        // Note: this affects incoming attacks, surfaced in the sheet UI.
      }
    } else if (system === "pf2e") {
      const p = e.pf2ePenalty ?? 0;
      if (p !== 0) {
        res.flatPenalty += p;
        res.lines.push({ label: id, value: p, source: "condition" });
      }
    } else {
      const p = e.gurpsPenalty ?? 0;
      if (p !== 0) {
        res.flatPenalty += p;
        res.lines.push({ label: id, value: p, source: "condition" });
      }
    }
  }
  return res;
}

export function abilityLabel(a: AbilityId): string {
  return a === "str" ? "Strength" : a === "dex" ? "Dexterity" : a === "con" ? "Constitution" : a === "int" ? "Intelligence" : a === "wis" ? "Wisdom" : "Charisma";
}
