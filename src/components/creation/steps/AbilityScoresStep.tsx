import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  type AbilityId,
  type DnDClassId,
} from "@/lib/rpg/types";
import {
  BACKGROUND_MAP,
  CLASS_MAP,
  DND_SKILLS,
  raceTotalAsi,
  RACE_MAP,
} from "@/lib/rpg/data/dnd";
import { Minus, Plus } from "lucide-react";
import { SectionLabel, StepShell } from "../ui";

const PB_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const ARRAY_VALUES = [15, 14, 13, 12, 10, 8];

export function dndMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

interface Props {
  raceId: string;
  /** Chosen subrace (e.g. elf-wood, human-variant) — affects ASIs & scores. */
  subraceId: string | null;
  customOrigin: boolean;
  setCustomOrigin: (v: boolean) => void;
  originFirst: AbilityId;
  setOriginFirst: (v: AbilityId) => void;
  originSecond: AbilityId;
  setOriginSecond: (v: AbilityId) => void;
  buyMode: "pointbuy" | "array";
  setBuyMode: (v: "pointbuy" | "array") => void;
  pointBuys: Record<AbilityId, number>;
  setPointBuys: (v: Record<AbilityId, number>) => void;
  arrayAssign: Record<AbilityId, number | null>;
  setArrayAssign: (v: Record<AbilityId, number | null>) => void;
  classId: DnDClassId;
  backgroundId: string;
  chosenSkills: string[];
  setChosenSkills: (v: string[]) => void;
}

