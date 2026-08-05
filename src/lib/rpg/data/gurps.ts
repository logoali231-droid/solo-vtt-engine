import type { GurpsSkillDef } from "../types";

// Skill list: name, controlling attribute, difficulty.
export const GURPS_SKILLS: GurpsSkillDef[] = [
  { id: "brawling", name: "Brawling", stat: "dx", difficulty: "easy" },
  { id: "knife", name: "Knife", stat: "dx", difficulty: "easy" },
  { id: "shortsword", name: "Shortsword", stat: "dx", difficulty: "average" },
  { id: "broadsword", name: "Broadsword", stat: "dx", difficulty: "average" },
  { id: "axe-mace", name: "Axe/Mace", stat: "dx", difficulty: "average" },
  { id: "spear", name: "Spear", stat: "dx", difficulty: "average" },
  { id: "polearm", name: "Polearm", stat: "dx", difficulty: "average" },
  { id: "bow", name: "Bow", stat: "dx", difficulty: "average" },
  { id: "crossbow", name: "Crossbow", stat: "dx", difficulty: "easy" },
  { id: "guns", name: "Guns", stat: "dx", difficulty: "easy" },
  { id: "thrown-weapon", name: "Thrown Weapon", stat: "dx", difficulty: "easy" },
  { id: "acrobatics", name: "Acrobatics", stat: "dx", difficulty: "hard" },
  { id: "climbing", name: "Climbing", stat: "dx", difficulty: "average" },
  { id: "stealth", name: "Stealth", stat: "dx", difficulty: "average" },
  { id: "driving", name: "Driving", stat: "dx", difficulty: "average" },
  { id: "sleight-of-hand", name: "Sleight of Hand", stat: "dx", difficulty: "hard" },
  { id: "lockpicking", name: "Lockpicking", stat: "iq", difficulty: "average" },
  { id: "traps", name: "Traps", stat: "iq", difficulty: "average" },
  { id: "survival", name: "Survival", stat: "iq", difficulty: "average" },
  { id: "first-aid", name: "First Aid", stat: "iq", difficulty: "easy" },
  { id: "tactics", name: "Tactics", stat: "iq", difficulty: "hard" },
  { id: "strategy", name: "Strategy", stat: "iq", difficulty: "hard" },
  { id: "current-affairs", name: "Current Affairs", stat: "iq", difficulty: "easy" },
  { id: "area-knowledge", name: "Area Knowledge", stat: "iq", difficulty: "easy" },
  { id: "hiking", name: "Hiking", stat: "ht", difficulty: "average" },
  { id: "running", name: "Running", stat: "ht", difficulty: "hard" },
  { id: "swimming", name: "Swimming", stat: "ht", difficulty: "easy" },
  { id: "brawling-dx", name: "—", stat: "dx", difficulty: "easy" },
];

export const GURPS_SKILL_MAP = Object.fromEntries(
  GURPS_SKILLS.map((s) => [s.id, s]),
);

export const GURPS_ARMORS: { id: string; name: string; dr: number; note?: string }[] = [
  { id: "none", name: "No Armor", dr: 0 },
  { id: "leather-jacket", name: "Leather Jacket", dr: 1, note: "Torso, arms" },
  { id: "chainmail", name: "Chainmail Hauberk", dr: 3, note: "Torso" },
  { id: "plate", name: "Plate Cuirass", dr: 5, note: "Torso" },
  { id: "knight", name: "Full Plate", dr: 6, note: "Whole body" },
];

export const GURPS_ARMOR_MAP = Object.fromEntries(
  GURPS_ARMORS.map((a) => [a.id, a]),
);

// ---------------------------------------------------------------------------
// Advantages / Talents (GURPS character points)
// ---------------------------------------------------------------------------

export interface GurpsAdvantageDef {
  id: string;
  name: string;
  points: number;
  summary: string;
  perLevel?: boolean;
  effects?: {
    dr?: number;
    dodge?: number;
    will?: number;
  };
}

