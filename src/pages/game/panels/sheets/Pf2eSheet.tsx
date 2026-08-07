import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  type Pf2eCharacter,
  type PfRank,
} from "@/lib/rpg/types";
import type { Pf2eDerived } from "@/lib/rpg/character";
import { formatMod, pfTierBonus } from "@/lib/rpg/dice";
import { PF2E_SKILLS } from "@/lib/rpg/data/pf2e";
import IdentityChips from "./IdentityChips";
import type { SheetProps } from "../../types";

const RANKS: PfRank[] = ["untrained", "trained", "expert", "master", "legendary"];
const RANK_LETTER: Record<PfRank, string> = { untrained: "—", trained: "T", expert: "E", master: "M", legendary: "L" };

interface Props extends SheetProps<Pf2eCharacter> {
  derived: Pf2eDerived;
  actions: {
    setSkillRank: (skill: string, rank: PfRank) => void;
    setSaveRank: (ability: string, rank: PfRank) => void;
    setPerceptionRank: (rank: PfRank) => void;
    spendAction: (n: number) => void;
    resetActions: () => void;
    damage: (n: number) => void;
    heal: (n: number) => void;
  };
}

function RankPicker({
  value,
  onPick,
  compact,
}: {
  value: PfRank;
  onPick: (r: PfRank) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex gap-0.5", compact ? "" : "")}>
      {RANKS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onPick(r)}
          className={cn(
            "rounded border px-1 text-[9px] font-bold transition-colors",
            value === r
              ? "border-teal-400 bg-teal-400/20 text-teal-300"
              : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300",
          )}
        >
          {RANK_LETTER[r]}
        </button>
      ))}
    </div>
  );
}

export default function Pf2eSheet({ character: c, derived: d, onRoll, actions }: Props) {
  const hpCurrent = Math.max(0, d.hpMax - c.state.hpDamage);
  const hpPct = Math.min(100, Math.round((hpCurrent / Math.max(1, d.hpMax)) * 100));
  const actionsLeft = c.state.actions;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)]">
      {/* Header grid */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm font-bold tracking-wide text-slate-100">{c.name}</p>
            <p className="font-mono text-[10px] text-teal-400">
              {d.ancestryName}{d.heritageName ? ` (${d.heritageName})` : ""} · {d.className} · {d.backgroundName}
            </p>
            <IdentityChips identity={c.identity} tone="dark" />
          </div>
          <span className="rounded bg-teal-400/10 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-300">
            LVL {c.level}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ["HP", `${hpCurrent}/${d.hpMax}`],
            ["AC", d.ac],
            ["Class DC", d.classDC],
            ["Perception", formatMod(d.perception)],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-center">
              <p className="font-mono text-[8px] uppercase tracking-widest text-slate-500">{label}</p>
              <p className="font-mono text-sm font-bold text-slate-100">{value}</p>
            </div>
          ))}
        </div>
        {/* HP bar */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-teal-400/80 transition-all" style={{ width: `${hpPct}%` }} />
          </div>
          <button type="button" onClick={() => actions.damage(1)} className="rounded border border-slate-700 px-1.5 font-mono text-[9px] text-red-400 hover:bg-slate-800">−</button>
          <button type="button" onClick={() => actions.heal(1)} className="rounded border border-slate-700 px-1.5 font-mono text-[9px] text-emerald-400 hover:bg-slate-800">+</button>
        </div>
      </div>

      {/* 3-action economy */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
            Action Economy
          </p>
          <button type="button" onClick={actions.resetActions}
            className="font-mono text-[9px] text-teal-400 hover:underline">
            reset
          </button>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => actions.spendAction(i + 1)}
              className={cn(
                "h-5 flex-1 rounded-sm border font-mono text-[9px] font-bold transition-colors",
                i < actionsLeft
                  ? "border-teal-400/70 bg-teal-400/20 text-teal-300"
                  : "border-slate-800 bg-slate-950 text-slate-600",
              )}
            >
              {i < actionsLeft ? "●" : "○"}
            </button>
          ))}
        </div>
      </div>

      {/* Abilities */}
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">Ability Scores</p>
        <div className="grid grid-cols-6 gap-1.5">
          {ABILITIES.map((a) => (
            <button key={a} type="button"
              onClick={() => onRoll({ label: `${ABILITY_LABELS[a]} Check`, kind: "check", ability: a, rank: c.saveRanks[a] })}
              className="rounded border border-slate-800 bg-slate-950 px-1 py-1.5 text-center transition-colors hover:border-teal-500/50">
              <p className="font-mono text-[8px] uppercase text-slate-500">{a}</p>
              <p className="font-mono text-xs font-bold text-slate-100">{c.scores[a]}</p>
              <p className="font-mono text-[9px] text-teal-400">{formatMod(d.mods[a])}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Saves with tier pickers */}
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Saves <span className="normal-case text-slate-600">· click rank to train</span>
        </p>
        <div className="flex flex-col gap-1">
          {ABILITIES.map((a) => {
            const rank = c.saveRanks[a];
            return (
              <div key={a} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onRoll({ label: `${ABILITY_LABELS[a]} Save`, kind: "save", ability: a, rank })}
                  className="flex-1 rounded border border-slate-800 bg-slate-950 px-2 py-1 text-left font-mono text-[10px] text-slate-300 transition-colors hover:border-teal-500/50"
                >
                  <span className="text-slate-500">{ABILITY_LABELS[a]}</span>
                  <span className="float-right font-bold text-slate-100">
                    {formatMod(d.mods[a] + pfTierBonus(rank, c.level))}
                  </span>
                </button>
                <RankPicker value={rank} onPick={(r) => actions.setSaveRank(a, r)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="px-4 py-3">
        <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Skills <span className="normal-case text-slate-600">· click name to roll</span>
        </p>
        <div className="flex flex-col gap-1">
          {PF2E_SKILLS.map((s) => {
            const rank = c.skillRanks[s.id] ?? "untrained";
            return (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onRoll({ label: s.name, kind: "skill", ability: s.ability, skill: s.id, rank })}
                  className={cn(
                    "flex-1 rounded border px-2 py-1 text-left font-mono text-[10px] transition-colors",
                    rank !== "untrained"
                      ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-teal-500/50"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:border-teal-500/40",
                  )}
                >
                  {s.name}
                  <span className="float-right font-bold">
                    {formatMod(d.mods[s.ability] + pfTierBonus(rank, c.level))}
                  </span>
                </button>
                <RankPicker value={rank} onPick={(r) => actions.setSkillRank(s.id, r)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
