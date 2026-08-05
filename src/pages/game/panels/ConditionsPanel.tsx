import { cn } from "@/lib/utils";
import type { GameSystem } from "@/lib/rpg/types";
import { CONDITIONS } from "@/lib/rpg/data/conditions";

export default function ConditionsPanel({
  system,
  active,
  onToggle,
}: {
  system: GameSystem;
  active: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs text-slate-500">
        Conditions modify the dice engine automatically — e.g. <span className="font-semibold text-slate-300">Poisoned</span> grants
        disadvantage on attack rolls and ability checks.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {CONDITIONS.map((cd) => {
          const on = active.includes(cd.id);
          return (
            <button
              key={cd.id}
              type="button"
              onClick={() => onToggle(cd.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                on
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-600",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                  on ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-600",
                )}
              >
                {on && (
                  <svg viewBox="0 0 12 12" className="size-3" fill="none">
                    <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <span>
                <span className={cn("text-sm font-semibold", on ? "text-amber-200" : "text-slate-200")}>
                  {cd.name}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{cd.summary}</span>
                <span className="mt-1 block text-[10px] font-medium text-slate-500">
                  {system === "dnd5e"
                    ? "5e: advantage/disadvantage mechanics"
                    : system === "pf2e"
                      ? `PF2e: ${cd.effects.pf2ePenalty ?? 0} status penalty`
                      : `GURPS: ${cd.effects.gurpsPenalty ?? 0} penalty`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
