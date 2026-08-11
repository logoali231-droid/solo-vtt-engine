// ============================================================================
// Oraculum — GURPS Gear & Goods Shop.
//
// A point-scaled, life-mode-aware storefront for the GURPS engine. Stock is
// built from the character's trained combat skills (a swordsman sees blades,
// a gunman sees iron), gated by total character points so better builds find
// better (and pricier) gear, and filtered by the campaign's Life Mode tag —
// medieval worlds stock chainmail and longbows, modern worlds sell pistols and
// laptops, cyber worlds add kevlar and stim patches, and "all" opens every
// shelf.
//
// Prices are in the app's mechanical gp purse (the same wallet the Life &
// Livelihood extension pays from). Armor with an `armorId` equips straight
// into the character slot and feeds the DR engine on the sheet; everything
// else is carried loot with a mechanical description.
// ============================================================================

import type { GurpsCharacter, GurpsLifeMode, Wallet } from "@/lib/rpg/types";
import { gurpsThrust } from "@/lib/rpg/dice";

export type GurpsShopCategory = "armor" | "weapon" | "gear" | "consumable" | "life";

export type GurpsQuality = "standard" | "fine" | "masterwork";

export const GURPS_QUALITY_LABELS: Record<GurpsQuality, string> = {
  standard: "Standard",
  fine: "Fine",
  masterwork: "Masterwork",
};

