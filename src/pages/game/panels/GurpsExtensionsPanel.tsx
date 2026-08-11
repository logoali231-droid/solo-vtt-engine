import { cn } from "@/lib/utils";
import type {
  DiceResult,
  GmLanguage,
  GurpsCharacter,
  GurpsExtensionState,
  Wallet,
} from "@/lib/rpg/types";
import type { GurpsDerived } from "@/lib/rpg/character";
import {
  GURPS_BUSINESSES,
  GURPS_BUSINESS_MAP,
  GURPS_CORP_LADDER,
  GURPS_CORP_RANK_MAP,
  GURPS_COURT_POSITIONS,
  GURPS_COURT_POSITION_MAP,
  GURPS_CYBERWARE,
  GURPS_CYBERWARE_MAP,
  GURPS_DEGREES,
  GURPS_DEGREE_MAP,
  GURPS_HACK_MAP,
  GURPS_HACK_TARGETS,
  GURPS_HOLDINGS,
  GURPS_HOLDING_MAP,
  GURPS_JOBS,
  GURPS_JOB_MAP,
  GURPS_NETDECKS,
  GURPS_NETDECK_MAP,
  GURPS_NOBLE_TITLES,
  GURPS_PROGRAMS,
  GURPS_PROGRAM_MAP,
  GURPS_RELATIONSHIP_MAP,
  GURPS_RELATIONSHIP_STAGES,
  GURPS_SOCIAL_CIRCLES,
  GURPS_SOCIAL_CIRCLE_MAP,
  GURPS_SOCIAL_EVENTS,
  GURPS_SOCIAL_EVENT_MAP,
  GURPS_TITLE_MAP,
  GURPS_UNIVERSITIES,
  GURPS_UNIVERSITY_MAP,
  GURPS_WEALTH_MAP,
  GURPS_WEALTH_TIERS,
  gurpsBusinessResult,
  gurpsCorpSalary,
  gurpsCostOfLiving,
  gurpsCourtSalary,
  gurpsEventRep,
  gurpsHackBonus,
  gurpsJobPay,
  gurpsMonthlyIncome,
  gurpsReactionModifiers,
  gurpsStudyGain,
  gurpsTitleIncome,
  gurpsTraceDefense,
} from "@/lib/rpg/data/gurps-extensions";
import type { RollRequest } from "../types";
import {
  BookOpen,
  Briefcase,
  Building2,
  Castle,
  Check,
  ChevronDown,
  Coins,
  Cpu,
  Crown,
  GraduationCap,
  Heart,
  Landmark,
  Minus,
  Network,
  Plus,
  Shield,
  Sparkles,
  Store,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Props {
  character: GurpsCharacter;
  derived: GurpsDerived;
  /** Roll through the real engine — returns the resolved dice synchronously. */
  onRoll: (request: RollRequest) => DiceResult | undefined;
  /** Persist a slice of the extension state on the character. */
  onExt: (patch: Partial<GurpsExtensionState>) => void;
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
  gmLanguage?: GmLanguage;
}

/** Skill level from the derived sheet (exact), else the raw-stat default. */
function skillLevel(d: GurpsDerived, c: GurpsCharacter, id: string, fallback: "st" | "dx" | "iq" | "ht"): number {
  const trained = d.skills.find((s) => s.id === id);
  return trained ? trained.level : c.attributes[fallback] - 5;
}

function Section({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-amber-900/40 bg-[#14110b]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#1c1810]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-amber-500">{icon}</span>
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-200">{title}</span>
            {subtitle && <span className="block text-[9px] text-amber-600/60">{subtitle}</span>}
          </span>
        </span>
        <ChevronDown className={cn("size-3.5 text-amber-600 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-amber-900/40 px-3 py-3">{children}</div>}
    </div>
  );
}

function Pill({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "emerald" | "red" | "slate" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        tone === "amber" && "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30",
        tone === "emerald" && "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
        tone === "red" && "bg-red-500/10 text-red-300 ring-1 ring-red-500/30",
        tone === "slate" && "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/30",
      )}
    >
      {children}
    </span>
  );
}

const EMPTY_EXT: GurpsExtensionState = {
  jobId: undefined,
  wealthTierId: undefined,
  businessId: undefined,
  cyberware: [],
  relationshipStage: undefined,
  relationshipName: undefined,
  holdingId: undefined,
  universityId: undefined,
  degreeId: undefined,
  studyProgress: 0,
  graduated: false,
  studentDebt: 0,
  scholarship: false,
  reputation: 0,
  socialCircleId: undefined,
  contacts: [],
  titleId: undefined,
  courtPositionId: undefined,
  netdeckId: undefined,
  programs: [],
  corpPositionId: undefined,
};

export default function GurpsExtensionsPanel({
  character: c,
  derived: d,
  onRoll,
  onExt,
  wallet,
  onWalletChange,
}: Props) {
  const ext: GurpsExtensionState = { ...EMPTY_EXT, ...c.ext };
  const [result, setResult] = useState<string | null>(null);

  const credit = (gp: number) => {
    if (!wallet || !onWalletChange) return;
    onWalletChange({ ...wallet, gp: Math.max(0, wallet.gp + gp) });
  };
  const debit = (gp: number): boolean => {
    if (!wallet || !onWalletChange) return false;
    if (wallet.gp < gp) return false;
    onWalletChange({ ...wallet, gp: wallet.gp - gp });
    return true;
  };

  const report = (msg: string) => setResult(msg);

  // --- Jobs ---
  const job = ext.jobId ? GURPS_JOB_MAP[ext.jobId] : undefined;
  const workMonth = () => {
    if (!job) return;
    const target = skillLevel(d, c, job.skill, job.fallbackStat);
    const dice = onRoll({ label: `Job: ${job.name} (skill ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    const { pay, label, kept } = gurpsJobPay(job, dice.margin ?? 0, dice.outcome, ext.wealthTierId);
    if (pay > 0) credit(pay);
    if (!kept) onExt({ jobId: undefined });
    report(
      `${label} — ${pay > 0 ? `+${pay} gp to your purse` : "no pay"}. ${dice.breakdown}`,
    );
  };

  // --- Economics ---
  const tier = ext.wealthTierId ? GURPS_WEALTH_MAP[ext.wealthTierId] : undefined;
  const income = gurpsMonthlyIncome(ext.wealthTierId);
  const living = gurpsCostOfLiving(ext.wealthTierId);

  // --- Love ---
  const rawStageIdx = ext.relationshipStage
    ? GURPS_RELATIONSHIP_STAGES.findIndex((s) => s.id === ext.relationshipStage)
    : 0; // unset defaults to Strangers — the first rung of the ladder
  const stageIdx = rawStageIdx < 0 ? 0 : rawStageIdx;
  const currentStage = stageIdx >= 0 ? GURPS_RELATIONSHIP_STAGES[stageIdx] : undefined;
  const nextStage = stageIdx >= 0 && stageIdx < GURPS_RELATIONSHIP_STAGES.length - 1
    ? GURPS_RELATIONSHIP_STAGES[stageIdx + 1]
    : undefined;
  const reactionMod = gurpsReactionModifiers(c);
  const advanceLove = () => {
    if (!nextStage) {
      report("You are already committed partners — the bond only deepens with time.");
      return;
    }
    const target = Math.max(3, nextStage.target + reactionMod);
    const dice = onRoll({
      label: `Reaction roll — ${nextStage.name} (target ${target})`,
      kind: "check",
      gurpsTarget: target,
    });
    if (!dice) return;
    const ok = dice.outcome === "success" || dice.outcome === "critical-success";
    if (dice.outcome === "critical-failure") {
      onExt({ relationshipStage: stageIdx > 0 ? GURPS_RELATIONSHIP_STAGES[stageIdx - 1].id : undefined });
      report(`A terrible misunderstanding — the relationship cools. ${dice.breakdown}`);
    } else if (ok && dice.outcome === "critical-success") {
      const jump = Math.min(GURPS_RELATIONSHIP_STAGES.length - 1, stageIdx + 2);
      onExt({ relationshipStage: GURPS_RELATIONSHIP_STAGES[jump].id });
      report(`A rare and perfect moment — the relationship leaps forward to ${GURPS_RELATIONSHIP_STAGES[jump].name}! ${dice.breakdown}`);
    } else if (ok) {
      onExt({ relationshipStage: nextStage.id });
      report(`The bond deepens — you are now ${nextStage.name.toLowerCase()}. ${dice.breakdown}`);
    } else {
      report(`Not yet — the moment passes without catching. ${dice.breakdown}`);
    }
  };

  // --- Business ---
  const biz = ext.businessId ? GURPS_BUSINESS_MAP[ext.businessId] : undefined;
  const startBusiness = (id: string) => {
    const def = GURPS_BUSINESS_MAP[id];
    if (!def) return;
    if (debit(def.startupCost)) {
      onExt({ businessId: id });
      report(`You open ${def.name} — ${def.startupCost} gp invested.`);
    } else {
      report(`Not enough coin — ${def.name} needs ${def.startupCost} gp to start.`);
    }
  };
  const runBusiness = () => {
    if (!biz) return;
    const target = skillLevel(d, c, biz.skill, "iq");
    const dice = onRoll({ label: `Business: ${biz.name} (skill ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    const { profit, label } = gurpsBusinessResult(biz, dice.margin ?? 0, dice.outcome);
    if (profit >= 0) credit(profit);
    else {
      // A loss can exceed the purse — clamp at zero and note the shortfall.
      const available = wallet?.gp ?? 0;
      const paid = Math.min(available, -profit);
      credit(-paid);
      report(`${label} — the books close ${profit >= 0 ? `+${profit}` : profit} gp${profit < 0 && -profit > available ? ` (${-profit - available} gp of debt carried)` : ""}. ${dice.breakdown}`);
    }
  };

  // --- Cyber ---
  const hackLevel = skillLevel(d, c, "hacking", "iq");
  const hackTarget = (id: string) => {
    const def = GURPS_HACK_MAP[id];
    if (!def) return;
    const bonus = gurpsHackBonus(ext.netdeckId, ext.programs);
    const target = Math.max(3, hackLevel + bonus + def.penalty);
    const dice = onRoll({ label: `Hack ${def.name} (target ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    if (dice.outcome === "critical-failure") {
      const traceDef = gurpsTraceDefense(ext.programs);
      report(`Trace detected — you jack out with the system screaming after you${traceDef > 0 ? ` (your ${traceDef} trace-defense programs bought you seconds)` : ""}. ${dice.breakdown}`);
    } else if (dice.outcome === "success" || dice.outcome === "critical-success") {
      report(`Breach successful — ${def.summary} is now yours. ${dice.breakdown}`);
    } else {
      report(`ICE holds. You bounce off the wall without getting in. ${dice.breakdown}`);
    }
  };
  const buyCyberware = (id: string) => {
    const def = GURPS_CYBERWARE_MAP[id];
    if (!def) return;
    if (ext.cyberware.includes(id)) return;
    if (debit(def.cost)) {
      onExt({ cyberware: [...ext.cyberware, id] });
      report(`${def.name} installed${def.dr ? ` (+${def.dr} DR)` : ""}.`);
    } else {
      report(`Not enough coin — ${def.name} costs ${def.cost} gp.`);
    }
  };

  // --- Medieval ---
  const holding = ext.holdingId ? GURPS_HOLDING_MAP[ext.holdingId] : undefined;
  const claimHolding = (id: string) => {
    onExt({ holdingId: id });
    const def = GURPS_HOLDING_MAP[id];
    report(def ? `You take stewardship of ${def.name}.` : "");
  };
  const harvest = () => {
    if (!holding) return;
    const target = skillLevel(d, c, holding.skill, "iq");
    const dice = onRoll({ label: `Harvest: ${holding.name} (skill ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    if (dice.outcome === "success" || dice.outcome === "critical-success") {
      const pay = dice.outcome === "critical-success" ? holding.income * 2 : holding.income;
      credit(pay);
      report(`A ${dice.outcome === "critical-success" ? "bountiful" : "good"} season — the holding yields +${pay} gp. ${dice.breakdown}`);
    } else if (dice.outcome === "critical-failure") {
      report(`A disaster season — blight, theft, or ruin strikes the holding. ${dice.breakdown}`);
    } else {
      report(`A lean season — the holding yields nothing this cycle. ${dice.breakdown}`);
    }
  };

  // --- Education ---
  const university = ext.universityId ? GURPS_UNIVERSITY_MAP[ext.universityId] : undefined;
  const degree = ext.degreeId ? GURPS_DEGREE_MAP[ext.degreeId] : undefined;
  const progress = Math.min(100, Math.max(0, ext.studyProgress ?? 0));
  const enroll = (id: string) => {
    const def = GURPS_UNIVERSITY_MAP[id];
    if (!def) return;
    if (ext.scholarship) {
      onExt({ universityId: id });
      report(`Your scholarship covers tuition — you enroll at ${def.name}.`);
      return;
    }
    if (debit(def.tuition)) {
      onExt({ universityId: id, studentDebt: 0 });
      report(`You enroll at ${def.name} — ${def.tuition} gp tuition paid.`);
    } else {
      onExt({ universityId: id, studentDebt: def.tuition });
      report(`You enroll at ${def.name} on credit — ${def.tuition} gp added to your student debt.`);
    }
  };
  const study = () => {
    if (!degree) return;
    if (ext.graduated) return;
    const target = skillLevel(d, c, degree.studySkill, degree.fallbackStat);
    const dice = onRoll({ label: `Study: ${degree.name} (skill ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    const gain = gurpsStudyGain(dice.margin ?? 0, dice.outcome);
    const next = Math.min(100, Math.max(0, progress + gain));
    onExt({ studyProgress: next });
    if (gain > 0) report(`Study session complete — exam progress ${progress}% → ${next}%. ${dice.breakdown}`);
    else if (gain < 0) report(`A rough session — you lose focus and slip to ${next}%. ${dice.breakdown}`);
    else report(`The material resists you today — progress stays at ${next}%. ${dice.breakdown}`);
  };
  const sitExam = () => {
    if (!degree || !university) return;
    if (ext.graduated) return;
    if (progress < 100) {
      report("You cannot sit the exam yet — study until your progress reaches 100%.");
      return;
    }
    const target = skillLevel(d, c, university.examSkill, university.fallbackStat);
    const examTarget = Math.max(3, Math.min(18, degree.examTarget));
    const dice = onRoll({ label: `Final exam: ${degree.name} (target ${target} vs ${examTarget})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    const pass = dice.outcome === "success" || dice.outcome === "critical-success";
    const honors = dice.outcome === "critical-success";
    if (pass) {
      onExt({ graduated: true, studyProgress: 0 });
      const bonus = degree.skillBonus ? ` +${degree.skillBonus.bonus} to ${degree.skillBonus.skill.replace(/-/g, " ")}` : "";
      report(`You ${honors ? "graduate with honors" : "graduate"} in ${degree.name}!${bonus} ${dice.breakdown}`);
    } else {
      onExt({ studyProgress: 50 });
      report(`The exam defeats you — you must restudy from 50%. ${dice.breakdown}`);
    }
  };

  // --- Social life ---
  const rep = Math.min(100, Math.max(0, ext.reputation ?? 0));
  const repLabel = rep >= 80 ? "Renowned" : rep >= 55 ? "Well known" : rep >= 30 ? "Known" : rep >= 10 ? "Familiar" : "Unknown";
  const attendEvent = (id: string) => {
    const ev = GURPS_SOCIAL_EVENT_MAP[id];
    if (!ev) return;
    if (!debit(ev.cost)) {
      report(`You cannot afford ${ev.name} — it costs ${ev.cost} gp.`);
      return;
    }
    const target = skillLevel(d, c, ev.skill, ev.fallbackStat);
    const circleMod = ext.socialCircleId ? GURPS_SOCIAL_CIRCLE_MAP[ext.socialCircleId]?.reactionMod ?? 0 : 0;
    const dice = onRoll({ label: `Attend ${ev.name} (skill ${target}${circleMod ? ` +${circleMod}` : ""})`, kind: "check", gurpsTarget: target + circleMod });
    if (!dice) return;
    const delta = gurpsEventRep(dice.margin ?? 0, dice.outcome, ev.repBase);
    const next = Math.min(100, Math.max(0, rep + delta));
    onExt({ reputation: next });
    if (delta > 0) report(`You shine at ${ev.name} — reputation +${delta} (now ${next}). ${dice.breakdown}`);
    else if (delta < 0) report(`A scandal at ${ev.name} — reputation ${delta} (now ${next}). ${dice.breakdown}`);
    else report(`You attend ${ev.name} without making waves — reputation ${next}. ${dice.breakdown}`);
  };
  const addContact = () => {
    const name = window.prompt("New contact's name / role:");
    if (!name?.trim()) return;
    onExt({ contacts: [...(ext.contacts ?? []), name.trim()] });
    report(`You add ${name.trim()} to your contacts.`);
  };

  // --- Medieval deep: title & court ---
  const titleIncome = gurpsTitleIncome(ext.titleId);
  const courtSalary = gurpsCourtSalary(ext.courtPositionId);
  const courtPos = ext.courtPositionId ? GURPS_COURT_POSITION_MAP[ext.courtPositionId] : undefined;
  const buyTitle = (id: string) => {
    const def = GURPS_TITLE_MAP[id];
    if (!def) return;
    if (debit(def.cost)) {
      onExt({ titleId: id });
      report(`You are granted the title of ${def.name} — ${def.cost} gp changes hands.`);
    } else {
      report(`Not enough coin — the rank of ${def.name} costs ${def.cost} gp.`);
    }
  };
  const serveCourt = () => {
    if (!courtPos) return;
    const target = skillLevel(d, c, courtPos.skill, courtPos.fallbackStat);
    const dice = onRoll({ label: `Serve as ${courtPos.name} (skill ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    if (dice.outcome === "success" || dice.outcome === "critical-success") {
      const pay = dice.outcome === "critical-success" ? courtSalary * 2 : courtSalary;
      credit(pay);
      report(`A fine month of service as ${courtPos.name} — +${pay} gp. ${dice.breakdown}`);
    } else if (dice.outcome === "critical-failure") {
      onExt({ courtPositionId: undefined });
      report(`A terrible blunder — you are dismissed from court. ${dice.breakdown}`);
    } else {
      report(`A quiet month at court — no salary this cycle. ${dice.breakdown}`);
    }
  };

  // --- Cyber deep: deck, programs, corp ladder ---
  const hackBonusTotal = gurpsHackBonus(ext.netdeckId, ext.programs);
  const traceDef = gurpsTraceDefense(ext.programs);
  const corpRank = ext.corpPositionId ? GURPS_CORP_RANK_MAP[ext.corpPositionId] : undefined;
  const rankIdx = ext.corpPositionId ? GURPS_CORP_LADDER.findIndex((r) => r.id === ext.corpPositionId) : -1;
  const nextRank = rankIdx >= 0 && rankIdx < GURPS_CORP_LADDER.length - 1 ? GURPS_CORP_LADDER[rankIdx + 1] : undefined;
  const buyDeck = (id: string) => {
    const def = GURPS_NETDECK_MAP[id];
    if (!def) return;
    if (debit(def.cost)) {
      onExt({ netdeckId: id });
      report(`${def.name} acquired${def.hackBonus ? ` (+${def.hackBonus} Hacking)` : ""}.`);
    } else {
      report(`Not enough coin — ${def.name} costs ${def.cost} gp.`);
    }
  };
  const installProgram = (id: string) => {
    const def = GURPS_PROGRAM_MAP[id];
    if (!def) return;
    if (ext.programs.includes(id)) return;
    if (debit(def.cost)) {
      onExt({ programs: [...ext.programs, id] });
      report(`${def.name} loaded${def.hackBonus ? ` (+${def.hackBonus} Hacking)` : ""}${def.defenseBonus ? ` (+${def.defenseBonus} trace defense)` : ""}.`);
    } else {
      report(`Not enough coin — ${def.name} costs ${def.cost} gp.`);
    }
  };
  const pursuePromotion = () => {
    if (!nextRank) {
      report("You are at the top of the ladder — the executive floor is yours.");
      return;
    }
    const target = skillLevel(d, c, "administration", "iq");
    const dice = onRoll({ label: `Promotion to ${nextRank.name} (skill ${target} vs ${nextRank.target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    if (dice.outcome === "critical-failure") {
      if (rankIdx > 0) {
        const demoted = GURPS_CORP_LADDER[rankIdx - 1];
        onExt({ corpPositionId: demoted.id });
        report(`Your bid backfires catastrophically — you are demoted to ${demoted.name}. ${dice.breakdown}`);
      } else {
        report(`Your bid backfires — the office cools toward you. ${dice.breakdown}`);
      }
    } else if (dice.outcome === "success" || dice.outcome === "critical-success") {
      onExt({ corpPositionId: nextRank.id });
      report(`Promoted to ${nextRank.name}! ${dice.breakdown}`);
    } else {
      report(`The promotion committee passes you over this cycle. ${dice.breakdown}`);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <p className="rounded-xl border border-amber-900/40 bg-[#1c1810] px-3 py-2 text-[10px] leading-relaxed text-amber-600/70">
        <span className="font-bold text-amber-400">Life &amp; Livelihood.</span> Original extension mechanics in
        GURPS style — every action rolls 3d6 under a skill target, and the margin decides how well it went. Money
        comes from and returns to your purse. <span className="text-amber-400/80">You can also just type it in the
        chat — "work the month", "collect my income", "hack the corporate mainframe", "study", "sit the exam",
        "attend the ball", "start a market stall" — everything resolves mechanically, no AI required.</span>
      </p>

      {/* Economics */}
      <Section
        icon={<Coins className="size-4" />}
        title="Economics & Wealth"
        subtitle="Your tier sets income and cost of living"
        defaultOpen
      >
        <div className="flex flex-wrap gap-1.5">
          {GURPS_WEALTH_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onExt({ wealthTierId: t.id })}
              className={cn(
                "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                ext.wealthTierId === t.id
                  ? "border-amber-400 bg-amber-500/15 text-amber-200"
                  : "border-amber-900/40 text-amber-600/80 hover:border-amber-700 hover:text-amber-400",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
        {tier && (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-[9px] leading-relaxed text-amber-600/60">{tier.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="emerald">Income {income} gp/mo</Pill>
              {titleIncome > 0 && <Pill tone="amber">Title +{titleIncome} gp/mo</Pill>}
              {courtSalary > 0 && <Pill tone="amber">Court +{courtSalary} gp/mo</Pill>}
              <Pill>Cost of living {living} gp/mo</Pill>
              <Pill tone="slate">Start wealth ×{tier.startingWealthMult}</Pill>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { credit(income + titleIncome); report(`Collected monthly income${titleIncome > 0 ? " + title stipend" : ""}: +${income + titleIncome} gp.`); }}
                className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                <Plus className="mr-1 inline size-3" />Collect income
              </button>
              <button
                type="button"
                onClick={() => { if (debit(living)) report(`Cost of living paid: −${living} gp.`); else report("You cannot afford your cost of living this month."); }}
                className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
              >
                <Minus className="mr-1 inline size-3" />Pay living
              </button>
            </div>
          </div>
        )}
        {!tier && (
          <p className="mt-2 text-[9px] text-amber-600/50">Pick a wealth tier above to set your economic footing.</p>
        )}
      </Section>

      {/* Jobs */}
      <Section
        icon={<Briefcase className="size-4" />}
        title="Jobs & Work"
        subtitle="Work a month for a living"
      >
        <div className="flex flex-col gap-1.5">
          {(["medieval", "modern", "cyber", "business"] as const).map((domain) => {
            const jobs = GURPS_JOBS.filter((j) => j.domain === domain);
            if (jobs.length === 0) return null;
            return (
              <div key={domain}>
                <p className="mb-1 mt-1 text-[8px] font-bold uppercase tracking-widest text-amber-600/50 first:mt-0">
                  {domain}
                </p>
                {jobs.map((j) => {
                  const active = ext.jobId === j.id;
                  const target = skillLevel(d, c, j.skill, j.fallbackStat);
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => onExt({ jobId: j.id })}
                      className={cn(
                        "mb-1 flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors last:mb-0",
                        active
                          ? "border-amber-400 bg-amber-500/15"
                          : "border-amber-900/40 bg-[#1c1810] hover:border-amber-700",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold text-amber-100">
                          {j.name} <span className="ml-1 font-mono text-[8px] text-amber-500">skill {target}</span>
                        </span>
                        <span className="block truncate text-[9px] text-amber-600/60">{j.summary}</span>
                      </span>
                      {active && <Check className="size-3.5 shrink-0 text-amber-300" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {job ? (
            <Pill tone="emerald">Working: {job.name}</Pill>
          ) : (
            <Pill>No job</Pill>
          )}
          <button
            type="button"
            onClick={workMonth}
            disabled={!job}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Work the month
          </button>
        </div>
      </Section>

      {/* Love */}
      <Section
        icon={<Heart className="size-4" />}
        title="Love & Relationships"
        subtitle="Reaction rolls advance the bond"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              value={ext.relationshipName ?? ""}
              onChange={(e) => onExt({ relationshipName: e.target.value })}
              placeholder="Name of your interest…"
              aria-label="Relationship partner name"
              className="h-8 min-w-0 flex-1 rounded-lg border border-amber-900/40 bg-[#1c1810] px-2.5 text-[10px] text-amber-100 outline-none placeholder:text-amber-700/60 focus:border-amber-500/60"
            />
            <Pill>{currentStage?.name ?? "Strangers"}</Pill>
          </div>
          <div className="flex flex-wrap gap-1">
            {GURPS_RELATIONSHIP_STAGES.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  (stageIdx >= 0 && GURPS_RELATIONSHIP_STAGES.indexOf(s) <= stageIdx)
                    ? "bg-amber-400"
                    : "bg-amber-900/40",
                )}
                title={s.name}
              />
            ))}
          </div>
          <p className="text-[9px] text-amber-600/60">
            {nextStage
              ? `Next: ${nextStage.name} — reaction target ${Math.max(3, nextStage.target + reactionMod)}${reactionMod !== 0 ? ` (${reactionMod >= 0 ? "+" : ""}${reactionMod} from your traits)` : ""}.`
              : "The bond is at its deepest stage."}
          </p>
          <button
            type="button"
            onClick={advanceLove}
            disabled={!ext.relationshipName?.trim()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Advance the relationship
          </button>
        </div>
      </Section>

      {/* Education */}
      <Section
        icon={<GraduationCap className="size-4" />}
        title="Education & Study"
        subtitle="Enroll, study, and sit the exam"
      >
        {ext.graduated && degree ? (
          <div className="flex flex-col gap-1.5">
            <Pill tone="emerald">Graduated: {degree.name}</Pill>
            <p className="text-[9px] leading-relaxed text-amber-600/60">
              {degree.skillBonus
                ? `Your degree grants +${degree.skillBonus.bonus} to ${degree.skillBonus.skill.replace(/-/g, " ")}.`
                : "Your degree is parchment, pedigree, and doors that open."}
              {degree.unlocks?.length ? ` Unlocked jobs: ${degree.unlocks.map((u) => GURPS_JOB_MAP[u]?.name ?? u).join(", ")}.` : ""}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {GURPS_UNIVERSITIES.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => enroll(u.id)}
                  title={`${u.summary} — tuition ${u.tuition} gp/semester`}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                    ext.universityId === u.id
                      ? "border-amber-400 bg-amber-500/15 text-amber-200"
                      : "border-amber-900/40 text-amber-600/80 hover:border-amber-700 hover:text-amber-400",
                  )}
                >
                  {u.name}
                </button>
              ))}
            </div>
            {university && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[9px] text-amber-600/60">{university.summary}</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ext.scholarship ?? false}
                    onChange={(e) => onExt({ scholarship: e.target.checked })}
                    className="size-3.5 accent-amber-500"
                  />
                  <span className="text-[9px] text-amber-200">Scholarship (tuition waived)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GURPS_DEGREES.filter((dg) => dg.era === university.era).map((dg) => (
                    <button
                      key={dg.id}
                      type="button"
                      onClick={() => onExt({ degreeId: dg.id, studyProgress: 0 })}
                      title={`${dg.summary} — exam target ${dg.examTarget}, ${dg.semesters} semesters`}
                      className={cn(
                        "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                        ext.degreeId === dg.id
                          ? "border-amber-400 bg-amber-500/15 text-amber-200"
                          : "border-amber-900/40 text-amber-600/80 hover:border-amber-700 hover:text-amber-400",
                      )}
                    >
                      {dg.name}
                    </button>
                  ))}
                </div>
                {degree && !ext.graduated && (
                  <div className="flex flex-col gap-1.5 rounded-lg border border-amber-900/40 bg-[#1c1810] p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold text-amber-200">{degree.name}</span>
                      <span className="font-mono text-[9px] text-amber-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-amber-900/40">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={study}
                        className="flex-1 rounded-lg bg-amber-500 px-2 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400"
                      >
                        <BookOpen className="mr-1 inline size-3" />Study
                      </button>
                      <button
                        type="button"
                        onClick={sitExam}
                        disabled={progress < 100}
                        className="flex-1 rounded-lg border border-amber-400/60 px-2 py-1.5 text-[10px] font-bold text-amber-200 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Sit exam
                      </button>
                    </div>
                    {(ext.studentDebt ?? 0) > 0 && (
                      <p className="text-[9px] text-red-300/80">
                        Student debt: {ext.studentDebt} gp — pay it off from your purse or carry it into the story.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Social life */}
      <Section
        icon={<Users className="size-4" />}
        title="Social Life"
        subtitle="Circles, events, and reputation"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-100">{repLabel}</span>
            </div>
            <span className="font-mono text-[10px] text-amber-400">{rep}/100</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-amber-900/40">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${rep}%` }} />
          </div>
          <p className="text-[8px] font-bold uppercase tracking-widest text-amber-600/50">Social circles</p>
          <div className="flex flex-wrap gap-1.5">
            {GURPS_SOCIAL_CIRCLES.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  if (ext.socialCircleId === sc.id) {
                    onExt({ socialCircleId: undefined });
                    return;
                  }
                  if (debit(sc.entryCost)) {
                    onExt({ socialCircleId: sc.id });
                    report(`You join the ${sc.name} — ${sc.entryCost} gp entry.`);
                  } else {
                    report(`Joining the ${sc.name} costs ${sc.entryCost} gp.`);
                  }
                }}
                title={sc.summary}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                  ext.socialCircleId === sc.id
                    ? "border-amber-400 bg-amber-500/15 text-amber-200"
                    : "border-amber-900/40 text-amber-600/80 hover:border-amber-700 hover:text-amber-400",
                )}
              >
                {sc.name}
              </button>
            ))}
          </div>
          {ext.socialCircleId && GURPS_SOCIAL_CIRCLE_MAP[ext.socialCircleId]?.reactionMod !== 0 && (
            <Pill tone="amber">+{GURPS_SOCIAL_CIRCLE_MAP[ext.socialCircleId].reactionMod} social rolls</Pill>
          )}
          <p className="text-[8px] font-bold uppercase tracking-widest text-amber-600/50">Attend events</p>
          <div className="flex flex-col gap-1.5">
            {GURPS_SOCIAL_EVENTS.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => attendEvent(ev.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/40 bg-[#1c1810] px-2.5 py-1.5 text-left transition-colors hover:border-amber-700"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-amber-100">
                    {ev.name} <span className="ml-1 font-mono text-[8px] text-amber-500">{ev.cost} gp</span>
                  </span>
                  <span className="block truncate text-[9px] text-amber-600/60">{ev.summary}</span>
                </span>
                <Trophy className="size-3.5 shrink-0 text-amber-600" />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] text-amber-600/60">
              {(ext.contacts ?? []).length} contact{(ext.contacts ?? []).length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={addContact}
              className="rounded-lg border border-amber-400/60 px-2 py-1 text-[10px] font-bold text-amber-200 transition-colors hover:bg-amber-500/15"
            >
              <Plus className="mr-1 inline size-3" />Add contact
            </button>
          </div>
          {(ext.contacts ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(ext.contacts ?? []).map((ct, i) => (
                <span key={i} className="rounded-full border border-amber-800/60 bg-amber-900/20 px-2 py-0.5 text-[9px] text-amber-300">
                  {ct}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Business */}
      <Section
        icon={<Store className="size-4" />}
        title="Business"
        subtitle="Own a venture — profit comes from rolls"
      >
        <div className="flex flex-col gap-1.5">
          {GURPS_BUSINESSES.map((b) => {
            const active = ext.businessId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => startBusiness(b.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                  active
                    ? "border-amber-400 bg-amber-500/15"
                    : "border-amber-900/40 bg-[#1c1810] hover:border-amber-700",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-amber-100">
                    {b.name} <span className="ml-1 font-mono text-[8px] text-amber-500">{b.startupCost} gp</span>
                  </span>
                  <span className="block truncate text-[9px] text-amber-600/60">{b.summary}</span>
                </span>
                {active ? <Check className="size-3.5 shrink-0 text-amber-300" /> : <Plus className="size-3.5 shrink-0 text-amber-600" />}
              </button>
            );
          })}
        </div>
        {biz && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Pill tone="emerald">{biz.name} · {biz.risk} risk</Pill>
            <button
              type="button"
              onClick={runBusiness}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Run the month
            </button>
          </div>
        )}
      </Section>

      {/* Cyber */}
      <Section
        icon={<Cpu className="size-4" />}
        title="Cyber"
        subtitle="Chrome, netrunning, and ICE"
      >
        <div className="flex flex-col gap-1.5">
          {GURPS_CYBERWARE.map((w) => {
            const installed = ext.cyberware.includes(w.id);
            return (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/40 bg-[#1c1810] px-2.5 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-amber-100">
                    {w.name} <span className="ml-1 font-mono text-[8px] text-amber-500">{w.cost} gp</span>
                    {w.dr ? <span className="ml-1 text-[8px] text-emerald-400">+{w.dr} DR</span> : null}
                  </span>
                  <span className="block truncate text-[9px] text-amber-600/60">{w.summary}</span>
                </span>
                {installed ? (
                  <Check className="size-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <button
                    type="button"
                    onClick={() => buyCyberware(w.id)}
                    className="flex size-6 shrink-0 items-center justify-center rounded border border-teal-500/50 text-teal-300 transition-colors hover:bg-teal-500/20"
                    aria-label={`Install ${w.name}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 border-t border-amber-900/40 pt-2">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
            <Zap className="size-3" /> Netrun · Hacking skill {hackLevel}
            {hackBonusTotal > 0 && <span className="text-teal-300">+{hackBonusTotal} deck/programs</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GURPS_HACK_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => hackTarget(t.id)}
                title={t.summary}
                className="rounded-lg border border-amber-900/40 bg-[#1c1810] px-2 py-1 text-[10px] font-semibold text-amber-300 transition-colors hover:border-amber-500/60"
              >
                {t.name}
                <span className="ml-1 font-mono text-[8px] text-amber-600">{t.penalty}</span>
              </button>
            ))}
          </div>
          <p className="mb-1.5 mt-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
            <Network className="size-3" /> Netdeck
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GURPS_NETDECKS.map((nd) => (
              <button
                key={nd.id}
                type="button"
                onClick={() => buyDeck(nd.id)}
                title={nd.summary}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                  ext.netdeckId === nd.id
                    ? "border-teal-400 bg-teal-500/15 text-teal-200"
                    : "border-amber-900/40 bg-[#1c1810] text-amber-300 hover:border-teal-500/60",
                )}
              >
                {nd.name}
                <span className="ml-1 font-mono text-[8px] text-amber-600">{nd.cost} gp</span>
                {nd.hackBonus > 0 && <span className="ml-1 text-[8px] text-teal-400">+{nd.hackBonus}</span>}
              </button>
            ))}
          </div>
          <p className="mb-1.5 mt-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
            <Cpu className="size-3" /> Programs {traceDef > 0 && <span className="text-teal-300">(+{traceDef} trace defense)</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GURPS_PROGRAMS.map((p) => {
              const loaded = ext.programs.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => installProgram(p.id)}
                  disabled={loaded}
                  title={p.summary}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                    loaded
                      ? "border-teal-400 bg-teal-500/15 text-teal-200"
                      : "border-amber-900/40 bg-[#1c1810] text-amber-300 hover:border-teal-500/60",
                  )}
                >
                  {p.name}
                  <span className="ml-1 font-mono text-[8px] text-amber-600">{p.cost} gp</span>
                  {p.hackBonus ? <span className="ml-1 text-[8px] text-teal-400">+{p.hackBonus}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Corp ladder */}
      <Section
        icon={<Building2 className="size-4" />}
        title="Corporate Ladder"
        subtitle="Climb the org chart"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1">
            {GURPS_CORP_LADDER.map((r, i) => (
              <span
                key={r.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  (rankIdx >= 0 && i <= rankIdx) ? "bg-amber-400" : "bg-amber-900/40",
                )}
                title={r.name}
              />
            ))}
          </div>
          <p className="text-[9px] text-amber-600/60">
            {corpRank
              ? `Current rank: ${corpRank.name} — salary ${gurpsCorpSalary(ext.corpPositionId)} gp/mo.`
              : "You have no corporate position yet."}
            {nextRank ? ` Next: ${nextRank.name} (target ${nextRank.target}).` : ""}
          </p>
          <button
            type="button"
            onClick={pursuePromotion}
            disabled={!nextRank}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextRank ? `Pursue promotion to ${nextRank.name}` : "At the top of the ladder"}
          </button>
        </div>
      </Section>

      {/* Medieval */}
      <Section
        icon={<Castle className="size-4" />}
        title="Medieval Holdings"
        subtitle="Land, stewardship, and seasonal yields"
      >
        <div className="flex flex-col gap-1.5">
          {GURPS_HOLDINGS.map((h) => {
            const active = ext.holdingId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => claimHolding(h.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                  active
                    ? "border-amber-400 bg-amber-500/15"
                    : "border-amber-900/40 bg-[#1c1810] hover:border-amber-700",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-amber-100">
                    {h.name} <span className="ml-1 font-mono text-[8px] text-amber-500">{h.income} gp/season</span>
                  </span>
                  <span className="block truncate text-[9px] text-amber-600/60">{h.summary}</span>
                </span>
                {active ? <Check className="size-3.5 shrink-0 text-amber-300" /> : <Shield className="size-3.5 shrink-0 text-amber-600" />}
              </button>
            );
          })}
        </div>
        {holding && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Pill tone="emerald">Holding: {holding.name}</Pill>
            <button
              type="button"
              onClick={harvest}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Seasonal harvest
            </button>
          </div>
        )}
        <div className="mt-2 border-t border-amber-900/40 pt-2">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
            <Crown className="size-3" /> Noble titles
            {titleIncome > 0 && <span className="text-emerald-300">+{titleIncome} gp/mo</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GURPS_NOBLE_TITLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => buyTitle(t.id)}
                title={t.summary}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors",
                  ext.titleId === t.id
                    ? "border-amber-400 bg-amber-500/15 text-amber-200"
                    : "border-amber-900/40 bg-[#1c1810] text-amber-300 hover:border-amber-500/60",
                )}
              >
                {t.name}
                <span className="ml-1 font-mono text-[8px] text-amber-600">{t.cost} gp</span>
              </button>
            ))}
          </div>
          <p className="mb-1.5 mt-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
            <Landmark className="size-3" /> Court positions
            {courtSalary > 0 && <span className="text-emerald-300">{courtSalary} gp/mo</span>}
          </p>
          <div className="flex flex-col gap-1.5">
            {GURPS_COURT_POSITIONS.map((cp) => {
              const active = ext.courtPositionId === cp.id;
              return (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => onExt({ courtPositionId: cp.id })}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                    active
                      ? "border-amber-400 bg-amber-500/15"
                      : "border-amber-900/40 bg-[#1c1810] hover:border-amber-700",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold text-amber-100">{cp.name}</span>
                    <span className="block truncate text-[9px] text-amber-600/60">{cp.summary}</span>
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-amber-300" />}
                </button>
              );
            })}
          </div>
          {courtPos && (
            <button
              type="button"
              onClick={serveCourt}
              className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Serve the month at court
            </button>
          )}
        </div>
      </Section>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10px] leading-relaxed text-amber-200"
        >
          {result}
        </div>
      )}
    </div>
  );
}
