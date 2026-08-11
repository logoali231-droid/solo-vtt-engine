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

import type { GurpsCharacter, GurpsLifeMode, GurpsSkillDef, Wallet } from "../types";
import { gurpsLifeModeOf, walletToSp, spToWallet } from "../types";

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
  { id: "physician", name: "Court Physician", domain: "medieval", skill: "first-aid", fallbackStat: "ht", payMult: 1.8, summary: "Leeches, poultices, and a reputation that outlives your patients." },
  { id: "cook", name: "Castle Cook", domain: "medieval", skill: "professional-skill", fallbackStat: "iq", payMult: 0.9, summary: "Twelve-course feasts and the sharpest knives in the keep." },
  { id: "falconer", name: "Royal Falconer", domain: "medieval", skill: "professional-skill", fallbackStat: "iq", payMult: 1.1, summary: "Hawks, hunting days, and the ear of the hunt-master." },
  { id: "forester", name: "Forester", domain: "medieval", skill: "survival", fallbackStat: "iq", payMult: 0.8, summary: "The king's woods, the king's deer, and the poachers between." },
  { id: "mason", name: "Master Mason", domain: "medieval", skill: "professional-skill", fallbackStat: "iq", payMult: 1.2, summary: "Cathedrals, keeps, and the geometry of permanence." },
  { id: "court-advocate", name: "Court Advocate", domain: "medieval", skill: "law", fallbackStat: "iq", payMult: 1.6, summary: "Pleading cases before judges who already know the verdict." },
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
  { id: "engineer", name: "Civil Engineer", domain: "modern", skill: "professional-skill", fallbackStat: "iq", payMult: 1.6, summary: "Bridges, towers, and approving the risk of others." },
  { id: "professor", name: "University Professor", domain: "modern", skill: "research", fallbackStat: "iq", payMult: 1.4, summary: "Lectures by day, peer-reviewed dread by night." },
  { id: "chef", name: "Restaurant Chef", domain: "modern", skill: "professional-skill", fallbackStat: "iq", payMult: 1.2, summary: "A kitchen that runs on screaming and savoir-faire." },
  { id: "lawyer", name: "Lawyer", domain: "modern", skill: "law", fallbackStat: "iq", payMult: 2.0, summary: "Billable hours and the art of the settlement." },
  // --- Cyber ---
  { id: "corp-drone", name: "Corp Drone", domain: "cyber", skill: "administration", fallbackStat: "iq", payMult: 1.6, summary: "A cubicle in a glass tower, chained to the quarterly report." },
  { id: "netrunner", name: "Netrunner", domain: "cyber", skill: "hacking", fallbackStat: "iq", payMult: 2.0, summary: "Stealing data through the Grid — one cred at a time." },
  { id: "fixer", name: "Fixer", domain: "cyber", skill: "streetwise", fallbackStat: "iq", payMult: 1.7, summary: "Everyone knows someone who knows someone. That's you." },
  { id: "ripperdoc", name: "Ripperdoc", domain: "cyber", skill: "first-aid", fallbackStat: "ht", payMult: 1.8, summary: "Installing chrome and stitching wounds, no questions asked." },
  { id: "bounty-hunter", name: "Bounty Hunter", domain: "cyber", skill: "stealth", fallbackStat: "dx", payMult: 1.9, summary: "Collecting heads and warrants in equal measure." },
  { id: "corp-sec-engineer", name: "Corp Security Engineer", domain: "cyber", skill: "computer-programming", fallbackStat: "iq", payMult: 2.2, summary: "Building the walls the netrunners chip away at." },
  { id: "data-broker", name: "Data Broker", domain: "cyber", skill: "market-analysis", fallbackStat: "iq", payMult: 2.1, summary: "Buying secrets cheap and selling them at market price." },
  { id: "sim-diver", name: "Sim Diver", domain: "cyber", skill: "computer-operation", fallbackStat: "iq", payMult: 1.5, summary: "Testing virtual worlds by dying in them, professionally." },
  { id: "chrome-artist", name: "Chrome Artist", domain: "cyber", skill: "professional-skill", fallbackStat: "iq", payMult: 1.9, summary: "Body-mod work that's part surgery, part street art." },
  // --- Business ---
  { id: "shopkeeper", name: "Shopkeeper", domain: "business", skill: "merchant", fallbackStat: "iq", payMult: 1.3, summary: "Your own counter, your own stock, your own hours." },
  { id: "money-lender", name: "Money Lender", domain: "business", skill: "finance", fallbackStat: "iq", payMult: 1.8, summary: "Lending at interest — profitable until a client vanishes." },
  { id: "contractor", name: "Contractor", domain: "business", skill: "professional-skill", fallbackStat: "iq", payMult: 1.4, summary: "Bidding jobs, meeting deadlines, collecting invoices." },
  { id: "entertainer", name: "Performer", domain: "business", skill: "sex-appeal", fallbackStat: "ht", payMult: 1.2, summary: "Stage, screen or street — the crowd is the boss." },
  { id: "investor", name: "Private Investor", domain: "business", skill: "finance", fallbackStat: "iq", payMult: 2.4, summary: "Other people's ideas, your money, their risk." },
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
  /** Which Life Mode worlds this venture exists in ("all" = everywhere). */
  mode: GurpsLifeMode | "all";
  summary: string;
}

