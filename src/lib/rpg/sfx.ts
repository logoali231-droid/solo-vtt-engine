/**
 * Procedural dice-roll sound effects via the Web Audio API.
 *
 * Everything is synthesized at runtime — no audio assets, no network — so the
 * sounds work offline in the PWA. The roll is staged like a real toss:
 *
 *   1. a rattle phase (filtered-noise bursts, one per die),
 *   2. settling clacks (short triangle "tick"s as the dice land),
 *   3. an outcome flavor: bright chime on a success/critical success, a dull
 *      thud on a failure/critical failure.
 *
 * Mute preference is persisted in localStorage so it survives reloads.
 */
import type { DiceResult } from "@/lib/rpg/types";

const SFX_KEY = "oraculum.sfx.muted";

let ctx: AudioContext | null = null;
let mutedCache: boolean | null = null;

export function isSfxMuted(): boolean {
  if (mutedCache === null) {
    try {
      mutedCache = typeof localStorage !== "undefined" && localStorage.getItem(SFX_KEY) === "1";
    } catch {
      mutedCache = false;
    }
  }
  return mutedCache;
}

export function setSfxMuted(m: boolean): void {
  mutedCache = m;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(SFX_KEY, m ? "1" : "0");
  } catch {
    /* storage unavailable — in-memory only */
  }
}

/** Toggle and return the new state (so callers can mirror it in UI state). */
export function toggleSfxMuted(): boolean {
  const next = !isSfxMuted();
  setSfxMuted(next);
  return next;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    // Some browsers keep the context suspended until the user has gestured
    // once. Unlock on the first pointer/key interaction anywhere in the app.
    const unlock = () => {
      if (ctx && ctx.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function makeNoise(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Short filtered-noise rattle burst — a die bouncing around the tray. */
function rattle(c: AudioContext, when: number, duration: number, gain: number, dest: AudioNode): void {
  const src = c.createBufferSource();
  src.buffer = makeNoise(c, duration);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800 + Math.random() * 1600;
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(when);
  src.stop(when + duration + 0.02);
}

/** Short percussive "clack" — sharp attack, fast decay (a die settling). */
function clack(c: AudioContext, when: number, freq: number, gain: number, dest: AudioNode): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + 0.1);
}

/** Soft bell-like chime for a successful outcome. */
function chime(c: AudioContext, when: number, base: number, gain: number, dest: AudioNode): void {
  const partials: Array<[number, number]> = [
    [base, 1],
    [base * 1.5, 0.55],
  ];
  for (const [freq, amp] of partials) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain * amp, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + 0.55);
  }
}

/** Low, dull "thud" for a failed outcome. */
function thud(c: AudioContext, when: number, gain: number, dest: AudioNode): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, when);
  osc.frequency.exponentialRampToValueAtTime(70, when + 0.15);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.25);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + 0.28);
}

export interface DiceSfxOptions {
  outcome: DiceResult["outcome"];
  /** Number of dice that were rolled — more dice, longer rattle. */
  count?: number;
}

/** Play the full dice-toss sound for a roll that just resolved. */
export function playDiceRoll({ outcome, count = 1 }: DiceSfxOptions): void {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;

  // Sound is decorative — an audio hiccup must never break game logic
  // (this is called from the dice-log critical path in GameBoard).
  try {
    void synthRoll(c, outcome, count);
  } catch {
    /* ignore */
  }
}

function synthRoll(c: AudioContext, outcome: DiceResult["outcome"], count: number): void {
  const t0 = c.currentTime + 0.02;
  const master = c.createGain();
  master.gain.value = 0.35;
  master.connect(c.destination);

  const dice = Math.max(1, Math.min(6, count));

  // Rattle phase — one noise burst per die, plus an extra for dramatic rolls.
  const rattleCount = dice + (outcome.includes("critical") ? 2 : 1);
  for (let i = 0; i < rattleCount; i++) {
    rattle(c, t0 + i * 0.07, 0.09 + Math.random() * 0.06, 0.12, master);
  }

  // Settling clacks — the dice land one after another.
  const settleAt = t0 + 0.05 + rattleCount * 0.07;
  for (let i = 0; i < dice; i++) {
    clack(c, settleAt + i * 0.045, 2200 + Math.random() * 1200, 0.16, master);
  }

  // Outcome flavor layered on the last clack.
  const flavorAt = settleAt + (dice - 1) * 0.045 + 0.06;
  if (outcome === "critical-success") {
    chime(c, flavorAt, 660, 0.12, master);
    chime(c, flavorAt + 0.09, 880, 0.1, master);
  } else if (outcome === "success") {
    chime(c, flavorAt, 523.25, 0.09, master);
  } else if (outcome === "critical-failure") {
    thud(c, flavorAt, 0.16, master);
    thud(c, flavorAt + 0.12, 0.12, master);
  } else {
    thud(c, flavorAt, 0.11, master);
  }
}
