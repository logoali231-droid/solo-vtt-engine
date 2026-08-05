import { cn } from "@/lib/utils";
import type { LorebookEntry } from "@/lib/rpg/types";
import { uid } from "@/lib/rpg/types";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  entries: LorebookEntry[];
  onChange: (entries: LorebookEntry[]) => void;
}

export default function LorebookPanel({ entries, onChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const entry: LorebookEntry = {
      id: uid(),
      name: n,
      description: description.trim(),
      keywords: keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      updatedAt: Date.now(),
    };
    onChange([entry, ...entries]);
    setName("");
    setDescription("");
    setKeywords("");
  };

  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <BookOpen className="size-3.5" /> World lorebook
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Facts about your world. Entries whose keywords appear in recent chat are injected into
          the Game Master's context (token-budgeted) so the world stays consistent.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">New entry</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name — e.g. The Sunken Cathedral"
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description — facts the GM should know…"
          rows={3}
          className="mb-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
        <input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Keywords — cathedral, sunken, bell (comma separated)"
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3.5" /> Add entry
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {entries.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-[11px] text-slate-600">
            No lorebook entries yet. Add your world's places, people and secrets here.
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-100">{e.name}</p>
              <button
                type="button"
                onClick={() => remove(e.id)}
                title="Delete entry"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {e.description && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{e.description}</p>
            )}
            {e.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.keywords.map((k) => (
                  <span
                    key={k}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      "bg-amber-500/10 text-amber-300/80",
                    )}
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
