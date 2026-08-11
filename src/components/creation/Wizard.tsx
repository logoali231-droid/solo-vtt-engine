import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  SYSTEMS,
  type AbilityId,
  type AdventurePrefs,
  type Character,
  type CharacterIdentity,
  type DnDClassId,
  type GameSystem,
  type InventoryItem,
  type PfRank,
  uid,
} from "@/lib/rpg/types";
import {
  ARMOR_MAP,
  BACKGROUNDS,
  CLASSES,
  CLASS_MAP,
  defaultSubraceId,
  FEAT_MAP,
  RACES,
  raceTotalAsi,
  RACE_MAP,
  SUBRACES,
  subraceOf,
  WEAPON_MAP,
} from "@/lib/rpg/data/dnd";
import { rollDice } from "@/lib/rpg/dice";
import { GURPS_ARMORS } from "@/lib/rpg/data/gurps";
import {
  PF2E_ANCESTRIES,
  PF2E_BACKGROUNDS,
  PF2E_CLASSES,
  PF2E_FEATS,
} from "@/lib/rpg/data/pf2e";
import { Coins, Dices, Flame, ScrollText, Shield, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import AbilityScoresStep, { dndMod } from "./steps/AbilityScoresStep";
import {
  AncestryStep,
  BoostsStep,
  HeritageStep,
  PfBackgroundStep,
  PfClassStep,
  PfFeatsStep,
  PfReviewCard,
  type PfFeatsDraft,
} from "./steps/Pf2eSteps";
import {
  AdvantagesStep,
  AttributesStep,
  DisadvantagesStep,
  GURPS_BUDGET,
  GurpsEquipmentStep,
  GurpsReviewCard,
  SkillsStep,
} from "./steps/GurpsSteps";
import {
  FeatsStep,
  maxFeatSlots,
  SkillsExpertiseStep,
} from "./steps/TalentsStep";
import AdventureSetupStep, { PrefsSummaryChips } from "./steps/AdventureSetupStep";
import IdentityStep from "./steps/IdentityStep";
import { ChoiceGrid, SectionLabel, StepShell, WizardFooter } from "./ui";

interface WizardProps {
  onLock: (character: Character) => void;
  initial?: Character | null;
}

interface DndDraft {
  raceId: string | null;
  subraceId: string | null;
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
  feats: string[];
  expertiseSkills: string[];
  /** Rolled class starting wealth in gp (0 = use the class average). */
  gold: number;
  gear: {
    weapon: string;
    secondWeapon: string | null;
    armor: string;
    shield: boolean;
    packIndex: number;
  };
}

function initialGearFor(classId: DnDClassId | null): DndDraft["gear"] {
  const g = classId ? CLASS_MAP[classId].startingGear : undefined;
  return {
    weapon: g?.defaultWeapon ?? "longsword",
    secondWeapon: g?.defaultSecondWeapon ?? null,
    armor: g?.defaultArmor ?? "none",
    shield: g?.shieldInKit ?? false,
    packIndex: 0,
  };
}

/** PHB average of a starting-wealth roll, e.g. 5d4 × 10 → 120 gp. */
function averageWealth(dice: string, mult: number): number {
  const [count, sides] = dice.split("d").map((n) => parseInt(n, 10));
  const perDie = Math.floor((sides + 1) / 2);
  return (perDie * (count || 1)) * mult;
}

function dndSteps() {
  return ["System", "Identity", "Adventure", "Race", "Subrace", "Class", "Subclass", "Background", "Abilities", "Talents & Feats", "Skills & Expertise", "Starting Gear & Gold", "Review & Lock"];
}
function pf2eSteps() {
  return ["System", "Identity", "Adventure", "Ancestry", "Heritage", "Class", "Background", "Feats", "Ability Boosts", "Review & Lock"];
}
function gurpsSteps() {
  return ["System", "Identity", "Adventure", "Attributes", "Advantages", "Disadvantages", "Skills", "Protection", "Review & Lock"];
}

export default function Wizard({ onLock, initial }: WizardProps) {
  const [system, setSystem] = useState<GameSystem>(initial?.system ?? "dnd5e");
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "Kaelen");
  const [level, setLevel] = useState(initial && initial.system === "dnd5e" ? initial.level : 3);
  const [identity, setIdentity] = useState<Partial<CharacterIdentity>>(
    initial?.identity ?? {},
  );
  const [prefs, setPrefs] = useState<Partial<AdventurePrefs>>(
    initial?.adventurePrefs ?? {},
  );

  // D&D draft
  const [dnd, setDnd] = useState<DndDraft>({
    raceId: null,
    subraceId: null,
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
    feats: [],
    expertiseSkills: [],
    gold: 0,
    gear: initialGearFor(null),
  });

  // PF2e draft
  const [pf2e, setPf2e] = useState<{
    ancestryId: string | null;
    heritageId: string;
    classId: string | null;
    backgroundId: string | null;
    boosts: AbilityId[];
    feats: PfFeatsDraft;
  }>({
    ancestryId: null,
    heritageId: "standard",
    classId: null,
    backgroundId: null,
    boosts: [],
    feats: { ancestry: "", general: "fleet", skill: "assurance" },
  });

  // GURPS draft
  const [gurps, setGurps] = useState<{
    attrs: { st: number; dx: number; iq: number; ht: number };
    advantages: { id: string; points: number }[];
    disadvantages: { id: string; points: number }[];
    skills: { id: string; points: number }[];
    armorId: string;
  }>({ attrs: { st: 10, dx: 12, iq: 12, ht: 11 }, advantages: [], disadvantages: [], skills: [], armorId: "leather-jacket" });

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
    if (step === 2) return true;
    if (system === "dnd5e") {
      if (step === 3) return !!dnd.raceId;
      if (step === 4) return true; // subrace — auto-defaulted; races without one just continue
      if (step === 5) return !!dnd.classId;
      if (step === 6) return !!dnd.subclassId;
      if (step === 7) return !!dnd.backgroundId;
      if (step === 8) {
        if (dnd.buyMode === "array") {
          return Object.values(dnd.arrayAssign).every((v) => v !== null);
        }
        return true;
      }
      if (step === 9) {
        const slots =
          maxFeatSlots(level, dnd.raceId) + (dnd.subraceId === "human-variant" ? 1 : 0);
        return dnd.feats.length <= slots;
      }
      if (step === 10) {
        const pool =
          (dnd.classId === "rogue" ? 2 : 0) + (dnd.feats.includes("skill-expert") ? 1 : 0);
        return dnd.expertiseSkills.length === pool;
      }
      if (step === 11) return true; // gear picks always have valid defaults
      if (step === 12) return true;
    }
    if (system === "pf2e") {
      if (step === 3) return !!pf2e.ancestryId;
      if (step === 4) return true;
      if (step === 5) return !!pf2e.classId;
      if (step === 6) return !!pf2e.backgroundId;
      if (step === 7) return !!pf2e.feats.ancestry;
      if (step === 8) return pf2e.boosts.length === 4;
      if (step === 9) return true;
    }
    if (system === "gurps") {
      const attrsCost =
        (gurps.attrs.st - 10) * 10 +
        (gurps.attrs.dx - 10) * 10 +
        (gurps.attrs.iq - 10) * 10 +
        (gurps.attrs.ht - 10) * 10;
      const refund = gurps.disadvantages.reduce((a, s) => a + s.points, 0); // negative
      const available = GURPS_BUDGET - refund; // disadvantages refund into the budget
      if (step === 3) return true;
      if (step === 4) {
        return attrsCost + gurps.advantages.reduce((a, s) => a + s.points, 0) <= available;
      }
      if (step === 5) return true;
      if (step === 6) return true;
      if (step === 7) return !!gurps.armorId;
      if (step === 8) return true;
    }
    return true;
  }, [step, system, name, level, dnd, pf2e, gurps]);

  // -------------------------------------------------------------------------
  // Character builders
  // -------------------------------------------------------------------------
  function buildDnD(): Character {
    const baseScores = dnd.buyMode === "pointbuy"
      ? { ...dnd.pointBuys }
      : (Object.fromEntries(
          ABILITIES.map((a) => [a, dnd.arrayAssign[a] ?? 8]),
        ) as Record<AbilityId, number>);
    const klass = CLASS_MAP[dnd.classId!];
    const gearDef = klass.startingGear;
    const wealth = klass.startingWealth;
    const gold = dnd.gold || (wealth ? averageWealth(wealth.dice, wealth.mult) : 0);
    // Build the starting inventory: class extras, pack, and any second weapon.
    const startingInventory: InventoryItem[] = [];
    const push = (label: string, qty = 1) =>
      startingInventory.push({ id: uid(), name: label, qty });
    for (const extra of gearDef?.extras ?? []) {
      const m = extra.match(/^(\d+)\s*×\s*(.+)$/);
      push(m ? m[2].trim() : extra, m ? parseInt(m[1], 10) : 1);
    }
    const packLabel = gearDef?.packOptions[dnd.gear.packIndex];
    if (packLabel) push(packLabel);
    if (dnd.gear.secondWeapon) {
      push(WEAPON_MAP[dnd.gear.secondWeapon]?.name ?? dnd.gear.secondWeapon);
    }
    return {
      system: "dnd5e",
      name: name.trim(),
      level,
      identity: { ...identity },
      adventurePrefs: { ...prefs },
      raceId: dnd.raceId!,
      subraceId: dnd.subraceId,
      customOrigin: dnd.customOrigin,
      originFirst: dnd.originFirst,
      originSecond: dnd.originSecond,
      classId: dnd.classId!,
      subclassId: dnd.subclassId!,
      backgroundId: dnd.backgroundId!,
      baseScores,
      chosenSkills: dnd.chosenSkills,
      expertiseSkills: dnd.expertiseSkills,
      feats: dnd.feats,
      weaponId: dnd.gear.weapon,
      armorId: dnd.gear.armor,
      shield: dnd.gear.shield,
      startingGold: gold,
      startingInventory,
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
      heritageId: pf2e.heritageId,
      classId: pf2e.classId!,
      backgroundId: pf2e.backgroundId!,
      scores,
      freeBoosts: pf2e.boosts,
      feats: Object.values(pf2e.feats).filter(Boolean),
      skillRanks,
      saveRanks,
      perceptionRank: "trained" as PfRank,
      armorId: "leather",
      // Player Core: every 1st-level hero starts with 15 gp and the class kit.
      startingGold: 15,
      startingInventory: (klass.startingItems ?? []).map((itemName) => ({
        id: uid(),
        name: itemName,
        qty: 1,
      })),
      identity: { ...identity },
      adventurePrefs: { ...prefs },
      state: { hpDamage: 0, actions: 3, conditions: [] },
    };
  }

  function buildGurps(): Character {
    const spentAttrs =
      (gurps.attrs.st - 10) * 10 + (gurps.attrs.dx - 10) * 10 + (gurps.attrs.iq - 10) * 10 + (gurps.attrs.ht - 10) * 10;
    const spentAdv = gurps.advantages.reduce((a, s) => a + s.points, 0);
    const spentDisadv = gurps.disadvantages.reduce((a, s) => a + s.points, 0);
    const spentSkills = gurps.skills.reduce((a, s) => a + s.points, 0);
    return {
      system: "gurps",
      name: name.trim(),
      attributes: gurps.attrs,
      advantages: gurps.advantages,
      disadvantages: gurps.disadvantages,
      skills: gurps.skills,
      armorId: gurps.armorId,
      identity: { ...identity },
      adventurePrefs: { ...prefs },
      points: { attributes: spentAttrs, advantages: spentAdv, skills: spentSkills, disadvantages: spentDisadv, budget: GURPS_BUDGET },
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
          <div className="mt-5">
            <IdentityStep identity={identity} setIdentity={setIdentity} />
          </div>
        </StepShell>
      );
    }

    if (step === 2) {
      return <AdventureSetupStep prefs={prefs} setPrefs={setPrefs} system={system} />;
    }

    if (system === "dnd5e") {
      if (step === 3) {
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
              onSelect={(id) =>
                patchDnd({ raceId: id, subraceId: defaultSubraceId(id), customOrigin: false })
              }
            />
          </StepShell>
        );
      }
      if (step === 4 && dnd.raceId) {
        const options = SUBRACES.filter((s) => s.raceId === dnd.raceId);
        const current = dnd.subraceId ?? defaultSubraceId(dnd.raceId);
        return (
          <StepShell
            title="Choose a Subrace"
            subtitle="Subraces refine your ancestry — they adjust your ability increases and grant extra traits (e.g. Wood Elf, Hill Dwarf, Human Variant, dragon ancestry)."
          >
            {options.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
                <p className="text-sm font-semibold text-stone-700">
                  {RACE_MAP[dnd.raceId].name} has no subraces
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Continue — the base racial traits already apply.
                </p>
              </div>
            ) : (
              <ChoiceGrid
                columns={options.length > 5 ? 4 : 3}
                items={options.map((s) => ({
                  id: s.id,
                  title: s.name,
                  subtitle: s.blurb,
                  badge: [
                    s.speed ? `${s.speed} ft` : null,
                    Object.entries(s.asi)
                      .filter(([, v]) => v)
                      .map(([a, v]) => `${ABILITY_LABELS[a as AbilityId]} +${v}`)
                      .join(", "),
                    s.variantHuman ? "Feat + skill + two +1s" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—",
                }))}
                selected={current}
                onSelect={(id) =>
                  patchDnd({
                    subraceId: id,
                    // Variant Human and Tasha's Custom Origin are mutually exclusive.
                    customOrigin: id === "human-variant" ? false : dnd.customOrigin,
                  })
                }
              />
            )}
          </StepShell>
        );
      }
      if (step === 5) {
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
                subtitle: `${c.blurb} Core bonuses: ${c.features
                  .filter((f) => f.level <= level)
                  .slice(0, 4)
                  .map((f) => f.name)
                  .join(", ")}${c.features.filter((f) => f.level <= level).length > 4 ? "…" : ""}`,
                badge: `d${c.hitDie} · ${ABILITY_LABELS[c.primaryAbility]}${c.casterType ? ` · ${c.casterType === "pact" ? "pact caster" : c.casterType} caster` : ""}${c.id === "artificer" ? " · TCoE" : ""}`,
                badgeTone: c.id === "artificer" ? "tcoe" : undefined,
              }))}
              selected={dnd.classId}
              onSelect={(id) =>
                patchDnd({
                  classId: id as DnDClassId,
                  subclassId: null,
                  expertiseSkills: [],
                  gear: initialGearFor(id as DnDClassId),
                })
              }
            />
          </StepShell>
        );
      }
      if (step === 6 && dnd.classId) {
        const klass = CLASS_MAP[dnd.classId];
        return (
          <StepShell
            title={`Choose a ${klass.name} Subclass`}
            subtitle="Including the Tasha's Cauldron of Everything subclasses, marked TCoE. Every card lists the mechanical features the subclass grants."
          >
            <ChoiceGrid
              columns={2}
              items={klass.subclasses.map((s) => ({
                id: s.id,
                title: s.name,
                subtitle: `${s.blurb} Bonus features at L${klass.subclassLevel}+: ${s.features
                  .filter((f) => f.level <= level)
                  .map((f) => `${f.name} (L${f.level}) — ${f.summary}`)
                  .join(" · ")}`,
                badge: `${s.features.filter((f) => f.level <= level).length} features · ${s.source}`,
                badgeTone: s.source === "TCoE" ? "tcoe" : s.source === "XGtE" ? "xgte" : undefined,
              }))}
              selected={dnd.subclassId}
              onSelect={(id) => patchDnd({ subclassId: id })}
            />
          </StepShell>
        );
      }
      if (step === 7) {
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
      if (step === 8 && dnd.classId && dnd.backgroundId) {
        return (
          <AbilityScoresStep
            raceId={dnd.raceId!}
            subraceId={dnd.subraceId}
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
      if (step === 9 && dnd.classId) {
        return (
          <FeatsStep
            feats={dnd.feats}
            setFeats={(v) =>
              patchDnd({
                feats: v,
                expertiseSkills: dnd.expertiseSkills.slice(
                  0,
                  (dnd.classId === "rogue" ? 2 : 0) + (v.includes("skill-expert") ? 1 : 0),
                ),
              })
            }
            level={level}
            raceId={dnd.raceId!}
            classId={dnd.classId}
            bonusSlots={dnd.subraceId === "human-variant" ? 1 : 0}
          />
        );
      }
      if (step === 10 && dnd.classId && dnd.backgroundId) {
        return (
          <SkillsExpertiseStep
            classId={dnd.classId}
            backgroundId={dnd.backgroundId}
            chosenSkills={dnd.chosenSkills}
            expertiseSkills={dnd.expertiseSkills}
            setExpertiseSkills={(v) => patchDnd({ expertiseSkills: v })}
            feats={dnd.feats}
          />
        );
      }
      if (step === 11 && dnd.classId) {
        const klass = CLASS_MAP[dnd.classId];
        const gearDef = klass.startingGear;
        const wealth = klass.startingWealth;
        const avg = wealth ? averageWealth(wealth.dice, wealth.mult) : 0;
        const gold = dnd.gold || avg;
        const set = (p: Partial<DndDraft["gear"]>) =>
          patchDnd({ gear: { ...dnd.gear, ...p } });
        return (
          <StepShell
            title="Starting Gear & Gold"
            subtitle={`The ${klass.name} kit from the Player's Handbook — roll your starting wealth, then pick your weapons, armor and pack. Everything here is equipped automatically.`}
          >
            {/* Wealth */}
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <SectionLabel hint={wealth ? `${wealth.dice} × ${wealth.mult} gp` : "Fixed wealth"}>
                Starting wealth
              </SectionLabel>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-3xl font-bold text-amber-700">{gold} gp</p>
                {wealth && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const [count, sides] = wealth.dice.split("d").map((n) => parseInt(n, 10));
                        const rolled =
                          rollDice(count || 1, sides || 4).reduce((a, b) => a + b, 0) * wealth.mult;
                        patchDnd({ gold: rolled });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                    >
                      <Dices className="size-4" /> Roll {wealth.dice} × {wealth.mult}
                    </button>
                    <button
                      type="button"
                      onClick={() => patchDnd({ gold: avg })}
                      className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300"
                    >
                      Take average ({avg} gp)
                    </button>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-stone-400">
                The roll uses the same internal dice engine as the game — reroll as often as you
                like before locking in.
              </p>
            </div>

            {gearDef ? (
              <>
                {/* Weapons */}
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <SectionLabel>Weapon</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {gearDef.weaponOptions.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => set({ weapon: o.id })}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          dnd.gear.weapon === o.id
                            ? "border-amber-600 bg-amber-50 text-amber-900"
                            : "border-stone-200 text-stone-600 hover:border-stone-300",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {gearDef.secondWeaponOptions && (
                    <>
                      <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                        Second weapon
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {gearDef.secondWeaponOptions.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => set({ secondWeapon: o.id })}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              dnd.gear.secondWeapon === o.id
                                ? "border-amber-600 bg-amber-50 text-amber-900"
                                : "border-stone-200 text-stone-600 hover:border-stone-300",
                            )}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Armor */}
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <SectionLabel>Armor</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {gearDef.armorOptions.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => set({ armor: o.id })}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          dnd.gear.armor === o.id
                            ? "border-amber-600 bg-amber-50 text-amber-900"
                            : "border-stone-200 text-stone-600 hover:border-stone-300",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {gearDef.shieldInKit && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={dnd.gear.shield}
                        onChange={(e) => set({ shield: e.target.checked })}
                        className="size-4 accent-amber-600"
                      />
                      Equip a shield (+2 AC)
                    </label>
                  )}
                </div>

                {/* Pack */}
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <SectionLabel hint="Placed in your inventory">Pack</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {gearDef.packOptions.map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => set({ packIndex: i })}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          dnd.gear.packIndex === i
                            ? "border-amber-600 bg-amber-50 text-amber-900"
                            : "border-stone-200 text-stone-600 hover:border-stone-300",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-stone-400">
                    Also packed: {gearDef.extras.join(" · ") || "—"}
                  </p>
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No class kit defined — you'll start with the default equipment.
              </p>
            )}
          </StepShell>
        );
      }
      if (step === 12) {
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
                : dnd.subraceId === "human-variant"
                  ? a === dnd.originFirst || a === dnd.originSecond ? 1 : 0
                  : (raceTotalAsi(dnd.raceId!, dnd.subraceId)[a] ?? 0)) +
              dnd.feats.reduce(
                (sum, f) => sum + (FEAT_MAP[f]?.effects?.asi?.[a] ?? 0),
                0,
              ),
          ]),
        ) as Record<AbilityId, number>;
        return (
          <StepShell
            title="Review & Lock"
            subtitle="Everything checks out? Lock in your character and begin your solo adventure."
          >
            <PrefsSummaryChips prefs={prefs} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <Dices className="size-6" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-stone-900">{name}</p>
                    <p className="text-sm text-stone-500">
                      {subraceOf(dnd.raceId!, dnd.subraceId)?.name ?? race.name} {klass.name} ·{" "}
                      {subclass?.name} · {background.name}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                  {dnd.subraceId === "human-variant" && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Human Variant (+1 {ABILITY_LABELS[dnd.originFirst]}, +1 {ABILITY_LABELS[dnd.originSecond]} · free feat)
                    </span>
                  )}
                  {dnd.feats.map((f) => (
                    <span key={f} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      {FEAT_MAP[f]?.name ?? f}
                    </span>
                  ))}
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
                  {dnd.expertiseSkills.map((s) => (
                    <span key={s} className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                      {s.replace(/-/g, " ")} (expertise)
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
                  <li className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600" /> {dnd.feats.length} feat(s): {dnd.feats.map((f) => FEAT_MAP[f]?.name ?? f).join(", ") || "none"}</li>
                  <li className="flex gap-2"><Coins className="mt-0.5 size-4 shrink-0 text-amber-600" /> Starting gold: {dnd.gold || (klass.startingWealth ? averageWealth(klass.startingWealth.dice, klass.startingWealth.mult) : 0)} gp</li>
                  <li className="flex gap-2"><Flame className="mt-0.5 size-4 shrink-0 text-amber-600" /> Starting gear: {WEAPON_MAP[dnd.gear.weapon]?.name ?? dnd.gear.weapon}{dnd.gear.secondWeapon ? ` + ${WEAPON_MAP[dnd.gear.secondWeapon]?.name ?? dnd.gear.secondWeapon}` : ""} · {ARMOR_MAP[dnd.gear.armor]?.name ?? dnd.gear.armor}{dnd.gear.shield ? " + shield" : ""}</li>
                  <li className="text-xs text-stone-400">Conditions, spell slots and class resources become fully interactive in the game dashboard.</li>
                </ul>
              </div>
            </div>
          </StepShell>
        );
      }
    }

    if (system === "pf2e") {
      if (step === 3) {
        return (
          <AncestryStep
            ancestryId={pf2e.ancestryId}
            setAncestryId={(v) => {
              const firstFeat = PF2E_FEATS.find((f) => f.kind === "ancestry" && f.ancestryId === v)?.id ?? "";
              setPf2e((p) => ({ ...p, ancestryId: v, heritageId: "standard", feats: { ...p.feats, ancestry: firstFeat } }));
            }}
          />
        );
      }
      if (step === 4 && pf2e.ancestryId) {
        return (
          <HeritageStep
            ancestryId={pf2e.ancestryId}
            heritageId={pf2e.heritageId}
            setHeritageId={(v) => setPf2e((p) => ({ ...p, heritageId: v }))}
          />
        );
      }
      if (step === 5) return <PfClassStep classId={pf2e.classId} setClassId={(v) => setPf2e((p) => ({ ...p, classId: v }))} />;
      if (step === 6) return <PfBackgroundStep backgroundId={pf2e.backgroundId} setBackgroundId={(v) => setPf2e((p) => ({ ...p, backgroundId: v }))} />;
      if (step === 7 && pf2e.ancestryId) {
        return (
          <PfFeatsStep
            ancestryId={pf2e.ancestryId}
            feats={pf2e.feats}
            setFeats={(v) => setPf2e((p) => ({ ...p, feats: v }))}
          />
        );
      }
      if (step === 8 && pf2e.ancestryId && pf2e.classId && pf2e.backgroundId) {
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
      if (step === 9 && pf2e.ancestryId && pf2e.classId && pf2e.backgroundId) {
        return (
          <StepShell title="Review & Lock" subtitle="Lock in your Pathfinder hero and begin your adventure.">
            <PrefsSummaryChips prefs={prefs} />
            <PfReviewCard
              system="pf2e"
              name={name}
              ancestryId={pf2e.ancestryId}
              heritageId={pf2e.heritageId}
              classId={pf2e.classId}
              backgroundId={pf2e.backgroundId}
              boosts={pf2e.boosts}
              feats={Object.values(pf2e.feats).filter(Boolean)}
            />
          </StepShell>
        );
      }
    }

    if (system === "gurps") {
      if (step === 3) return <AttributesStep attrs={gurps.attrs} setAttrs={(v) => setGurps((g) => ({ ...g, attrs: v }))} disadvantages={gurps.disadvantages} />;
      if (step === 4) return <AdvantagesStep attrs={gurps.attrs} advantages={gurps.advantages} setAdvantages={(v) => setGurps((g) => ({ ...g, advantages: v }))} disadvantages={gurps.disadvantages} />;
      if (step === 5) return <DisadvantagesStep advantages={gurps.advantages} attrs={gurps.attrs} disadvantages={gurps.disadvantages} setDisadvantages={(v) => setGurps((g) => ({ ...g, disadvantages: v }))} />;
      if (step === 6) return <SkillsStep attrs={gurps.attrs} skills={gurps.skills} setSkills={(v) => setGurps((g) => ({ ...g, skills: v }))} disadvantages={gurps.disadvantages} />;
      if (step === 7) return <GurpsEquipmentStep armorId={gurps.armorId} setArmorId={(v) => setGurps((g) => ({ ...g, armorId: v }))} />;
      if (step === 8) {
        return (
          <StepShell title="Review & Lock" subtitle="Lock in your point-budget hero and begin your adventure.">
            <PrefsSummaryChips prefs={prefs} />
            <GurpsReviewCard
              name={name}
              attrs={gurps.attrs}
              skills={gurps.skills}
              advantages={gurps.advantages}
              disadvantages={gurps.disadvantages}
              armorId={gurps.armorId}
              points={{
                attributes: (gurps.attrs.st - 10) * 10 + (gurps.attrs.dx - 10) * 10 + (gurps.attrs.iq - 10) * 10 + (gurps.attrs.ht - 10) * 10,
                advantages: gurps.advantages.reduce((a, s) => a + s.points, 0),
                skills: gurps.skills.reduce((a, s) => a + s.points, 0),
                disadvantages: gurps.disadvantages.reduce((a, s) => a + s.points, 0),
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
    <div className="flex min-h-screen flex-col bg-[#f7f5f0] text-stone-900 supports-[height:100dvh]:min-h-dvh">
      <header className="flex items-center justify-between border-b border-stone-200/80 bg-white/70 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
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

      {/* Mobile step progress — the step rail is hidden below lg */}
      <div className="flex shrink-0 items-center gap-3 border-b border-stone-200/80 bg-white/60 px-4 py-2 backdrop-blur lg:hidden">
        <span className="shrink-0 text-[11px] font-bold text-stone-500">
          Step {step + 1}
          <span className="font-medium text-stone-300"> / {steps.length}</span>
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-700">{steps[step]}</p>
        <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-amber-600 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

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
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
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
