import { cn } from "@/lib/utils";
import type { DnDClassId } from "@/lib/rpg/types";
import { BACKGROUND_MAP, CLASS_MAP, DND_SKILLS, FEATS } from "@/lib/rpg/data/dnd";
import { Check, Sparkles } from "lucide-react";
import { SectionLabel, StepShell } from "../ui";

/** Standard feat progression: one ASI/feat slot at 4, 8, 12, 16, 19. */
export function maxFeatSlots(level: number, raceId: string | null): number {
  const byLevel =
    (level >= 4 ? 1 : 0) +
    (level >= 8 ? 1 : 0) +
    (level >= 12 ? 1 : 0) +
    (level >= 16 ? 1 : 0) +
    (level >= 19 ? 1 : 0);
  const lineage = raceId === "custom-lineage" ? 1 : 0;
  return byLevel + lineage;
}

export function FeatsStep({
  feats,
  setFeats,
  level,
  raceId,
  classId,
}: {
  feats: string[];
  setFeats: (v: string[]) => void;
  level: number;
  raceId: string;
  classId: DnDClassId;
}) {
  const slots = maxFeatSlots(level, raceId);
  const toggle = (id: string) => {
    if (feats.includes(id)) {
      setFeats(feats.filter((f) => f !== id));
    } else if (feats.length < slots) {
      setFeats([...feats, id]);
    }
  };

  return (
    <StepShell
      title="Talents & Feats"
      subtitle={`Spend ${slots} feat slot${slots === 1 ? "" : "s"} on talents from the Player's Handbook and Tasha's Cauldron of Everything. Feats with +1 ability increases apply automatically to your final scores.`}
    >
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-xs leading-relaxed text-violet-800">
        <p className="font-semibold">
          <Sparkles className="mr-1 inline size-3" />
          You have {slots} feat slot{slots === 1 ? "" : "s"} — {feats.length} used
          {raceId === "custom-lineage" ? " · includes your free Custom Lineage feat" : ""}
        </p>
        <p className="mt-1 text-violet-700/80">
          Feats that grant +1 to an ability score (e.g. Actor, Resilient, Fey Touched) are applied to
          your scores automatically. Pick {CLASS_MAP[classId].name} synergy or a TCoE power feat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FEATS.map((f) => {
          const active = feats.includes(f.id);
          const full = feats.length >= slots && !active;
          return (
            <button
              key={f.id}
              type="button"
              disabled={full}
              onClick={() => toggle(f.id)}
              className={cn(
                "group relative rounded-xl border p-4 text-left transition-all duration-150",
                active
                  ? "border-violet-600/60 bg-violet-50 shadow-[0_0_0_1px_rgba(120,80,200,0.35)]"
                  : full
                    ? "cursor-not-allowed border-stone-200 bg-stone-50 opacity-50"
                    : "border-stone-200 bg-white hover:border-violet-300 hover:shadow-sm",
              )}
            >
              {active && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
              <div className="pr-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-900">{f.name}</p>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[9px] font-bold tracking-wide",
                      f.source === "TCoE"
                        ? "bg-violet-100 text-violet-700"
                        : f.source === "XGtE"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-stone-100 text-stone-500",
                    )}
                  >
                    {f.source}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">{f.summary}</p>
                {f.effects && (
                  <p className="mt-2 flex flex-wrap gap-1 text-[10px] font-medium">
                    {f.effects.asi && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                        +{(Object.values(f.effects.asi)[0] ?? 1)} {Object.keys(f.effects.asi)[0]?.toUpperCase()}
                      </span>
                    )}
                    {f.effects.saveProf && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                        {f.effects.saveProf.toUpperCase()} save proficiency
                      </span>
                    )}
                    {f.effects.skillProfs && (
                      <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">
                        skill proficiency
                      </span>
                    )}
                    {f.effects.expertise && (
                      <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">
                        expertise
                      </span>
                    )}
                    {f.effects.hpPerLevel && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">
                        +{f.effects.hpPerLevel} HP/level
                      </span>
                    )}
                    {f.effects.initiative && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
                        +{f.effects.initiative} initiative
                      </span>
                    )}
                    {f.effects.speed && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">
                        +{f.effects.speed} ft speed
                      </span>
                    )}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

export function expertisePool(classId: DnDClassId, feats: string[]): number {
  const rogue = classId === "rogue" ? 2 : 0;
  const expert = feats.includes("skill-expert") ? 1 : 0;
  return rogue + expert;
}

export function SkillsExpertiseStep({
  classId,
  backgroundId,
  chosenSkills,
  expertiseSkills,
  setExpertiseSkills,
  feats,
}: {
  classId: DnDClassId;
  backgroundId: string;
  chosenSkills: string[];
  expertiseSkills: string[];
  setExpertiseSkills: (v: string[]) => void;
  feats: string[];
}) {
  const klass = CLASS_MAP[classId];
  const bgSkills = BACKGROUND_MAP[backgroundId]?.skills ?? [];
  const proficient = new Set([...chosenSkills, ...bgSkills]);
  const pool = expertisePool(classId, feats);

  const toggle = (id: string) => {
    if (expertiseSkills.includes(id)) {
      setExpertiseSkills(expertiseSkills.filter((s) => s !== id));
    } else if (expertiseSkills.length < pool) {
      setExpertiseSkills([...expertiseSkills, id]);
    }
  };

  return (
    <StepShell
      title="Skills & Expertise"
      subtitle={`Class and background skills give proficiency (+${klass.name === "Rogue" ? 2 : 0} from ${klass.name}); expertise doubles your proficiency bonus on chosen skills.`}
    >
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <SectionLabel hint={`${expertiseSkills.length} / ${pool} expertise`}>
          Proficient skills — pick up to {pool} for expertise
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DND_SKILLS.map((s) => {
            const prof = proficient.has(s.id);
            const expert = expertiseSkills.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={!prof}
                onClick={() => toggle(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  !prof
                    ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
                    : expert
                      ? "border-violet-600 bg-violet-100 text-violet-800"
                      : "border-amber-600/50 bg-amber-50/50 text-amber-800 hover:bg-amber-50",
                )}
              >
                {s.name}
                {!prof && <span className="ml-1 text-[9px] text-stone-300">—</span>}
                {expert && <span className="ml-1 text-[9px] font-bold text-violet-600">EX</span>}
              </button>
            );
          })}
        </div>
        {pool === 0 && (
          <p className="mt-3 text-xs text-stone-400">
            No expertise available — the Rogue gains two at 1st level, and the Skill Expert feat
            (TCoE) grants one. Choosing a different class or taking that feat enables this.
          </p>
        )}
      </div>
    </StepShell>
  );
}

