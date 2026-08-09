import { useCallback, useEffect, useState } from "react";
import type { DiceResult } from "./types";

/**
 * Accessibility settings + read-aloud screen reader for low-vision players.
 *
 * High-contrast mode is applied by toggling `oraculum-hc` on <html>; the CSS
 * lives in index.css. "auto" follows the OS "increase contrast" preference.
 * The reader uses the Web Speech API (speechSynthesis) — zero installs, works
 * offline, and announces GM replies + dice results as they land.
 */

export type HcMode = "auto" | "on" | "off";

export interface A11ySettings {
  /** High-contrast mode: auto (follow OS), on, or off. */
  hc: HcMode;
  /** Read game text aloud (GM replies + dice results). */
  reader: boolean;
  /** Speech rate 0.5–2 (1 = normal). */
  rate: number;
  /** Speech pitch 0.5–2 (1 = normal). */
  pitch: number;
  /** Preferred voiceURI, or null for auto-pick by language. */
  voiceURI: string | null;
  /** UI text scale: "normal" | "115" | "130" (percent). */
  large: "normal" | "115" | "130";
}

const KEY = "oraculum.a11y";
const DEFAULTS: A11ySettings = { hc: "auto", reader: false, rate: 1, pitch: 1, voiceURI: null, large: "normal" };

export function loadA11y(): A11ySettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<A11ySettings>;
    return {
      hc: p.hc === "on" || p.hc === "off" || p.hc === "auto" ? p.hc : DEFAULTS.hc,
      reader: typeof p.reader === "boolean" ? p.reader : DEFAULTS.reader,
      rate: typeof p.rate === "number" ? Math.min(2, Math.max(0.5, p.rate)) : DEFAULTS.rate,
      pitch: typeof p.pitch === "number" ? Math.min(2, Math.max(0.5, p.pitch)) : DEFAULTS.pitch,
      voiceURI: typeof p.voiceURI === "string" && p.voiceURI ? p.voiceURI : null,
      large: p.large === "115" || p.large === "130" ? p.large : "normal",
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveA11y(s: A11ySettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode) — settings just won't persist
  }
}

// ---------------------------------------------------------------------------
// Pub-sub so the TopBar dialog and GameBoard stay in sync
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeA11y(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyA11y(): void {
  listeners.forEach((fn) => fn());
}

// ---------------------------------------------------------------------------
// High-contrast mode
// ---------------------------------------------------------------------------
function prefersContrastMore(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

/** Re-reads settings and toggles the `oraculum-hc` + `oraculum-large-*` classes. */
export function applyA11y(): void {
  const root = typeof document !== "undefined" ? document.documentElement : null;
  if (!root) return;
  const s = loadA11y();
  const on = s.hc === "on" || (s.hc === "auto" && prefersContrastMore());
  root.classList.toggle("oraculum-hc", on);
  root.classList.toggle("oraculum-large-115", s.large === "115");
  root.classList.toggle("oraculum-large-130", s.large === "130");
}

// ---------------------------------------------------------------------------
// Read-aloud engine (Web Speech API)
// ---------------------------------------------------------------------------
let voicesCache: SpeechSynthesisVoice[] = [];

export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) voicesCache = v;
  return voicesCache;
}

/** Subscribes to the async `voiceschanged` event; fires immediately with cache. */
export function subscribeVoices(fn: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  const onChanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
    fn();
  };
  window.speechSynthesis.addEventListener?.("voiceschanged", onChanged);
  onChanged();
  return () => {
    window.speechSynthesis.removeEventListener?.("voiceschanged", onChanged);
  };
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const all = getVoices();
  const s = loadA11y();
  if (s.voiceURI) {
    const preferred = all.find((v) => v.voiceURI === s.voiceURI);
    if (preferred) return preferred;
  }
  const prefix = lang.slice(0, 2).toLowerCase();
  return (
    all.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    all.find((v) => v.default)
  );
}

/**
 * Speaks text aloud if the reader is enabled. Cancels any in-flight utterance
 * first so dice results never queue behind old GM replies. Returns whether
 * speech actually started.
 */
export function speak(text: string, lang = "en-US"): boolean {
  const s = loadA11y();
  if (!s.reader || !text.trim()) return false;
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = s.rate;
  u.pitch = s.pitch;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

const OUTCOME_LABELS: Record<string, string> = {
  success: "Success",
  failure: "Failure",
  critical: "Critical success",
  fumble: "Critical failure",
  "crit-success": "Critical success",
  "crit-failure": "Critical failure",
  neutral: "",
};

/** Reads a dice result aloud with a short spoken summary. */
export function speakDice(dice: DiceResult, lang = "en-US"): boolean {
  const parts = [
    dice.label,
    `Total ${dice.total}.`,
    dice.breakdown ? `${dice.breakdown}.` : "",
    OUTCOME_LABELS[dice.outcome] ??
      (dice.outcome ? String(dice.outcome).replace(/-/g, " ") + "." : ""),
  ];
  return speak(parts.filter(Boolean).join(" "), lang);
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------
/** Reactive a11y settings + updater that persists and broadcasts. */
export function useA11ySettings(): readonly [A11ySettings, (s: A11ySettings) => void] {
  const [settings, setSettings] = useState<A11ySettings>(() => loadA11y());

  useEffect(() => subscribeA11y(() => setSettings(loadA11y())), []);

  const update = useCallback((next: A11ySettings) => {
    saveA11y(next);
    applyA11y();
    notifyA11y();
  }, []);

  return [settings, update] as const;
}

/**
 * Applies high-contrast mode on mount and keeps it in sync: manual changes,
 * other tabs, and live OS "prefers-contrast" changes while in auto mode.
 */
export function useA11yApplied(): void {
  useEffect(() => {
    applyA11y();
    const off = subscribeA11y(applyA11y);
    const mq =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-contrast: more)")
        : null;
    const onMq = () => applyA11y();
    mq?.addEventListener?.("change", onMq);
    return () => {
      off();
      mq?.removeEventListener?.("change", onMq);
      stopSpeaking();
    };
  }, []);
}