export const GURPS_ADVANTAGES: GurpsAdvantageDef[] = [
  { id: "combat-reflexes", name: "Combat Reflexes", points: 15, summary: "+1 to all Active Defenses, +2 to Fright Checks; never caught flat-footed.", effects: { dodge: 1 } },
  { id: "high-pain-threshold", name: "High Pain Threshold", points: 10, summary: "Ignore pain penalties; +3 to resist knockdown and stunning." },
  { id: "danger-sense", name: "Danger Sense", points: 15, summary: "The GM warns you of hidden danger with a premonition." },
  { id: "intuition", name: "Intuition", points: 15, summary: "Sense whether a proposed course of action is good or bad." },
  { id: "luck", name: "Luck", points: 15, summary: "Reroll one failed roll once per hour of play." },
  { id: "extraordinary-luck", name: "Extraordinary Luck", points: 30, summary: "Reroll failed rolls as often as every ten minutes." },
  { id: "daredevil", name: "Daredevil", points: 15, summary: "+1 to all rolls when you take a genuine risk." },
  { id: "common-sense", name: "Common Sense", points: 10, summary: "The GM may warn you when you are about to act foolishly." },
  { id: "serendipity", name: "Serendipity", points: 15, summary: "Unlikely coincidences and lucky breaks favor you." },
  { id: "weapon-master", name: "Weapon Master", points: 45, summary: "+1 damage per die with your signature weapons." },
  { id: "trained-by-master", name: "Trained by a Master", points: 30, summary: "Cinematic martial-arts feats and free rapid strikes." },
  { id: "ambidexterity", name: "Ambidexterity", points: 5, summary: "No off-hand penalty for either hand." },
  { id: "enhanced-dodge", name: "Enhanced Dodge", points: 15, summary: "+1 to Dodge.", effects: { dodge: 1 } },
  { id: "enhanced-parry", name: "Enhanced Parry", points: 5, summary: "+1 to Parry with your chosen skill." },
  { id: "perfect-balance", name: "Perfect Balance", points: 15, summary: "+6 to Balance, Climbing and tightrope rolls." },
  { id: "catfall", name: "Catfall", points: 10, summary: "Ignore damage from falls up to 20 yards on a DX roll." },
  { id: "acute-vision", name: "Acute Vision", points: 2, summary: "+1 to Vision rolls per level.", perLevel: true },
  { id: "acute-hearing", name: "Acute Hearing", points: 2, summary: "+1 to Hearing rolls per level.", perLevel: true },
  { id: "night-vision", name: "Night Vision", points: 1, summary: "Ignore one level of darkness penalties per level.", perLevel: true },
  { id: "fearlessness", name: "Fearlessness", points: 2, summary: "+1 to Fright Checks per level.", perLevel: true },
  { id: "strong-will", name: "Strong Will", points: 4, summary: "+1 to Will per level — resist mental coercion.", perLevel: true, effects: { will: 1 } },
  { id: "high-manual-dexterity", name: "High Manual Dexterity", points: 5, summary: "+3 to fine-manipulation tasks in your hands." },
  { id: "flexibility", name: "Flexibility", points: 5, summary: "+3 to Escape and Climbing rolls." },
  { id: "double-jointed", name: "Double-Jointed", points: 15, summary: "+5 to Escape and Contortionist; limber beyond belief." },
  { id: "fit", name: "Fit", points: 5, summary: "+1 to HT rolls; recover FP twice as fast." },
  { id: "very-fit", name: "Very Fit", points: 15, summary: "+2 to HT rolls; recover FP three times as fast." },
  { id: "hard-to-kill", name: "Hard to Kill", points: 5, summary: "+1 per level to survive death; die less easily.", perLevel: true },
  { id: "rapid-healing", name: "Rapid Healing", points: 5, summary: "Recover from injury twice as fast." },
  { id: "eidetic-memory", name: "Eidetic Memory", points: 5, summary: "Roll to recall anything you have ever experienced." },
  { id: "photographic-memory", name: "Photographic Memory", points: 10, summary: "Near-perfect recall of everything you see or read." },
  { id: "language-talent", name: "Language Talent", points: 10, summary: "Learn new languages in a fraction of the time." },
  { id: "voice", name: "Voice", points: 10, summary: "+2 to all social skill rolls that use speech." },
  { id: "charisma", name: "Charisma", points: 5, summary: "+1 to reaction rolls per level; leadership magnetism.", perLevel: true },
  { id: "attractive", name: "Attractive", points: 4, summary: "+1 to reaction rolls from those who find you appealing." },
  { id: "handsome", name: "Handsome / Beautiful", points: 12, summary: "+2 to reaction rolls; +4 from the attracted sex." },
  { id: "business-acumen", name: "Business Acumen", points: 10, summary: "+1 per level to Finance, Market Analysis and Merchant.", perLevel: true },
  { id: "artificer-talent", name: "Artificer Talent", points: 10, summary: "+1 per level to invention, engineering and smithing skills.", perLevel: true },
  { id: "social-chameleon", name: "Social Chameleon", points: 5, summary: "No penalty when acting outside your class or role." },
  { id: "single-minded", name: "Single-Minded", points: 5, summary: "+3 to complete one chosen task while focused." },
  { id: "absolute-direction", name: "Absolute Direction", points: 5, summary: "Always know which way is north; never lost." },
  { id: "absolute-timing", name: "Absolute Timing", points: 5, summary: "Know the time precisely at any moment." },
  { id: "less-sleep", name: "Less Sleep", points: 2, summary: "Need one fewer hour of sleep per level (min 0).", perLevel: true },
  { id: "longevity", name: "Longevity", points: 2, summary: "Age noticeably slower than your peers." },
  { id: "alcohol-tolerance", name: "Alcohol Tolerance", points: 1, summary: "Ignore penalties from intoxication; no hangovers." },
  { id: "deep-sleeper", name: "Deep Sleeper", points: 1, summary: "Sleep through almost any noise or disturbance." },
  { id: "immovable-stance", name: "Immovable Stance", points: 15, summary: "Cannot be knocked down or shoved from your footing." },
  { id: "unfazeable", name: "Unfazeable", points: 15, summary: "Immune to mental stun and intimidation." },
  { id: "indomitable", name: "Indomitable", points: 15, summary: "+5 to resist mental coercion of any kind." },
  { id: "resistant-disease", name: "Resistant to Disease", points: 5, summary: "+3 to resist all disease." },
  { id: "resistant-poison", name: "Resistant to Poison", points: 5, summary: "+3 to resist all poison." },
  { id: "temperature-tolerance", name: "Temperature Tolerance", points: 1, summary: "Comfortable in more extreme heat or cold per level.", perLevel: true },
  { id: "gizmos", name: "Gizmos", points: 5, summary: "Retroactively have a small gadget you need per level.", perLevel: true },
  { id: "independent-income", name: "Independent Income", points: 1, summary: "Income per level without working.", perLevel: true },
  { id: "wealthy", name: "Wealthy", points: 20, summary: "Comfortable or better income tier and starting wealth." },
  { id: "very-wealthy", name: "Very Wealthy", points: 30, summary: "Affluent income tier and lavish starting wealth." },
  { id: "zeroed", name: "Zeroed", points: 10, summary: "No official records of your existence exist." },
  { id: "blessed", name: "Blessed", points: 10, summary: "Divine favor — critical successes happen more often." },
  { id: "oracle", name: "Oracle", points: 15, summary: "Vague prophetic visions guide your choices." },
  { id: "mind-shield", name: "Mind Shield", points: 4, summary: "+1 per level to resist mental attacks and probes.", perLevel: true },
  { id: "tough-skin", name: "Tough Skin", points: 3, summary: "DR 1 per level — cannot stack with worn armor.", perLevel: true, effects: { dr: 1 } },
  { id: "damage-resistance", name: "Damage Resistance", points: 5, summary: "DR 1 per level — stacks with worn armor.", perLevel: true, effects: { dr: 1 } },
];

