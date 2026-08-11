// ============================================================================
// Oraculum — GURPS-style CYBER / FUTURISTIC expansion.
//
// ORIGINAL CONTENT. Published cyberpunk supplements (GURPS Cyberpunk,
// Ultra-Tech, etc.) are closed-copyright, so this module implements the SAME
// design language — 3d6 roll-under vs a skill target, margins of success,
// black-ICE danger, gear with clear mechanical stats — with entirely original
// gear, netrun missions and ICE countermeasures. Nothing here is copied.
//
// Domains: Gear · Netrunning missions · ICE countermeasures.
// ============================================================================

import type { GurpsCharacter } from "../types";

// ---------------------------------------------------------------------------
// Futuristic gear — original catalog with GURPS-style mechanical stats.
// ---------------------------------------------------------------------------

/** GURPS skill level (inlined — same math as the core gurpsSkillLevel). */
function gurpsLevel(stat: number, difficulty: "easy" | "average" | "hard", points: number): number {
  const offset = difficulty === "easy" ? 0 : difficulty === "average" ? -1 : -2;
  if (points <= 0) return stat - 5;
  if (points === 1) return stat + offset;
  if (points === 2) return stat + offset + 1;
  if (points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((points - 4) / 4);
}

export type GurpsGearKind = "weapon" | "armor" | "sensor" | "drone" | "vehicle" | "utility";

export interface GurpsGearDef {
  id: string;
  name: string;
  kind: GurpsGearKind;
  cost: number;
  summary: string;
  effect: string;
  /** Skill used when the gear is deployed (defaults to the kind's skill). */
  skill?: string;
}

export const GURPS_CYBER_GEAR: GurpsGearDef[] = [
  // --- Weapons ---
  { id: "arc-lance", name: "Arc Lance", kind: "weapon", cost: 250, skill: "guns", summary: "Energy sidearm — 3d burn, 30 yd.", effect: "A crackling sidearm: 3d burn damage at up to 30 yd." },
  { id: "pulse-carbine", name: "Pulse Carbine", kind: "weapon", cost: 700, skill: "guns", summary: "Rifle-grade plasma — 4d burn, 60 yd.", effect: "A heavy pulse rifle: 4d burn damage at up to 60 yd." },
  { id: "shredder-smg", name: "Shredder SMG", kind: "weapon", cost: 400, skill: "guns", summary: "Close-quarters storm — 3d+2, 20 yd.", effect: "A compact storm of flechettes: 3d+2 damage at up to 20 yd." },
  { id: "plasma-cutter", name: "Plasma Cutter", kind: "weapon", cost: 300, skill: "shortsword", summary: "Melee torch — 4d burn, cuts armor.", effect: "A welding torch that cuts: 4d burn damage, ignores DR 3 or less." },
  // --- Armor ---
  { id: "weave-suit", name: "Weave Suit", kind: "armor", cost: 300, summary: "Concealable smart fabric — DR 2.", effect: "DR 2, looks like ordinary streetwear." },
  { id: "ballistic-vest", name: "Ballistic Vest", kind: "armor", cost: 500, summary: "Rigid plates — DR 4.", effect: "DR 4 against all damage to the torso." },
  { id: "hardsuit", name: "Hardsuit", kind: "armor", cost: 1500, summary: "Full sealed shell — DR 8, sealed.", effect: "DR 8, fully sealed (vacuum, gas, water); slows Move by 1." },
  // --- Sensors ---
  { id: "optic-suite", name: "Optic Suite", kind: "sensor", cost: 450, summary: "Implanted eyes — +2 Vision.", effect: "+2 to Vision rolls; low-light and glare-filter modes." },
  { id: "audio-suite", name: "Audio Suite", kind: "sensor", cost: 350, summary: "Implanted ears — +2 Hearing.", effect: "+2 to Hearing rolls; filters out loud ambient noise." },
  { id: "bio-scanner", name: "Bio Scanner", kind: "sensor", cost: 400, summary: "Palm unit — read life signs through walls.", effect: "Detects living beings within 15 yd through walls and clutter." },
  // --- Drones ---
  { id: "scout-drone", name: "Scout Drone", kind: "drone", cost: 500, skill: "electronics-operation", summary: "A palm-sized spy — flies, films, relays.", effect: "Scouts up to 500 yd, relays video; +3 to reconnaissance rolls." },
  { id: "gun-drone", name: "Gun Drone", kind: "drone", cost: 900, skill: "electronics-operation", summary: "A hovering shooter — 2d+1 per volley.", effect: "Flies and fires 2d+1 damage per volley; counts as an ally in a fight." },
  { id: "medic-drone", name: "Medic Drone", kind: "drone", cost: 700, skill: "electronics-operation", summary: "Auto-doc — +2 to First Aid.", effect: "+2 to First Aid rolls; can stabilize one bleeding ally automatically." },
  // --- Vehicles ---
  { id: "hoverbike", name: "Hoverbike", kind: "vehicle", cost: 1200, skill: "driving", summary: "Fast, loud, illegal in most districts.", effect: "A fast ground-effect bike: +2 to Driving in open terrain, poor in tunnels." },
  { id: "gridrunner", name: "Gridrunner", kind: "vehicle", cost: 2000, skill: "driving", summary: "A quiet armored sedan — DR 4.", effect: "A civilian car with DR 4; unremarkable and untraceable in traffic." },
  { id: "armored-transport", name: "Armored Transport", kind: "vehicle", cost: 6000, skill: "driving", summary: "A rolling vault — DR 10, six wheels.", effect: "DR 10, seats six, survives mines and ambushes." },
  // --- Utility ---
  { id: "jammer", name: "Signal Jammer", kind: "utility", cost: 350, skill: "electronics-operation", summary: "Kills comms and cameras in a bubble.", effect: "Blocks radio and comms within 30 yd; -2 to enemy coordination rolls." },
  { id: "datapad-pro", name: "Datapad Pro", kind: "utility", cost: 200, skill: "computer-operation", summary: "A hardened deck-side terminal.", effect: "+1 to Computer Operation and Research rolls." },
  { id: "locksmith-kit", name: "Locksmith Kit", kind: "utility", cost: 250, skill: "lockpicking", summary: "Magnetic and thermal pick tools — +1.", effect: "+1 to Lockpicking and Traps rolls." },
];

export const GURPS_GEAR_MAP = Object.fromEntries(
  GURPS_CYBER_GEAR.map((g) => [g.id, g]),
);

export const GURPS_GEAR_KIND_LABELS: Record<GurpsGearKind, string> = {
  weapon: "Weapon",
  armor: "Armor",
  sensor: "Sensor",
  drone: "Drone",
  vehicle: "Vehicle",
  utility: "Utility",
};

// ---------------------------------------------------------------------------
// Netrun missions — original target profiles. Difficulty maps to the same
// penalty ladder as GURPS_HACK_TARGETS (Public 0, Personal −2, Corporate −4,
// Military −7, Black ICE −10) so the resolver stacks with deck/program bonus.
// ---------------------------------------------------------------------------

export interface GurpsIceDef {
  id: string;
  name: string;
  summary: string;
}

export const GURPS_ICE: GurpsIceDef[] = [
  { id: "warden", name: "Warden", summary: "Watchdog ICE — if you fail, it flags your trace for the grid." },
  { id: "serpent", name: "Serpent", summary: "Attacker ICE — on failure it strikes back with a data-whip (FP damage)." },
  { id: "trap-grid", name: "Trap Grid", summary: "Slow ICE — on failure it entangles your deck, -2 on the next attempt." },
  { id: "black-ice", name: "Black Ice", summary: "Lethal ICE — on a critical failure it burns out a program or your interface." },
];

export const GURPS_ICE_MAP = Object.fromEntries(
  GURPS_ICE.map((i) => [i.id, i]),
);

export interface GurpsNetrunDef {
  id: string;
  name: string;
  /** Hacking penalty (matches the hack-target ladder). */
  penalty: number;
  /** ICE defending the run. */
  ice: string[];
  objective: string;
  /** gp value of the paydata on success. */
  paydata: number;
  summary: string;
}

export const GURPS_NETRUNS: GurpsNetrunDef[] = [
  { id: "backroom", name: "Backroom Data Broker", penalty: -2, ice: ["warden"], objective: "Extract a client list from a fence's terminal.", paydata: 150, summary: "A low-risk milk run on a fixer's private machine." },
  { id: "archive-vault", name: "Corp Archive Vault", penalty: -4, ice: ["warden", "serpent"], objective: "Steal the schematics for a new chassis line.", paydata: 400, summary: "A deep archive behind a mid-level corp's defenses." },
  { id: "security-mainframe", name: "Security Firm Mainframe", penalty: -4, ice: ["warden", "trap-grid"], objective: "Plant a daemon that will scrub a record.", paydata: 350, summary: "In and out of a firm that sells lockdowns to everyone." },
  { id: "broadcast-core", name: "Media Broadcast Core", penalty: -4, ice: ["serpent", "trap-grid"], objective: "Leak the story the corps buried.", paydata: 300, summary: "Bust into the news grid and slip the truth into the feed." },
  { id: "military-node", name: "Military Grid Node", penalty: -7, ice: ["warden", "serpent", "trap-grid"], objective: "Decoy a satellite handshake for six minutes.", paydata: 900, summary: "The army's mesh — everything is watched, everything shoots." },
  { id: "black-core", name: "Black ICE Core", penalty: -10, ice: ["warden", "serpent", "black-ice"], objective: "Break the black box that ate three runners.", paydata: 2000, summary: "The legendary core no runner has ever cracked." },
];

export const GURPS_NETRUN_MAP = Object.fromEntries(
  GURPS_NETRUNS.map((n) => [n.id, n]),
);

/** Total netrunning modifier: Hacking skill + deck + programs + gear. */
export function gurpsNetrunTotal(
  c: GurpsCharacter,
  hackingLevel: number,
  deckBonus: number,
  programBonus: number,
  gearBonus: number,
): number {
  return hackingLevel + deckBonus + programBonus + gearBonus;
}

/** Hacking skill level — trained, else IQ-5 default. */
export function gurpsHackingLevel(c: GurpsCharacter): number {
  const trained = c.skills.find((s) => s.id === "hacking");
  if (!trained) return c.attributes.iq - 5;
  return gurpsLevel(c.attributes.iq, "hard", trained.points);
}

/**
 * Netrun outcome — returns paydata, damage taken (HP), FP loss and a trace
 * flag. Black ICE only ever fires on a critical failure; Warden adds a trace
 * on any failure.
 */
export function gurpsNetrunResult(
  margin: number,
  outcome: string,
  run: GurpsNetrunDef,
): { paydata: number; hpDamage: number; fpDamage: number; traced: boolean; note: string } {
  if (outcome === "critical-success") {
    return { paydata: run.paydata * 2, hpDamage: 0, fpDamage: 0, traced: false, note: "A flawless run — you even grab the backup drives (+double paydata)." };
  }
  if (outcome === "success") {
    return { paydata: run.paydata, hpDamage: 0, fpDamage: 0, traced: false, note: `The run goes clean — paydata secured (+${run.paydata} gp).` };
  }
  // Failure — ICE reacts.
  const ice = run.ice.map((i) => GURPS_ICE_MAP[i]).filter(Boolean);
  const hasBlackIce = ice.some((i) => i.id === "black-ice");
  const hasSerpent = ice.some((i) => i.id === "serpent");
  const hasWarden = ice.some((i) => i.id === "warden");
  const hasTrapGrid = ice.some((i) => i.id === "trap-grid");
  if (outcome === "critical-failure") {
    return {
      paydata: 0,
      hpDamage: hasBlackIce ? 6 : 0,
      fpDamage: hasSerpent ? 3 : hasBlackIce ? 2 : 1,
      traced: true,
      note: hasBlackIce
        ? "BLACK ICE — the core wakes and strikes: 6 HP damage, 2 FP, and your trace is logged."
        : hasSerpent
          ? "The Serpent lashes back — 3 FP and the grid logs your trace."
          : "The ICE locks you out and flags your trace. The run is blown.",
    };
  }
  // plain failure (margin < 0)
  const trace = hasWarden || hasTrapGrid;
  return {
    paydata: 0,
    hpDamage: 0,
    fpDamage: hasSerpent ? 1 : 0,
    traced: trace,
    note: margin >= -5
      ? hasSerpent
        ? "You slip past the payload but the Serpent scores a glancing hit — 1 FP, no data."
        : "The ICE drops a counter-run — you bail with nothing (no data, no trace)."
      : hasWarden
        ? "The Warden flags you — your trace is logged and the run is dead."
        : hasTrapGrid
          ? "The Trap Grid closes — you cut the link, but the next attempt will be harder."
          : "The ICE wins the exchange — you pull the plug, empty-handed.",
  };
}

// ---------------------------------------------------------------------------
// AI rules corpus — fed to the GM so it narrates cyber/futuristic content.
// The caller gates by mode (cyber worlds only).
// ---------------------------------------------------------------------------

export function gurpsCyberRulesContext(): string {
  return [
    "GURPS-STYLE CYBER / FUTURISTIC EXPANSION (original mechanics — 3d6 roll-under vs skill targets, margins of success).",
    "GEAR: energy weapons (Arc Lance 3d burn, Pulse Carbine 4d burn, Shredder SMG 3d+2, Plasma Cutter 4d burn ignoring DR 3), smart armor (Weave Suit DR 2, Ballistic Vest DR 4, Hardsuit DR 8 sealed), sensors (+2 Vision/Hearing, bio-scanners), drones (scout, gun, medic) and vehicles (hoverbike, gridrunner, armored transport). Gear is bought from the wallet and lives in ADVENTURE STATE.",
    "NETRUNNING: a netrun rolls 3d6 vs Hacking + netdeck bonus + program bonus + gear bonus, with a penalty from the target (Backroom −2, Corp Vaults −4, Military Node −7, Black ICE Core −10). Success collects the paydata (150–2,000 gp); failure trips the ICE — Warden logs a trace, Serpent deals FP damage, Trap Grid hampers the next attempt, and Black ICE on a critical failure deals HP damage.",
    "Chrome (cyberware), netdecks, programs, the corporate ladder and this gear exist only in cyber worlds — honor the LIFE MODE TAG and never invent futuristic solutions in a world without them.",
  ].join("\n");
}
