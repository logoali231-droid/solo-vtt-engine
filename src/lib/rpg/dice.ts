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

/**
 * GURPS 4e thrust-damage table (Basic Set p.16).
 * Each +2 ST adds +1 damage; the number of dice grows by one every 8 ST
 * above 17 (2d at ST 18, 3d at ST 26, 4d at ST 34, ...).
 */
export function gurpsThrust(st: number): { notation: string; flat: number } {
  const s = Math.max(4, Math.min(50, st));
  let dice = 1;
  let flat = 0;
  if (s <= 9) {
    flat = s <= 7 ? -4 : s === 8 ? -3 : -2;
  } else if (s <= 11) {
    flat = s === 10 ? -2 : -1;
  } else if (s <= 17) {
    flat = Math.floor((s - 12) / 2);
  } else {
    dice = 2 + Math.floor((s - 18) / 8);
    flat = Math.floor(((s - 18) % 8) / 2) - 1;
  }
  const flatText = flat > 0 ? `+${flat}` : flat < 0 ? `${flat}` : "";
  return { notation: `${dice}d6${flatText}`, flat };
}

/**
 * GURPS swing-damage table (custom variant, same +2 ST / +1 dmg curve but
 * one die step ahead of thrust — a broadside from a sword hits harder than
 * a thrust). 1d at ST 10, 2d at ST 13, one extra die every 8 ST after 18.
 */
export function gurpsSwing(st: number): { notation: string; flat: number } {
  const s = Math.max(4, Math.min(50, st));
  let dice = 1;
  let flat = 0;
  if (s <= 9) {
    flat = s - 10; // ST 10 → 1d
  } else if (s <= 12) {
    flat = s - 10; // ST 11 → 1d+1, ST 12 → 1d+2
  } else if (s <= 17) {
    dice = 2;
    flat = Math.floor((s - 13) / 2) - 1; // ST 13 → 2d-1 … ST 17 → 2d+1
  } else {
    dice = 2 + Math.floor((s - 14) / 8);
    flat = Math.floor(((s - 14) % 8) / 2); // ST 18 → 3d, ST 22 → 3d+2
  }
  const flatText = flat > 0 ? `+${flat}` : flat < 0 ? `${flat}` : "";
  return { notation: `${dice}d6${flatText}`, flat };
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
    outcome = pf2eOutcome(total, opts.dc, kept);
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

  return {
    // Only report the second die when advantage/disadvantage actually rolled
    // two dice — a plain roll must render a single die face.
    rolls: opts.advantage || opts.disadvantage ? [first, second] : [first],
    kept,
    modifiers: lines,
    total,
    nat20,
    nat1,
    outcome,
    breakdown,
  };
}

/**
 * Pathfinder 2e degree-of-success evaluation matrix.
 *
 * The raw result (total vs DC) sets a base degree: +10 or more is a critical
 * success, +0..9 a success, -1..-10 a failure, worse a critical failure.
 * A natural 20 then shifts the degree one step UP; a natural 1 shifts it one
 * step DOWN (this is the official PF2e rule — never a raw auto-win/loss).
 */
export function pf2eOutcome(total: number, dc: number, kept: number): Outcome {
  const degrees = total - dc;
  let base: Outcome =
    degrees >= 10
      ? "critical-success"
      : degrees >= 0
        ? "success"
        : degrees >= -10
          ? "failure"
          : "critical-failure";
  if (kept === 20) {
    base = base === "critical-failure" ? "failure" : base === "failure" ? "success" : "critical-success";
  } else if (kept === 1) {
    base = base === "critical-success" ? "success" : base === "success" ? "failure" : "critical-failure";
  }
  return base;
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
  // GURPS 4e critical rules: 3-4 always crit, 5 crits at effective skill 15+;
  // 18 always crit-fails, 17 crit-fails at effective skill 15 or less.
  const isCritSuccess = total === 3 || total === 4 || (total === 5 && target >= 15);
  const isCritFail = total >= 18 || (total === 17 && target <= 15);
  const success = total <= target && !isCritFail;
  const margin = target - total; // positive on success, negative on failure

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
  advSources?: string[];
  disSources?: string[];
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
