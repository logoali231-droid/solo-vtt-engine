import { cn } from "@/lib/utils";
import type { LogEntry } from "@/lib/rpg/types";
import { useEffect, useRef } from "react";
import DiceCard from "./DiceCard";

interface Props {
  logs: LogEntry[];
  onReroll: (diceId: string) => void;
}

export default function NarrativeHub({ logs, onReroll }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs.length]);

  // Fresh table — nothing has happened yet. Give the player a clear starting point.
  if (logs.length === 0) {
    return (
      <div className="oracle-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex h-full min-h-[45vh] flex-col items-center justify-center gap-3 text-center">
          <span className="die3d flex size-14 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 font-mono text-xl font-bold text-amber-300">
            20
          </span>
          <p className="text-sm font-bold tracking-tight text-slate-200">The table is quiet</p>
          <p className="max-w-xs text-[11px] leading-relaxed text-slate-500">
            Describe your hero's next move below — say what you do, and the dice, the world, and the
            Game Master will answer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="oracle-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      {logs.map((entry) => {
        if (entry.kind === "dice" && entry.dice) {
          return (
            <div key={entry.id} className="max-w-xl">
              <DiceCard result={entry.dice} onReroll={() => onReroll(entry.id)} />
            </div>
          );
        }
        if (entry.kind === "player") {
          return (
            <div key={entry.id} className="flex justify-end">
              <div className="max-w-md rounded-2xl rounded-br-sm bg-amber-500/15 px-4 py-2.5 text-sm text-amber-100 ring-1 ring-amber-500/25">
                {entry.text}
              </div>
            </div>
          );
        }
        if (entry.kind === "system") {
          return (
            <div key={entry.id} className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              {entry.text}
              <span className="h-px flex-1 bg-slate-800" />
            </div>
          );
        }
        // gm / combat narration
        return (
          <div key={entry.id} className={cn("max-w-2xl", entry.kind === "combat" && "border-l-2 border-red-500/40 pl-3")}>
            <p
              className={cn(
                "whitespace-pre-wrap text-sm leading-relaxed",
                entry.kind === "gm" ? "text-slate-200" : "text-slate-300",
              )}
            >
              {entry.text}
            </p>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
