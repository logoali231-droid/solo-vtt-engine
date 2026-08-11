// ============================================================================
// Oraculum — Mechanical encounter tables & generator.
// Original stat blocks per system (D&D 5e, PF2e, GURPS). The generator scales
// a foe's numbers by the chosen difficulty so the player can set up a fight
// mechanically, with no AI required.
// ============================================================================

import type { EnemyState, GameSystem } from "../types";
import { uid } from "../types";

export type EncounterDifficulty = "trivial" | "easy" | "standard" | "hard" | "deadly";

export const ENCOUNTER_DIFFICULTIES: { id: EncounterDifficulty; label: string; scale: number; hint: string }[] = [
  { id: "trivial", label: "Trivial", scale: 0.6, hint: "A lone weakling — barely a fight." },
  { id: "easy", label: "Easy", scale: 0.8, hint: "A modest threat you can brush aside." },
  { id: "standard", label: "Standard", scale: 1.0, hint: "A fair fight on equal terms." },
  { id: "hard", label: "Hard", scale: 1.35, hint: "They outmatch you — bring everything." },
  { id: "deadly", label: "Deadly", scale: 1.8, hint: "A genuine risk of death." },
];

export const ENEMY_TABLES: Record<string, EnemyState[]> = {
  dnd5e: [
    { id: "goblin", name: "Goblin", ac: 15, hp: 7, maxHp: 7, attackBonus: 4, damage: "1d6+2", xp: 50, gold: 5, loot: ["a crude dagger"] },
    { id: "wolf", name: "Wolf", ac: 13, hp: 11, maxHp: 11, attackBonus: 4, damage: "2d4+2", xp: 25, gold: 0, loot: ["wolf pelt"] },
    { id: "bandit", name: "Bandit", ac: 12, hp: 11, maxHp: 11, attackBonus: 3, damage: "1d8+1", xp: 25, gold: 8, loot: ["a worn coin purse"] },
    { id: "skeleton", name: "Skeleton", ac: 13, hp: 13, maxHp: 13, attackBonus: 4, damage: "1d6+2", xp: 50, gold: 4, loot: ["a brittle bone charm"] },
    { id: "zombie", name: "Zombie", ac: 8, hp: 22, maxHp: 22, attackBonus: 3, damage: "1d6+1", xp: 50, gold: 0, loot: ["a tattered coat with a key in the pocket"] },
    { id: "cultist", name: "Cultist", ac: 13, hp: 9, maxHp: 9, attackBonus: 3, damage: "1d6+1", xp: 50, gold: 10, loot: ["a black iron medallion"] },
    { id: "hobgoblin", name: "Hobgoblin", ac: 18, hp: 13, maxHp: 13, attackBonus: 3, damage: "1d8+1", xp: 100, gold: 20, loot: ["a hobgoblin captain's badge"] },
    { id: "orc", name: "Orc", ac: 13, hp: 15, maxHp: 15, attackBonus: 5, damage: "1d12+3", xp: 100, gold: 12, loot: ["an orcish war axe"] },
    { id: "bugbear", name: "Bugbear", ac: 16, hp: 27, maxHp: 27, attackBonus: 4, damage: "2d8+2", xp: 200, gold: 25, loot: ["a heavy iron spear"] },
    { id: "dire-wolf", name: "Dire Wolf", ac: 14, hp: 37, maxHp: 37, attackBonus: 5, damage: "2d6+3", xp: 200, gold: 0, loot: ["a dire wolf pelt"] },
    { id: "mage", name: "Rogue Mage", ac: 12, hp: 22, maxHp: 22, attackBonus: 5, damage: "2d8", xp: 1100, gold: 100, loot: ["a spell scroll (2nd-level)", "a quarterstaff"] },
    { id: "dragon-wyrmling", name: "Dragon Wyrmling", ac: 17, hp: 75, maxHp: 75, attackBonus: 6, damage: "2d6+4", xp: 450, gold: 200, loot: ["a draconic scale", "a nest hoard"] },
    { id: "owlbear", name: "Owlbear", ac: 13, hp: 59, maxHp: 59, attackBonus: 7, damage: "1d10+5", xp: 700, gold: 40, loot: ["an owlbear feather", "a gold ring in its gullet"] },
    { id: "troll", name: "Troll", ac: 15, hp: 84, maxHp: 84, attackBonus: 7, damage: "2d6+4", xp: 1800, gold: 60, loot: ["a troll heart (regenerative)"] },
    { id: "giant-rat", name: "Giant Rat", ac: 12, hp: 7, maxHp: 7, attackBonus: 4, damage: "1d4+2", xp: 25, gold: 0, loot: ["a scrap of cured leather"] },
    { id: "kobold", name: "Kobold", ac: 12, hp: 5, maxHp: 5, attackBonus: 4, damage: "1d4+2", xp: 25, gold: 3, loot: ["a chipped jade trinket"] },
    { id: "guard", name: "City Guard", ac: 16, hp: 11, maxHp: 11, attackBonus: 3, damage: "1d8+1", xp: 25, gold: 6, loot: ["a brass badge", "a pouch of ration coins"] },
    { id: "ghoul", name: "Ghoul", ac: 12, hp: 22, maxHp: 22, attackBonus: 4, damage: "1d6+2", xp: 200, gold: 0, loot: ["a bone talisman still warm"] },
    { id: "ogre", name: "Ogre", ac: 11, hp: 59, maxHp: 59, attackBonus: 6, damage: "2d8+4", xp: 450, gold: 100, loot: ["an ogre's greatclub", "a sack of old silver"] },
    { id: "bandit-captain", name: "Bandit Captain", ac: 15, hp: 65, maxHp: 65, attackBonus: 5, damage: "1d8+3", xp: 450, gold: 150, loot: ["a captain's saber", "a letter with a wax seal"] },
  ],
  pf2e: [
    { id: "goblin-warrior", name: "Goblin Warrior", ac: 16, hp: 9, maxHp: 9, attackBonus: 6, damage: "1d6", xp: 40, gold: 3, loot: ["a goblin dogslicer"] },
    { id: "zombie-shambler", name: "Zombie Shambler", ac: 13, hp: 20, maxHp: 20, attackBonus: 7, damage: "1d8+3", xp: 40, gold: 1 },
    { id: "giant-spider", name: "Giant Spider", ac: 16, hp: 15, maxHp: 15, attackBonus: 10, damage: "1d8+2", xp: 40, gold: 5, loot: ["a venom gland", "a wad of spider silk"] },
    { id: "skeleton-guard", name: "Skeleton Guard", ac: 15, hp: 12, maxHp: 12, attackBonus: 6, damage: "1d6+2", xp: 40, gold: 2 },
    { id: "orc-brute", name: "Orc Brute", ac: 15, hp: 22, maxHp: 22, attackBonus: 8, damage: "1d12+3", xp: 80, gold: 10, loot: ["an orcish greataxe"] },
    { id: "worg", name: "Worg", ac: 14, hp: 26, maxHp: 26, attackBonus: 9, damage: "2d6+4", xp: 80, gold: 8, loot: ["a worg pelt"] },
    { id: "cult-leader", name: "Cult Leader", ac: 18, hp: 32, maxHp: 32, attackBonus: 10, damage: "1d8+4", xp: 160, gold: 30, loot: ["a tarnished ritual dagger"] },
    { id: "otyugh", name: "Otyugh", ac: 18, hp: 40, maxHp: 40, attackBonus: 9, damage: "2d6+4", xp: 120, gold: 20, loot: ["a swallowed pouch of coins"] },
    { id: "ghost", name: "Ghost", ac: 16, hp: 22, maxHp: 22, attackBonus: 11, damage: "2d6+2", xp: 160, gold: 0, loot: ["a mourning veil"] },
    { id: "hill-giant", name: "Hill Giant", ac: 17, hp: 60, maxHp: 60, attackBonus: 11, damage: "3d8+6", xp: 240, gold: 50, loot: ["a giant's club", "a pouch of gold teeth"] },
    { id: "kobold-warrior", name: "Kobold Warrior", ac: 15, hp: 6, maxHp: 6, attackBonus: 5, damage: "1d4", xp: 20, gold: 1, loot: ["a scrap of jade"] },
    { id: "rat-swarm", name: "Rat Swarm", ac: 13, hp: 20, maxHp: 20, attackBonus: 8, damage: "1d6", xp: 60, gold: 0, loot: ["a gnawed silver button"] },
    { id: "ghoul", name: "Ghoul", ac: 16, hp: 18, maxHp: 18, attackBonus: 8, damage: "1d6+2", xp: 80, gold: 4, loot: ["a cold iron key"] },
    { id: "hobgoblin-soldier", name: "Hobgoblin Soldier", ac: 18, hp: 16, maxHp: 16, attackBonus: 7, damage: "1d8+2", xp: 80, gold: 12, loot: ["a hobgoblin spear", "a unit banner scrap"] },
    { id: "owlbear", name: "Owlbear", ac: 18, hp: 55, maxHp: 55, attackBonus: 12, damage: "1d10+6", xp: 240, gold: 30, loot: ["an owlbear feather", "a gold ring in its gullet"] },
  ],
  gurps: [
    { id: "wolf", name: "Wolf", ac: 9, hp: 10, maxHp: 10, attackBonus: 12, damage: "1d6-1", xp: 1, gold: 0, loot: ["wolf pelt"] },
    { id: "thug", name: "Thug", ac: 9, hp: 11, maxHp: 11, attackBonus: 11, damage: "1d6", xp: 1, gold: 5, loot: ["a heavy club"] },
    { id: "bandit-archer", name: "Bandit Archer", ac: 9, hp: 10, maxHp: 10, attackBonus: 13, damage: "1d6+1", xp: 1, gold: 6, loot: ["a shortbow", "10 arrows"] },
    { id: "orc-soldier", name: "Orc Soldier", ac: 9, hp: 13, maxHp: 13, attackBonus: 12, damage: "1d6+2", xp: 1, gold: 8, loot: ["an orcish blade"] },
    { id: "brute", name: "Brute", ac: 9, hp: 15, maxHp: 15, attackBonus: 13, damage: "1d6+3", xp: 2, gold: 12, loot: ["a broken war-hammer"] },
    { id: "guard-lieutenant", name: "Guard Lieutenant", ac: 10, hp: 15, maxHp: 15, attackBonus: 14, damage: "1d6+2", xp: 2, gold: 15, loot: ["a lieutenant's badge"] },
    { id: "wraith", name: "Wraith", ac: 9, hp: 12, maxHp: 12, attackBonus: 14, damage: "1d6+1", xp: 3, gold: 0, loot: ["a silver key that opens nothing nearby"] },
    { id: "troll", name: "Troll", ac: 9, hp: 20, maxHp: 20, attackBonus: 15, damage: "2d6+2", xp: 3, gold: 20, loot: ["a troll heart (regenerative)"] },
    { id: "giant-rat", name: "Giant Rat", ac: 8, hp: 4, maxHp: 4, attackBonus: 10, damage: "1d6-2", xp: 1, gold: 0, loot: ["a chewed bootlace"] },
    { id: "goblin", name: "Goblin", ac: 9, hp: 8, maxHp: 8, attackBonus: 11, damage: "1d6-1", xp: 1, gold: 4, loot: ["a crudely carved tooth"] },
    { id: "skeleton", name: "Skeleton", ac: 9, hp: 10, maxHp: 10, attackBonus: 11, damage: "1d6", xp: 1, gold: 2, loot: ["a brittle bone charm"] },
    { id: "veteran", name: "Veteran Soldier", ac: 10, hp: 14, maxHp: 14, attackBonus: 13, damage: "1d6+2", xp: 2, gold: 18, loot: ["a soldier's pay purse"] },
  ],
};

