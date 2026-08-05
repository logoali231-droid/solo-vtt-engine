import { cn } from "@/lib/utils";
import {
  GURPS_ARMORS,
  GURPS_SKILLS,
  gurpsAttributeCost,
  gurpsSkillLevel,
} from "@/lib/rpg/data/gurps";
import { Minus, Plus } from "lucide-react";
import { ChoiceGrid, SectionLabel, StepShell } from "../ui";

export const GURPS_BUDGET = 100;

interface Attrs {
  st: number;
  dx: number;
  iq: number;
  ht: number;
}

const ATTR_LABELS: Record<keyof Attrs, { name: string; desc: string }> = {
  st: { name: "Strength (ST)", desc: "HP, lifting, melee damage" },
  dx: { name: "Dexterity (DX)", desc: "Agility, most combat skills" },
  iq: { name: "Intelligence (IQ)", desc: "Knowledge and mental skills" },
  ht: { name: "Health (HT)", desc: "FP, stamina, survival" },
};

export function AttributesStep({
  attrs,
  setAttrs,
}: {
  attrs: Attrs;
  setAttrs: (v: Attrs) => void;
}) {
  const spent = gurpsAttributeCost(attrs);
  const remaining = GURPS_BUDGET - spent;

  const change = (key: keyof Attrs, delta: number) => {
    const next = Math.max(6, Math.min(20, attrs[key] + delta));
    const trial = { ...attrs, [key]: next };
    if (gurpsAttributeCost(trial) > GURPS_BUDGET) return;
    setAttrs(trial);
  };

  return (
    <StepShell
      title="Attributes (100-point build)"
      subtitle="Base attributes start at 10. Each ±1 point costs or refunds 10 character points — spend within your 100-point budget."
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-stone-600">Points spent</span>
        <span className={cn("text-lg font-bold", remaining >= 0 ? "text-stone-900" : "text-red-600")}>
          {spent} <span className="text-sm font-normal text-stone-400">/ {GURPS_BUDGET}</span>
          <span className="ml-2 text-sm font-semibold text-emerald-600">{remaining} left</span>
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(ATTR_LABELS) as (keyof Attrs)[]).map((key) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">{ATTR_LABELS[key].name}</p>
              <p className="text-xs text-stone-400">{ATTR_LABELS[key].desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => change(key, -1)}
                className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-lg font-bold text-stone-900">{attrs[key]}</span>
              <button
                type="button"
                onClick={() => change(key, 1)}
                className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400">
        Derived: HP = ST · FP = HT · Basic Speed = (DX+HT)/4 · Move = ⌊Basic Speed⌋ · Dodge = Move + 3
      </p>
    </StepShell>
  );
}

export function SkillsStep({
  attrs,
  skills,
  setSkills,
}: {
  attrs: Attrs;
  skills: { id: string; points: number }[];
  setSkills: (v: { id: string; points: number }[]) => void;
}) {
  const spentAttrs = gurpsAttributeCost(attrs);
  const spentSkills = skills.reduce((a, s) => a + s.points, 0);
  const remaining = GURPS_BUDGET - spentAttrs - spentSkills;

  const statOf = (id: string): number => {
    const def = GURPS_SKILLS.find((s) => s.id === id);
    if (!def) return 10;
    return def.stat === "st" ? attrs.st : def.stat === "dx" ? attrs.dx : def.stat === "ht" ? attrs.ht : attrs.iq;
  };

  const toggle = (id: string) => {
    if (skills.some((s) => s.id === id)) {
      setSkills(skills.filter((s) => s.id !== id));
    } else {
      setSkills([...skills, { id, points: 1 }]);
    }
  };

  const changePoints = (id: string, delta: number) => {
    setSkills(
      skills.map((s) => {
        if (s.id !== id) return s;
        const next = s.points + delta;
        if (next < 1) return s;
        const cost = next - s.points;
        if (remaining - cost < 0) return s;
        return { ...s, points: next };
      }),
    );
  };

  const costs = { easy: [1, 2, 4], average: [1, 2, 4], hard: [1, 2, 4] };
  void costs;

  return (
    <StepShell
      title="Skills"
      subtitle={`${remaining} points left for skills. Each skill level costs 1, 2 or 4 points (more for higher levels). Level shown is vs the controlling attribute.`}
    >
      <div className="flex flex-wrap gap-2">
        {GURPS_SKILLS.filter((s) => s.name !== "—").map((s) => {
          const selected = skills.find((x) => x.id === s.id);
          const stat = statOf(s.id);
          const level = selected ? gurpsSkillLevel(stat, s.difficulty, selected.points) : stat - 5;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-left transition-colors",
                selected
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              <span className={cn("text-xs font-semibold", selected ? "text-emerald-900" : "text-stone-700")}>
                {s.name}
              </span>
              <span className="ml-2 text-[10px] font-medium text-stone-400">
                {s.stat.toUpperCase()} · {s.difficulty}
              </span>
              {selected && (
                <span className="mt-0.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changePoints(s.id, -1); }}
                    className="flex size-5 items-center justify-center rounded border border-emerald-200 text-emerald-700"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="text-xs font-bold text-emerald-800">
                    lvl {level} ({selected.points} pts)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); changePoints(s.id, 1); }}
                    className="flex size-5 items-center justify-center rounded border border-emerald-200 text-emerald-700"
                  >
                    <Plus className="size-3" />
                  </button>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

export function GurpsEquipmentStep({
  armorId,
  setArmorId,
}: {
  armorId: string;
  setArmorId: (v: string) => void;
}) {
  return (
    <StepShell
      title="Protection"
      subtitle="Choose armor. Its Damage Resistance (DR) subtracts from incoming damage."
    >
      <ChoiceGrid
        columns={3}
        items={GURPS_ARMORS.map((a) => ({
          id: a.id,
          title: a.name,
          subtitle: a.note ?? "—",
          badge: `DR ${a.dr}`,
        }))}
        selected={armorId}
        onSelect={setArmorId}
      />
    </StepShell>
  );
}

export function GurpsReviewCard({
  name,
  attrs,
  skills,
  armorId,
  points,
}: {
  name: string;
  attrs: Attrs;
  skills: { id: string; points: number }[];
  armorId: string;
  points: { attributes: number; skills: number; budget: number };
}) {
  const armor = GURPS_ARMORS.find((a) => a.id === armorId);
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-stone-400">GURPS 4e · {name}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(ATTR_LABELS) as (keyof Attrs)[]).map((key) => (
          <div key={key} className="rounded-lg bg-stone-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{ATTR_LABELS[key].name.split(" ")[1]?.replace("(", "") ?? key}</p>
            <p className="mt-1 text-lg font-bold text-stone-900">{attrs[key]}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((s) => {
          const def = GURPS_SKILLS.find((x) => x.id === s.id);
          const stat = def?.stat === "st" ? attrs.st : def?.stat === "dx" ? attrs.dx : def?.stat === "ht" ? attrs.ht : attrs.iq;
          const level = def ? gurpsSkillLevel(stat, def.difficulty, s.points) : 0;
          return (
            <span key={s.id} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {def?.name ?? s.id} {level}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm">
        <span className="text-stone-500">DR {armor?.dr ?? 0} · {armor?.name}</span>
        <span className="font-semibold text-stone-900">
          {points.attributes + points.skills} / {points.budget} pts
        </span>
      </div>
    </div>
  );
}