export const GURPS_ADVANTAGE_MAP = Object.fromEntries(
  GURPS_ADVANTAGES.map((a) => [a.id, a]),
);

// ---------------------------------------------------------------------------
// Disadvantages (GURPS character points — negative cost, refund into budget)
// ---------------------------------------------------------------------------

export interface GurpsDisadvantageDef {
  id: string;
  name: string;
  points: number; // negative
  summary: string;
}

export const GURPS_DISADVANTAGES: GurpsDisadvantageDef[] = [
  { id: "addiction", name: "Addiction", points: -5, summary: "A consuming habit you must feed or suffer withdrawal." },
  { id: "alcoholism", name: "Alcoholism", points: -15, summary: "Self-control roll to avoid drinking; impairment while intoxicated." },
  { id: "bad-temper", name: "Bad Temper", points: -10, summary: "Self-control roll to avoid violent outbursts when provoked." },
  { id: "bad-smell", name: "Bad Smell", points: -10, summary: "-2 on reactions and social rolls in close proximity." },
  { id: "bloodlust", name: "Bloodlust", points: -10, summary: "Self-control roll to avoid killing disabled enemies." },
  { id: "code-of-honor", name: "Code of Honor", points: -10, summary: "Personal creed you will not break, even at great cost." },
  { id: "compulsive-carousing", name: "Compulsive Carousing", points: -5, summary: "Self-control roll to avoid drinking and partying." },
  { id: "compulsive-gambling", name: "Compulsive Gambling", points: -5, summary: "Self-control roll to avoid betting on anything." },
  { id: "compulsive-liar", name: "Compulsive Liar", points: -15, summary: "Self-control roll to avoid lying, even when pointless." },
  { id: "curious", name: "Curious", points: -5, summary: "Self-control roll to avoid investigating every mystery." },
  { id: "deafness", name: "Deafness", points: -20, summary: "No hearing at all — no Hearing rolls, -4 to perception." },
  { id: "dependents", name: "Dependents", points: -10, summary: "People who rely on you — and need rescuing." },
  { id: "duty", name: "Duty", points: -5, summary: "Obligations to an employer, guild or cause." },
  { id: "enemy", name: "Enemy", points: -10, summary: "Someone powerful and determined who hunts you." },
  { id: "flashbacks", name: "Flashbacks", points: -5, summary: "Disabling memories trigger on trauma; Will roll to stay in control." },
  { id: "greed", name: "Greed", points: -15, summary: "Self-control roll to avoid risky plays for profit." },
  { id: "honesty", name: "Honesty", points: -10, summary: "Cannot knowingly break the law." },
  { id: "impulsiveness", name: "Impulsiveness", points: -10, summary: "Self-control roll to avoid acting before you think." },
  { id: "intolerance", name: "Intolerance", points: -5, summary: "Deep bias against a group; -3 on reactions with them." },
  { id: "jealousy", name: "Jealousy", points: -10, summary: "Self-control roll to avoid sabotaging rivals." },
  { id: "kleptomania", name: "Kleptomania", points: -15, summary: "Self-control roll to avoid stealing, even with no need." },
  { id: "light-sleeper", name: "Light Sleeper", points: -5, summary: "Awakened by any disturbance; only truly rest in perfect silence." },
  { id: "lunacy", name: "Lunacy", points: -10, summary: "When the moon is full, you lose control of yourself." },
  { id: "megalomania", name: "Megalomania", points: -10, summary: "You are destined to rule the world; delusions of grandeur." },
  { id: "nervous-stomach", name: "Nervous Stomach", points: -5, summary: "Vomit under extreme stress or gore." },
  { id: "nightmares", name: "Nightmares", points: -5, summary: "Terrifying dreams; rest poorly and lose FP." },
  { id: "no-sense-of-humor", name: "No Sense of Humor", points: -10, summary: "Literal-minded and deadpan; -2 on social reactions." },
  { id: "obsession", name: "Obsession", points: -5, summary: "A single driving obsession you pursue relentlessly." },
  { id: "overconfidence", name: "Overconfidence", points: -5, summary: "Self-control roll to avoid taking foolish risks." },
  { id: "pacifism", name: "Pacifism", points: -10, summary: "Cannot kill — at worst, cannot fight at all." },
  { id: "paranoia", name: "Paranoia", points: -10, summary: "Everyone is out to get you. Treat everyone with suspicion." },
  { id: "phobia", name: "Phobia (pick one)", points: -5, summary: "Crippling fear of a specific thing — cower or flee on failure." },
  { id: "post-combat-shakes", name: "Post-Combat Shakes", points: -5, summary: "Trembling and -2 on tasks for a while after battle." },
  { id: "poverty", name: "Poverty", points: -10, summary: "Barely any money; no starting wealth to speak of." },
  { id: "pyromania", name: "Pyromania", points: -5, summary: "Self-control roll to avoid setting things on fire." },
  { id: "self-centered", name: "Self-Centered", points: -5, summary: "You look out for number one, to everyone's cost." },
  { id: "shyness", name: "Shyness", points: -10, summary: "-2 on social rolls with strangers; painful in crowds." },
  { id: "sleepwalker", name: "Sleepwalker", points: -5, summary: "You wander and act while asleep." },
  { id: "slow-healing", name: "Slow Healing", points: -5, summary: "Take twice as long to recover from injury." },
  { id: "smell-blindness", name: "Smell Blindness", points: -5, summary: "No sense of smell." },
  { id: "squeamish", name: "Squeamish", points: -10, summary: "-2 on rolls near blood and gore." },
  { id: "stubbornness", name: "Stubbornness", points: -5, summary: "Self-control roll to back down from a position." },
  { id: "truthfulness", name: "Truthfulness", points: -5, summary: "Self-control roll to tell a lie, even a useful one." },
  { id: "unluckiness", name: "Unluckiness", points: -10, summary: "Once per session, the GM turns your success into failure." },
  { id: "weakness", name: "Weakness (common)", points: -10, summary: "Take damage when exposed to a common substance (e.g. sunlight)." },
  { id: "wealth-poor", name: "Poor", points: -15, summary: "Severe money troubles; starting wealth one-fifth of normal." },
  { id: "weirdness-magnet", name: "Weirdness Magnet", points: -15, summary: "Strange and supernatural events follow you everywhere." },
  { id: "workaholic", name: "Workaholic", points: -5, summary: "Cannot relax; self-control roll to stop working." },
  { id: "xenophilia", name: "Xenophilia", points: -5, summary: "Irresistible fascination with the alien and unknown." },
];

