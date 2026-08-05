import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  SYSTEMS,
  type AbilityId,
  type Character,
  type DnDClassId,
  type GameSystem,
  type PfRank,
} from "@/lib/rpg/types";
import {
  BACKGROUNDS,
  CLASSES,
  CLASS_MAP,
  RACES,
  RACE_MAP,
  WEAPONS,
} from "@/lib/rpg/data/dnd";
import { GURPS_ARMORS } from "@/lib/rpg/data/gurps";
import { PF2E_ANCESTRIES, PF2E_BACKGROUNDS, PF2E_CLASSES } from "@/lib/rpg/data/pf2e";
import { Coins, Dices, Flame, ScrollText, Shield, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import AbilityScoresStep, { dndMod } from "./steps/AbilityScoresStep";
import {
  AncestryStep,
  BoostsStep,
  PfBackgroundStep,
  PfClassStep,
  PfReviewCard,
} from "./steps/Pf2eSteps";
import {
  AttributesStep,
  GURPS_BUDGET,
  GurpsEquipmentStep,
  GurpsReviewCard,
  SkillsStep,
} from "./steps/GurpsSteps";
import { ChoiceGrid, SectionLabel, StepShell, WizardFooter } from "./ui";

interface WizardProps {
  onLock: (character: Character) => void;
  initial?: Character | null;
}

interface DndDraft {
  raceId: string | null;
  customOrigin: boolean;
  originFirst: AbilityId;
  originSecond: AbilityId;
  classId: DnDClassId | null;
  subclassId: string | null;
  backgroundId: string | null;
  buyMode: "pointbuy" | "array";
  pointBuys: Record<AbilityId, number>;
  arrayAssign: Record<AbilityId, number | null>;
  chosenSkills: string[];
}

function dndSteps() {
  return ["System", "Identity", "Race", "Class", "Subclass", "Background", "Abilities & Skills", "Review & Lock"];
}
function pf2eSteps() {
  return ["System", "Identity", "Ancestry", "Class", "Background", "Ability Boosts", "Review & Lock"];
}
function gurpsSteps() {
  return ["System", "Identity", "Attributes", "Skills", "Protection", "Review & Lock"];
}

export default function Wizard({ onLock, initial }: WizardProps) {
  const [system, setSystem] = useState<GameSystem>(initial?.system ?? "dnd5e");
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "Kaelen");
  const [level, setLevel] = useState(initial && initial.system === "dnd5e" ? initial.level : 3);

  // D&D draft
  const [dnd, setDnd] = useState<DndDraft>({
    raceId: null,
    customOrigin: false,
    originFirst: "str",
    originSecond: "dex",
    classId: null,
    subclassId: null,
    backgroundId: null,
    buyMode: "pointbuy",
    pointBuys: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    arrayAssign: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    chosenSkills: [],
  });

  // PF2e draft
  const [pf2e, setPf2e] = useState<{
    ancestryId: string | null;
    classId: string | null;
    backgroundId: string | null;
    boosts: AbilityId[];
  }>({ ancestryId: null, classId: null, backgroundId: null, boosts: [] });

  // GURPS draft
  const [gurps, setGurps] = useState<{
    attrs: { st: number; dx: number; iq: number; ht: number };
    skills: { id: string; points: number }[];
    armorId: string;
  }>({ attrs: { st: 10, dx: 12, iq: 12, ht: 11 }, skills: [], armorId: "leather-jacket" });

  const steps = useMemo(
    () =>
      system === "dnd5e"
        ? dndSteps()
        : system === "pf2e"
          ? pf2eSteps()
          : gurpsSteps(),
    [system],
  );

  const switchSystem = (s: GameSystem) => {
    setSystem(s);
    setStep(0);
  };

  const patchDnd = (p: Partial<DndDraft>) => setDnd((d) => ({ ...d, ...p }));

  // -------------------------------------------------------------------------
  // Validation per step
  // -------------------------------------------------------------------------
  const canContinue = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return name.trim().length >= 2;
    if (system === "dnd5e") {
      if (step === 2) return !!dnd.raceId;
      if (step === 3) return !!dnd.classId;
      if (step === 4) return !!dnd.subclassId;
      if (step === 5) return !!dnd.backgroundId;
      if (step === 6) {
        if (dnd.buyMode === "array") {
          return Object.values(dnd.arrayAssign).every((v) => v !== null);
        }
        return true;
      }
      if (step === 7) return true;
    }
    if (system === "pf2e") {
      if (step === 2) return !!pf2e.ancestryId;
      if (step === 3) return !!pf2e.classId;
      if (step === 4) return !!pf2e.backgroundId;
      if (step === 5) return pf2e.boosts.length === 4;
      if (step === 6) return true;
    }
    if (system === "gurps") {
      if (step === 2) return true;
      if (step === 3) return true;
      if (step === 4) return !!gurps.armorId;
      if (step === 5) return true;
    }
    return true;
  }, [step, system, name, dnd, pf2e, gurps]);

  // -------------------------------------------------------------------------
  // Character builders
  // -------------------------------------------------------------------------
  function buildDnD(): Character {
    const baseScores = dnd.buyMode === "pointbuy"
      ? { ...dnd.pointBuys }
      : (Object.fromEntries(
          ABILITIES.map((a) => [a, dnd.arrayAssign[a] ?? 8]),
        ) as Record<AbilityId, number>);
    return {
      system: "dnd5e",
      name: name.trim(),
      level,
      raceId: dnd.raceId!,
      customOrigin: dnd.customOrigin,
      originFirst: dnd.originFirst,
      originSecond: dnd.originSecond,
      classId: dnd.classId!,
      subclassId: dnd.subclassId!,
      backgroundId: dnd.backgroundId!,
      baseScores,
      chosenSkills: dnd.chosenSkills,
      weaponId: "longsword",
      armorId: "leather",
      shield: false,
      state: {
        hpDamage: 0,
        tempHp: 0,
        resourceUses: {},
        spellSlotsUsed: [],
        pactUsed: 0,
        infusionsUsed: 0,
        conditions: [],
        pending: [],
        damagePending: [],
        activeStatus: [],
      },
    };
  }

  function buildPf2e(): Character {
    const ancestry = PF2E_ANCESTRIES.find((a) => a.id === pf2e.ancestryId)!;
    const klass = PF2E_CLASSES.find((c) => c.id === pf2e.classId)!;
    const background = PF2E_BACKGROUNDS.find((b) => b.id === pf2e.backgroundId)!;
    const auto = [...ancestry.boosts, klass.keyAbility, ...background.boosts];
    const scores = Object.fromEntries(
      ABILITIES.map((a) => [
        a,
        10 + 2 * (auto.filter((b) => b === a).length + pf2e.boosts.filter((b) => b === a).length),
      ]),
    ) as Record<AbilityId, number>;

    const skillRanks: Record<string, PfRank> = {};
    for (const s of [...klass.trainedSkills, ...background.skills]) skillRanks[s] = "trained";
    const saveRanks: Record<AbilityId, PfRank> = {
      str: klass.keyAbility === "str" ? "expert" : "trained",
      dex: klass.keyAbility === "dex" ? "expert" : "trained",
      con: "trained",
      int: klass.keyAbility === "int" ? "expert" : "trained",
      wis: klass.keyAbility === "wis" ? "expert" : "trained",
      cha: klass.keyAbility === "cha" ? "expert" : "trained",
    };

    return {
      system: "pf2e",
      name: name.trim(),
      level: 1,
      ancestryId: pf2e.ancestryId!,
      classId: pf2e.classId!,
      backgroundId: pf2e.backgroundId!,
      scores,
      freeBoosts: pf2e.boosts,
      skillRanks,
      saveRanks,
      perceptionRank: "trained" as PfRank,
      armorId: "leather",
      state: { hpDamage: 0, actions: 3, conditions: [] },
    };
  }

  function buildGurps(): Character {
    const spentAttrs =
      (gurps.attrs.st - 10) * 10 + (gurps.attrs.dx - 10) * 10 + (gurps.attrs.iq - 10) * 10 + (gurps.attrs.ht - 10) * 10;
    const spentSkills = gurps.skills.reduce((a, s) => a + s.points, 0);
    return {
      system: "gurps",
      name: name.trim(),
      attributes: gurps.attrs,
      skills: gurps.skills,
      armorId: gurps.armorId,
      points: { attributes: spentAttrs, skills: spentSkills, budget: GURPS_BUDGET },
      state: { hpDamage: 0, fpDamage: 0, conditions: [] },
    };
  }

  const lock = () => {
    if (system === "dnd5e") onLock(buildDnD());
    else if (system === "pf2e") onLock(buildPf2e());
    else onLock(buildGurps());
  };

  const isLast = step === steps.length - 1;

  // -------------------------------------------------------------------------
  // Step renderers
  // -------------------------------------------------------------------------
  function renderStep() {
    if (step === 0) {
      return (
        <StepShell
          title="Choose your ruleset"
          subtitle="Oraculum enforces the rules of the system you pick. You can switch systems at any time before locking in — the wizard rebuilds around your choice."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {SYSTEMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchSystem(s.id)}
                className={cn(
                  "group rounded-2xl border p-5 text-left transition-all duration-150",
                  system === s.id
                    ? "border-amber-600/60 bg-amber-50 shadow-[0_0_0_1px_rgba(180,120,40,0.35)]"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm",
                )}
              >
                <div className={cn(
                  "mb-4 flex size-10 items-center justify-center rounded-xl",
                  s.id === "dnd5e" ? "bg-red-100 text-red-700" : s.id === "pf2e" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700",
                )}>
                  {s.id === "dnd5e" ? <Dices className="size-5" /> : s.id === "pf2e" ? <Shield className="size-5" /> : <Flame className="size-5" />}
                </div>
                <p className="font-display text-lg font-semibold text-stone-900">{s.name}</p>
                <p className="mt-0.5 text-sm font-medium text-amber-700">{s.tagline}</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">{s.description}</p>
                {system === s.id && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Sparkles className="size-3" /> Selected
                  </span>
                )}
              </button>
            ))}
          </div>
        </StepShell>
      );
    }

    if (step === 1) {
      return (
        <StepShell title="Identity" subtitle="Who is this adventurer?">
          <div className="max-w-md rounded-xl border border-stone-200 bg-white p-5">
            <SectionLabel>Character name</SectionLabel>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kaelen Brightblade"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            {system === "dnd5e" && (
              <div className="mt-4">
                <SectionLabel>Starting level</SectionLabel>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 10, 20].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                        level === l
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-stone-200 text-stone-600 hover:border-stone-300",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-400">
                  Level 3 unlocks every subclass including the TCoE options.
                </p>
              </div>
            )}
          </div>
        </StepShell>
      );
    }

    if (system === "dnd5e") {
      if (step === 2) {
        return (
          <StepShell
            title="Choose a Race"
            subtitle="Core races with their fixed ability increases. Enable Tasha's Custom Origin on the next step to reassign them."
          >
            <ChoiceGrid
              columns={3}
              items={RACES.map((r) => ({
                id: r.id,
                title: r.name,
                subtitle: r.blurb,
                badge: `${r.size} · ${r.speed} ft · ${Object.entries(r.asi).filter(([, v]) => v).map(([a, v]) => `${ABILITY_LABELS[a as AbilityId]} +${v}`).join(", ")}`,
              }))}
              selected={dnd.raceId}
              onSelect={(id) => patchDnd({ raceId: id })}
            />
          </StepShell>
        );
      }
      if (step === 3) {
        return (
          <StepShell
            title="Choose a Class"
            subtitle="All twelve core classes plus the Tasha's Cauldron of Everything class — the Artificer."
          >
            <ChoiceGrid
              columns={3}
              items={CLASSES.map((c) => ({
                id: c.id,
                title: c.name,
                subtitle: c.blurb,
                badge: `d${c.hitDie} · ${ABILITY_LABELS[c.primaryAbility]}${c.casterType ? ` · ${c.casterType === "pact" ? "pact caster" : c.casterType} caster` : ""}${c.id === "artificer" ? " · TCoE" : ""}`,
                badgeTone: c.id === "artificer" ? "tcoe" : undefined,
              }))}
              selected={dnd.classId}
              onSelect={(id) => patchDnd({ classId: id as DnDClassId, subclassId: null })}
            />
          </StepShell>
        );
      }
      if (step === 4 && dnd.classId) {
        const klass = CLASS_MAP[dnd.classId];
        return (
          <StepShell
            title={`Choose a ${klass.name} Subclass`}
            subtitle="Including the Tasha's Cauldron of Everything subclasses, marked TCoE."
          >
            <ChoiceGrid
              columns={3}
              items={klass.subclasses.map((s) => ({
                id: s.id,
                title: s.name,
                subtitle: s.blurb,
                badge: s.source,
                badgeTone: s.source === "TCoE" ? "tcoe" : s.source === "XGtE" ? "xgte" : undefined,
              }))}
              selected={dnd.subclassId}
              onSelect={(id) => patchDnd({ subclassId: id })}
            />
          </StepShell>
        );
      }
      if (step === 5) {
        return (
          <StepShell
            title="Choose a Background"
            subtitle="Your background grants two skill proficiencies and a story feature."
          >
            <ChoiceGrid
              columns={2}
              items={BACKGROUNDS.map((b) => ({
                id: b.id,
                title: b.name,
                subtitle: `${b.blurb} Feature: ${b.feature.name} — ${b.feature.summary}`,
                badge: b.skills.map((s) => s.replace(/-/g, " ")).join(", "),
              }))}
              selected={dnd.backgroundId}
              onSelect={(id) => patchDnd({ backgroundId: id })}
            />
          </StepShell>
        );
      }
      if (step === 6 && dnd.classId && dnd.backgroundId) {
        return (
          <AbilityScoresStep
            raceId={dnd.raceId!}
            customOrigin={dnd.customOrigin}
            setCustomOrigin={(v) => patchDnd({ customOrigin: v })}
            originFirst={dnd.originFirst}
            setOriginFirst={(v) => patchDnd({ originFirst: v })}
            originSecond={dnd.originSecond}
            setOriginSecond={(v) => patchDnd({ originSecond: v })}
            buyMode={dnd.buyMode}
            setBuyMode={(v) => patchDnd({ buyMode: v })}
            pointBuys={dnd.pointBuys}
            setPointBuys={(v) => patchDnd({ pointBuys: v })}
            arrayAssign={dnd.arrayAssign}
            setArrayAssign={(v) => patchDnd({ arrayAssign: v })}
            classId={dnd.classId}
            backgroundId={dnd.backgroundId}
            chosenSkills={dnd.chosenSkills}
            setChosenSkills={(v) => patchDnd({ chosenSkills: v })}
          />
        );
      }
      if (step === 7) {
        const klass = CLASS_MAP[dnd.classId!];
        const race = RACE_MAP[dnd.raceId!];
        const subclass = klass.subclasses.find((s) => s.id === dnd.subclassId);
        const background = BACKGROUNDS.find((b) => b.id === dnd.backgroundId)!;
        const scores = (dnd.buyMode === "pointbuy"
          ? { ...dnd.pointBuys }
          : (Object.fromEntries(ABILITIES.map((a) => [a, dnd.arrayAssign[a] ?? 8])) as Record<AbilityId, number>));
        const final = Object.fromEntries(
          ABILITIES.map((a) => [
            a,
            scores[a] +
              (dnd.customOrigin
                ? a === dnd.originFirst ? 2 : a === dnd.originSecond ? 1 : 0
                : (race.asi[a] ?? 0)),
          ]),
        ) as Record<AbilityId, number>;
        return (
          <StepShell
            title="Review & Lock"
            subtitle="Everything checks out? Lock in your character and begin your solo adventure."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <Dices className="size-6" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-stone-900">{name}</p>
                    <p className="text-sm text-stone-500">
                      {race.name} {klass.name} · {subclass?.name} · {background.name}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-2">
                  {ABILITIES.map((a) => (
                    <div key={a} className="rounded-lg bg-stone-50 p-2 text-center">
                      <p className="text-[10px] font-bold uppercase text-stone-400">{a}</p>
                      <p className="text-base font-bold text-stone-900">{final[a]}</p>
                      <p className="text-[10px] text-stone-500">
                        {dndMod(final[a]) >= 0 ? "+" : ""}{dndMod(final[a])}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dnd.customOrigin && (
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Tasha's Custom Origin (+2 {ABILITY_LABELS[dnd.originFirst]}, +1 {ABILITY_LABELS[dnd.originSecond]})
                    </span>
                  )}
                  {dnd.chosenSkills.map((s) => (
                    <span key={s} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                      {s.replace(/-/g, " ")}
                    </span>
                  ))}
                  {background.skills.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {s.replace(/-/g, " ")} (bg)
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">You will carry into the adventure</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li className="flex gap-2"><ScrollText className="mt-0.5 size-4 shrink-0 text-amber-600" /> Level {level} · d{klass.hitDie} hit dice · proficiency +{(level <= 4 ? 2 : level <= 8 ? 3 : level <= 12 ? 4 : level <= 16 ? 5 : 6)}</li>
                  <li className="flex gap-2"><Shield className="mt-0.5 size-4 shrink-0 text-amber-600" /> Saves: {klass.saves.map((s) => ABILITY_LABELS[s]).join(", ")}</li>
                  <li className="flex gap-2"><Coins className="mt-0.5 size-4 shrink-0 text-amber-600" /> {subclass?.features.filter((f) => f.level <= level).length ?? 0} subclass feature(s) available</li>
                  <li className="flex gap-2"><Flame className="mt-0.5 size-4 shrink-0 text-amber-600" /> Starting weapon: {WEAPONS.find((w) => w.id === "longsword")?.name}</li>
                  <li className="text-xs text-stone-400">Conditions, spell slots and class resources become fully interactive in the game dashboard.</li>
                </ul>
              </div>
            </div>
          </StepShell>
        );
      }
    }

    if (system === "pf2e") {
      if (step === 2) return <AncestryStep ancestryId={pf2e.ancestryId} setAncestryId={(v) => setPf2e((p) => ({ ...p, ancestryId: v }))} />;
      if (step === 3) return <PfClassStep classId={pf2e.classId} setClassId={(v) => setPf2e((p) => ({ ...p, classId: v }))} />;
      if (step === 4) return <PfBackgroundStep backgroundId={pf2e.backgroundId} setBackgroundId={(v) => setPf2e((p) => ({ ...p, backgroundId: v }))} />;
      if (step === 5 && pf2e.ancestryId && pf2e.classId && pf2e.backgroundId) {
        return (
          <BoostsStep
            ancestryId={pf2e.ancestryId}
            classId={pf2e.classId}
            backgroundId={pf2e.backgroundId}
            boosts={pf2e.boosts}
            setBoosts={(v) => setPf2e((p) => ({ ...p, boosts: v }))}
            system="pf2e"
          />
        );
      }
      if (step === 6 && pf2e.ancestryId && pf2e.classId && pf2e.backgroundId) {
        return (
          <StepShell title="Review & Lock" subtitle="Lock in your Pathfinder hero and begin your adventure.">
            <PfReviewCard
              system="pf2e"
              name={name}
              ancestryId={pf2e.ancestryId}
              classId={pf2e.classId}
              backgroundId={pf2e.backgroundId}
              boosts={pf2e.boosts}
            />
          </StepShell>
        );
      }
    }

    if (system === "gurps") {
      if (step === 2) return <AttributesStep attrs={gurps.attrs} setAttrs={(v) => setGurps((g) => ({ ...g, attrs: v }))} />;
      if (step === 3) return <SkillsStep attrs={gurps.attrs} skills={gurps.skills} setSkills={(v) => setGurps((g) => ({ ...g, skills: v }))} />;
      if (step === 4) return <GurpsEquipmentStep armorId={gurps.armorId} setArmorId={(v) => setGurps((g) => ({ ...g, armorId: v }))} />;
      if (step === 5) {
        return (
          <StepShell title="Review & Lock" subtitle="Lock in your point-budget hero and begin your adventure.">
            <GurpsReviewCard
              name={name}
              attrs={gurps.attrs}
              skills={gurps.skills}
              armorId={gurps.armorId}
              points={{
                attributes: (gurps.attrs.st - 10) * 10 + (gurps.attrs.dx - 10) * 10 + (gurps.attrs.iq - 10) * 10 + (gurps.attrs.ht - 10) * 10,
                skills: gurps.skills.reduce((a, s) => a + s.points, 0),
                budget: GURPS_BUDGET,
              }}
            />
            <div className="text-xs text-stone-400">
              {GURPS_ARMORS.find((a) => a.id === gurps.armorId)?.name} provides DR{" "}
              {GURPS_ARMORS.find((a) => a.id === gurps.armorId)?.dr ?? 0} against incoming damage.
            </div>
          </StepShell>
        );
      }
    }

    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f0] text-stone-900">
      <header className="flex items-center justify-between border-b border-stone-200/80 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
            <Dices className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight">Oraculum</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
              Phase 1 · Character Creation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span className="hidden sm:inline">Two-phase engine · Wizard → VTT</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Step rail */}
        <aside className="hidden w-60 shrink-0 border-r border-stone-200/80 bg-white/50 px-4 py-6 lg:block">
          <nav className="flex flex-col gap-1">
            {steps.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => (done ? setStep(i) : undefined)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    current
                      ? "bg-amber-100/70 font-semibold text-amber-900"
                      : done
                        ? "text-stone-600 hover:bg-stone-100"
                        : "text-stone-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      current
                        ? "bg-amber-600 text-white"
                        : done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-400",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
          <p className="mt-6 rounded-lg bg-stone-100/70 p-3 text-[11px] leading-relaxed text-stone-500">
            Your choices serialize into a strict JSON payload that feeds the game's rule engine and Game Master.
          </p>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-4xl pb-24">{renderStep()}</div>
        </main>
      </div>

      <WizardFooter
        canContinue={canContinue}
        onBack={() => setStep(Math.max(0, step - 1))}
        onContinue={() => (isLast ? lock() : setStep(step + 1))}
        isLast={isLast}
      />
    </div>
  );
}
