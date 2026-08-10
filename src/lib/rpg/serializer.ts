// ============================================================================
// Oraculum — API architecture layer.
// Serializes the complete character sheet (incl. Tasha's subclass data and
// modifiers) plus computed dice logs into a strict JSON payload for the LLM
// completion endpoint.
// ============================================================================

import type {
  AdventurePrefs,
  AdventureState,
  DnDCharacter,
  GameSystem,
  GurpsCharacter,
  Pf2eCharacter,
} from "./types";
import { identityOf, prefsOf } from "./types";
import { PF2E_FEAT_MAP } from "./data/pf2e";
import {
  getDndDerived,
  getGurpsDerived,
  getPf2eDerived,
} from "./character";
import { CONDITIONS } from "./data/conditions";
import {
  BACKGROUND_MAP,
  CLASS_MAP,
  FEAT_MAP,
  raceTotalAsi,
  RACE_MAP,
  subraceOf,
} from "./data/dnd";
import { GURPS_ADVANTAGE_MAP } from "./data/gurps";

export interface SerializedCondition {
  id: string;
  name: string;
  active: boolean;
}

export interface LLMPayload {
  schemaVersion: 1;
  meta: {
    app: "oraculum";
    system: GameSystem;
    gmMode: "local" | "live";
    generatedAt: number;
  };
  character: Record<string, unknown>;
  adventure: {
    sceneTitle: string;
    location: string;
    quest: string[];
    enemies: { name: string; hp: number; maxHp: number; ac: number }[];
    companions: {
      id: string;
      name: string;
      role: string;
      level: number;
      hp: number;
      maxHp: number;
      ac: number;
      attackBonus: number;
      damage: string;
    }[];
    conditions: SerializedCondition[];
    hp: { current: number; max: number };
    xp: number;
    gold: number;
    wallet: { gp: number; sp: number; cp: number };
    inventory: { name: string; qty: number }[];
    memory: string | null;
    prefs: AdventurePrefs;
  };
  diceLog: Record<string, unknown>[];
}

function serializeDnd5e(c: DnDCharacter): Record<string, unknown> {
  const d = getDndDerived(c);
  const race = RACE_MAP[c.raceId];
  const klass = CLASS_MAP[c.classId];
  const subclass = klass.subclasses.find((s) => s.id === c.subclassId);
  const background = BACKGROUND_MAP[c.backgroundId];
  return {
    system: "dnd5e",
    name: c.name,
    identity: identityOf(c.identity),
    level: c.level,
    race: {
      id: race.id,
      name: race.name,
      size: race.size,
      speed: subraceOf(c.raceId, c.subraceId)?.speed ?? race.speed,
      traits: race.traits,
      subrace: subraceOf(c.raceId, c.subraceId)
        ? {
            id: subraceOf(c.raceId, c.subraceId)!.id,
            name: subraceOf(c.raceId, c.subraceId)!.name,
            traits: subraceOf(c.raceId, c.subraceId)!.traits,
            variantHuman: subraceOf(c.raceId, c.subraceId)!.variantHuman ?? false,
          }
        : null,
      tashasCustomOrigin: c.customOrigin,
      assignedAbilityIncreases: c.customOrigin
        ? { [c.originFirst]: +2, [c.originSecond]: +1 }
        : c.subraceId === "human-variant"
          ? { [c.originFirst]: +1, [c.originSecond]: +1 }
          : raceTotalAsi(c.raceId, c.subraceId),
    },
    class: {
      id: klass.id,
      name: klass.name,
      hitDie: klass.hitDie,
      primaryAbility: klass.primaryAbility,
    },
    subclass: {
      id: subclass?.id,
      name: subclass?.name,
      source: subclass?.source,
      features: subclass?.features.map((f) => ({ name: f.name, level: f.level, summary: f.summary })) ?? [],
    },
    background: { id: background.id, name: background.name, feature: background.feature },
    feats: c.feats.map((f) => {
      const def = FEAT_MAP[f];
      return {
        id: f,
        name: def?.name ?? f,
        source: def?.source ?? "PHB",
        summary: def?.summary ?? "",
        effects: def?.effects ?? null,
      };
    }),
    expertiseSkills: c.expertiseSkills.map((id) => ({ id, name: d.skills.find((s) => s.id === id)?.name ?? id })),
    abilityScores: d.scores,
    modifiers: d.mods,
    proficiencyBonus: d.profBonus,
    hpMax: d.hpMax,
    armorClass: d.ac,
    initiative: d.initiative,
    speed: d.speed,
    darkvision: d.darkvision,
    savingThrows: d.savingThrows.map((s) => ({
      ability: s.ability,
      proficient: s.proficient,
      total: s.total,
    })),
    skills: d.skills.map((s) => ({
      id: s.id,
      name: s.name,
      ability: s.ability,
      proficient: s.proficient,
      expert: s.expert,
      total: s.total,
    })),
    spellSlots: d.spellSlots,
    pactSlots: d.pact ? { count: d.pact.count, slotLevel: d.pact.slotLevel } : null,
    spellSlotsUsed: c.state.spellSlotsUsed,
    pactSlotsUsed: c.state.pactUsed,
    infusions: d.infusions,
    infusionsUsed: c.state.infusionsUsed,
    spellAbility: d.spellAbility,
    attacks: d.attacks,
    features: d.features.map((f) => ({ name: f.name, level: f.level, summary: f.summary, rest: f.rest ?? null })),
    resources: Object.entries(c.state.resourceUses).map(([id, used]) => ({
      id,
      used,
      remaining: (klass.resources.find((r) => r.id === id)?.max(c) ?? 0) - used,
    })),
    activeStatuses: c.state.activeStatus,
    pendingBonuses: c.state.pending,
    equipment: {
      weapon: c.weaponId,
      armor: c.armorId,
      shield: c.shield,
    },
  };
}

