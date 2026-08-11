// ============================================================================
// Oraculum — D&D 5e Adventurer's Shop.
//
// A class-fit, level-scaled item generator with a gp pricing model. Every
// stock is built from the character's class profile (favored weapons, allowed
// armor, signature gear and class magic items) and gated by level so loot
// stays "good but never over-enchanted": +1 gear from level 3, +2 from level
// 8, +3 only at level 15+, and prices climb with a level factor.
//
// Items with a `baseWeaponId` / `baseArmorId` are real equipment — equipping
// them from the shop sets the character's slot AND applies the enchant bonus
// to the dice engine (attack rolls and AC). Everything else is carried loot
// with a mechanical description.
// ============================================================================

import type { ArmorDef, DnDCharacter, DnDClassId, WeaponDef } from "@/lib/rpg/types";
import { ARMORS, CLASS_MAP, WEAPONS } from "./dnd";

export type DndShopCategory =
  | "weapon"
  | "armor"
  | "shield"
  | "potion"
  | "gear"
  | "magic";

export type DndRarity = "common" | "uncommon" | "rare" | "very-rare";

export const DND_RARITY_LABELS: Record<DndRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "very-rare": "Very Rare",
};

export interface DndShopItem {
  id: string;
  name: string;
  category: DndShopCategory;
  rarity: DndRarity;
  /** Price in gold pieces. */
  price: number;
  /** +N enchantment for weapons / armor / shields. */
  enchant?: number;
  /** Base weapon this enchants (equipping sets the Weapon Slot). */
  baseWeaponId?: string;
  /** Base armor this enchants (equipping sets the Armor Slot). */
  baseArmorId?: string;
  description: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Pricing model — base prices in gp, scaled by a level factor.
// ---------------------------------------------------------------------------

const BASE_WEAPON_PRICE: Record<string, number> = {
  dagger: 2,
  quarterstaff: 1,
  shortsword: 10,
  rapier: 25,
  longsword: 15,
  greataxe: 30,
  handaxe: 5,
  longbow: 50,
  shortbow: 25,
  "light-crossbow": 25,
  unarmed: 0,
};

const BASE_ARMOR_PRICE: Record<string, number> = {
  none: 0,
  leather: 10,
  studded: 45,
  scale: 50,
  "half-plate": 750,
  chain: 75,
};

const SHIELD_PRICE = 10;

/** Prices grow ~15% per level, capped at 3× the base — a level-1 purse can
 *  afford common gear; rare loot only becomes reachable as the hero does. */
export function shopLevelFactor(level: number): number {
  return Math.min(3, 1 + (level - 1) * 0.15);
}

const ENCHANT_PRICE_MULT = [1, 2.5, 4.5, 9] as const;
const ENCHANT_RARITY: DndRarity[] = ["common", "uncommon", "rare", "very-rare"];

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

function weaponPrice(weaponId: string, enchant: number, level: number): number {
  const base = BASE_WEAPON_PRICE[weaponId] ?? 10;
  return round5(base * shopLevelFactor(level) * ENCHANT_PRICE_MULT[enchant]);
}

function armorPrice(armorId: string, enchant: number, level: number): number {
  const base = BASE_ARMOR_PRICE[armorId] ?? 10;
  return round5(base * shopLevelFactor(level) * ENCHANT_PRICE_MULT[enchant]);
}

// ---------------------------------------------------------------------------
// Class profiles — what fits each class, mechanically and thematically.
// ---------------------------------------------------------------------------

interface ClassShopProfile {
  /** Favored WEAPONS ids (class-proficient families). */
  weapons: string[];
  /** Allowed armor kinds. */
  armor: ArmorDef["acKind"][];
  shield: boolean;
  /** Signature tools / gear for the class. */
  gear: { name: string; price: number; description: string }[];
  /** Class-flavored magic items with mechanical descriptions. */
  magic: {
    name: string;
    rarity: DndRarity;
    minLevel: number;
    description: string;
  }[];
}

const CLASS_PROFILES: Record<DnDClassId, ClassShopProfile> = {
  fighter: {
    weapons: ["longsword", "greataxe", "longbow", "light-crossbow"],
    armor: ["light", "medium", "heavy"],
    shield: true,
    gear: [
      { name: "Smith's Repair Kit", price: 50, description: "Mend weapons and armor; Advantage on checks to repair gear." },
      { name: "Grappling Hook & Rope", price: 10, description: "50 ft of rope and a steel hook for climbs and binds." },
    ],
    magic: [
      { name: "Veteran's Iron Charm", rarity: "uncommon", minLevel: 2, description: "Once per short rest, reroll one missed attack and keep the second result." },
      { name: "Banner of the Broken Line", rarity: "rare", minLevel: 6, description: "Once per battle, you and allies within 30 ft gain +1 on attack rolls until the end of your next turn." },
      { name: "Bulwark Pauldrons", rarity: "very-rare", minLevel: 12, description: "The first hit you take each battle deals 5 less damage." },
    ],
  },
  rogue: {
    weapons: ["rapier", "shortsword", "dagger", "shortbow"],
    armor: ["light"],
    shield: false,
    gear: [
      { name: "Thieves' Tools", price: 25, description: "Required for picking locks and disarming traps." },
      { name: "Poisoner's Kit", price: 50, description: "Brew basic toxins; a dose adds +1d4 damage to one weapon attack." },
    ],
    magic: [
      { name: "Boots of the Silent Step", rarity: "uncommon", minLevel: 2, description: "Advantage on Stealth checks while moving at half speed." },
      { name: "Blade Oil of the Night", rarity: "uncommon", minLevel: 3, description: "Coats one weapon — its next hit deals an extra 2d6 damage." },
      { name: "Cloak of Many Pockets", rarity: "rare", minLevel: 6, description: "A hidden pocket holds one small item; retrieving it is a free action." },
    ],
  },
  wizard: {
    weapons: ["dagger", "quarterstaff"],
    armor: ["none"],
    shield: false,
    gear: [
      { name: "Blank Spellbook", price: 50, description: "A sturdy 100-page book for scribing new spells." },
      { name: "Component Pouch", price: 25, description: "Holds the material components for your spells." },
    ],
    magic: [
      { name: "Quill of the Second Draft", rarity: "uncommon", minLevel: 2, description: "Once per day, reroll a failed Intelligence (Arcana) check." },
      { name: "Ring of the Warded Mind", rarity: "rare", minLevel: 6, description: "Advantage on saving throws against being charmed or frightened." },
      { name: "Gloves of the Fumbling Apprentice", rarity: "common", minLevel: 1, description: "When you cast a cantrip, you may reroll one damage die." },
    ],
  },
  cleric: {
    weapons: ["longsword", "quarterstaff", "light-crossbow"],
    armor: ["light", "medium"],
    shield: true,
    gear: [
      { name: "Silver Holy Symbol", price: 25, description: "Your divine focus — required for most cleric spells." },
      { name: "Healer's Kit", price: 5, description: "Stabilize a dying ally without a Medicine check (10 uses)." },
    ],
    magic: [
      { name: "Censer of Renewal", rarity: "uncommon", minLevel: 2, description: "Once per short rest, restore 1d4 + 2 HP to a touched ally as an action." },
      { name: "Prayer Beads of the Dawn", rarity: "rare", minLevel: 7, description: "Once per day, cast a 1st-level healing spell without expending a slot." },
      { name: "Reliquary of the Saint", rarity: "very-rare", minLevel: 12, description: "Allies within 30 ft gain +2 on death saving throws." },
    ],
  },
  paladin: {
    weapons: ["longsword", "longbow", "greataxe"],
    armor: ["light", "medium", "heavy"],
    shield: true,
    gear: [
      { name: "Gold Holy Symbol", price: 50, description: "Your oath's focus, worn openly on the chest." },
      { name: "Whetstone & Oil", price: 5, description: "Keep a blade battle-sharp; +1 damage on the first hit after an hour of care." },
    ],
    magic: [
      { name: "Oath Sigil", rarity: "uncommon", minLevel: 2, description: "Once per battle, add +1d4 to one failed saving throw." },
      { name: "Vow of the Silver Oath", rarity: "rare", minLevel: 6, description: "Once per day, gain +1 on attack rolls for 1 minute." },
      { name: "Relic of the Crusade", rarity: "very-rare", minLevel: 12, description: "When you use Lay on Hands, you may also end one condition on the target." },
    ],
  },
  barbarian: {
    weapons: ["greataxe", "handaxe", "longsword"],
    armor: ["light", "medium"],
    shield: true,
    gear: [
      { name: "Fur-lined Travel Cloak", price: 20, description: "Resistance to cold weather; Advantage on Survival checks to endure harsh terrain." },
      { name: "Double Handaxe Sheath", price: 10, description: "Two throwing axes at the hip, ready as backup." },
    ],
    magic: [
      { name: "Berserker's Tooth", rarity: "uncommon", minLevel: 2, description: "While raging, your weapon attacks deal +1 damage." },
      { name: "Tattoo of the Scarred Bear", rarity: "rare", minLevel: 6, description: "Once per day, when you drop to 0 HP, you drop to 1 HP instead." },
      { name: "Mammoth-Hide Mantle", rarity: "very-rare", minLevel: 12, description: "While raging, reduce bludgeoning, piercing and slashing damage by 3." },
    ],
  },
  bard: {
    weapons: ["rapier", "shortsword", "dagger"],
    armor: ["light"],
    shield: false,
    gear: [
      { name: "Fine Musical Instrument", price: 30, description: "Your bardic focus — lute, flute or fiddle of good make." },
      { name: "Disguise Kit", price: 25, description: "Change your look convincingly; Advantage on Deception to pass as someone else." },
    ],
    magic: [
      { name: "Lyre of the Mended Heart", rarity: "uncommon", minLevel: 2, description: "Once per day, restore one ally's HP equal to your Bardic Inspiration die." },
      { name: "Cap of Captivating Cadence", rarity: "rare", minLevel: 6, description: "Advantage on Performance checks meant to charm a crowd." },
      { name: "Siren's Sheet Music", rarity: "very-rare", minLevel: 12, description: "Once per day, play a tune that charms a group of creatures for as long as you keep playing." },
    ],
  },
  druid: {
    weapons: ["quarterstaff", "shortbow", "dagger"],
    armor: ["light", "medium"],
    shield: true,
    gear: [
      { name: "Herbalism Kit", price: 5, description: "Identify plants and brew one healing salve (1d6 HP) per day." },
      { name: "Gnarled Yew Staff", price: 15, description: "A hand-carved focus attuned to the old growth." },
    ],
    magic: [
      { name: "Herbalist's Sash", rarity: "uncommon", minLevel: 2, description: "Advantage on checks to identify plants and poisons; brew one 1d6 salve per day." },
      { name: "Seed of the Old Oak", rarity: "rare", minLevel: 7, description: "Once per day, crush the seed to regrow 2d8 HP." },
      { name: "Antler Crown of the Warder", rarity: "very-rare", minLevel: 12, description: "While in Wild Shape, your AC is 14 + your Dexterity modifier." },
    ],
  },
  ranger: {
    weapons: ["longbow", "shortsword", "handaxe", "dagger"],
    armor: ["light", "medium"],
    shield: true,
    gear: [
      { name: "Quiver & 40 Arrows", price: 5, description: "A full quiver of flight arrows, fletched and ready." },
      { name: "Hunting Trap", price: 5, description: "A steel jaw trap — set it to restrain a creature that steps in." },
    ],
    magic: [
      { name: "Farsight Lenses", rarity: "uncommon", minLevel: 2, description: "Advantage on Perception checks to spot distant threats; once per day ignore long-range penalty." },
      { name: "Quiver of the Hushed Hunt", rarity: "rare", minLevel: 6, description: "Your arrows fly silent; Advantage on Stealth while standing still." },
      { name: "Cloak of the Stalking Beast", rarity: "very-rare", minLevel: 12, description: "+2 to Stealth and Survival checks." },
    ],
  },
  sorcerer: {
    weapons: ["dagger", "quarterstaff", "light-crossbow"],
    armor: ["none"],
    shield: false,
    gear: [
      { name: "Arcane Focus (Crystal)", price: 10, description: "A humming crystal that channels your innate magic." },
      { name: "Fine Robes", price: 20, description: "Comfortable, dramatic, and absolutely not armor." },
    ],
    magic: [
      { name: "Emberheart Gem", rarity: "uncommon", minLevel: 2, description: "When you deal fire damage, add +1 per damage die." },
      { name: "Cord of Surge Control", rarity: "rare", minLevel: 6, description: "Once per day, reroll a Wild Magic surge result you dislike." },
      { name: "Crown of the Chosen", rarity: "very-rare", minLevel: 12, description: "Your sorcery points recover 4 faster each long rest." },
    ],
  },
  warlock: {
    weapons: ["dagger", "quarterstaff", "light-crossbow"],
    armor: ["light"],
    shield: false,
    gear: [
      { name: "Arcane Focus (Tome)", price: 10, description: "A black-bound grimoire humming with pact magic." },
      { name: "Elder Sign Amulet", price: 30, description: "Advantage on saving throws against being frightened by aberrations." },
    ],
    magic: [
      { name: "Signet of the Dark Pact", rarity: "uncommon", minLevel: 2, description: "Once per day, recover one expended pact magic slot." },
      { name: "Grimoire of Shared Secret", rarity: "rare", minLevel: 6, description: "Your summoned familiar or companion gains +2 AC." },
      { name: "Eye of the Unseen Court", rarity: "very-rare", minLevel: 12, description: "Advantage on Perception (sight) and Insight checks." },
    ],
  },
  monk: {
    weapons: ["quarterstaff", "shortsword", "dagger"],
    armor: ["none"],
    shield: false,
    gear: [
      { name: "Prayer Beads", price: 10, description: "A string of worn beads for daily meditation." },
      { name: "Traveler's Garb", price: 15, description: "Simple, breathable robes that never hinder a single step." },
    ],
    magic: [
      { name: "Prayer Beads of Balance", rarity: "uncommon", minLevel: 2, description: "Once per short rest, regain 2 ki points." },
      { name: "Bracers of Flowing Strikes", rarity: "rare", minLevel: 6, description: "When you hit with an unarmed strike, move 5 ft without provoking opportunity attacks." },
      { name: "Mask of the Thousand Faces", rarity: "very-rare", minLevel: 12, description: "Once per day, take on any face for one hour (no concentration)." },
    ],
  },
  artificer: {
    weapons: ["light-crossbow", "dagger", "quarterstaff", "handaxe"],
    armor: ["light", "medium"],
    shield: true,
    gear: [
      { name: "Tinker's Tools", price: 50, description: "Required to infuse and maintain your inventions." },
      { name: "Alchemist's Supplies", price: 50, description: "A field lab for brewing elixirs and reagents." },
    ],
    magic: [
      { name: "Tinker's Gloves", rarity: "uncommon", minLevel: 2, description: "Advantage on checks with tinker's tools; repair one broken object per day." },
      { name: "Voltaic Core", rarity: "rare", minLevel: 6, description: "Once per day, your next attack deals an extra 2d6 lightning damage." },
      { name: "Goggles of Arcane Sight", rarity: "very-rare", minLevel: 12, description: "See invisible creatures within 30 ft." },
    ],
  },
};

// ---------------------------------------------------------------------------
// Consumables — potion tier climbs with level.
// ---------------------------------------------------------------------------

interface PotionDef {
  name: string;
  rarity: DndRarity;
  minLevel: number;
  price: number;
  description: string;
}

const POTIONS: PotionDef[] = [
  { name: "Potion of Healing", rarity: "common", minLevel: 1, price: 50, description: "Regain 2d4 + 2 HP." },
  { name: "Potion of Climbing", rarity: "common", minLevel: 1, price: 60, description: "Climb speed equal to your walking speed for 1 hour." },
  { name: "Antitoxin", rarity: "common", minLevel: 1, price: 50, description: "Advantage on saving throws against poison for 1 hour." },
  { name: "Potion of Greater Healing", rarity: "uncommon", minLevel: 3, price: 150, description: "Regain 4d4 + 4 HP." },
  { name: "Potion of Resistance", rarity: "uncommon", minLevel: 3, price: 150, description: "Resistance to one damage type for 1 hour." },
  { name: "Potion of Invisibility", rarity: "uncommon", minLevel: 4, price: 180, description: "Become invisible for 1 hour (ends if you attack)." },
  { name: "Potion of Superior Healing", rarity: "rare", minLevel: 7, price: 450, description: "Regain 8d4 + 8 HP." },
  { name: "Potion of Speed", rarity: "rare", minLevel: 8, price: 500, description: "Double your speed and gain +2 AC for 1 minute." },
  { name: "Potion of Supreme Healing", rarity: "very-rare", minLevel: 11, price: 1350, description: "Regain 10d4 + 20 HP." },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

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

/** Roll an enchantment tier for a weapon, gated by level and kept modest. */
function rollWeaponEnchant(level: number): number {
  const r = Math.random();
  if (level >= 15 && r < 0.18) return 3;
  if (level >= 8 && r < 0.45) return 2;
  if (level >= 3 && r < 0.75) return 1;
  return 0;
}

function rollArmorEnchant(level: number): number {
  const r = Math.random();
  if (level >= 12 && r < 0.3) return 2;
  if (level >= 5 && r < 0.6) return 1;
  return 0;
}

/** Build a fresh shop stock tailored to the character's class and level. */
export function generateDndShop(c: DnDCharacter): DndShopItem[] {
  const prof = CLASS_PROFILES[c.classId] ?? CLASS_PROFILES.fighter;
  const items: DndShopItem[] = [];
  const level = Math.max(1, c.level);

  // --- Weapons: two class-fit base weapons, enchantment gated by level ---
  const weaponPool = shuffle(prof.weapons.filter((id) => BASE_WEAPON_PRICE[id] !== undefined && id !== "unarmed"));
  const chosenWeapons = weaponPool.slice(0, 2);
  let anyEnchanted = false;
  for (const wid of chosenWeapons) {
    const def = WEAPONS.find((w) => w.id === wid) as WeaponDef | undefined;
    if (!def) continue;
    let enchant = rollWeaponEnchant(level);
    // Guarantee at least one enchanted blade from level 3+ so the shop
    // visibly scales — but never push past what the level allows.
    if (!anyEnchanted && level >= 3 && enchant === 0 && Math.random() < 0.7) {
      enchant = level >= 8 && Math.random() < 0.4 ? 2 : 1;
    }
    if (enchant > 0) anyEnchanted = true;
    const bonus = enchant > 0 ? ` +${enchant}` : "";
    items.push({
      id: `shop-weapon-${slug(def.name)}${bonus}`,
      name: `${def.name}${bonus}`,
      category: "weapon",
      rarity: ENCHANT_RARITY[enchant],
      price: weaponPrice(wid, enchant, level),
      enchant: enchant > 0 ? enchant : undefined,
      baseWeaponId: wid,
      description:
        enchant > 0
          ? `${enchant > 0 ? `+${enchant} bonus to attack and damage rolls with this weapon. ` : ""}${def.properties.join(", ")}. Equip it to apply the bonus in the dice engine.`
          : `${def.properties.join(", ")}. A reliable ${def.name.toLowerCase()} in good condition.`,
      tags: ["Weapon", enchant > 0 ? `+${enchant}` : "Martial"],
    });
  }

  // --- Armor + shield: class-allowed kinds, light enchant scaling ---
  const armorPool = ARMORS.filter(
    (a) => prof.armor.includes(a.acKind) && a.id !== "none",
  );
  const armorDef = pick(armorPool);
  if (armorDef) {
    const enchant = rollArmorEnchant(level);
    const bonus = enchant > 0 ? ` +${enchant}` : "";
    items.push({
      id: `shop-armor-${slug(armorDef.name)}${bonus}`,
      name: `${armorDef.name}${bonus}`,
      category: "armor",
      rarity: ENCHANT_RARITY[enchant],
      price: armorPrice(armorDef.id, enchant, level),
      enchant: enchant > 0 ? enchant : undefined,
      baseArmorId: armorDef.id,
      description:
        enchant > 0
          ? `+${enchant} bonus to AC while worn. ${armorDef.note ? armorDef.note + ". " : ""}Equip it to apply the bonus in the dice engine.`
          : `${armorDef.note ? armorDef.note + ". " : ""}Solid protection for a ${CLASS_MAP[c.classId]?.name ?? "hero"}.`,
      tags: ["Armor", enchant > 0 ? `+${enchant}` : armorDef.acKind],
    });
  }

  if (prof.shield) {
    const enchant = level >= 8 && Math.random() < 0.4 ? 1 : 0;
    const bonus = enchant > 0 ? ` +${enchant}` : "";
    items.push({
      id: `shop-shield${bonus}`,
      name: `Shield${bonus}`,
      category: "shield",
      rarity: ENCHANT_RARITY[enchant],
      price: round5(SHIELD_PRICE * shopLevelFactor(level) * ENCHANT_PRICE_MULT[enchant]),
      enchant: enchant > 0 ? enchant : undefined,
      description: enchant > 0 ? `+${enchant} bonus to AC while equipped with the shield.` : "A stout wooden-and-iron shield (+2 AC when equipped).",
      tags: ["Shield", enchant > 0 ? `+${enchant}` : "+2 AC"],
    });
  }

  // --- Potions: two consumables at or below the hero's level ---
  const potionPool = shuffle(POTIONS.filter((p) => p.minLevel <= level));
  for (const potion of potionPool.slice(0, 2)) {
    items.push({
      id: `shop-potion-${slug(potion.name)}`,
      name: potion.name,
      category: "potion",
      rarity: potion.rarity,
      price: potion.price,
      description: potion.description,
      tags: ["Consumable"],
    });
  }

  // --- Gear: one class signature tool + one generic adventuring item ---
  const classGear = pick(prof.gear);
  if (classGear) {
    items.push({
      id: `shop-gear-${slug(classGear.name)}`,
      name: classGear.name,
      category: "gear",
      rarity: "common",
      price: classGear.price,
      description: classGear.description,
      tags: ["Gear"],
    });
  }
  const GENERIC_GEAR = [
    { name: "Rope (50 ft)", price: 1, description: "Hempen rope, fifty feet, always useful." },
    { name: "Lantern & Oil", price: 5, description: "A hooded lantern with a flask of oil (6 hours of light)." },
    { name: "Bedroll", price: 1, description: "Sleep warm on the cold ground." },
    { name: "Crowbar", price: 2, description: "Advantage on Strength checks to pry things open." },
    { name: "Mess Kit", price: 1, description: "Eat like a person, not a beast." },
  ];
  const generic = pick(GENERIC_GEAR);
  if (generic) {
    items.push({
      id: `shop-gear-${slug(generic.name)}`,
      name: generic.name,
      category: "gear",
      rarity: "common",
      price: generic.price,
      description: generic.description,
      tags: ["Gear"],
    });
  }

  // --- Class magic items: one or two, gated by rarity minimum level ---
  const magicPool = shuffle(prof.magic.filter((m) => m.minLevel <= level));
  const magicCount = Math.min(2, magicPool.length, level >= 6 ? 2 : 1);
  for (const m of magicPool.slice(0, magicCount)) {
    const priceMult = m.rarity === "very-rare" ? 3000 : m.rarity === "rare" ? 900 : 140;
    items.push({
      id: `shop-magic-${slug(m.name)}`,
      name: m.name,
      category: "magic",
      rarity: m.rarity,
      price: round5(priceMult * shopLevelFactor(level)),
      description: m.description,
      tags: ["Magic Item", DND_RARITY_LABELS[m.rarity]],
    });
  }

  return items;
}

/** Human-readable price, e.g. "45 gp". */
export function fmtShopPrice(gp: number): string {
  return `${gp} gp`;
}
