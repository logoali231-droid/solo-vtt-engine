// ============================================================================
// Oraculum — Curated D&D 5e spellbook.
// A playable, self-contained selection of spells. Cantrips are free to cast;
// leveled spells consume a spell slot (see the cast flow in GameBoard).
// Save spells are resolved as the target's roll against your spell save DC;
// attack spells roll against the enemy's AC.
// ============================================================================

import type { DnDClassId, SpellDef } from "../types";

export const SPELLS: SpellDef[] = [
  // --- Cantrips ---
  { id: "fire-bolt", name: "Fire Bolt", level: 0, school: "Evocation", range: "120 ft", cast: "1 action", attack: true, damage: "1d10", description: "Hurl a mote of fire at a creature or object.", classes: ["artificer", "sorcerer", "wizard"] },
  { id: "ray-of-frost", name: "Ray of Frost", level: 0, school: "Evocation", range: "60 ft", cast: "1 action", attack: true, damage: "1d8", description: "A frigid beam of light; speed reduced by 10 ft on a hit.", classes: ["sorcerer", "wizard"] },
  { id: "eldritch-blast", name: "Eldritch Blast", level: 0, school: "Evocation", range: "120 ft", cast: "1 action", attack: true, damage: "1d10", description: "A beam of crackling energy; a Warlock's signature.", classes: ["warlock"] },
  { id: "sacred-flame", name: "Sacred Flame", level: 0, school: "Evocation", range: "60 ft", cast: "1 action", save: "dex", damage: "1d8", description: "Flame-like radiance descends; no cover benefit.", classes: ["cleric"] },
  { id: "guidance", name: "Guidance", level: 0, school: "Divination", range: "Touch", cast: "1 action", concentration: true, description: "+1d4 to one ability check within the next minute.", classes: ["artificer", "cleric", "druid"] },
  { id: "thorn-whip", name: "Thorn Whip", level: 0, school: "Transmutation", range: "30 ft", cast: "1 action", attack: true, damage: "1d6", description: "A whip-like vine yanks the target 10 ft toward you.", classes: ["artificer", "druid"] },
  { id: "vicious-mockery", name: "Vicious Mockery", level: 0, school: "Enchantment", range: "60 ft", cast: "1 action", save: "wis", damage: "1d4", description: "An insult so cutting it deals psychic damage and gives disadvantage on the next attack.", classes: ["bard"] },
  { id: "mage-hand", name: "Mage Hand", level: 0, school: "Conjuration", range: "30 ft", cast: "1 action", description: "A spectral hand can manipulate objects within range.", classes: ["bard", "sorcerer", "warlock", "wizard"] },
  { id: "prestidigitation", name: "Prestidigitation", level: 0, school: "Transmutation", range: "10 ft", cast: "1 action", description: "Minor magical tricks: clean, soil, chill, flavor, spark.", classes: ["artificer", "bard", "sorcerer", "warlock", "wizard"] },
  { id: "chill-touch", name: "Chill Touch", level: 0, school: "Necromancy", range: "120 ft", cast: "1 action", attack: true, damage: "1d8", description: "A ghostly hand; undead hit have disadvantage on attacks.", classes: ["sorcerer", "warlock", "wizard"] },
  { id: "produce-flame", name: "Produce Flame", level: 0, school: "Conjuration", range: "30 ft", cast: "1 action", attack: true, damage: "1d8", description: "A flickering flame in your hand sheds light and can be hurled.", classes: ["druid"] },
  { id: "word-of-radiance", name: "Word of Radiance", level: 0, school: "Evocation", range: "5 ft", cast: "1 action", save: "con", damage: "1d6", description: "Burning radiance erupts from you; enemies within 5 ft save.", classes: ["cleric"] },

  // --- 1st level ---
  { id: "burning-hands", name: "Burning Hands", level: 1, school: "Evocation", range: "Self (15-ft cone)", cast: "1 action", save: "dex", damage: "3d6", description: "Flames wash over a cone; half damage on a save.", classes: ["sorcerer", "wizard"] },
  { id: "magic-missile", name: "Magic Missile", level: 1, school: "Evocation", range: "120 ft", cast: "1 action", autoHit: true, damage: "3d4+3", description: "Three darts of force strike unerringly.", classes: ["sorcerer", "wizard"] },
  { id: "shield", name: "Shield", level: 1, school: "Abjuration", range: "Self", cast: "1 reaction", description: "+5 AC until your next turn when hit.", classes: ["sorcerer", "wizard"] },
  { id: "chromatic-orb", name: "Chromatic Orb", level: 1, school: "Evocation", range: "90 ft", cast: "1 action", attack: true, damage: "3d8", description: "A sphere of chosen energy (acid, cold, fire, etc.).", classes: ["sorcerer", "wizard"] },
  { id: "healing-word", name: "Healing Word", level: 1, school: "Evocation", range: "60 ft", cast: "1 bonus action", healDice: "1d4", description: "A word of healing restores 1d4 + spell mod HP.", classes: ["bard", "cleric", "druid"] },
  { id: "cure-wounds", name: "Cure Wounds", level: 1, school: "Evocation", range: "Touch", cast: "1 action", healDice: "1d8", description: "Heal 1d8 + spell mod HP.", classes: ["artificer", "bard", "cleric", "druid", "paladin", "ranger"] },
  { id: "guiding-bolt", name: "Guiding Bolt", level: 1, school: "Evocation", range: "120 ft", cast: "1 action", attack: true, damage: "4d6", description: "A flash of light; next attack against the target has advantage.", classes: ["cleric"] },
  { id: "bless", name: "Bless", level: 1, school: "Enchantment", range: "30 ft", cast: "1 action", concentration: true, description: "Three allies add 1d4 to attack rolls and saves.", classes: ["cleric", "paladin"] },
  { id: "faerie-fire", name: "Faerie Fire", level: 1, school: "Evocation", range: "60 ft", cast: "1 action", concentration: true, save: "dex", description: "Outlined creatures can't benefit from invisibility; attacks on them have advantage.", classes: ["artificer", "bard", "druid"] },
  { id: "thunderwave", name: "Thunderwave", level: 1, school: "Evocation", range: "Self (15-ft cube)", cast: "1 action", save: "con", damage: "2d8", description: "A wave of thunder pushes creatures back; half damage on a save.", classes: ["bard", "druid", "sorcerer", "wizard"] },
  { id: "sleep", name: "Sleep", level: 1, school: "Enchantment", range: "90 ft", cast: "1 action", description: "Creatures with up to 5d8 HP fall unconscious, lowest first.", classes: ["bard", "sorcerer", "wizard"] },
  { id: "hellish-rebuke", name: "Hellish Rebuke", level: 1, school: "Evocation", range: "60 ft", cast: "1 reaction", save: "dex", damage: "2d10", description: "A retaliatory blast of flame at the creature that just hurt you.", classes: ["warlock"] },
  { id: "arms-of-hadar", name: "Arms of Hadar", level: 1, school: "Conjuration", range: "Self (10-ft radius)", cast: "1 action", save: "str", damage: "2d6", description: "Tendrils of dark energy buffet nearby creatures.", classes: ["warlock"] },

  // --- 2nd level ---
  { id: "scorching-ray", name: "Scorching Ray", level: 2, school: "Evocation", range: "120 ft", cast: "1 action", attack: true, damage: "6d6", description: "Three rays of fire that can strike the same target; a separate attack roll for each.", classes: ["sorcerer", "wizard"] },
  { id: "shatter", name: "Shatter", level: 2, school: "Evocation", range: "60 ft", cast: "1 action", save: "con", damage: "3d8", description: "A ringing shriek damages and deafens creatures in a 10-ft sphere.", classes: ["artificer", "bard", "sorcerer", "warlock", "wizard"] },
  { id: "misty-step", name: "Misty Step", level: 2, school: "Conjuration", range: "Self", cast: "1 bonus action", description: "Teleport up to 30 ft to an unoccupied space you can see.", classes: ["sorcerer", "warlock", "wizard"] },
  { id: "spiritual-weapon", name: "Spiritual Weapon", level: 2, school: "Evocation", range: "60 ft", cast: "1 bonus action", attack: true, damage: "1d8+5", description: "A floating weapon you command with a bonus action.", classes: ["cleric"] },
  { id: "moonbeam", name: "Moonbeam", level: 2, school: "Evocation", range: "120 ft", cast: "1 action", concentration: true, save: "con", damage: "2d10", description: "A silvery beam; shape-shifters are harmed on entry.", classes: ["druid"] },
  { id: "web", name: "Web", level: 2, school: "Conjuration", range: "60 ft", cast: "1 action", concentration: true, save: "dex", description: "Thick webs restrain creatures caught inside.", classes: ["artificer", "sorcerer", "wizard"] },
  { id: "hold-person", name: "Hold Person", level: 2, school: "Enchantment", range: "60 ft", cast: "1 action", concentration: true, save: "wis", description: "Paralyze a humanoid for the duration.", classes: ["bard", "cleric", "sorcerer", "warlock", "wizard"] },
  { id: "suggestion", name: "Suggestion", level: 2, school: "Enchantment", range: "30 ft", cast: "1 action", concentration: true, save: "wis", description: "A reasonable-sounding course of action the target follows.", classes: ["bard", "sorcerer", "warlock", "wizard"] },
  { id: "mirror-image", name: "Mirror Image", level: 2, school: "Illusion", range: "Self", cast: "1 action", description: "Three illusory duplicates divert attacks.", classes: ["sorcerer", "warlock", "wizard"] },
  { id: "flaming-sphere", name: "Flaming Sphere", level: 2, school: "Conjuration", range: "60 ft", cast: "1 action", concentration: true, save: "dex", damage: "2d6", description: "A rolling ball of fire you can ram into foes.", classes: ["artificer", "druid", "sorcerer", "wizard"] },
  { id: "pass-without-trace", name: "Pass Without Trace", level: 2, school: "Abjuration", range: "Self", cast: "1 action", concentration: true, description: "+10 to Stealth for you and allies within 30 ft.", classes: ["druid", "ranger"] },

  // --- 3rd level ---
  { id: "fireball", name: "Fireball", level: 3, school: "Evocation", range: "150 ft", cast: "1 action", save: "dex", damage: "8d6", description: "A bright streak then a low roar — a 20-ft-radius explosion.", classes: ["sorcerer", "wizard"] },
  { id: "lightning-bolt", name: "Lightning Bolt", level: 3, school: "Evocation", range: "Self (100-ft line)", cast: "1 action", save: "dex", damage: "8d6", description: "A line of lightning; half damage on a save.", classes: ["sorcerer", "wizard"] },
  { id: "counterspell", name: "Counterspell", level: 3, school: "Abjuration", range: "60 ft", cast: "1 reaction", description: "Attempt to interrupt a creature's spell as it is cast.", classes: ["sorcerer", "warlock", "wizard"] },
  { id: "dispel-magic", name: "Dispel Magic", level: 3, school: "Abjuration", range: "120 ft", cast: "1 action", description: "End spells of 3rd level or lower; roll to beat higher ones.", classes: ["artificer", "bard", "cleric", "druid", "paladin", "sorcerer", "warlock", "wizard"] },
  { id: "fly", name: "Fly", level: 3, school: "Transmutation", range: "Touch", cast: "1 action", concentration: true, description: "A creature gains a 60-ft flying speed for the duration.", classes: ["artificer", "sorcerer", "warlock", "wizard"] },
  { id: "haste", name: "Haste", level: 3, school: "Transmutation", range: "30 ft", cast: "1 action", concentration: true, description: "Doubled speed, +2 AC, extra action — then a lethargy round when it ends.", classes: ["artificer", "sorcerer", "wizard"] },
  { id: "slow", name: "Slow", level: 3, school: "Transmutation", range: "120 ft", cast: "1 action", concentration: true, save: "wis", description: "Up to six creatures move and act more slowly.", classes: ["sorcerer", "wizard"] },
  { id: "spirit-guardians", name: "Spirit Guardians", level: 3, school: "Conjuration", range: "Self (15-ft radius)", cast: "1 action", concentration: true, save: "wis", damage: "3d8", description: "Guardian spirits circle you, harming and slowing enemies.", classes: ["cleric"] },
  { id: "revivify", name: "Revivify", level: 3, school: "Necromancy", range: "Touch", cast: "1 action", description: "Return a creature that died within the last minute to 1 HP.", classes: ["artificer", "cleric", "paladin"] },
  { id: "hypnotic-pattern", name: "Hypnotic Pattern", level: 3, school: "Illusion", range: "120 ft", cast: "1 action", concentration: true, save: "wis", description: "A twisting pattern charms creatures that fail their save.", classes: ["bard", "sorcerer", "warlock", "wizard"] },
  { id: "sleet-storm", name: "Sleet Storm", level: 3, school: "Conjuration", range: "150 ft", cast: "1 action", concentration: true, save: "dex", description: "Heavy sleet blinds and knocks creatures prone.", classes: ["druid", "sorcerer", "wizard"] },
  { id: "conjure-animals", name: "Conjure Animals", level: 3, school: "Conjuration", range: "60 ft", cast: "1 action", concentration: true, description: "Summon beasts to fight alongside you.", classes: ["druid", "ranger"] },
];