export default function AbilityScoresStep({
  raceId,
  subraceId,
  customOrigin,
  setCustomOrigin,
  originFirst,
  setOriginFirst,
  originSecond,
  setOriginSecond,
  buyMode,
  setBuyMode,
  pointBuys,
  setPointBuys,
  arrayAssign,
  setArrayAssign,
  classId,
  backgroundId,
  chosenSkills,
  setChosenSkills,
}: Props) {
  const klass = CLASS_MAP[classId];
  const race = RACE_MAP[raceId];
  const bgSkills = BACKGROUND_MAP[backgroundId]?.skills ?? [];

  const spent = Object.values(pointBuys).reduce((a, b) => a + PB_COST[b], 0);
  const pointsLeft = 27 - spent;

  const usedValues = Object.values(arrayAssign).filter((v): v is number => v !== null);
  const remainingValues = ARRAY_VALUES.filter((v) => !usedValues.includes(v));

  const change = (a: AbilityId, delta: number) => {
    const next = pointBuys[a] + delta;
    if (next < 8 || next > 15) return;
    const cost = PB_COST[next] - PB_COST[pointBuys[a]];
    if (pointsLeft - cost < 0) return;
    setPointBuys({ ...pointBuys, [a]: next });
  };

  const setArray = (a: AbilityId, value: number | null) => {
    if (value === null) {
      setArrayAssign({ ...arrayAssign, [a]: null });
      return;
    }
    // swap if value already assigned elsewhere
    const holder = (Object.keys(arrayAssign) as AbilityId[]).find(
      (k) => arrayAssign[k] === value,
    );
    if (holder) {
      const next = { ...arrayAssign };
      next[holder] = null;
      next[a] = value;
      setArrayAssign(next);
    } else {
      setArrayAssign({ ...arrayAssign, [a]: value });
    }
  };

  const finalScore = (a: AbilityId): number => {
    const base = buyMode === "pointbuy" ? pointBuys[a] : (arrayAssign[a] ?? 8);
    if (customOrigin) {
      if (a === originFirst) return base + 2;
      if (a === originSecond) return base + 1;
      return base;
    }
    if (subraceId === "human-variant") {
      if (a === originFirst || a === originSecond) return base + 1;
      return base;
    }
    return base + (raceTotalAsi(raceId, subraceId)[a] ?? 0);
  };

  const toggleSkill = (id: string) => {
    if (chosenSkills.includes(id)) {
      setChosenSkills(chosenSkills.filter((s) => s !== id));
    } else if (chosenSkills.length < klass.skillCount) {
      setChosenSkills([...chosenSkills, id]);
    }
  };

  return (
    <StepShell
      title="Ability Scores & Skills"
      subtitle={`Distribute your base scores with a strict 27-point buy or the standard array (15, 14, 13, 12, 10, 8), then add your ${race.name} ability increases and pick your ${klass.name} skills.`}
    >
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1">
        {(["pointbuy", "array"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setBuyMode(m)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              buyMode === m ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800",
            )}
          >
            {m === "pointbuy" ? "27-Point Buy" : "Standard Array"}
          </button>
        ))}
      </div>

      {/* Tasha's custom origin */}
      <div className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={customOrigin}
            onChange={(e) => setCustomOrigin(e.target.checked)}
            className="mt-0.5 size-4 accent-violet-600"
          />
          <span>
            <span className="text-sm font-semibold text-violet-900">
              Tasha's Custom Origin (TCoE)
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-violet-700/80">
              Instead of the fixed racial ability increases, manually assign a +2 and a +1 to any
              two ability scores of your choice.
            </span>
          </span>
        </label>
        {customOrigin && (
          <div className="grid gap-3 pl-7 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-violet-800">+2 to</p>
              <select
                value={originFirst}
                onChange={(e) => setOriginFirst(e.target.value as AbilityId)}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-stone-800"
              >
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>{ABILITY_LABELS[a]}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-violet-800">+1 to</p>
              <select
                value={originSecond}
                onChange={(e) => setOriginSecond(e.target.value as AbilityId)}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-stone-800"
              >
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>{ABILITY_LABELS[a]}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Human Variant — two chosen +1s (replaces the +1-to-all) */}
      {subraceId === "human-variant" && !customOrigin && (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-sm font-semibold text-emerald-900">Human Variant — two +1s</p>
          <p className="text-xs leading-relaxed text-emerald-700/80">
            Instead of the standard +1 to every ability score, the Variant gains +1 to two different
            abilities of your choice (plus a skill and a feat).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-emerald-800">+1 to</p>
              <select
                value={originFirst}
                onChange={(e) => setOriginFirst(e.target.value as AbilityId)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-stone-800"
              >
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>{ABILITY_LABELS[a]}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-emerald-800">+1 to</p>
              <select
                value={originSecond}
                onChange={(e) => setOriginSecond(e.target.value as AbilityId)}
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-stone-800"
              >
                {ABILITIES.map((a) => (
                  <option key={a} value={a}>{ABILITY_LABELS[a]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Score rows */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <SectionLabel hint={buyMode === "pointbuy" ? `${pointsLeft} points left` : `${remainingValues.length} values left`}>
          Base ability scores
        </SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2">
          {ABILITIES.map((a) => (
            <div
              key={a}
              className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800">
                  {ABILITY_LABELS[a]}
                  <span className="ml-1 text-[10px] font-bold uppercase text-stone-400">
                    {a}
                  </span>
                </p>
                <p className="text-xs text-stone-500">
                  Final: <span className="font-semibold text-stone-800">{finalScore(a)}</span>
                  <span className="ml-1 text-stone-400">
                    (mod {dndMod(finalScore(a)) >= 0 ? "+" : ""}{dndMod(finalScore(a))})
                  </span>
                </p>
              </div>
              {buyMode === "pointbuy" ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => change(a, -1)}
                    className="flex size-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition-colors hover:bg-stone-100"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-stone-900">
                    {pointBuys[a]}
                  </span>
                  <button
                    type="button"
                    onClick={() => change(a, 1)}
                    disabled={pointBuys[a] >= 15 || (PB_COST[pointBuys[a] + 1] - PB_COST[pointBuys[a]] > pointsLeft)}
                    className="flex size-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-30"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={arrayAssign[a] ?? ""}
                  onChange={(e) => setArray(a, e.target.value ? Number(e.target.value) : null)}
                  className={cn(
                    "rounded-md border border-stone-200 px-2 py-1 text-sm font-semibold",
                    arrayAssign[a] === null ? "text-stone-400" : "text-stone-900",
                  )}
                >
                  <option value="">—</option>
                  {remainingValues.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <SectionLabel hint={`${chosenSkills.length} / ${klass.skillCount} chosen`}>
          {klass.name} skills (choose {klass.skillCount})
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DND_SKILLS.map((s) => {
            const isBg = bgSkills.includes(s.id);
            const selected = chosenSkills.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={isBg}
                onClick={() => toggleSkill(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isBg
                    ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
                    : selected
                      ? "border-amber-600 bg-amber-50 text-amber-800"
                      : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                {s.name}
                {isBg && <span className="ml-1 text-[9px] font-bold uppercase text-emerald-500">bg</span>}
              </button>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}
