import { cn } from "@/lib/utils";
import type { GameSystem } from "@/lib/rpg/types";
import type { RollRequest } from "../types";
import { Loader2, Puzzle, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CONDITION_MAP } from "@/lib/rpg/data/conditions";

export interface QuickAction {
  id: string;
  label: string;
  hint: string;
}

/** Foe states that the auto engine reads at attack time (D&D 5e). */
const ENEMY_STATES = ["prone", "restrained", "blinded", "stunned", "incapacitated", "invisible"];

interface Props {
  system: GameSystem;
  onSend: (text: string) => void;
  onQuickAction: (id: string) => void;
  onRoll: (r: RollRequest) => void;
  busy: boolean;
  /** Difficulty class — the only manual roll preference left. */
  rollPrefs: { dc: number };
  setRollPrefs: (p: { dc: number }) => void;
  pendingCount: number;
  /** Conditions on the current foe — drive automatic advantage/disadvantage. */
  enemyConditions?: string[];
  onEnemyConditionToggle?: (id: string) => void;
  /** Rules-governed puzzle — local DCs, AI narration. */
  onPuzzle?: () => void;
}

export default function CommandCenter({
  system,
  onSend,
  onQuickAction,
  busy,
  rollPrefs,
  setRollPrefs,
  pendingCount,
  enemyConditions,
  onEnemyConditionToggle,
  onPuzzle,
}: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Skip autofocus on touch-primary devices — popping the keyboard open on
    // load is jarring and covers the game board on mobile.
    const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? true;
    if (finePointer) inputRef.current?.focus();
  }, []);

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
  };

  const actions: QuickAction[] =
    system === "dnd5e"
      ? [
          { id: "attack", label: "Attack", hint: "Roll weapon attack vs enemy AC" },
          { id: "perception", label: "Perception", hint: "Wisdom (Perception) check" },
          { id: "class-feature", label: "Class Feature", hint: "Use a feature or resource" },
          { id: "short-rest", label: "Short Rest", hint: "Recover short-rest features, spend a hit die" },
          { id: "long-rest", label: "Long Rest", hint: "Full recovery" },
          { id: "encounter", label: "New Encounter", hint: "Spawn a foe" },
        ]
      : system === "pf2e"
        ? [
            { id: "attack", label: "Attack", hint: "Strike (1 action)" },
            { id: "stride", label: "Stride", hint: "Move (1 action)" },
            { id: "raise-shield", label: "Raise Shield", hint: "Defend (1 action)" },
            { id: "recall-knowledge", label: "Recall Knowledge", hint: "Intelligence check (1 action)" },
            { id: "refocus", label: "Refocus", hint: "Restore actions / focus" },
            { id: "long-rest", label: "Long Rest", hint: "Full recovery" },
          ]
        : [
            { id: "attack", label: "Attack", hint: "Roll your best weapon skill" },
            { id: "dodge", label: "Dodge", hint: "Roll Dodge (Move + 3)" },
            { id: "perception", label: "Perception", hint: "IQ-based Perception" },
            { id: "concentrate", label: "Concentrate", hint: "Focus; recover 1 FP" },
            { id: "rest", label: "Rest 1hr", hint: "Recover FP" },
          ];

  return (
    <div className="shrink-0 border-t border-slate-800 bg-slate-950/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur sm:px-4 sm:pt-3">
      {/* Roll preferences — advantage/disadvantage is ALWAYS automatic;
          the only manual preference left is the difficulty class. */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          title="Advantage and disadvantage are applied automatically from context: your conditions (poisoned, blinded…), unseen-attacker status (hidden / invisible), class features (rage, reckless attack) and the target's state (prone, restrained, hidden…)."
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-300"
        >
          <Sparkles className="size-3" /> Adv/Dis · auto
        </span>
        {system === "dnd5e" && onEnemyConditionToggle && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Foe:</span>
            {ENEMY_STATES.map((id) => {
              const on = (enemyConditions ?? []).includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onEnemyConditionToggle(id)}
                  aria-pressed={on}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold capitalize transition-colors",
                    on
                      ? "bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/50"
                      : "bg-slate-900 text-slate-500 hover:text-slate-300",
                  )}
                  title={`Mark the current foe ${CONDITION_MAP[id]?.name.toLowerCase() ?? id} — attack rolls adapt automatically`}
                >
                  {CONDITION_MAP[id]?.name.toLowerCase() ?? id}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">DC</span>
          <button type="button" aria-label="Decrease DC" onClick={() => setRollPrefs({ ...rollPrefs, dc: Math.max(5, rollPrefs.dc - 1) })}
            className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200">−</button>
          <span className="w-8 text-center font-mono text-xs font-bold text-slate-200">{rollPrefs.dc}</span>
          <button type="button" aria-label="Increase DC" onClick={() => setRollPrefs({ ...rollPrefs, dc: Math.min(30, rollPrefs.dc + 1) })}
            className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200">+</button>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold text-violet-300">
            {pendingCount} bonus dice ready
          </span>
        )}
        <div className="ml-auto hidden gap-1 sm:flex">
          {onPuzzle && (
            <button
              type="button"
              onClick={onPuzzle}
              title="A rules-governed puzzle — local DCs, the AI narrates the scene"
              className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-300 transition-all hover:border-violet-400 hover:bg-violet-500/20 hover:text-violet-200"
            >
              <Puzzle className="size-3" /> Puzzle
            </button>
          )}
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onQuickAction(a.id)}
              title={a.hint}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-all hover:border-amber-500/50 hover:text-amber-200"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          aria-label="Describe your next action"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={
            system === "dnd5e"
              ? "Describe your action — “I search the room” auto-rolls Investigation, “oracle: …” asks the fates…"
              : system === "pf2e"
                ? "Action — “I recall knowledge about the creature” auto-rolls the skill…"
                : "Action — “I sneak toward the guard” auto-rolls Stealth…"
          }
          className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-[16px] text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 sm:text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !text.trim()}
          aria-busy={busy}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 transition-all hover:bg-amber-400 disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
      {/* Mobile quick actions */}
      <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 sm:hidden">
        {onPuzzle && (
          <button type="button" onClick={onPuzzle}
            className="shrink-0 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-300">
            Puzzle
          </button>
        )}
        {actions.map((a) => (
          <button key={a.id} type="button" onClick={() => onQuickAction(a.id)}
            className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300">
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
