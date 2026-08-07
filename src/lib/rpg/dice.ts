// ============================================================================
// Oraculum — Internal dice engine.
// Every roll is resolved with strict Math.floor(Math.random()) algorithms.
// ============================================================================

import type {
  DiceResult,
  GameSystem,
  Outcome,
  PfRank,
  RollModifierLine,
} from "./types";
import { uid } from "./types";

/** Uniform die. The only randomness primitive in the entire engine. */
export function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => d(sides));
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** Parse "1d6+2" style notation into dice count, sides and flat modifier. */
export function parseDice(notation: string): { count: number; sides: number; flat: number } {
  const m = notation.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!m) return { count: 1, sides: 6, flat: 0 };
  return {
    count: m[1] ? parseInt(m[1], 10) : 1,
    sides: parseInt(m[2], 10),
    flat: m[3] ? parseInt(m[3], 10) : 0,
  };
}

/** GURPS thrust-damage table by Strength. */
export function gurpsThrust(st: number): { notation: string; flat: number } {
  const notation =
    st <= 9 ? "1d6-2" : st <= 11 ? "1d6-1" : st <= 13 ? "1d6" : st <= 15 ? "1d6+1" : st <= 17 ? "1d6+2" : "2d6-1";
  const flat =
    notation === "1d6-2"
      ? -2
      : notation === "1d6-1"
        ? -1
        : notation === "1d6+1"
          ? 1
          : notation === "1d6+2"
            ? 2
            : notation === "2d6-1"
              ? -1
              : 0;
  return { notation, flat };
}

// ---------------------------------------------------------------------------
// D&D 5e / PF2e d20 resolution
// ---------------------------------------------------------------------------

export interface D20CheckOptions {
  dc: number;
  abilityMod: number;
  bonus?: number; // proficiency or tier bonus
  advantage?: boolean;
  disadvantage?: boolean;
  extra?: RollModifierLine[];
  system: GameSystem; // "dnd5e" applies binary DC, "pf2e" applies degrees of success
  autoFail?: boolean; // e.g. stunned / blinded auto-fails
  natAdjust?: boolean; // pf2e: natural 1/20 shifts the degree
}

export interface ResolvedCheck {
  rolls: number[];
  kept: number;
  modifiers: RollModifierLine[];
  total: number;
  nat20: boolean;
  nat1: boolean;
  outcome: Outcome;
  breakdown: string;
}

/** d20 roll with advantage / disadvantage, plus modifier math. */
export function resolveD20Check(opts: D20CheckOptions): ResolvedCheck {
  const first = d(20);
  const second = opts.advantage || opts.disadvantage ? d(20) : first;
  const kept =
    opts.advantage && !opts.disadvantage
      ? Math.max(first, second)
      : opts.disadvantage && !opts.advantage
        ? Math.min(first, second)
        : first;

  const lines: RollModifierLine[] = [...(opts.extra ?? [])];
  if (opts.abilityMod !== 0) {
    lines.push({ label: "Ability", value: opts.abilityMod, source: "ability" });
  }
  if (opts.bonus && opts.bonus !== 0) {
    lines.push({ label: "Bonus", value: opts.bonus, source: "proficiency" });
  }
  const flat = lines.reduce((a, l) => a + l.value, 0);
  const total = kept + flat;
  const nat20 = kept === 20;
  const nat1 = kept === 1;

  let outcome: Outcome;
  if (opts.autoFail) {
    outcome = "critical-failure";
  } else if (opts.system === "pf2e") {
    const degrees = total - opts.dc;
    if (nat20) {
      outcome = degrees >= -9 ? "critical-success" : "success";
    } else if (nat1) {
      outcome = degrees <= 9 ? "critical-failure" : "failure";
    } else if (degrees >= 10) outcome = "critical-success";
    else if (degrees >= 0) outcome = "success";
    else if (degrees >= -10) outcome = "failure";
    else outcome = "critical-failure";
  } else {
    if (nat20) outcome = "critical-success";
    else if (nat1) outcome = "critical-failure";
    else outcome = total >= opts.dc ? "success" : "failure";
  }

  const rollText = opts.advantage || opts.disadvantage
    ? `d20(${first})${opts.disadvantage ? " ⇣" : " ⇡"} d20(${second}) → keep ${kept}`
    : `d20(${kept})`;
  const breakdown =
    `${rollText} + ${lines.map((l) => `${l.label} ${formatMod(l.value)}`).join(" + ") || "0"} ` +
    `= ${total} vs DC ${opts.dc} → ${outcome.replace("-", " ").toUpperCase()}`;

  return { rolls: [first, second], kept, modifiers: lines, total, nat20, nat1, outcome, breakdown };
}

// ---------------------------------------------------------------------------
// GURPS 3d6 resolution (roll under skill target)
// ---------------------------------------------------------------------------

export interface GurpsCheckResult {
  rolls: number[];
  total: number;
  target: number;
  margin: number; // positive = success margin, negative = failure margin
  outcome: Outcome;
  breakdown: string;
}

export function resolve3d6(target: number): GurpsCheckResult {
  const rolls = rollDice(3, 6);
  const total = sum(rolls);
  const isCritSuccess = total === 3 || total === 4;
  const isCritFail = total >= 18;
  const success = total <= target && !isCritFail;
  const margin = total <= target ? target - total : target - total; // negative on failure

  let outcome: Outcome;
  if (isCritSuccess) outcome = "critical-success";
  else if (isCritFail) outcome = "critical-failure";
  else if (success) outcome = "success";
  else outcome = "failure";

  const breakdown = `3d6(${rolls.join("+")}) = ${total} vs target ${target} → ${outcome.replace("-", " ").toUpperCase()}`;
  return { rolls, total, target, margin, outcome, breakdown };
}

// ---------------------------------------------------------------------------
// PF2e proficiency tier bonus
// ---------------------------------------------------------------------------

export function pfTierBonus(rank: PfRank, level: number): number {
  switch (rank) {
    case "untrained":
      return 0;
    case "trained":
      return 2 + level;
    case "expert":
      return 4 + level;
    case "master":
      return 6 + level;
    case "legendary":
      return 8 + level;
  }
}

// ---------------------------------------------------------------------------
// Dice result assembly (shared by all systems)
// ---------------------------------------------------------------------------

export interface BuildResultOptions {
  system: GameSystem;
  label: string;
  kind: DiceResult["kind"];
  rolls: number[];
  diceNotation: string;
  modifiers?: RollModifierLine[];
  total: number;
  target?: number;
  outcome: Outcome;
  margin?: number;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: boolean;
  breakdown: string;
  featureUsed?: string;
}

export function buildDiceResult(opts: BuildResultOptions): DiceResult {
  return {
    id: uid(),
    timestamp: Date.now(),
    ...opts,
    modifiers: opts.modifiers ?? [],
  };
}

export function naturalFrom(check: ResolvedCheck): number {
  return check.kept;
}
