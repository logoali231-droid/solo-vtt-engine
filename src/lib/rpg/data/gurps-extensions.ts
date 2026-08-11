// ============================================================================
// Oraculum — GURPS "Life & Livelihood" Extension.
//
// ORIGINAL CONTENT. The official GURPS supplements (Social Engineering,
// Business, Cyberpunk, Low-Tech, Jobs, etc.) are closed-copyright, so this
// module implements the SAME design language — 3d6 roll-under vs a skill
// target, margins of success, reaction rolls, point/value economics — with
// entirely original tables, jobs, businesses and mechanics built on GURPS
// logic. Nothing here is copied from the books.
//
// Domains: Jobs · Economics · Love · Business · Cyber · Medieval.
// ============================================================================

import type { GurpsCharacter, GurpsSkillDef, Wallet } from "../types";
import { walletToSp, spToWallet } from "../types";

// ---------------------------------------------------------------------------
// Extension skills — added to the GURPS skill list so the wizard can train
// them and the sheet can roll them. (GURPS-style: stat + difficulty.)
// ---------------------------------------------------------------------------

export const GURPS_EXTENSION_SKILLS: GurpsSkillDef[] = [
  { id: "merchant", name: "Merchant", stat: "iq", difficulty: "average" },
  { id: "finance", name: "Finance", stat: "iq", difficulty: "hard" },
  { id: "accounting", name: "Accounting", stat: "iq", difficulty: "hard" },
  { id: "market-analysis", name: "Market Analysis", stat: "iq", difficulty: "hard" },
  { id: "law", name: "Law", stat: "iq", difficulty: "hard" },
  { id: "diplomacy", name: "Diplomacy", stat: "iq", difficulty: "average" },
  { id: "leadership", name: "Leadership", stat: "iq", difficulty: "average" },
  { id: "savoir-faire", name: "Savoir-Faire", stat: "iq", difficulty: "easy" },
  { id: "sex-appeal", name: "Sex Appeal", stat: "ht", difficulty: "average" },
  { id: "psychology", name: "Psychology", stat: "iq", difficulty: "hard" },
  { id: "detect-lies", name: "Detect Lies", stat: "iq", difficulty: "hard" },
  { id: "streetwise", name: "Streetwise", stat: "iq", difficulty: "average" },
  { id: "administration", name: "Administration", stat: "iq", difficulty: "average" },
  { id: "politics", name: "Politics", stat: "iq", difficulty: "average" },
  { id: "propaganda", name: "Propaganda", stat: "iq", difficulty: "average" },
  { id: "research", name: "Research", stat: "iq", difficulty: "average" },
  { id: "computer-operation", name: "Computer Operation", stat: "iq", difficulty: "easy" },
  { id: "computer-programming", name: "Computer Programming", stat: "iq", difficulty: "hard" },
  { id: "electronics-operation", name: "Electronics Operation", stat: "iq", difficulty: "average" },
  { id: "hacking", name: "Hacking", stat: "iq", difficulty: "hard" },
  { id: "fast-talk", name: "Fast-Talk", stat: "iq", difficulty: "average" },
  { id: "professional-skill", name: "Professional Skill", stat: "iq", difficulty: "average" },
];

export const GURPS_EXTENSION_SKILL_MAP = Object.fromEntries(
  GURPS_EXTENSION_SKILLS.map((s) => [s.id, s]),
);

// ---------------------------------------------------------------------------
// Wealth & economics — original tier ladder. "Standard" monthly income is the
// baseline (100% — the economic average for the setting). Every tier scales
// income, cost of living, and the wallet's starting value.
// ---------------------------------------------------------------------------

export interface GurpsWealthTier {
  id: string;
  name: string;
  /** Multiplier on the standard monthly income. */
  incomeMult: number;
  /** Cost of living per month, as a fraction of standard income. */
  costOfLivingMult: number;
  /** Starting wallet multiplier vs the standard 100 gp purse. */
  startingWealthMult: number;
  summary: string;
}