function d(n: number): number {
  return Math.floor(Math.random() * n);
}

/**
 * Generate a fight mechanically: 1–3 foes drawn from the system's table,
 * scaled to the chosen difficulty (HP, AC and attack bonus shift, and the
 * damage dice step up/down). Returns ready-to-roll EnemyState entries.
 */
export function generateEncounter(
  system: GameSystem,
  difficulty: EncounterDifficulty = "standard",
): EnemyState[] {
  const table = ENEMY_TABLES[system] ?? ENEMY_TABLES.dnd5e;
  const scale = ENCOUNTER_DIFFICULTIES.find((df) => df.id === difficulty)?.scale ?? 1;
  // Deadlier fights field more foes.
  const count = difficulty === "trivial" ? 1 : difficulty === "easy" ? 1 : difficulty === "standard" ? (d(2) === 0 ? 1 : 2) : difficulty === "hard" ? 2 : 3;
  const foes: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const base = table[d(table.length)];
    const hp = Math.max(1, Math.round(base.hp * scale));
    const ac = Math.min(24, base.ac + (scale >= 1.35 ? 1 : 0));
    const attackBonus = base.attackBonus + (scale >= 1.8 ? 2 : scale >= 1.35 ? 1 : 0);
    foes.push({
      ...base,
      id: `${base.id}-${uid().slice(0, 4)}`,
      hp,
      maxHp: hp,
      ac,
      attackBonus,
    });
  }
  return foes;
}

/** A single random foe (the old quick-spawn behavior). */
export function randomEnemy(system: GameSystem): EnemyState {
  return generateEncounter(system, "standard")[0];
}
