import { cn } from "@/lib/utils";
import type { PuzzleSpec } from "@/lib/rpg/puzzle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzle: PuzzleSpec | null;
  /** 0 fresh · 1 first check passed · 2 solved · −1 failed (consequence applied) */
  step: number;
  onAttempt: (idx: number) => void;
  onNewPuzzle: () => void;
}

export default function PuzzleDialog({
  open,
  onOpenChange,
  puzzle,
  step,
  onAttempt,
  onNewPuzzle,
}: Props) {
  if (!puzzle) return null;
  const failed = step === -1;
  const solved = step === 2;
  const current = step === 0 ? 0 : step === 1 ? 1 : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {puzzle.kind}
            </span>
            {puzzle.title}
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed text-slate-400">
            {puzzle.intro}
          </DialogDescription>
        </DialogHeader>

        {solved && (
          <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-3 text-sm text-emerald-300">
            The way opens. +{puzzle.rewardXp} XP — and the GM is already narrating what waits beyond.
          </div>
        )}
        {failed && (
          <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300">
            {puzzle.consequenceText} (−{puzzle.consequenceHp} HP). The mechanism re-locks.
          </div>
        )}

        {!solved && !failed && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Two checks — the dice decide, the rules are local
            </p>
            {puzzle.checks.map((ck, idx) => {
              const done = idx < step;
              const isCurrent = current === idx;
              const target = ck.dc
                ? `DC ${ck.dc}`
                : ck.gurpsTarget
                  ? `target ${ck.gurpsTarget}`
                  : "";
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                    done
                      ? "border-emerald-800/60 bg-emerald-950/20"
                      : isCurrent
                        ? "border-amber-600/60 bg-amber-950/20"
                        : "border-slate-800 bg-slate-900",
                  )}
                >
                  <div>
                    <p className={cn("text-sm font-medium", done ? "text-emerald-300" : "text-slate-200")}>
                      {ck.label}
                      {done && <span className="ml-2 text-[10px] text-emerald-500">✓ passed</span>}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {ck.rollLabel}
                      {target ? ` · ${target}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!isCurrent || done}
                    onClick={() => onAttempt(idx)}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      isCurrent && !done
                        ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                        : "cursor-not-allowed bg-slate-800 text-slate-600",
                    )}
                  >
                    {done ? "Done" : isCurrent ? "Roll" : "Locked"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!solved && !failed && (
          <p className="text-[10px] leading-relaxed text-slate-600">
            Fail a check and the trap bites (−{puzzle.consequenceHp} HP), but you can retry. The GM
            narrates the scene and outcomes — it never sets the DCs.
          </p>
        )}

        <div className="flex justify-end gap-2">
          {failed && (
            <button
              type="button"
              onClick={onNewPuzzle}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-400"
            >
              Give up — find another way
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            {solved ? "Proceed" : "Leave it for now"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
