import { cn } from "@/lib/utils";
import type { LogEntry } from "@/lib/rpg/types";
import { useEffect, useRef } from "react";
import DiceCard from "./DiceCard";

interface Props {
  logs: LogEntry[];
  onReroll: (diceId: string, opts: { advantage?: boolean; disadvantage?: boolean }) => void;
}

export default function NarrativeHub({ logs, onReroll }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs.length]);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      {logs.map((entry) => {
        if (entry.kind === "dice" && entry.dice) {
          return (
            <div key={entry.id} className="max-w-xl">
              <DiceCard
                result={entry.dice}
                onReroll={(opts) => onReroll(entry.id, { advantage: opts.advantage, disadvantage: opts.disadvantage })}
              />
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