export const GURPS_WEALTH_TIERS: GurpsWealthTier[] = [
  { id: "dead-broke", name: "Dead Broke", incomeMult: 0, costOfLivingMult: 0.5, startingWealthMult: 0, summary: "No money, no income. You survive on charity, theft or luck." },
  { id: "poor", name: "Poor", incomeMult: 0.5, costOfLivingMult: 0.6, startingWealthMult: 0.2, summary: "Hand to mouth. Every coin spent is a coin earned twice." },
  { id: "struggling", name: "Struggling", incomeMult: 0.75, costOfLivingMult: 0.8, startingWealthMult: 0.5, summary: "A working life. Enough to eat, rarely enough to save." },
  { id: "average", name: "Average", incomeMult: 1, costOfLivingMult: 1, startingWealthMult: 1, summary: "The standard of the setting — a modest, honest living." },
  { id: "comfortable", name: "Comfortable", incomeMult: 1.5, costOfLivingMult: 1.2, startingWealthMult: 2, summary: "Savings in the bank and a roof that never leaks." },
  { id: "wealthy", name: "Wealthy", incomeMult: 2.5, costOfLivingMult: 1.6, startingWealthMult: 5, summary: "Money opens doors. You rarely think about the price." },
  { id: "very-wealthy", name: "Very Wealthy", incomeMult: 5, costOfLivingMult: 2.2, startingWealthMult: 20, summary: "An enterprise, an estate, or a fortune in trust." },
  { id: "filthy-rich", name: "Filthy Rich", incomeMult: 10, costOfLivingMult: 3, startingWealthMult: 100, summary: "A personal staff, properties in three cities, and influence." },
  { id: "multimillionaire", name: "Multimillionaire", incomeMult: 25, costOfLivingMult: 4, startingWealthMult: 1000, summary: "You buy things other people cannot even price." },
];