export const GURPS_BUSINESSES: GurpsBusinessDef[] = [
  { id: "stall", name: "Market Stall", skill: "merchant", startupCost: 20, profitBase: 8, risk: "low", mode: "all", summary: "A cart and a corner. Slow, safe, honest." },
  { id: "workshop", name: "Workshop", skill: "professional-skill", startupCost: 60, profitBase: 16, risk: "low", mode: "all", summary: "Tools, a bench, and a reputation for good work." },
  { id: "tavern", name: "Tavern / Bar", skill: "administration", startupCost: 150, profitBase: 30, risk: "moderate", mode: "all", summary: "Rooms, ale and gossip — the heart of any street." },
  { id: "trading-house", name: "Trading House", skill: "merchant", startupCost: 300, profitBase: 55, risk: "moderate", mode: "medieval", summary: "Moving goods in bulk along the trade lanes." },
  { id: "startup", name: "Tech Startup", skill: "computer-programming", startupCost: 250, profitBase: 90, risk: "high", mode: "modern", summary: "An idea, a loft, and a runway of pure adrenaline." },
  { id: "smuggling-ring", name: "Smuggling Ring", skill: "streetwise", startupCost: 200, profitBase: 80, risk: "high", mode: "cyber", summary: "Fast ships, blind guards, and very large margins." },
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
// Education — original universities & degrees. Enrolling costs tuition from
// the wallet (scholarships waive it); studying rolls 3d6 vs the degree's study
// skill and fills progress; the exam rolls 3d6 vs the university's exam skill.
// A graduated degree grants its skill bonus and unlocks its jobs.
// ---------------------------------------------------------------------------

export interface GurpsUniversityDef {
  id: string;
  name: string;
  era: "medieval" | "modern" | "cyber";
  /** Tuition per semester in gp. */
  tuition: number;
  /** Skill id used for exams at this university. */
  examSkill: string;
  fallbackStat: "st" | "dx" | "iq" | "ht";
  summary: string;
}

export const GURPS_UNIVERSITIES: GurpsUniversityDef[] = [
  { id: "monastery", name: "Monastery Scriptorium", era: "medieval", tuition: 30, examSkill: "research", fallbackStat: "iq", summary: "Vellum, candlelight, and the patient copying of the great texts." },
  { id: "guild-college", name: "Guild College", era: "medieval", tuition: 50, examSkill: "professional-skill", fallbackStat: "iq", summary: "Masters, apprentices, and a syllabus written in tools." },
  { id: "crown-university", name: "Crown University", era: "medieval", tuition: 90, examSkill: "law", fallbackStat: "iq", summary: "The kingdom's oldest seat of learning — clerks, jurists, and poets." },
  { id: "city-university", name: "City University", era: "modern", tuition: 140, examSkill: "research", fallbackStat: "iq", summary: "Lecture halls, late libraries, and the debt that follows." },
  { id: "polytechnic", name: "Polytechnic Institute", era: "modern", tuition: 120, examSkill: "professional-skill", fallbackStat: "iq", summary: "Workshops over oratories — learn by breaking things." },
  { id: "corp-academy", name: "Corp Academy", era: "cyber", tuition: 260, examSkill: "computer-programming", fallbackStat: "iq", summary: "Sponsored seats, signed NDAs, and a career pre-assigned." },
  { id: "grid-university", name: "Grid University", era: "cyber", tuition: 180, examSkill: "computer-operation", fallbackStat: "iq", summary: "Fully remote lectures beamed straight into the neural link." },
];

export const GURPS_UNIVERSITY_MAP = Object.fromEntries(
  GURPS_UNIVERSITIES.map((u) => [u.id, u]),
);

export interface GurpsDegreeDef {
  id: string;
  name: string;
  era: "medieval" | "modern" | "cyber";
  /** Skill id rolled when studying. */
  studySkill: string;
  fallbackStat: "st" | "dx" | "iq" | "ht";
  /** 3d6 target for the final exam. */
  examTarget: number;
  /** Semesters required to graduate. */
  semesters: number;
  /** Skill bonus granted on graduation. */
  skillBonus?: { skill: string; bonus: number };
  /** Jobs this degree unlocks (ids from GURPS_JOBS). */
  unlocks?: string[];
  summary: string;
}

export const GURPS_DEGREES: GurpsDegreeDef[] = [
  { id: "theology", name: "Theology", era: "medieval", studySkill: "research", fallbackStat: "iq", examTarget: 11, semesters: 3, summary: "Doctrine, scripture, and the patience of the cloister." },
  { id: "law-degree", name: "Law", era: "medieval", studySkill: "law", fallbackStat: "iq", examTarget: 13, semesters: 4, skillBonus: { skill: "law", bonus: 1 }, unlocks: ["court-advocate", "lawyer"], summary: "Contracts, customs, and the arguments that move realms." },
  { id: "medicine-degree", name: "Medicine", era: "medieval", studySkill: "first-aid", fallbackStat: "ht", examTarget: 13, semesters: 4, skillBonus: { skill: "first-aid", bonus: 1 }, unlocks: ["physician"], summary: "Humours, anatomy, and the delicate art of not killing." },
  { id: "history", name: "History & Letters", era: "medieval", studySkill: "research", fallbackStat: "iq", examTarget: 12, semesters: 3, summary: "Chronicles, lineages, and the long memory of kingdoms." },
  { id: "economics", name: "Economics", era: "modern", studySkill: "finance", fallbackStat: "iq", examTarget: 13, semesters: 3, skillBonus: { skill: "finance", bonus: 1 }, unlocks: ["investor"], summary: "Supply, demand, and why the invisible hand is usually broke." },
  { id: "engineering-degree", name: "Engineering", era: "modern", studySkill: "professional-skill", fallbackStat: "iq", examTarget: 13, semesters: 4, skillBonus: { skill: "professional-skill", bonus: 1 }, unlocks: ["engineer"], summary: "Stress, strain, and the mathematics of not collapsing." },
  { id: "computer-science", name: "Computer Science", era: "cyber", studySkill: "computer-programming", fallbackStat: "iq", examTarget: 13, semesters: 3, skillBonus: { skill: "computer-programming", bonus: 1 }, unlocks: ["corp-sec-engineer"], summary: "Algorithms, architecture, and the logic under the Grid." },
  { id: "netsec", name: "Net Security", era: "cyber", studySkill: "hacking", fallbackStat: "iq", examTarget: 14, semesters: 3, skillBonus: { skill: "hacking", bonus: 1 }, unlocks: ["corp-sec-engineer", "data-broker"], summary: "Offense and defense on the Grid — a degree with teeth." },
];

export const GURPS_DEGREE_MAP = Object.fromEntries(
  GURPS_DEGREES.map((dg) => [dg.id, dg]),
);

// ---------------------------------------------------------------------------
// Social life — original circles & events. Joining a circle costs entry and
// grants a reaction bonus on social rolls; attending events rolls 3d6 vs the
// event's skill and moves your reputation (0–100) by the margin.
// ---------------------------------------------------------------------------

export interface GurpsSocialCircleDef {
  id: string;
  name: string;
  era: "medieval" | "modern" | "cyber";
  /** Entry cost in gp. */
  entryCost: number;
  /** Reaction bonus while a member. */
  reactionMod: number;
  summary: string;
}

export const GURPS_SOCIAL_CIRCLES: GurpsSocialCircleDef[] = [
  { id: "tavern", name: "Tavern Regulars", era: "medieval", entryCost: 5, reactionMod: 1, summary: "A stool by the fire and a name the whole room knows." },
  { id: "guild", name: "Merchant Guild", era: "medieval", entryCost: 60, reactionMod: 2, summary: "Trade secrets, contacts, and the price of everything." },
  { id: "court", name: "Court Society", era: "medieval", entryCost: 120, reactionMod: 2, summary: "Intrigue, dances, and the politics of the great hall." },
  { id: "church", name: "Parish Congregation", era: "medieval", entryCost: 10, reactionMod: 1, summary: "Soup kitchens, hymns, and quiet influence." },
  { id: "social-club", name: "Social Club", era: "modern", entryCost: 80, reactionMod: 1, summary: "Golf, gala dinners, and handshakes that matter." },
  { id: "union", name: "Workers' Union", era: "modern", entryCost: 20, reactionMod: 1, summary: "Solidarity, strikes, and the strength of numbers." },
  { id: "gym", name: "Fitness Scene", era: "modern", entryCost: 30, reactionMod: 0, summary: "Lifting, posing, and the respect of the strong." },
  { id: "netrunners-club", name: "Netrunner Underground", era: "cyber", entryCost: 40, reactionMod: 2, summary: "Darknet handles, black-market chrome, and trust by reputation." },
  { id: "corp-social", name: "Corporate Social Circuit", era: "cyber", entryCost: 200, reactionMod: 2, summary: "Elevator pitches in glass atriums with synth-lattes." },
  { id: "street", name: "Street Scene", era: "cyber", entryCost: 10, reactionMod: 1, summary: "Street racers, graffiti crews, and the people's network." },
];

export const GURPS_SOCIAL_CIRCLE_MAP = Object.fromEntries(
  GURPS_SOCIAL_CIRCLES.map((sc) => [sc.id, sc]),
);

export interface GurpsSocialEventDef {
  id: string;
  name: string;
  era: "medieval" | "modern" | "cyber";
  /** Skill id rolled to shine at the event. */
  skill: string;
  fallbackStat: "st" | "dx" | "iq" | "ht";
  /** Cost to attend in gp. */
  cost: number;
  /** Base reputation gain on a success. */
  repBase: number;
  summary: string;
}

export const GURPS_SOCIAL_EVENTS: GurpsSocialEventDef[] = [
  { id: "feast", name: "Great Feast", era: "medieval", skill: "savoir-faire", fallbackStat: "iq", cost: 15, repBase: 4, summary: "Twelve courses, seating politics, and the king's ear." },
  { id: "tournament", name: "Tournament", era: "medieval", skill: "broadsword", fallbackStat: "dx", cost: 20, repBase: 6, summary: "The lists, the crowd, and glory for the bold." },
  { id: "market-day", name: "Market Day", era: "medieval", skill: "merchant", fallbackStat: "iq", cost: 5, repBase: 2, summary: "Booths, banter, and bargaining in the square." },
  { id: "ball", name: "Grand Ball", era: "modern", skill: "sex-appeal", fallbackStat: "ht", cost: 40, repBase: 5, summary: "Orchestras, champagne, and the dance of alliances." },
  { id: "gala", name: "Charity Gala", era: "modern", skill: "savoir-faire", fallbackStat: "iq", cost: 60, repBase: 4, summary: "Auction paddles, flashbulbs, and causes to be seen with." },
  { id: "sports-night", name: "Fight Night", era: "modern", skill: "brawling", fallbackStat: "dx", cost: 15, repBase: 3, summary: "Ringside seats, roar of the crowd, and heavy bets." },
  { id: "rave", name: "Street Rave", era: "cyber", skill: "computer-operation", fallbackStat: "iq", cost: 10, repBase: 3, summary: "Synth-bass, neural strobes, and the night's own wavelength." },
  { id: "demo", name: "Product Demo", era: "cyber", skill: "computer-programming", fallbackStat: "iq", cost: 25, repBase: 4, summary: "Pitch your build to investors with lasers on." },
  { id: "auction", name: "Black Market Auction", era: "cyber", skill: "streetwise", fallbackStat: "iq", cost: 50, repBase: 5, summary: "Chrome, secrets, and bid paddles for the unscrupulous." },
];

export const GURPS_SOCIAL_EVENT_MAP = Object.fromEntries(
  GURPS_SOCIAL_EVENTS.map((ev) => [ev.id, ev]),
);

// ---------------------------------------------------------------------------
// Medieval deep — original noble titles & court positions. Titles are bought
// from the wallet (or granted) and multiply income; court positions pay a
// salary and are served with a monthly roll.
// ---------------------------------------------------------------------------

export interface GurpsTitleDef {
  id: string;
  name: string;
  /** Purchase cost in gp. */
  cost: number;
  /** Multiplier on standard income added while holding the title. */
  incomeMult: number;
  summary: string;
}

export const GURPS_NOBLE_TITLES: GurpsTitleDef[] = [
  { id: "esquire", name: "Esquire", cost: 80, incomeMult: 0.2, summary: "A coat of arms and the right to carry a banner." },
  { id: "knight", name: "Knight", cost: 200, incomeMult: 0.5, summary: "Spurs, an oath, and land in fief." },
  { id: "baronet", name: "Baronet", cost: 400, incomeMult: 0.8, summary: "Hereditary rank, modest lands, real obligations." },
  { id: "baron", name: "Baron", cost: 900, incomeMult: 1.5, summary: "A keep, tenants, and a seat in the king's council." },
  { id: "count", name: "Count", cost: 1800, incomeMult: 2.5, summary: "A county to govern and an army to raise." },
  { id: "duke", name: "Duke", cost: 3600, incomeMult: 4, summary: "The highest honor short of the crown itself." },
];

export const GURPS_TITLE_MAP = Object.fromEntries(
  GURPS_NOBLE_TITLES.map((t) => [t.id, t]),
);

export interface GurpsCourtPositionDef {
  id: string;
  name: string;
  /** Skill id rolled when serving. */
  skill: string;
  fallbackStat: "st" | "dx" | "iq" | "ht";
  /** Pay multiplier vs standard income. */
  payMult: number;
  summary: string;
}

export const GURPS_COURT_POSITIONS: GurpsCourtPositionDef[] = [
  { id: "page", name: "Page", skill: "savoir-faire", fallbackStat: "iq", payMult: 0.4, summary: "Run messages, pour wine, learn everything." },
  { id: "herald", name: "Royal Herald", skill: "sex-appeal", fallbackStat: "ht", payMult: 0.7, summary: "Proclaim, announce, and carry the king's voice." },
  { id: "marshal", name: "Court Marshal", skill: "tactics", fallbackStat: "iq", payMult: 1.1, summary: "Tournaments, guards, and the discipline of the yard." },
  { id: "chancellor", name: "Chancellor", skill: "administration", fallbackStat: "iq", payMult: 1.6, summary: "The realm's paperwork flows through your desk." },
  { id: "spymaster", name: "Spymaster", skill: "streetwise", fallbackStat: "iq", payMult: 2.0, summary: "You know what the king knows — and what he doesn't." },
];

export const GURPS_COURT_POSITION_MAP = Object.fromEntries(
  GURPS_COURT_POSITIONS.map((p) => [p.id, p]),
);

// ---------------------------------------------------------------------------
// Cyber deep — original netdecks, programs & the corporate ladder.
// ---------------------------------------------------------------------------

export interface GurpsNetdeckDef {
  id: string;
  name: string;
  cost: number;
  /** Hacking bonus while jacked in. */
  hackBonus: number;
  summary: string;
}

export const GURPS_NETDECKS: GurpsNetdeckDef[] = [
  { id: "civic-deck", name: "Civic Deck", cost: 40, hackBonus: 0, summary: "Public-access terminal hardware — gets you on the Grid." },
  { id: "runner-deck", name: "Runner Deck", cost: 120, hackBonus: 1, summary: "Custom-rigged for speed and silence." },
  { id: "corp-deck", name: "Corp Deck", cost: 300, hackBonus: 2, summary: "Enterprise hardware with corporate-grade ICE breakers." },
  { id: "military-deck", name: "Military Deck", cost: 700, hackBonus: 3, summary: "War-issue architecture. Owning one is probably illegal." },
];

export const GURPS_NETDECK_MAP = Object.fromEntries(
  GURPS_NETDECKS.map((nd) => [nd.id, nd]),
);

export interface GurpsProgramDef {
  id: string;
  name: string;
  kind: "attack" | "defense" | "utility";
  cost: number;
  /** Hacking bonus while loaded. */
  hackBonus?: number;
  /** Defense bonus against traces when caught. */
  defenseBonus?: number;
  summary: string;
}

export const GURPS_PROGRAMS: GurpsProgramDef[] = [
  { id: "icebreaker", name: "Icebreaker", kind: "attack", cost: 35, hackBonus: 1, summary: "Shatters ICE walls with brute force." },
  { id: "stealth-wrap", name: "Stealth Wrap", kind: "attack", cost: 50, hackBonus: 1, defenseBonus: 1, summary: "Muffles your footprint while you dig." },
  { id: "data-razor", name: "Data Razor", kind: "attack", cost: 60, hackBonus: 2, summary: "Carves through encrypted payloads fast." },
  { id: "firewall", name: "Micro-Firewall", kind: "defense", cost: 30, defenseBonus: 1, summary: "Personal ICE that eats stray daemons." },
  { id: "trace-killer", name: "Trace Killer", kind: "defense", cost: 70, defenseBonus: 2, summary: "Erases the breadcrumbs as you run." },
  { id: "decryptor", name: "Decryptor", kind: "utility", cost: 25, hackBonus: 1, summary: "Opens sealed files and cipher-locked doors." },
  { id: "glitch", name: "Glitch Bomb", kind: "utility", cost: 40, summary: "Jams sensors and spoofs identities." },
  { id: "proxy-chain", name: "Proxy Chain", kind: "utility", cost: 45, defenseBonus: 1, summary: "Bounces your signal through six dead zones." },
];

export const GURPS_PROGRAM_MAP = Object.fromEntries(
  GURPS_PROGRAMS.map((p) => [p.id, p]),
);

export interface GurpsCorpRankDef {
  id: string;
  name: string;
  /** Income multiplier for the rank. */
  incomeMult: number;
  /** 3d6 target to be promoted INTO this rank. */
  target: number;
  summary: string;
}

export const GURPS_CORP_LADDER: GurpsCorpRankDef[] = [
  { id: "intern", name: "Intern", incomeMult: 0.4, target: 7, summary: "Unpaid in spirit, coffee in hand." },
  { id: "analyst", name: "Analyst", incomeMult: 0.9, target: 9, summary: "Spreadsheets and the eternal status meeting." },
  { id: "associate", name: "Associate", incomeMult: 1.4, target: 11, summary: "You delegate the bad news now." },
  { id: "manager", name: "Manager", incomeMult: 2.0, target: 13, summary: "A floor, a budget, and a door that closes." },
  { id: "director", name: "Director", incomeMult: 3.0, target: 15, summary: "The corner office and the quarterly guillotine." },
  { id: "executive", name: "Executive", incomeMult: 4.5, target: 17, summary: "The company bends around your signature." },
];

export const GURPS_CORP_RANK_MAP = Object.fromEntries(
  GURPS_CORP_LADDER.map((r) => [r.id, r]),
);

// ---------------------------------------------------------------------------
// Life Mode filters — the Adventure Setup tag that re-frames the whole
// extension. Every table below filters by the tag; "all" keeps everything.
// ---------------------------------------------------------------------------

/** Does the given content era exist in this Life Mode? */
export function gurpsModeHas(era: "medieval" | "modern" | "cyber", mode: GurpsLifeMode): boolean {
  return mode === "all" || mode === era;
}

/** Jobs available in a Life Mode (the era-agnostic "business" domain is
 *  always included — a shopkeeper exists in every world). */
export function gurpsJobsFor(mode: GurpsLifeMode): GurpsJobDef[] {
  if (mode === "all") return GURPS_JOBS;
  return GURPS_JOBS.filter(
    (j) => j.domain === mode || j.domain === "business",
  );
}

/** Businesses available in a Life Mode. */
export function gurpsBusinessesFor(mode: GurpsLifeMode): GurpsBusinessDef[] {
  if (mode === "all") return GURPS_BUSINESSES;
  return GURPS_BUSINESSES.filter((b) => b.mode === "all" || b.mode === mode);
}

/** Universities available in a Life Mode. */
export function gurpsUniversitiesFor(mode: GurpsLifeMode): GurpsUniversityDef[] {
  return GURPS_UNIVERSITIES.filter((u) => gurpsModeHas(u.era, mode));
}

/** Degrees available in a Life Mode. */
export function gurpsDegreesFor(mode: GurpsLifeMode): GurpsDegreeDef[] {
  return GURPS_DEGREES.filter((dg) => gurpsModeHas(dg.era, mode));
}

/** Social circles available in a Life Mode. */
export function gurpsCirclesFor(mode: GurpsLifeMode): GurpsSocialCircleDef[] {
  return GURPS_SOCIAL_CIRCLES.filter((sc) => gurpsModeHas(sc.era, mode));
}

/** Social events available in a Life Mode. */
export function gurpsEventsFor(mode: GurpsLifeMode): GurpsSocialEventDef[] {
  return GURPS_SOCIAL_EVENTS.filter((ev) => gurpsModeHas(ev.era, mode));
}

/** Is the medieval layer (holdings, titles, court) part of this Life Mode? */
export function gurpsMedievalLayer(mode: GurpsLifeMode): boolean {
  return mode === "all" || mode === "medieval";
}

/** Is the cyber layer (chrome, netrunning, corps) part of this Life Mode? */
export function gurpsCyberLayer(mode: GurpsLifeMode): boolean {
  return mode === "all" || mode === "cyber";
}

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

/** Extra monthly income from a noble title, in gp. */
export function gurpsTitleIncome(titleId: string | undefined): number {
  if (!titleId) return 0;
  const t = GURPS_TITLE_MAP[titleId];
  return Math.round(GURPS_STANDARD_INCOME * (t?.incomeMult ?? 0));
}

/** Monthly salary for a court position, in gp. */
export function gurpsCourtSalary(positionId: string | undefined): number {
  if (!positionId) return 0;
  const p = GURPS_COURT_POSITION_MAP[positionId];
  return Math.round(GURPS_STANDARD_INCOME * (p?.payMult ?? 0));
}

/** Monthly salary for a corp rank, in gp. */
export function gurpsCorpSalary(rankId: string | undefined): number {
  if (!rankId) return 0;
  const r = GURPS_CORP_RANK_MAP[rankId];
  return Math.round(GURPS_STANDARD_INCOME * (r?.incomeMult ?? 0));
}

/** Total hacking bonus from netdeck + loaded programs (original). */
export function gurpsHackBonus(
  netdeckId: string | undefined,
  programs: string[] | undefined,
): number {
  let b = 0;
  if (netdeckId) b += GURPS_NETDECK_MAP[netdeckId]?.hackBonus ?? 0;
  for (const p of programs ?? []) b += GURPS_PROGRAM_MAP[p]?.hackBonus ?? 0;
  return b;
}

/** Total trace-defense bonus from loaded programs. */
export function gurpsTraceDefense(programs: string[] | undefined): number {
  let b = 0;
  for (const p of programs ?? []) b += GURPS_PROGRAM_MAP[p]?.defenseBonus ?? 0;
  return b;
}

/**
 * Study session result: how much exam progress (0–100) a study roll buys.
 * Critical success is a breakthrough; a critical failure sets you back.
 */
export function gurpsStudyGain(margin: number, outcome: string): number {
  if (outcome === "critical-success") return 24;
  if (outcome === "critical-failure") return -12;
  if (margin >= 5) return 16;
  if (margin >= 0) return 10;
  if (margin >= -3) return 4;
  return 0;
}

/**
 * Social event outcome: reputation delta from the roll margin.
 * A critical failure is a scandal — reputation drops.
 */
export function gurpsEventRep(margin: number, outcome: string, repBase: number): number {
  if (outcome === "critical-success") return repBase * 3;
  if (outcome === "critical-failure") return -Math.round(repBase * 1.5);
  if (margin >= 5) return repBase * 2;
  if (margin >= 0) return repBase;
  if (margin >= -3) return 0;
  return -Math.round(repBase * 0.5);
}

// ---------------------------------------------------------------------------
// AI rules corpus — original plain-language summary fed to the GM so it can
// narrate job, business, love, cyber and medieval rolls faithfully.
// ---------------------------------------------------------------------------

export function gurpsRulesContext(mode?: GurpsLifeMode): string {
  const m = gurpsLifeModeOf(mode ? { lifeMode: mode } : undefined);
  const modeLine =
    m === "medieval"
      ? "LIFE MODE TAG — FANTASY / MEDIEVAL: this campaign's life-sim is a medieval world — field hands, guilds, courts, monasteries, fiefs and titles. There are no phones, no corporations and no chrome; the social ladder runs on land, oaths and favor. Only medieval-era jobs, universities, degrees, circles, events and businesses exist; netrunning, cyberware, netdecks, programs and the corporate ladder do not exist in this world."
      : m === "modern"
        ? "LIFE MODE TAG — MODERN / SOCIAL: this campaign's life-sim is a contemporary social-engineering world — careers, universities, student debt, social clubs, galas and city life. Only modern-era jobs, universities, degrees, circles, events and businesses exist; medieval holdings, titles, court positions, netrunning and chrome do not exist in this world."
        : m === "cyber"
          ? "LIFE MODE TAG — CYBERPUNK: this campaign's life-sim is a cyberpunk world — corp drones, netrunners, chrome, ICE, the Grid and the corporate ladder. Only cyber-era jobs, universities, degrees, circles, events and businesses exist; medieval holdings, titles and court positions do not exist in this world."
          : "LIFE MODE TAG — EVERYTHING / MIXED: every era of the life-sim coexists — medieval courts and cyber decks, monasteries and megacorps.";
  const lines: string[] = [
    "GURPS LIFE & LIVELIHOOD EXTENSION (original mechanics in GURPS style — 3d6 roll-under vs skill targets, margins of success).",
    modeLine,
    "The engine rolls every check and resolves the outcome; you narrate the result faithfully.",
    "JOBS: a monthly work roll vs the job's skill sets the month's pay (critical success = double pay, success = standard, failure = half, critical failure = fired). Degrees can unlock higher jobs.",
    "ECONOMICS: each wealth tier sets monthly income and cost of living; the wallet in ADVENTURE STATE is the mechanical purse the player spends from.",
    "LOVE: advancing a relationship requires a reaction roll — 3d6 + attraction modifiers vs the stage target (Strangers 6, Acquaintances 9, Friends 12, Romantic 14, Lovers 16, Committed 18).",
    "BUSINESS: an owned business pays monthly profit on a roll vs its skill (high-risk ventures swing wider — windfalls and disasters are both possible).",
    "CYBER: hacking rolls vs Hacking + netdeck/program bonuses with a penalty from the target's ICE (Public 0, Personal −2, Corporate −4, Military −7, Black ICE −10). Programs also grant trace-defense bonuses. The corporate ladder promotes on a roll vs the next rank's target (Intern 7, Analyst 9, Associate 11, Manager 13, Director 15, Executive 17).",
    "MEDIEVAL: a holding pays seasonal income on a successful roll vs its skill. Noble titles add monthly income; court positions pay a salary on a monthly service roll.",
    "EDUCATION: universities charge tuition per semester (scholarships waive it). Studying rolls 3d6 vs the degree's study skill and fills exam progress (0–100); the final exam rolls vs the university's exam skill at the degree's target. Graduating grants the degree's skill bonus and unlocks its jobs.",
    "SOCIAL LIFE: reputation runs 0–100. Social circles cost entry and grant a reaction bonus; attending events (feast, ball, gala, rave…) rolls 3d6 vs the event's skill — successes raise reputation, critical failures are scandals that lower it.",
    "Always honor the rolled margin: narrate success proportionally to how far the roll succeeded or failed, and never invent unrolled outcomes.",
  ];
  return lines.join("\n");
}
