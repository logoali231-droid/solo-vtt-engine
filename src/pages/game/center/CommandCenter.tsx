import { cn } from "@/lib/utils";
import type { GameSystem } from "@/lib/rpg/types";
import type { RollRequest } from "../types";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface QuickAction {
  id: string;
  label: string;
  hint: string;
}

interface Props {
  system: GameSystem;
  onSend: (text: string) => void;
  onQuickAction: (id: string) => void;
  onRoll: (r: RollRequest) => void;
  busy: boolean;
  rollPrefs: { adv: boolean; dis: boolean; dc: number };
  setRollPrefs: (p: { adv: boolean; dis: boolean; dc: number }) => void;
  pendingCount: number;
}

export default function CommandCenter({
  system,
  onSend,
  onQuickAction,
  busy,
  rollPrefs,
  setRollPrefs,
  pendingCount,
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
      {/* Roll preferences */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Roll:</span>
          <button
            type="button"
            onClick={() => setRollPrefs({ ...rollPrefs, adv: !rollPrefs.adv, dis: false })}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-bold transition-colors",
              rollPrefs.adv ? "bg-amber-500/25 text-amber-300" : "bg-slate-900 text-slate-500 hover:text-slate-300",
            )}
          >
            ⇡ Adv
          </button>
          <button
            type="button"
            onClick={() => setRollPrefs({ ...rollPrefs, dis: !rollPrefs.dis, adv: false })}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-bold transition-colors",
              rollPrefs.dis ? "bg-red-500/25 text-red-300" : "bg-slate-900 text-slate-500 hover:text-slate-300",
            )}
          >
            ⇣ Dis
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">DC</span>
          <button type="button" onClick={() => setRollPrefs({ ...rollPrefs, dc: Math.max(5, rollPrefs.dc - 1) })}
            className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200">−</button>
          <span className="w-8 text-center font-mono text-xs font-bold text-slate-200">{rollPrefs.dc}</span>
          <button type="button" onClick={() => setRollPrefs({ ...rollPrefs, dc: Math.min(30, rollPrefs.dc + 1) })}
            className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200">+</button>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold text-violet-300">
            {pendingCount} bonus dice ready
          </span>
        )}
        <div className="ml-auto hidden gap-1 sm:flex">
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={
            system === "dnd5e"
              ? "Describe your action — e.g. “I search the room” or “oracle: does the door open?”…"
              : system === "pf2e"
                ? "Action — e.g. “I recall knowledge about the creature”…"
                : "Action — e.g. “I sneak toward the guard”…"
          }
          className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !text.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 transition-all hover:bg-amber-400 disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
      {/* Mobile quick actions */}
      <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 sm:hidden">
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