export const GURPS_DISADVANTAGE_MAP = Object.fromEntries(
  GURPS_DISADVANTAGES.map((d) => [d.id, d]),
);

export function gurpsAdvantageCost(advantages: { id: string; points: number }[]): number {
  return advantages.reduce((a, s) => a + s.points, 0);
}

export function gurpsDisadvantageRefund(disadvantages: { id: string; points: number }[]): number {
  return disadvantages.reduce((a, s) => a + s.points, 0);
}

/** Skill level given controlling attribute and invested points. */
export function gurpsSkillLevel(
  stat: number,
  difficulty: "easy" | "average" | "hard",
  points: number,
): number {
  const offset = difficulty === "easy" ? 0 : difficulty === "average" ? -1 : -2;
  if (points <= 0) return stat - 5; // default
  if (points === 1) return stat + offset;
  if (points === 2) return stat + offset + 1;
  if (points === 4) return stat + offset + 2;
  return stat + offset + 2 + Math.floor((points - 4) / 4);
}

/** Attribute cost: base 10, each ±1 costs/refunds 10 points. */
export function gurpsAttributeCost(attributes: {
  st: number;
  dx: number;
  iq: number;
  ht: number;
}): number {
  return (
    (attributes.st - 10) * 10 +
    (attributes.dx - 10) * 10 +
    (attributes.iq - 10) * 10 +
    (attributes.ht - 10) * 10
  );
}
