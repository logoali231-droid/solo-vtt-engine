// Behavioral test: all 18 D&D 5e skills must trigger an auto-roll via
// detectSkillCheck with the correct skill id and ability.
import { detectSkillCheck } from "./src/lib/rpg/skillDetect";
import type { AdventureState, DnDCharacter } from "./src/lib/rpg/types";

const char: DnDCharacter = {
  system: "dnd5e",
  name: "Test Fighter",
  level: 1,
  raceId: "human",
  subraceId: null,
  customOrigin: false,
  originFirst: "str",
  originSecond: "con",
  classId: "fighter",
  subclassId: "champion",
  backgroundId: "soldier",
  baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  chosenSkills: [],
  expertiseSkills: [],
  feats: [],
  weaponId: "longsword",
  armorId: "chain",
  shield: true,
  state: {
    hpDamage: 0, tempHp: 0, resourceUses: {}, spellSlotsUsed: [],
    pactUsed: 0, infusionsUsed: 0, conditions: [], pending: [],
    damagePending: [], activeStatus: [],
  },
};

const adventure = { system: "dnd5e", character: char } as unknown as AdventureState;

const cases: [string, string, string, string][] = [
  // [phrase, expected skill id, expected ability, expected label]
  ["I climb the wall", "athletics", "str", "Athletics"],
  ["I tumble across the room", "acrobatics", "dex", "Acrobatics"],
  ["I pickpocket the guard", "sleight-of-hand", "dex", "Sleight of Hand"],
  ["I sneak past the guard", "stealth", "dex", "Stealth"],
  ["I recall knowledge about the magic sigil", "arcana", "int", "Arcana"],
  ["I recall knowledge about ancient kings", "history", "int", "History"],
  ["I investigate the warehouse", "investigation", "int", "Investigation"],
  ["I recall knowledge about this beast", "nature", "int", "Nature"],
  ["I recall knowledge about the undead", "religion", "int", "Religion"],
  ["I calm the frightened horse", "animal-handling", "wis", "Animal Handling"],
  ["I read him to tell if he lies", "insight", "wis", "Insight"],
  ["I bandage the wound", "medicine", "wis", "Medicine"],
  ["I look around the room", "perception", "wis", "Perception"],
  ["I track the goblin trail", "survival", "wis", "Survival"],
  ["I bluff the guard into letting me pass", "deception", "cha", "Deception"],
  ["I threaten the merchant", "intimidation", "cha", "Intimidation"],
  ["I sing a song to entertain the crowd", "performance", "cha", "Performance"],
  ["I persuade the merchant to lower the price", "persuasion", "cha", "Persuasion"],
];

let pass = 0;
let fail = 0;
for (const [phrase, skill, ability, label] of cases) {
  const r = detectSkillCheck(phrase, adventure);
  const ok = !!r && r.skill === skill && r.ability === ability;
  if (!ok) fail++;
  else pass++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  "${phrase}"  ->  ${r ? `${r.label} (${r.skill}/${r.ability})` : "null"}`,
  );
}

// Exclusion sanity: attack/rest/questions must NOT roll.
const excluded = [
  "I attack the goblin",
  "I take a short rest",
  "Is the door locked?",
];
for (const phrase of excluded) {
  const r = detectSkillCheck(phrase, adventure);
  const ok = r === null;
  if (!ok) fail++;
  else pass++;
  console.log(`${ok ? "PASS" : "FAIL"}  "${phrase}"  ->  ${r ? "ROLLED (wrong!)" : "null (excluded, correct)"}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
