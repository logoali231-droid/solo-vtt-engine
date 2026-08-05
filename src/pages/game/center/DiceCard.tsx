import { cn } from "@/lib/utils";
import type { DiceResult } from "@/lib/rpg/types";
import { formatMod } from "@/lib/rpg/dice";
import { RefreshCw } from "lucide-react";

const OUTCOME_STYLES: Record<DiceResult["outcome"], { label: string; cls: string }> = {
  "critical-success": { label: "CRITICAL SUCCESS", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  success: { label: "SUCCESS", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  failure: { label: "FAILURE", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  "critical-failure": { label: "CRITICAL FAILURE", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
};

interface Props {
  result: DiceResult;
  onReroll?: (opts: { advantage?: boolean; disadvantage?: boolean; dc?: number }) => void;
}

export default function DiceCard({ result, onReroll }: Props) {
  const style = OUTCOME_STYLES[result.outcome];
  const total = result.total;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="text-xs font-semibold text-slate-200">{result.label}</p>
        <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-widest", style.cls)}>
          {style.label}
        </span>
      </div>

      <div className="flex items-center gap-4 px-3 py-3">
        {/* Dice faces */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(result.advantage || result.disadvantage) && result.rolls.length > 1 ? (
            <>
              <DieFace value={result.rolls[0]} dimmed={result.rolls[0] !== result.total} />
              <span className="text-[10px] font-bold text-slate-500">{result.disadvantage ? "⇣" : "⇡"}</span>
              <DieFace value={result.rolls[1]} dimmed={result.rolls[1] !== result.total} />
            </>
          ) : (
            result.rolls.map((r, i) => <DieFace key={i} value={r} />)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-slate-400">{result.diceNotation}</p>
          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-slate-500">{result.breakdown}</p>
          {result.featureUsed && (
            <p className="mt-1 inline-flex rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
              ✦ {result.featureUsed}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {result.target !== undefined ? "total" : "total"}
          </p>
          <p className={cn("font-mono text-2xl font-bold leading-none", result.critical ? "text-amber-300" : "text-slate-100")}>
            {total}
          </p>
          {result.margin !== undefined && (
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
              margin {formatMod(result.margin)}
            </p>
          )}
        </div>
      </div>

      {onReroll && (
        <div className="flex items-center gap-1.5 border-t border-slate-800 px-3 py-1.5">
          <button
            type="button"
            onClick={() => onReroll({ advantage: true })}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors",
              result.advantage ? "bg-amber-500/20 text-amber-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
            )}
          >
            ⇡ Advantage
          </button>
          <button
            type="button"
            onClick={() => onReroll({ disadvantage: true })}
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors",
              result.disadvantage ? "bg-red-500/20 text-red-300" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
            )}
          >
            ⇣ Disadvantage
          </button>
          <button
            type="button"
            onClick={() => onReroll({})}
            className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <RefreshCw className="size-3" /> Roll again
          </button>
        </div>
      )}
    </div>
  );
}

function DieFace({ value, dimmed }: { value: number; dimmed?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-md border font-mono text-base font-bold",
        dimmed
          ? "border-slate-700/60 text-slate-600"
          : value === 20
            ? "border-amber-400/70 bg-amber-400/15 text-amber-300"
            : value === 1
              ? "border-red-500/60 bg-red-500/10 text-red-400"
              : "border-slate-600 bg-slate-800 text-slate-100",
      )}
    >
      {value}
    </span>
  );
}