export interface GurpsShopItem {
  id: string;
  name: string;
  category: GurpsShopCategory;
  quality: GurpsQuality;
  /** Price in gp — the app's mechanical purse. */
  price: number;
  weight: string;
  /** Which Life Modes stock this item; "all" = every era. */
  eras: GurpsLifeMode[];
  /** Equipping sets the character's armor slot (feeds the DR engine). */
  armorId?: string;
  /** Armor DR once equipped (display + engine source). */
  dr?: number;
  /** The GURPS skill that uses this weapon (e.g. "broadsword"). */
  skill?: string;
  /** Human-readable damage at the character's ST, e.g. "2d+1 cut". */
  damageText?: string;
  /** Quality bonus — Fine weapons deal +1, Masterwork +2 (flavor + display). */
  qualityBonus?: number;
  description: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Weapons — GURPS skill families. `damage` describes how the weapon strikes;
// the actual roll is ST-based (thrust or swing) and shown per-character.
// ---------------------------------------------------------------------------

export interface GurpsShopWeaponDef {
  id: string;
  name: string;
  skill: string;
  kind: "thrust" | "swing" | "fixed";
  damageType: string;
  reach: string;
  /** Fixed damage for guns, e.g. "2d+2 pi". */
  fixedDamage?: string;
  price: number;
  weight: string;
  eras: GurpsLifeMode[];
  blurb: string;
}

export const GURPS_SHOP_WEAPONS: GurpsShopWeaponDef[] = [
  // --- Melee (all eras — a blade is a blade) ---
  { id: "shop-knife-small", name: "Small Knife", skill: "knife", kind: "thrust", damageType: "imp", reach: "C", price: 3, weight: "0.5 lb", eras: ["all"], blurb: "Concealable, cheap, and lethal in the right hands." },
  { id: "shop-knife-large", name: "Large Knife", skill: "knife", kind: "thrust", damageType: "imp", reach: "C, 1", price: 5, weight: "1 lb", eras: ["all"], blurb: "A long blade for close work — belt-knife of the professional." },
  { id: "shop-shortsword", name: "Shortsword", skill: "shortsword", kind: "swing", damageType: "cut", reach: "1", price: 40, weight: "2 lb", eras: ["all"], blurb: "Fast and balanced; the city guard's favorite sidearm." },
  { id: "shop-broadsword", name: "Broadsword", skill: "broadsword", kind: "swing", damageType: "cut", reach: "1", price: 50, weight: "3 lb", eras: ["all"], blurb: "The classic blade — heavy enough to cleave, nimble enough to parry." },
  { id: "shop-handaxe", name: "Handaxe", skill: "axe-mace", kind: "swing", damageType: "cut", reach: "1", price: 5, weight: "2 lb", eras: ["all"], blurb: "A splitting axe that doubles as a weapon — and a tool." },
  { id: "shop-mace", name: "Mace", skill: "axe-mace", kind: "swing", damageType: "cr", reach: "1", price: 6, weight: "3 lb", eras: ["all"], blurb: "Blunt force that laughs at armor." },
  { id: "shop-spear", name: "Spear", skill: "spear", kind: "thrust", damageType: "imp", reach: "1*", price: 4, weight: "4 lb", eras: ["all"], blurb: "Holds a line, and can be thrown when the line breaks." },
  { id: "shop-halberd", name: "Halberd", skill: "polearm", kind: "swing", damageType: "cut", reach: "2, 3", price: 12, weight: "6 lb", eras: ["all"], blurb: "Axe, spike and hook on a long shaft — reach is its armor." },
  { id: "shop-javelin", name: "Javelin", skill: "thrown-weapon", kind: "thrust", damageType: "imp", reach: "1*, thrown", price: 3, weight: "2 lb", eras: ["all"], blurb: "A light throwing spear; two more in your off hand." },
  { id: "shop-brass-knuckles", name: "Brass Knuckles", skill: "brawling", kind: "thrust", damageType: "cr", reach: "C", price: 2, weight: "0.5 lb", eras: ["all"], blurb: "Fists, but with intent. +1 damage to punches." },
  // --- Ranged (all eras: bows; modern/cyber: guns) ---
  { id: "shop-longbow", name: "Longbow", skill: "bow", kind: "thrust", damageType: "imp", reach: "1, 2 (120 yd)", price: 20, weight: "3 lb", eras: ["all"], blurb: "Yew, waxed string, and forty arrows in the quiver." },
  { id: "shop-crossbow", name: "Crossbow", skill: "crossbow", kind: "thrust", damageType: "imp", reach: "1, 2 (100 yd)", price: 15, weight: "6 lb", eras: ["all"], blurb: "A windlass in the field — slow to load, hard to argue with." },
  { id: "shop-pistol", name: "Service Pistol", skill: "guns", kind: "fixed", damageType: "pi", reach: "1, 2 (90 yd)", fixedDamage: "2d+2", price: 25, weight: "2 lb", eras: ["modern", "cyber"], blurb: "Nine rounds of authority. Standard sidearm of the modern world." },
  { id: "shop-rifle", name: "Combat Rifle", skill: "guns", kind: "fixed", damageType: "pi", reach: "2, 3 (500 yd)", fixedDamage: "5d", price: 60, weight: "8 lb", eras: ["modern", "cyber"], blurb: "Long-range stopping power for soldiers and professionals." },
  { id: "shop-combat-knife", name: "Combat Knife", skill: "knife", kind: "thrust", damageType: "imp", reach: "C, 1", price: 6, weight: "1 lb", eras: ["modern", "cyber"], blurb: "Hardened steel, serrated back, built for breaching." },
];

/** GURPS swing damage (Basic Set p.16) — simplified for shop display. */
export function gurpsSwing(st: number): { notation: string; flat: number } {
  const s = Math.max(4, Math.min(50, st));
  let dice = 1;
  let flat = 0;
  if (s <= 7) {
    flat = -3;
  } else if (s <= 9) {
    flat = -2;
  } else if (s <= 10) {
    flat = 0;
  } else if (s <= 11) {
    flat = 1;
  } else if (s <= 12) {
    flat = 2;
  } else if (s <= 16) {
    dice = 2;
    flat = s - 14; // 13→-1, 14→0, 15→+1, 16→+2
  } else {
    dice = 3 + Math.floor((s - 17) / 8);
    flat = Math.floor(((s - 17) % 8) / 2) - 1;
  }
  const flatText = flat > 0 ? `+${flat}` : flat < 0 ? `${flat}` : "";
  return { notation: `${dice}d6${flatText}`, flat };
}

/** Damage notation for a weapon at this character's ST. */
function weaponDamageText(w: GurpsShopWeaponDef, st: number): string {
  if (w.kind === "fixed") return w.fixedDamage ?? "";
  const dmg = w.kind === "swing" ? gurpsSwing(st) : gurpsThrust(st);
  return `${dmg.notation} ${w.damageType}`;
}

// ---------------------------------------------------------------------------
// Armor — priced versions of the sheet armors, plus modern/cyber kevlar. All
// armor with an `armorId` equips straight into the DR engine.
// ---------------------------------------------------------------------------

export interface GurpsShopArmorDef {
  id: string;
  name: string;
  armorId: string;
  dr: number;
  price: number;
  weight: string;
  eras: GurpsLifeMode[];
  blurb: string;
}

export const GURPS_SHOP_ARMORS: GurpsShopArmorDef[] = [
  { id: "shop-armor-leather", name: "Leather Jacket", armorId: "leather-jacket", dr: 1, price: 10, weight: "4 lb", eras: ["all"], blurb: "Torso and arms covered in cured hide — the wanderer's default." },
  { id: "shop-armor-chain", name: "Chainmail Hauberk", armorId: "chainmail", dr: 3, price: 30, weight: "16 lb", eras: ["medieval", "all"], blurb: "Thousands of interlocked rings. Stops cuts, shrugs at arrows." },
  { id: "shop-armor-plate", name: "Plate Cuirass", armorId: "plate", dr: 5, price: 80, weight: "18 lb", eras: ["medieval", "all"], blurb: "Shaped steel over the torso — the knight's iron shell." },
  { id: "shop-armor-fullplate", name: "Full Plate", armorId: "knight", dr: 6, price: 150, weight: "50 lb", eras: ["medieval", "all"], blurb: "Head to toe steel. Slow, heavy, nearly invincible." },
  { id: "shop-armor-kevlar-lite", name: "Concealable Vest", armorId: "light-kevlar", dr: 2, price: 25, weight: "3 lb", eras: ["modern", "cyber"], blurb: "Woven ballistic cloth that hides under a jacket." },
  { id: "shop-armor-kevlar", name: "Tactical Kevlar", armorId: "heavy-kevlar", dr: 4, price: 90, weight: "8 lb", eras: ["cyber", "all"], blurb: "Plate-lined ballistic armor for the streets that bite back." },
];

// ---------------------------------------------------------------------------
// Gear, consumables & life extras — era-filtered catalogs.
// ---------------------------------------------------------------------------

export interface GurpsShopGearDef {
  id: string;
  name: string;
  category: GurpsShopCategory;
  price: number;
  weight: string;
  eras: GurpsLifeMode[];
  /** Skill modifier granted while used (e.g. +1 First Aid). */
  skillBonus?: { skill: string; bonus: number };
  description: string;
}

export const GURPS_SHOP_GEAR: GurpsShopGearDef[] = [
  // --- Universal adventuring gear ---
  { id: "shop-gear-backpack", name: "Backpack", category: "gear", price: 5, weight: "3 lb", eras: ["all"], description: "Canvas pack that holds a week of supplies — and what you find." },
  { id: "shop-gear-lantern", name: "Lantern & Oil", category: "gear", price: 3, weight: "2 lb", eras: ["all"], description: "Hooded lantern with a flask of oil — 6 hours of steady light." },
  { id: "shop-gear-rope", name: "Rope (50 ft)", category: "gear", price: 2, weight: "5 lb", eras: ["all"], description: "Strong hemp rope; climbs, binds and lowers." },
  { id: "shop-gear-firstaid", name: "First Aid Kit", category: "gear", price: 8, weight: "2 lb", eras: ["all"], skillBonus: { skill: "first-aid", bonus: 1 }, description: "Bandages, salves and splints — +1 to First Aid rolls." },
  { id: "shop-gear-rations", name: "Rations (week)", category: "gear", price: 2, weight: "7 lb", eras: ["all"], description: "Dried meat, hard bread, and the will to eat it." },
  { id: "shop-gear-waterskin", name: "Waterskin", category: "gear", price: 1, weight: "1 lb", eras: ["all"], description: "A quart of water at your hip." },
  { id: "shop-gear-tent", name: "Tent (1 person)", category: "gear", price: 6, weight: "8 lb", eras: ["all"], description: "Waterproof shelter for one — sleep dry, wake ready." },
  { id: "shop-gear-lockpicks", name: "Lockpick Set", category: "gear", price: 4, weight: "0.5 lb", eras: ["all"], skillBonus: { skill: "lockpicking", bonus: 1 }, description: "Tension wrench and a dozen picks — +1 to Lockpicking rolls." },
  { id: "shop-gear-hook", name: "Grappling Hook", category: "gear", price: 3, weight: "2 lb", eras: ["all"], description: "Steel hook that finds a ledge when you need one." },
  // --- Modern / cyber ---
  { id: "shop-gear-compass", name: "Compass", category: "gear", price: 2, weight: "0.5 lb", eras: ["modern", "cyber"], description: "Needle points north; never argue with terrain again." },
  { id: "shop-gear-phone", name: "Smartphone", category: "gear", price: 15, weight: "0.5 lb", eras: ["modern", "cyber"], description: "The city's address book, map and pulse in your pocket." },
  { id: "shop-gear-laptop", name: "Field Laptop", category: "gear", price: 25, weight: "3 lb", eras: ["modern", "cyber"], skillBonus: { skill: "hacking", bonus: 1 }, description: "Portable workstation — +1 to Hacking rolls on the move." },
  { id: "shop-gear-briefcase", name: "Lockbox Briefcase", category: "gear", price: 8, weight: "4 lb", eras: ["modern", "all"], description: "Hardened case with a combination lock; papers stay papers." },
  { id: "shop-gear-medkit", name: "Trauma Medkit", category: "gear", price: 20, weight: "5 lb", eras: ["modern", "cyber"], skillBonus: { skill: "first-aid", bonus: 2 }, description: "Field surgery in a bag — +2 to First Aid rolls." },
  { id: "shop-gear-goggles", name: "Night-Vision Goggles", category: "gear", price: 30, weight: "1 lb", eras: ["cyber", "all"], description: "The dark is a suggestion. See clearly at night." },
  { id: "shop-gear-stealthsuit", name: "Stealth Suit", category: "gear", price: 40, weight: "3 lb", eras: ["cyber", "all"], skillBonus: { skill: "stealth", bonus: 2 }, description: "Sound-dampening weave — +2 to Stealth rolls." },
  // --- Consumables ---
  { id: "shop-consum-potion-minor", name: "Minor Healing Draught", category: "consumable", price: 5, weight: "0.5 lb", eras: ["medieval", "all"], description: "A bitter red tonic that mends 1d of injury." },
  { id: "shop-consum-potion", name: "Healing Draught", category: "consumable", price: 10, weight: "0.5 lb", eras: ["medieval", "all"], description: "Proper alchemy — restores 2d of injury." },
  { id: "shop-consum-antidote", name: "Antidote", category: "consumable", price: 8, weight: "0.5 lb", eras: ["all"], description: "Purges common poisons; +3 to resist one exposure." },
  { id: "shop-consum-arrows", name: "Quiver of Arrows (20)", category: "consumable", price: 2, weight: "2 lb", eras: ["all"], description: "Fletched and ready — keep the longbow singing." },
  { id: "shop-consum-stim", name: "Stim Patch", category: "consumable", price: 12, weight: "0.1 lb", eras: ["modern", "cyber"], description: "Chemicals that burn away fatigue — recover 1 FP once." },
  { id: "shop-consum-pistol-ammo", name: "Pistol Ammo (50)", category: "consumable", price: 4, weight: "1.5 lb", eras: ["modern", "cyber"], description: "Box of jacketed rounds for the service pistol." },
  { id: "shop-consum-rifle-ammo", name: "Rifle Ammo (20)", category: "consumable", price: 6, weight: "2 lb", eras: ["modern", "cyber"], description: "Long-arms ammunition, sealed and dry." },
  // --- Life extras (world-frame purchases) ---
  { id: "shop-life-horse", name: "Riding Horse", category: "life", price: 40, weight: "—", eras: ["medieval", "all"], description: "A sure-footed mount with saddle and bridle — roads become weeks shorter." },
  { id: "shop-life-warhorse", name: "Warhorse", category: "life", price: 120, weight: "—", eras: ["medieval", "all"], description: "Trained for battle — kicks, rears, and carries you into the line." },
  { id: "shop-life-courtoutfit", name: "Court Outfit", category: "life", price: 15, weight: "2 lb", eras: ["medieval", "all"], description: "Velvet, fur trim and a place at the high table." },
  { id: "shop-life-suit", name: "Business Suit", category: "life", price: 15, weight: "2 lb", eras: ["modern", "all"], description: "Tailored wool — doors open where jeans don't." },
  { id: "shop-life-netgear", name: "Street Net Rig", category: "life", price: 45, weight: "4 lb", eras: ["cyber", "all"], description: "Scratch-built deck and cable kit — +1 to Hacking on the grid." },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

const COMBAT_SKILLS = [
  "knife",
  "shortsword",
  "broadsword",
  "axe-mace",
  "spear",
  "polearm",
  "bow",
  "crossbow",
  "guns",
  "thrown-weapon",
  "brawling",
] as const;

/** Total character points spent — the GURPS analog of "level". */
export function gurpsPointTotal(c: GurpsCharacter): number {
  return (
    c.points.attributes +
    c.points.advantages +
    (c.points.disadvantages ?? 0) +
    c.points.skills
  );
}

/**
 * Starting wealth in gp, seeded from the Wealth advantages / disadvantages.
 * Baseline is the GURPS standard $1,000 scaled to the app's gp purse (100 gp);
 * Wealthy / Very Wealthy multiply it, Poor / Poverty gut it.
 */
export function gurpsStartingWealthGp(c: GurpsCharacter): number {
  const has = (id: string) =>
    c.advantages.some((a) => a.id === id) ||
    (c.disadvantages ?? []).some((d) => d.id === id);
  if (has("very-wealthy")) return 2000;
  if (has("wealthy")) return 500;
  if (has("wealth-poor")) return 20;
  if (has("poverty")) return 10;
  return 100;
}

/** Apply a wealth-tier multiplier (Life panel tier ids) on top of the base. */
export function gurpsWealthMultFor(tierId: string | undefined): number {
  switch (tierId) {
    case "dead-broke": return 0;
    case "poor": return 0.2;
    case "struggling": return 0.5;
    case "average": return 1;
    case "comfortable": return 2;
    case "wealthy": return 5;
    case "very-wealthy": return 20;
    case "filthy-rich": return 100;
    case "multimillionaire": return 1000;
    default: return 1;
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function pick<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function eraMatch(eras: GurpsLifeMode[], mode: GurpsLifeMode): boolean {
  return eras.includes("all") || eras.includes(mode);
}

/** Quality tier from the character's point total. */
function qualityFor(points: number): GurpsQuality {
  if (points >= 160) return "masterwork";
  if (points >= 120) return "fine";
  return "standard";
}

const QUALITY_WEAPON_MULT: Record<GurpsQuality, number> = {
  standard: 1,
  fine: 2,
  masterwork: 3.5,
};

const QUALITY_ARMOR_MULT: Record<GurpsQuality, number> = {
  standard: 1,
  fine: 1.6,
  masterwork: 2.5,
};

/**
 * Build a fresh shop stock tailored to the character's trained skills, point
 * total, and the campaign's Life Mode tag.
 */
export function generateGurpsShop(
  c: GurpsCharacter,
  mode: GurpsLifeMode,
): GurpsShopItem[] {
  const items: GurpsShopItem[] = [];
  const points = gurpsPointTotal(c);
  const quality = qualityFor(points);
  const qBonus = quality === "masterwork" ? 2 : quality === "fine" ? 1 : 0;

  const trained = new Set(c.skills.map((s) => s.id));
  const trainedCombat = COMBAT_SKILLS.filter((s) => trained.has(s));
  const anyCombat = trainedCombat.length > 0;

  // --- Weapons: skill-fit stock, scaled by points ---
  const weaponPool = GURPS_SHOP_WEAPONS.filter((w) =>
    eraMatch(w.eras, mode) && (!anyCombat || (trainedCombat as readonly string[]).includes(w.skill)),
  );
  const fallbackPool = anyCombat
    ? GURPS_SHOP_WEAPONS.filter((w) => eraMatch(w.eras, mode))
    : weaponPool;
  const chosen = shuffle((weaponPool.length > 0 ? weaponPool : fallbackPool)).slice(0, 3);
  for (const w of chosen) {
    // The primary weapon of the set can roll the quality upgrade; backups stay
    // standard so the shelf always holds a mix. Better point totals mean more
    // fine/masterwork steel on the shelves (and its higher price tag).
    const thisQuality: GurpsQuality =
      quality !== "standard" && Math.random() < 0.5 ? quality : "standard";
    const bonus = thisQuality === "masterwork" ? 2 : thisQuality === "fine" ? 1 : 0;
    const damage = weaponDamageText(w, c.attributes.st);
    items.push({
      id: `gurps-shop-${slug(w.name)}-${thisQuality}`,
      name: w.name,
      category: "weapon",
      quality: thisQuality,
      price: Math.round(w.price * QUALITY_WEAPON_MULT[thisQuality]),
      weight: w.weight,
      eras: w.eras,
      skill: w.skill,
      damageText: bonus > 0 ? `${damage} +${bonus}` : damage,
      qualityBonus: bonus,
      description: `${w.blurb} Uses the ${w.skill.replace(/-/g, " ")} skill — reach ${w.reach}.${bonus > 0 ? ` ${GURPS_QUALITY_LABELS[thisQuality]} steel deals +${bonus} damage.` : ""}`,
      tags: ["Weapon", w.skill.replace(/-/g, " "), w.reach, GURPS_QUALITY_LABELS[thisQuality]],
    });
  }

  // --- Armor: priced catalog, quality-scaled on the top end ---
  for (const a of GURPS_SHOP_ARMORS) {
    if (!eraMatch(a.eras, mode)) continue;
    const thisQuality: GurpsQuality =
      quality === "masterwork" && a.dr >= 4
        ? "masterwork"
        : quality !== "standard" && a.dr >= 3 && Math.random() < 0.4
          ? "fine"
          : "standard";
    const drBonus = thisQuality === "masterwork" ? 2 : thisQuality === "fine" ? 1 : 0;
    items.push({
      id: `gurps-shop-${slug(a.name)}-${thisQuality}`,
      name: a.name,
      category: "armor",
      quality: thisQuality,
      price: Math.round(a.price * QUALITY_ARMOR_MULT[thisQuality]),
      weight: a.weight,
      eras: a.eras,
      armorId: a.armorId,
      dr: a.dr + drBonus,
      qualityBonus: drBonus,
      description: `${a.blurb} Equip it to set your DR in the dice engine.${
        drBonus > 0 ? ` ${GURPS_QUALITY_LABELS[thisQuality]} workmanship adds +${drBonus} DR.` : ""
      }`,
      tags: ["Armor", `${a.dr + drBonus} DR`, GURPS_QUALITY_LABELS[thisQuality]],
    });
  }

  // --- Gear / consumables / life extras: era-filtered catalogs ---
  const gearPool = shuffle(
    GURPS_SHOP_GEAR.filter((g) => eraMatch(g.eras, mode)),
  );
  for (const g of gearPool) {
    items.push({
      id: `gurps-shop-${slug(g.name)}`,
      name: g.name,
      category: g.category,
      quality: "standard",
      price: g.price,
      weight: g.weight,
      eras: g.eras,
      description: g.skillBonus
        ? `${g.description} Grants ${g.skillBonus.bonus >= 0 ? "+" : ""}${g.skillBonus.bonus} to ${g.skillBonus.skill.replace(/-/g, " ")} rolls while used.`
        : g.description,
      tags: [
        g.category === "consumable" ? "Consumable" : g.category === "life" ? "Life" : "Gear",
        ...(g.skillBonus ? [`+${g.skillBonus.bonus} ${g.skillBonus.skill.replace(/-/g, " ")}`] : []),
      ],
    });
  }

  return items;
}

/** Seed the mechanical purse for a fresh GURPS run (wealth advantages). */
export function gurpsStartingWallet(c: GurpsCharacter): Wallet {
  const gp = gurpsStartingWealthGp(c);
  return { gp, sp: 0, cp: 0 };
}

/** Human-readable price, e.g. "45 gp". */
export function fmtGurpsPrice(gp: number): string {
  return `${gp} gp`;
}
