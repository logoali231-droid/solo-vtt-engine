import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  type AbilityId,
  type GameSystem,
} from "@/lib/rpg/types";
import {
  PF2E_ANCESTRIES,
  PF2E_BACKGROUNDS,
  PF2E_CLASSES,
  PF2E_HERITAGES,
} from "@/lib/rpg/data/pf2e";
import { ChoiceGrid, SectionLabel, StepShell } from "../ui";
import { dndMod } from "./AbilityScoresStep";

export function AncestryStep({
  ancestryId,
  setAncestryId,
}: {
  ancestryId: string | null;
  setAncestryId: (v: string) => void;
}) {
  return (
    <StepShell
      title="Choose an Ancestry"
      subtitle="Your ancestry grants starting HP, size, speed and two ability boosts."
    >
      <ChoiceGrid
        columns={3}
        items={PF2E_ANCESTRIES.map((a) => ({
          id: a.id,
          title: a.name,
          subtitle: `+2 ${a.boosts.map((b) => ABILITY_LABELS[b]).join(", ")} · ${a.hp} HP · ${a.speed} ft`,
          badge: `${a.size} · ${a.traits.slice(0, 2).join(", ")}`,
        }))}
        selected={ancestryId}
        onSelect={setAncestryId}
      />
    </StepShell>
  );
}

export function HeritageStep({
  ancestryId,
  heritageId,
  setHeritageId,
}: {
  ancestryId: string;
  heritageId: string;
  setHeritageId: (v: string) => void;
}) {
  const options = PF2E_HERITAGES.filter(
    (h) => !h.ancestryId || h.ancestryId === ancestryId,
  );
  return (
    <StepShell
      title="Choose a Heritage"
      subtitle="Heritages refine your ancestry with a specific cultural or physiological gift. Ancestry-specific options unlock based on your pick."
    >
      <ChoiceGrid
        columns={2}
        items={options.map((h) => ({
          id: h.id,
          title: h.name,
          subtitle: h.summary,
          badge: h.ancestryId
            ? `${PF2E_ANCESTRIES.find((a) => a.id === h.ancestryId)?.name} only${h.feat ? ` · ${h.feat}` : ""}`
            : h.feat ?? "All ancestries",
        }))}
        selected={heritageId}
        onSelect={setHeritageId}
      />
    </StepShell>
  );
}

export function PfClassStep({
  classId,
  setClassId,
}: {
  classId: string | null;
  setClassId: (v: string) => void;
}) {
  return (
    <StepShell
      title="Choose a Class"
      subtitle="Your class defines your key ability, Hit Points and trained skills."
    >
      <ChoiceGrid
        columns={3}
        items={PF2E_CLASSES.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: `Key ability ${ABILITY_LABELS[c.keyAbility]} · ${c.hp} HP + ${c.perLevel}/lvl`,
          badge: `Trained: ${c.trainedSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}`,
        }))}
        selected={classId}
        onSelect={setClassId}
      />
    </StepShell>
  );
}

export function PfBackgroundStep({
  backgroundId,
  setBackgroundId,
}: {
  backgroundId: string | null;
  setBackgroundId: (v: string) => void;
}) {
  return (
    <StepShell
      title="Choose a Background"
      subtitle="Backgrounds grant two ability boosts, a skill and a story feature."
    >
      <ChoiceGrid
        columns={3}
        items={PF2E_BACKGROUNDS.map((b) => ({
          id: b.id,
          title: b.name,
          subtitle: b.feature,
          badge: `+2 ${b.boosts.map((x) => ABILITY_LABELS[x]).join(", ")} · ${b.skills.join(", ")}`,
        }))}
        selected={backgroundId}
        onSelect={setBackgroundId}
      />
    </StepShell>
  );
}

export function BoostsStep({
  ancestryId,
  classId,
  backgroundId,
  boosts,
  setBoosts,
}: {
  ancestryId: string;
  classId: string;
  backgroundId: string;
  boosts: AbilityId[];
  setBoosts: (v: AbilityId[]) => void;
  system: GameSystem;
}) {
  const ancestry = PF2E_ANCESTRIES.find((a) => a.id === ancestryId)!;
  const klass = PF2E_CLASSES.find((c) => c.id === classId)!;
  const background = PF2E_BACKGROUNDS.find((b) => b.id === backgroundId)!;

  const autoBoosts = [...ancestry.boosts, klass.keyAbility, ...background.boosts];
  const scoreFor = (a: AbilityId) => {
    const count = autoBoosts.filter((b) => b === a).length + boosts.filter((b) => b === a).length;
    return 10 + 2 * count;
  };

  const setBoostAt = (index: number, value: AbilityId | null) => {
    const next = [...boosts];
    if (value === null) {
      next[index] = null as unknown as AbilityId;
      setBoosts(next.filter(Boolean));
      return;
    }
    // Swap if already assigned in another free slot
    const holder = boosts.indexOf(value);
    if (holder !== -1 && holder !== index) {
      const held = next[index];
      next[holder] = held;
    }
    next[index] = value;
    setBoosts(next);
  };

  return (
    <StepShell
      title="Ability Boosts"
      subtitle={`Assign your 4 free boosts (+2 each). Ancestry, class and background boosts apply automatically: ${autoBoosts.map((b) => ABILITY_LABELS[b]).join(", ")}.`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <SectionLabel>Free boosts (4)</SectionLabel>
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <select
                key={i}
                value={boosts[i] ?? ""}
                onChange={(e) => setBoostAt(i, e.target.value ? (e.target.value as AbilityId) : null)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800"
              >
                <option value="">Choose a boost…</option>
                {ABILITIES.map((a) => (
                  <option key={a} value={a} disabled={boosts.filter((b) => b === a).length >= 1 && boosts[i] !== a}>
                    {ABILITY_LABELS[a]}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-400">
            You cannot apply two free boosts to the same ability.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <SectionLabel>Resulting scores</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {ABILITIES.map((a) => (
              <div key={a} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                <span className="text-xs font-medium text-stone-600">{ABILITY_LABELS[a]}</span>
                <span className="text-sm font-bold text-stone-900">
                  {scoreFor(a)}
                  <span className="ml-1 font-normal text-stone-400">
                    ({dndMod(scoreFor(a)) >= 0 ? "+" : ""}{dndMod(scoreFor(a))})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

export function PfReviewCard({
  name,
  ancestryId,
  heritageId,
  classId,
  backgroundId,
  boosts,
}: {
  system: GameSystem;
  name: string;
  ancestryId: string;
  heritageId?: string;
  classId: string;
  backgroundId: string;
  boosts: AbilityId[];
}) {
  const ancestry = PF2E_ANCESTRIES.find((a) => a.id === ancestryId)!;
  const klass = PF2E_CLASSES.find((c) => c.id === classId)!;
  const background = PF2E_BACKGROUNDS.find((b) => b.id === backgroundId)!;
  const heritage = PF2E_HERITAGES.find((h) => h.id === heritageId);
  const autoBoosts = [...ancestry.boosts, klass.keyAbility, ...background.boosts];
  return (
    <div className={cn("rounded-xl border border-stone-200 bg-white p-5")}>
      <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Pathfinder 2e · {name}</p>
      <div className="mt-3 grid grid-cols-4 gap-3 text-center">
        {[
          ["Ancestry", ancestry.name],
          ["Heritage", heritage?.name ?? "—"],
          ["Class", klass.name],
          ["Background", background.name],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-stone-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[...autoBoosts, ...boosts].map((b, i) => (
          <span key={i} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            +2 {ABILITY_LABELS[b]}
          </span>
        ))}
      </div>
    </div>
  );
}