function serializePf2e(c: Pf2eCharacter): Record<string, unknown> {
  const d = getPf2eDerived(c);
  return {
    system: "pf2e",
    name: c.name,
    identity: identityOf(c.identity),
    level: c.level,
    ancestryId: c.ancestryId,
    ancestryName: d.ancestryName,
    heritageId: c.heritageId ?? null,
    heritageName: d.heritageName || null,
    classId: c.classId,
    className: d.className,
    backgroundId: c.backgroundId,
    scores: c.scores,
    mods: d.mods,
    hpMax: d.hpMax,
    armorClass: d.ac,
    classDC: d.classDC,
    perception: d.perception,
    skillRanks: c.skillRanks,
    saveRanks: c.saveRanks,
    perceptionRank: c.perceptionRank,
    armorId: c.armorId,
    feats: (c.feats ?? []).map((id) => PF2E_FEAT_MAP[id]?.name ?? id),
    actionsRemaining: c.state.actions,
  };
}

function serializeGurps(c: GurpsCharacter): Record<string, unknown> {
  const d = getGurpsDerived(c);
  return {
    system: "gurps",
    name: c.name,
    identity: identityOf(c.identity),
    attributes: c.attributes,
    advantages: d.advantages.map((a) => ({
      id: a.id,
      name: a.name,
      points: a.points,
      summary: GURPS_ADVANTAGE_MAP[a.id]?.summary ?? a.summary,
    })),
    disadvantages: d.disadvantages.map((a) => ({
      id: a.id,
      name: a.name,
      points: a.points,
      summary: a.summary,
    })),
    skills: d.skills.map((s) => ({ id: s.id, name: s.name, level: s.level, points: s.points })),
    points: { ...c.points, disadvantages: d.disadvPoints, total: d.pointTotal },
    hpMax: d.hpMax,
    fpMax: d.fpMax,
    basicSpeed: d.basicSpeed,
    move: d.move,
    dodge: d.dodge,
    damageResistance: d.dr,
    armorId: c.armorId,
  };
}

export function serializeCharacter(
  system: GameSystem,
  character: AdventureState["character"],
): Record<string, unknown> {
  switch (system) {
    case "dnd5e":
      return serializeDnd5e(character as DnDCharacter);
    case "pf2e":
      return serializePf2e(character as Pf2eCharacter);
    case "gurps":
      return serializeGurps(character as GurpsCharacter);
  }
}

export function serializeAdventure(adventure: AdventureState): LLMPayload {
  const c = adventure.character;
  const hp =
    c.system === "dnd5e"
      ? { current: getDndDerived(c).hpMax - c.state.hpDamage, max: getDndDerived(c).hpMax }
      : c.system === "pf2e"
        ? { current: getPf2eDerived(c).hpMax - c.state.hpDamage, max: getPf2eDerived(c).hpMax }
        : { current: getGurpsDerived(c).hpMax - c.state.hpDamage, max: getGurpsDerived(c).hpMax };

  return {
    schemaVersion: 1,
    meta: {
      app: "oraculum",
      system: adventure.system,
      gmMode: adventure.gmMode,
      generatedAt: Date.now(),
    },
    character: serializeCharacter(adventure.system, c),
    adventure: {
      sceneTitle: adventure.sceneTitle,
      location: adventure.location,
      quest: adventure.quest,
      enemies: adventure.enemies.map((e) => ({
        name: e.name,
        hp: Math.max(0, e.hp),
        maxHp: e.maxHp,
        ac: e.ac,
      })),
      companions: (adventure.companions ?? []).map((cp) => ({
        id: cp.id,
        name: cp.name,
        role: cp.role,
        level: cp.level,
        hp: Math.max(0, cp.hp),
        maxHp: cp.maxHp,
        ac: cp.ac,
        attackBonus: cp.attackBonus,
        damage: cp.damage,
      })),
      conditions: CONDITIONS.map((cd) => ({
        id: cd.id,
        name: cd.name,
        active: c.state.conditions.includes(cd.id),
      })),
      hp,
      xp: adventure.xp ?? 0,
      gold: adventure.gold ?? 0,
      wallet: adventure.wallet ?? { gp: 0, sp: 0, cp: 0 },
      inventory: (adventure.inventory ?? []).map((i) => ({ name: i.name, qty: i.qty })),
      memory: adventure.memory ?? null,
      prefs: prefsOf(c.adventurePrefs),
    },
    diceLog: adventure.diceLog.slice(-14).map((d) => ({
      label: d.label,
      kind: d.kind,
      rolls: d.rolls,
      diceNotation: d.diceNotation,
      modifiers: d.modifiers,
      total: d.total,
      target: d.target ?? null,
      outcome: d.outcome,
      margin: d.margin ?? null,
      advantage: d.advantage ?? false,
      disadvantage: d.disadvantage ?? false,
      breakdown: d.breakdown,
    })),
  };
}

export function payloadToJson(payload: LLMPayload): string {
  return JSON.stringify(payload, null, 2);
}