export const SPELL_MAP = Object.fromEntries(
  SPELLS.map((s) => [s.id, s]),
) as Record<string, SpellDef>;

/** Curated spell lists per class — the spells this hero can know.
 *  Martial classes (barbarian, fighter, monk, rogue) have no spellbook
 *  in this curated selection — their magic is subclass-flavored instead. */
export const KNOWN_SPELLS_BY_CLASS: Partial<Record<DnDClassId, string[]>> = {
  artificer: ["fire-bolt", "guidance", "mage-hand", "prestidigitation", "thorn-whip", "cure-wounds", "faerie-fire", "shield", "magic-missile", "shatter", "flaming-sphere", "web", "dispel-magic", "fly", "haste", "revivify"],
  bard: ["vicious-mockery", "mage-hand", "prestidigitation", "cure-wounds", "faerie-fire", "healing-word", "thunderwave", "sleep", "shatter", "hold-person", "suggestion", "dispel-magic", "hypnotic-pattern"],
  cleric: ["guidance", "sacred-flame", "word-of-radiance", "cure-wounds", "healing-word", "guiding-bolt", "bless", "spiritual-weapon", "hold-person", "spirit-guardians", "revivify", "dispel-magic"],
  druid: ["guidance", "thorn-whip", "produce-flame", "cure-wounds", "healing-word", "faerie-fire", "thunderwave", "moonbeam", "flaming-sphere", "pass-without-trace", "sleet-storm", "conjure-animals", "dispel-magic"],
  paladin: ["cure-wounds", "bless", "dispel-magic", "revivify"],
  ranger: ["cure-wounds", "pass-without-trace", "conjure-animals"],
  sorcerer: ["fire-bolt", "ray-of-frost", "mage-hand", "prestidigitation", "chill-touch", "burning-hands", "magic-missile", "shield", "chromatic-orb", "thunderwave", "sleep", "scorching-ray", "shatter", "misty-step", "web", "hold-person", "suggestion", "mirror-image", "flaming-sphere", "fireball", "lightning-bolt", "counterspell", "fly", "haste", "slow", "hypnotic-pattern", "sleet-storm", "dispel-magic"],
  warlock: ["eldritch-blast", "chill-touch", "mage-hand", "prestidigitation", "hellish-rebuke", "arms-of-hadar", "shatter", "misty-step", "hold-person", "suggestion", "mirror-image", "counterspell", "hypnotic-pattern", "fly", "dispel-magic"],
  wizard: ["fire-bolt", "ray-of-frost", "mage-hand", "prestidigitation", "chill-touch", "burning-hands", "magic-missile", "shield", "chromatic-orb", "thunderwave", "sleep", "scorching-ray", "shatter", "misty-step", "web", "hold-person", "suggestion", "mirror-image", "flaming-sphere", "fireball", "lightning-bolt", "counterspell", "fly", "haste", "slow", "hypnotic-pattern", "sleet-storm", "dispel-magic"],
};

/** Spell defs a character of this class can know at their current level. */
export function knownSpellsFor(classId: DnDClassId, level: number): SpellDef[] {
  const ids = KNOWN_SPELLS_BY_CLASS[classId] ?? [];
  return ids
    .map((id) => SPELL_MAP[id])
    .filter((s): s is SpellDef => !!s && s.level <= level);
}
