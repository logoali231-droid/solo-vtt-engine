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
  GURPS_CYBERWARE,
  GURPS_CYBERWARE_MAP,
  GURPS_HACK_MAP,
  GURPS_HACK_TARGETS,
  GURPS_HOLDINGS,
  GURPS_HOLDING_MAP,
  GURPS_JOBS,
  GURPS_JOB_MAP,
  GURPS_RELATIONSHIP_MAP,
  GURPS_RELATIONSHIP_STAGES,
  GURPS_WEALTH_MAP,
  GURPS_WEALTH_TIERS,
  gurpsBusinessResult,
  gurpsCostOfLiving,
  gurpsJobPay,
  gurpsMonthlyIncome,
  gurpsReactionModifiers,
} from "@/lib/rpg/data/gurps-extensions";
import type { RollRequest } from "../types";
import {
  Briefcase,
  Castle,
  Check,
  ChevronDown,
  Coins,
  Cpu,
  Heart,
  Minus,
  Plus,
  Shield,
  Store,
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
  const stageIdx = ext.relationshipStage
    ? GURPS_RELATIONSHIP_STAGES.findIndex((s) => s.id === ext.relationshipStage)
    : -1;
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
    const target = Math.max(3, hackLevel + def.penalty);
    const dice = onRoll({ label: `Hack ${def.name} (target ${target})`, kind: "check", gurpsTarget: target });
    if (!dice) return;
    if (dice.outcome === "critical-failure") {
      report(`Trace detected — you jack out with the system screaming after you. ${dice.breakdown}`);
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

  return (
    <div className="flex flex-col gap-2.5">
      <p className="rounded-xl border border-amber-900/40 bg-[#1c1810] px-3 py-2 text-[10px] leading-relaxed text-amber-600/70">
        <span className="font-bold text-amber-400">Life &amp; Livelihood.</span> Original extension mechanics in
        GURPS style — every action rolls 3d6 under a skill target, and the margin decides how well it went. Money
        comes from and returns to your purse.
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
              <Pill>Cost of living {living} gp/mo</Pill>
              <Pill tone="slate">Start wealth ×{tier.startingWealthMult}</Pill>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { credit(income); report(`Collected monthly income: +${income} gp.`); }}
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
          {GURPS_JOBS.map((j) => {
            const active = ext.jobId === j.id;
            const target = skillLevel(d, c, j.skill, j.fallbackStat);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => onExt({ jobId: j.id })}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
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
