import { cn } from "@/lib/utils";
import type { AdventureState } from "@/lib/rpg/types";
import { Dices, Download, LogOut, Plus, Upload } from "lucide-react";
import { useRef } from "react";

interface Props {
  adventure: AdventureState;
  hpText: string;
  onGmMode: (mode: "local" | "live") => void;
  onNewCharacter: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSignOut: () => void;
}

export default function TopBar({
  adventure,
  hpText,
  onGmMode,
  onNewCharacter,
  onExport,
  onImport,
  onSignOut,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
          <Dices className="size-4.5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold leading-none tracking-tight text-slate-100">Oraculum</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            Phase 2 · Solo VTT · {adventure.system.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mx-auto hidden min-w-0 flex-col items-center md:flex">
        <p className="max-w-md truncate text-sm font-semibold text-slate-200">{adventure.sceneTitle}</p>
        <p className="max-w-md truncate text-[11px] text-slate-500">{adventure.location}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-400 lg:inline">
          {hpText}
        </span>
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
          {(["local", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onGmMode(m)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
                adventure.gmMode === m
                  ? m === "live"
                    ? "bg-teal-500 text-slate-950"
                    : "bg-amber-500 text-slate-950"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              {m === "live" ? "Live GM" : "Local GM"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onExport}
          title="Export JSON"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
        >
          <Download className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Import JSON"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
        >
          <Upload className="size-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={onNewCharacter}
          title="New character (back to Phase 1)"
          className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300"
        >
          <Plus className="size-3.5" /> New
        </button>
        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