export const GURPS_WEALTH_MAP = Object.fromEntries(
  GURPS_WEALTH_TIERS.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Jobs — original table. Each job rolls 3d6 vs the job's skill (or a raw
// attribute default). The margin of success sets the month's quality and pay.
// ---------------------------------------------------------------------------

export interface GurpsJobDef {
  id: string;
  name: string;
  /** Domain filter — jobs are grouped so the panel can show the right era. */
  domain: "medieval" | "modern" | "cyber" | "business";
  /** Skill id to roll (extension skills + core skills). */
  skill: string;
  /** Raw attribute fallback when the skill is untrained. */
  fallbackStat: "st" | "dx" | "iq" | "ht";
  /** Pay vs the standard monthly income (before the wealth multiplier). */
  payMult: number;
  summary: string;
}

export const GURPS_JOBS: GurpsJobDef[] = [
  // --- Medieval ---
  { id: "field-hand", name: "Field Hand", domain: "medieval", skill: "professional-skill", fallbackStat: "st", payMult: 0.5, summary: "Back-breaking seasonal labor on another's land." },
  { id: "smith", name: "Smith", domain: "medieval", skill: "professional-skill", fallbackStat: "st", payMult: 1.4, summary: "Shoeing horses, mending ploughs, forging blades." },
  { id: "merchant-wagon", name: "Traveling Merchant", domain: "medieval", skill: "merchant", fallbackStat: "iq", payMult: 1.3, summary: "Buying cheap and selling dear along the trade roads." },
  { id: "guard", name: "Town Guard", domain: "medieval", skill: "spear", fallbackStat: "st", payMult: 0.9, summary: "Patrolling the walls, keeping the peace by presence." },
  { id: "soldier", name: "Mercenary Soldier", domain: "medieval", skill: "broadsword", fallbackStat: "dx", payMult: 1.2, summary: "A blade for hire — good money, short life." },
  { id: "scribe", name: "Scribe", domain: "medieval", skill: "research", fallbackStat: "iq", payMult: 1.1, summary: "Letters, contracts and records for those who cannot write." },
  { id: "minstrel", name: "Court Minstrel", domain: "medieval", skill: "sex-appeal", fallbackStat: "ht", payMult: 0.9, summary: "Songs and tales in halls that pay in coin and favor." },
  // --- Modern ---
  { id: "clerk", name: "Office Clerk", domain: "modern", skill: "administration", fallbackStat: "iq", payMult: 1.1, summary: "Filing, phones and forms — steady and soul-drying." },
  { id: "driver", name: "Cabbie / Delivery Driver", domain: "modern", skill: "driving", fallbackStat: "dx", payMult: 0.9, summary: "The city at your fingertips, fares in your pocket." },
  { id: "mechanic", name: "Auto Mechanic", domain: "modern", skill: "professional-skill", fallbackStat: "iq", payMult: 1.2, summary: "Engines, brakes and the honest grime of good work." },
  { id: "sales", name: "Salesperson", domain: "modern", skill: "merchant", fallbackStat: "iq", payMult: 1.0, summary: "Commission is a lottery with a skill-based rig." },
  { id: "journalist", name: "Journalist", domain: "modern", skill: "research", fallbackStat: "iq", payMult: 1.1, summary: "Chasing stories, filing copy, dodging libel suits." },
  { id: "medic", name: "Paramedic", domain: "modern", skill: "first-aid", fallbackStat: "ht", payMult: 1.1, summary: "First on the scene, last to leave the shift." },
  // --- Cyber ---
  { id: "corp-drone", name: "Corp Drone", domain: "cyber", skill: "administration", fallbackStat: "iq", payMult: 1.6, summary: "A cubicle in a glass tower, chained to the quarterly report." },
  { id: "netrunner", name: "Netrunner", domain: "cyber", skill: "hacking", fallbackStat: "iq", payMult: 2.0, summary: "Stealing data through the Grid — one cred at a time." },
  { id: "fixer", name: "Fixer", domain: "cyber", skill: "streetwise", fallbackStat: "iq", payMult: 1.7, summary: "Everyone knows someone who knows someone. That's you." },
  { id: "ripperdoc", name: "Ripperdoc", domain: "cyber", skill: "first-aid", fallbackStat: "ht", payMult: 1.8, summary: "Installing chrome and stitching wounds, no questions asked." },
  { id: "bounty-hunter", name: "Bounty Hunter", domain: "cyber", skill: "stealth", fallbackStat: "dx", payMult: 1.9, summary: "Collecting heads and warrants in equal measure." },
  // --- Business ---
  { id: "shopkeeper", name: "Shopkeeper", domain: "business", skill: "merchant", fallbackStat: "iq", payMult: 1.3, summary: "Your own counter, your own stock, your own hours." },
  { id: "money-lender", name: "Money Lender", domain: "business", skill: "finance", fallbackStat: "iq", payMult: 1.8, summary: "Lending at interest — profitable until a client vanishes." },
  { id: "contractor", name: "Contractor", domain: "business", skill: "professional-skill", fallbackStat: "iq", payMult: 1.4, summary: "Bidding jobs, meeting deadlines, collecting invoices." },
  { id: "entertainer", name: "Performer", domain: "business", skill: "sex-appeal", fallbackStat: "ht", payMult: 1.2, summary: "Stage, screen or street — the crowd is the boss." },
];

export const GURPS_JOB_MAP = Object.fromEntries(GURPS_JOBS.map((j) => [j.id, j]));

// ---------------------------------------------------------------------------
// Businesses — original ventures. Startup cost comes out of the wallet; a
// monthly roll (3d6 vs the business skill) sets profit or loss.
// ---------------------------------------------------------------------------

export interface GurpsBusinessDef {
  id: string;
  name: string;
  skill: string;
  /** Startup cost in gp (wallet). */
  startupCost: number;
  /** Base monthly profit in gp at a successful roll. */
  profitBase: number;
  risk: "low" | "moderate" | "high";
  summary: string;
}

export const GURPS_BUSINESSES: GurpsBusinessDef[] = [
  { id: "stall", name: "Market Stall", skill: "merchant", startupCost: 20, profitBase: 8, risk: "low", summary: "A cart and a corner. Slow, safe, honest." },
  { id: "workshop", name: "Workshop", skill: "professional-skill", startupCost: 60, profitBase: 16, risk: "low", summary: "Tools, a bench, and a reputation for good work." },
  { id: "tavern", name: "Tavern / Bar", skill: "administration", startupCost: 150, profitBase: 30, risk: "moderate", summary: "Rooms, ale and gossip — the heart of any street." },
  { id: "trading-house", name: "Trading House", skill: "merchant", startupCost: 300, profitBase: 55, risk: "moderate", summary: "Moving goods in bulk along the trade lanes." },
  { id: "startup", name: "Tech Startup", skill: "computer-programming", startupCost: 250, profitBase: 90, risk: "high", summary: "An idea, a loft, and a runway of pure adrenaline." },
  { id: "smuggling-ring", name: "Smuggling Ring", skill: "streetwise", startupCost: 200, profitBase: 80, risk: "high", summary: "Fast ships, blind guards, and very large margins." },
];

export const GURPS_BUSINESS_MAP = Object.fromEntries(
  GURPS_BUSINESSES.map((b) => [b.id, b]),
);

// ---------------------------------------------------------------------------
// Love & relationships — original stage ladder + reaction rolls. Advancing a
// stage requires a reaction roll: 3d6 + attraction modifiers vs the stage's
// target. Crits jump or break stages dramatically.
// ---------------------------------------------------------------------------

export interface GurpsRelationshipStage {
  id: string;
  name: string;
  /** Reaction target (3d6 + modifiers) needed to reach this stage. */
  target: number;
  summary: string;
}

export const GURPS_RELATIONSHIP_STAGES: GurpsRelationshipStage[] = [
  { id: "strangers", name: "Strangers", target: 6, summary: "You have met, barely." },
  { id: "acquaintances", name: "Acquaintances", target: 9, summary: "Names, small talk, and shared circles." },
  { id: "friends", name: "Friends", target: 12, summary: "Trust, banter, and plans made together." },
  { id: "romantic", name: "Romantic Interest", target: 14, summary: "Sparks, stolen glances, and heartbeats." },
  { id: "lovers", name: "Lovers", target: 16, summary: "Intimacy, vulnerability, and late-night talks." },
  { id: "committed", name: "Committed Partners", target: 18, summary: "A shared future, a shared name, a shared life." },
];

export const GURPS_RELATIONSHIP_MAP = Object.fromEntries(
  GURPS_RELATIONSHIP_STAGES.map((s) => [s.id, s]),
);

// ---------------------------------------------------------------------------
// Cyberware — original chrome catalog. Costs come from the wallet; some
// implants grant DR or skill bonuses.
// ---------------------------------------------------------------------------

export interface GurpsCyberwareDef {
  id: string;
  name: string;
  cost: number;
  dr?: number;
  /** +N to a specific skill id. */
  skillBonus?: { skill: string; bonus: number };
  summary: string;
}

export const GURPS_CYBERWARE: GurpsCyberwareDef[] = [
  { id: "datajack", name: "Datajack", cost: 25, summary: "A port at the base of the skull — jack into terminals." },
  { id: "cybereye", name: "Cybereye", cost: 60, skillBonus: { skill: "computer-operation", bonus: 1 }, summary: "HUD overlay, low-light, and a targeting reticle." },
  { id: "reflex-chips", name: "Reflex Chips", cost: 80, summary: "Neural timing implants — the world slows down." },
  { id: "dermal-plating", name: "Dermal Plating", cost: 100, dr: 1, summary: "Layered armor woven under the skin." },
  { id: "neural-link", name: "Neural Link", cost: 140, skillBonus: { skill: "hacking", bonus: 1 }, summary: "Direct mind-to-grid interface for deep netrunning." },
  { id: "muscle-weave", name: "Muscle Weave", cost: 90, summary: "Synthetic fibers braided through your own muscle." },
  { id: "implant-comm", name: "Implant Comm", cost: 40, summary: "A subdermal radio — always in touch." },
  { id: "bone-lacing", name: "Bone Lacing", cost: 70, dr: 1, summary: "Reinforced skeleton that shrugs off impacts." },
];

export const GURPS_CYBERWARE_MAP = Object.fromEntries(
  GURPS_CYBERWARE.map((w) => [w.id, w]),
);

// ---------------------------------------------------------------------------
// Hack targets — original ICE/security ladder for netrunning.
// ---------------------------------------------------------------------------

export interface GurpsHackTarget {
  id: string;
  name: string;
  /** Penalty applied to the Hacking roll. */
  penalty: number;
  summary: string;
}

export const GURPS_HACK_TARGETS: GurpsHackTarget[] = [
  { id: "public", name: "Public Terminal", penalty: 0, summary: "Open kiosks and street nodes — barely locked." },
  { id: "personal", name: "Personal Rig", penalty: -2, summary: "A private deck with a basic firewall." },
  { id: "corporate", name: "Corporate Mainframe", penalty: -4, summary: "ICE walls, audit logs, and a security team on call." },
  { id: "military", name: "Military Grid", penalty: -7, summary: "Hardened nodes, counter-intrusion ICE, no mercy." },
  { id: "black-ice", name: "Black ICE Core", penalty: -10, summary: "The legendary core — dangerous to even touch." },
];

export const GURPS_HACK_MAP = Object.fromEntries(
  GURPS_HACK_TARGETS.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Medieval holdings — original fief economy. A holding pays seasonal income
// on a successful 3d6 vs the listed skill.
// ---------------------------------------------------------------------------

export interface GurpsHoldingDef {
  id: string;
  name: string;
  skill: string;
  /** Seasonal income in gp on a success. */
  income: number;
  summary: string;
}

export const GURPS_HOLDINGS: GurpsHoldingDef[] = [
  { id: "smallholding", name: "Smallholding", skill: "professional-skill", income: 12, summary: "A few acres, a cottage, and a stubborn mule." },
  { id: "orchard", name: "Orchard & Vineyard", skill: "professional-skill", income: 25, summary: "Fruit trees and vines that pay in golden seasons." },
  { id: "mill", name: "Water Mill", skill: "professional-skill", income: 35, summary: "The village grinds its grain through your wheel." },
  { id: "manor", name: "Manor", skill: "administration", income: 60, summary: "Landed gentry — tenants, fields, and obligations." },
  { id: "keep", name: "Keep & Demesne", skill: "tactics", income: 120, summary: "A fortified seat with sworn men and rich lands." },
];

export const GURPS_HOLDING_MAP = Object.fromEntries(
  GURPS_HOLDINGS.map((h) => [h.id, h]),
);

// ---------------------------------------------------------------------------
// Mechanical helpers — original GURPS-style resolution for the panel.
// ---------------------------------------------------------------------------

/** Standard monthly income in gp — the setting's economic average. */
export const GURPS_STANDARD_INCOME = 50;

/** Monthly income for a wealth tier, in gp. */
export function gurpsMonthlyIncome(tierId: string | undefined): number {
  const tier = GURPS_WEALTH_MAP[tierId ?? "average"];
  return Math.round(GURPS_STANDARD_INCOME * (tier?.incomeMult ?? 1));
}

/** Monthly cost of living for a wealth tier, in gp. */
export function gurpsCostOfLiving(tierId: string | undefined): number {
  const tier = GURPS_WEALTH_MAP[tierId ?? "average"];
  return Math.round(gurpsMonthlyIncome(tierId) * (tier?.costOfLivingMult ?? 1));
}

/**
 * Job pay for the month given the roll margin.
 * Crit success: ×2 · success: ×1 · failure: ×0.5 · crit failure: ×0 (fired).
 * Returns the gp amount AND a quality label.
 */
export function gurpsJobPay(
  job: GurpsJobDef,
  margin: number,
  outcome: string,
  tierId: string | undefined,
): { pay: number; label: string; kept: boolean } {
  const base = Math.round(gurpsMonthlyIncome(tierId) * job.payMult);
  if (outcome === "critical-success") return { pay: base * 2, label: "Exceptional month", kept: true };
  if (outcome === "critical-failure") return { pay: 0, label: "Fired — no pay", kept: false };
  if (margin >= 0) return { pay: base, label: margin >= 5 ? "Excellent month" : "Good month", kept: true };
  return { pay: Math.round(base * 0.5), label: "Lean month", kept: true };
}

/**
 * Business monthly result given the roll margin. High-risk ventures swing
 * wider. Returns profit (negative = loss) and a label.
 */
export function gurpsBusinessResult(
  biz: GurpsBusinessDef,
  margin: number,
  outcome: string,
): { profit: number; label: string } {
  const swing = biz.risk === "high" ? 2 : biz.risk === "moderate" ? 1.4 : 1;
  if (outcome === "critical-success") return { profit: Math.round(biz.profitBase * 3 * swing), label: "Windfall month" };
  if (outcome === "critical-failure") return { profit: -Math.round(biz.profitBase * 1.5 * swing), label: "Disaster month" };
  if (margin >= 0) return { profit: Math.round(biz.profitBase * (1 + margin * 0.15) * swing), label: "Profit" };
  return { profit: -Math.round(biz.profitBase * 0.8 * swing), label: "Loss" };
}

/** Reaction modifiers from the character's advantages/disadvantages (original). */
export function gurpsReactionModifiers(c: GurpsCharacter): number {
  let mod = 0;
  for (const a of c.advantages) {
    if (a.id === "charisma") mod += Math.max(1, Math.round(a.points / 5));
    else if (a.id === "attractive") mod += 1;
    else if (a.id === "handsome") mod += 2;
    else if (a.id === "voice") mod += 2;
    else if (a.id === "social-chameleon") mod += 1;
    else if (a.id === "business-acumen") mod += 1;
    else if (a.id === "common-sense") mod += 1;
    else if (a.id === "zeroed") mod -= 1;
  }
  for (const dis of c.disadvantages ?? []) {
    if (dis.id === "shyness") mod -= 2;
    else if (dis.id === "bad-smell") mod -= 2;
    else if (dis.id === "no-sense-of-humor") mod -= 2;
    else if (dis.id === "intolerance") mod -= 1;
    else if (dis.id === "self-centered") mod -= 1;
    else if (dis.id === "stubbornness") mod -= 1;
    else if (dis.id === "ugly" || dis.id === "hideous") mod -= 2;
  }
  return mod;
}

/** Skill level for an extension/core skill id, with the raw-stat default. */
export function gurpsSkillLevelFor(
  c: GurpsCharacter,
  skillId: string,
  fallbackStat: "st" | "dx" | "iq" | "ht",
): number {
  const trained = c.skills.find((s) => s.id === skillId);
  const stat = c.attributes[fallbackStat];
  if (!trained) return stat - 5; // untrained default
  // Reuse the core GURPS level formula via the data module (avoid circular
  // import by inlining the same math used by gurpsSkillLevel).
  const def = GURPS_EXTENSION_SKILL_MAP[skillId];
  const diff = def?.difficulty ?? "average";
  const offset = diff === "easy" ? 0 : diff === "average" ? -1 : -2;
  if (trained.points <= 0) return stat - 5;
  if (trained.points === 1) return stat + offset;
  if (trained.points === 2) return stat + offset + 1;
  if (trained.points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((trained.points - 4) / 4);
}

/** Pay the wallet for a purchase; returns null when unaffordable. */
export function gurpsPay(wallet: Wallet | undefined, cost: number): Wallet | null {
  if (!wallet) return null;
  const total = walletToSp(wallet);
  const costSp = cost * 100; // gp → sp (app display unit)
  if (total < costSp) return null;
  return spToWallet(total - costSp);
}

// ---------------------------------------------------------------------------
// AI rules corpus — original plain-language summary fed to the GM so it can
// narrate job, business, love, cyber and medieval rolls faithfully.
// ---------------------------------------------------------------------------

export function gurpsRulesContext(): string {
  const lines: string[] = [
    "GURPS LIFE & LIVELIHOOD EXTENSION (original mechanics in GURPS style — 3d6 roll-under vs skill targets, margins of success).",
    "The engine rolls every check and resolves the outcome; you narrate the result faithfully.",
    "JOBS: a monthly work roll vs the job's skill sets the month's pay (critical success = double pay, success = standard, failure = half, critical failure = fired).",
    "ECONOMICS: each wealth tier sets monthly income and cost of living; the wallet in ADVENTURE STATE is the mechanical purse the player spends from.",
    "LOVE: advancing a relationship requires a reaction roll — 3d6 + attraction modifiers vs the stage target (Strangers 6, Acquaintances 9, Friends 12, Romantic 14, Lovers 16, Committed 18).",
    "BUSINESS: an owned business pays monthly profit on a roll vs its skill (high-risk ventures swing wider — windfalls and disasters are both possible).",
    "CYBER: hacking rolls vs Hacking with a penalty from the target's ICE (Public 0, Personal −2, Corporate −4, Military −7, Black ICE −10).",
    "MEDIEVAL: a holding pays seasonal income on a successful roll vs its skill.",
    "Always honor the rolled margin: narrate success proportionally to how far the roll succeeded or failed, and never invent unrolled outcomes.",
  ];
  return lines.join("\n");
}
