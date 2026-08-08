import type { ConditionDef, ConditionEffect } from "../types";

// Conditions whose effects dynamically feed the dice engine.
// - dnd5e: advantage / disadvantage semantics
// - pf2e:  status penalty (-2 for common adverse conditions)
// - gurps: flat penalty (-2)
export const CONDITIONS: ConditionDef[] = [
  {
    id: "blinded",
    name: "Blinded",
    summary: "Can't see. Attack rolls have disadvantage, attacks against you have advantage, and sight-based checks auto-fail.",
    effects: {
      attackDisadvantage: true,
      attacksAgainstAdvantage: true,
      autoFailSightChecks: true,
      pf2ePenalty: -2,
      gurpsPenalty: -3,
    },
  },
  {
    id: "poisoned",
    name: "Poisoned",
    summary: "Attack rolls and ability checks have disadvantage.",
    effects: {
      attackDisadvantage: true,
      abilityCheckDisadvantage: true,
      pf2ePenalty: -2,
      gurpsPenalty: -2,
    },
  },
  {
    id: "prone",
    name: "Prone",
    summary: "Attack rolls have disadvantage; melee attacks against you have advantage, ranged attacks have disadvantage.",
    effects: {
      attackDisadvantage: true,
      attacksAgainstAdvantage: true,
      pf2ePenalty: -2,
      gurpsPenalty: -2,
    },
  },
  {
    id: "restrained",
    name: "Restrained",
    summary: "Attack rolls and Dexterity saves have disadvantage; attacks against you have advantage; speed is 0.",
    effects: {
      attackDisadvantage: true,
      attacksAgainstAdvantage: true,
      dexSaveDisadvantage: true,
      speedZero: true,
      pf2ePenalty: -2,
      gurpsPenalty: -2,
    },
  },
  {
    id: "stunned",
    name: "Stunned",
    summary: "You can't act; auto-fail Strength/Dexterity saves and ability checks; attacks against you have advantage.",
    effects: {
      autoFailStrDexSaves: true,
      autoFailSightChecks: true,
      attacksAgainstAdvantage: true,
      abilityCheckDisadvantage: true,
      speedZero: true,
      pf2ePenalty: -3,
      gurpsPenalty: -3,
    },
  },
  {
    id: "frightened",
    name: "Frightened",
    summary: "While the source is visible, ability checks and attack rolls have disadvantage.",
    effects: {
      attackDisadvantage: true,
      abilityCheckDisadvantage: true,
      pf2ePenalty: -1,
      gurpsPenalty: -1,
    },
  },
  {
    id: "grappled",
    name: "Grappled",
    summary: "Your speed becomes 0, and attack rolls against anyone but the grappler have disadvantage.",
    effects: {
      speedZero: true,
      pf2ePenalty: -1,
      gurpsPenalty: -1,
    },
  },
  {
    id: "exhausted",
    name: "Exhausted",
    summary: "Each level: -2 penalty to all ability checks and attack rolls, speed halved.",
    effects: {
      abilityCheckDisadvantage: true,
      attackDisadvantage: true,
      pf2ePenalty: -2,
      gurpsPenalty: -2,
    },
  },
  {
    id: "dazed",
    name: "Dazed",
    summary: "You can take one action per turn. Check penalties apply.",
    effects: {
      abilityCheckDisadvantage: true,
      pf2ePenalty: -1,
      gurpsPenalty: -1,
    },
  },
  {
    id: "incapacitated",
    name: "Incapacitated",
    summary: "You can't take actions or reactions. Strength and Dexterity saves and checks auto-fail; attacks against you have advantage.",
    effects: {
      autoFailStrDexSaves: true,
      abilityCheckDisadvantage: true,
      attacksAgainstAdvantage: true,
      speedZero: true,
      pf2ePenalty: -3,
      gurpsPenalty: -3,
    },
  },
  {
    id: "deafened",
    name: "Deafened",
    summary: "You can't hear. Checks and saves that rely on hearing fail automatically, and perception suffers.",
    effects: {
      pf2ePenalty: -1,
      gurpsPenalty: -1,
    },
  },
  {
    id: "hidden",
    name: "Hidden",
    summary: "You're out of sight. Attack rolls you make have advantage (unseen attacker).",
    effects: {
      attackAdvantage: true,
      attacksAgainstDisadvantage: true,
    },
  },
  {
    id: "invisible",
    name: "Invisible",
    summary: "You can't be seen. Attack rolls you make have advantage, and attacks against you have disadvantage.",
    effects: {
      attackAdvantage: true,
      attacksAgainstDisadvantage: true,
    },
  },
];

export const CONDITION_MAP: Record<string, ConditionDef> = Object.fromEntries(
  CONDITIONS.map((c) => [c.id, c]),
);

export function getConditionEffect(id: string): ConditionEffect | undefined {
  return CONDITION_MAP[id]?.effects;
}
