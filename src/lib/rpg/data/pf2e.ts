import type {
  AbilityId,
  Pf2eAncestryDef,
  Pf2eBackgroundDef,
  Pf2eClassDef,
  Pf2eFeatDef,
  Pf2eGearDef,
  Pf2eWeaponDef,
} from "../types";

export const PF2E_SKILLS: { id: string; name: string; ability: AbilityId }[] = [
  { id: "acrobatics", name: "Acrobatics", ability: "dex" },
  { id: "arcana", name: "Arcana", ability: "int" },
  { id: "athletics", name: "Athletics", ability: "str" },
  { id: "crafting", name: "Crafting", ability: "int" },
  { id: "deception", name: "Deception", ability: "cha" },
  { id: "diplomacy", name: "Diplomacy", ability: "cha" },
  { id: "intimidation", name: "Intimidation", ability: "cha" },
  { id: "medicine", name: "Medicine", ability: "wis" },
  { id: "nature", name: "Nature", ability: "wis" },
  { id: "occultism", name: "Occultism", ability: "int" },
  { id: "performance", name: "Performance", ability: "cha" },
  { id: "religion", name: "Religion", ability: "wis" },
  { id: "society", name: "Society", ability: "int" },
  { id: "stealth", name: "Stealth", ability: "dex" },
  { id: "survival", name: "Survival", ability: "wis" },
  { id: "thievery", name: "Thievery", ability: "dex" },
];

export const PF2E_SKILL_MAP = Object.fromEntries(
  PF2E_SKILLS.map((s) => [s.id, s]),
);

// ---------------------------------------------------------------------------
// Ancestries — Player Core six + Lost Omens / APG breadth
// ---------------------------------------------------------------------------

export const PF2E_ANCESTRIES: Pf2eAncestryDef[] = [
  { id: "human", name: "Human", boosts: ["dex", "con"], hp: 8, size: "Medium", speed: 25, traits: ["Humanoid", "Human"], languages: ["Common"], feats: ["human-natural-ambition", "human-general-training", "human-cooperative-nature"], blurb: "Versatile and adaptive, humans thrive anywhere." },
  { id: "elf", name: "Elf", boosts: ["dex", "int"], hp: 6, size: "Medium", speed: 30, traits: ["Humanoid", "Elf"], languages: ["Common", "Elvish"], feats: ["elf-nimble", "elf-lore", "elf-otherworldly-magic"], blurb: "Ageless, graceful and attuned to magic." },
  { id: "dwarf", name: "Dwarf", boosts: ["con", "wis"], hp: 10, size: "Medium", speed: 20, traits: ["Humanoid", "Dwarf"], languages: ["Common", "Dwarven"], feats: ["dwarf-lore", "dwarf-rock-runner", "dwarf-forge-blessed"], blurb: "Stout, stubborn, and carved from stone." },
  { id: "goblin", name: "Goblin", boosts: ["dex", "cha"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Goblin"], languages: ["Common", "Goblin"], feats: ["goblin-lore", "goblin-burn-it", "goblin-very-sneaky"], blurb: "Chaotic fire-lovers with a talent for trouble." },
  { id: "halfling", name: "Halfling", boosts: ["dex", "wis"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Halfling"], languages: ["Common", "Halfling"], feats: ["halfling-lore", "halfling-sure-footed", "halfling-daring-act"], blurb: "Cheerful, lucky folk who keep their heads low." },
  { id: "orc", name: "Orc", boosts: ["str", "con"], hp: 10, size: "Medium", speed: 25, traits: ["Humanoid", "Orc"], languages: ["Common", "Orcish"], feats: ["orc-lore", "orc-ferocity", "orc-tusks"], blurb: "Fierce survivors with an unyielding will." },
  { id: "gnome", name: "Gnome", boosts: ["con", "cha"], hp: 8, size: "Small", speed: 25, traits: ["Humanoid", "Gnome", "Fey"], languages: ["Common", "Gnomish", "Sylvan"], feats: ["gnome-lore", "gnome-animal-accomplice", "gnome-fey-influence"], blurb: "Bright-eyed fey-touched tinkerers with endless curiosity." },
  { id: "kobold", name: "Kobold", boosts: ["dex", "cha"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Kobold"], languages: ["Common", "Draconic"], feats: ["kobold-lore", "kobold-cave-climber", "kobold-crafty"], blurb: "Plucky draconic underdogs with a talent for traps." },
  { id: "catfolk", name: "Catfolk", boosts: ["dex", "cha"], hp: 8, size: "Medium", speed: 25, traits: ["Humanoid", "Catfolk"], languages: ["Common", "Catfolk"], feats: ["catfolk-lore", "catfolk-cats-luck", "catfolk-sharpened-claws"], blurb: "Graceful, curious wanderers with whiskers and claws." },
  { id: "tengu", name: "Tengu", boosts: ["dex", "wis"], hp: 6, size: "Medium", speed: 25, traits: ["Humanoid", "Tengu"], languages: ["Common", "Tengu"], feats: ["tengu-lore", "tengu-long-nosed", "tengu-unerring-eye"], blurb: "Crow-kin scholars with a flair for the dramatic." },
  { id: "iruxi", name: "Lizardfolk (Iruxi)", boosts: ["str", "wis"], hp: 8, size: "Medium", speed: 25, traits: ["Humanoid", "Iruxi"], languages: ["Common", "Iruxi"], feats: ["iruxi-lore", "iruxi-unarmed-cunning", "iruxi-wetlands-walk"], blurb: "Ancient reptilian people in tune with the wilds." },
  { id: "ysoki", name: "Ratfolk (Ysoki)", boosts: ["dex", "int"], hp: 6, size: "Small", speed: 25, traits: ["Humanoid", "Ratfolk"], languages: ["Common", "Ysoki"], feats: ["ysoki-lore", "ysoki-cheek-pouches", "ysoki-junk-tinker"], blurb: "Clever, communal scavengers of the city byways." },
  { id: "leshy", name: "Leshy", boosts: ["con", "wis"], hp: 8, size: "Small", speed: 25, traits: ["Leshy", "Plant"], languages: ["Common", "Sylvan"], feats: ["leshy-lore", "leshy-plant-empathy", "leshy-verdant-burst"], blurb: "Awakened plants grown from a primal seed of life." },
  { id: "android", name: "Android", boosts: ["cha", "int"], hp: 8, size: "Medium", speed: 25, traits: ["Humanoid", "Android"], languages: ["Common", "Androffan"], feats: ["android-lore", "android-constructed-heart", "android-nanite-surge"], blurb: "Constructed synthetic lifeforms with an artificial soul." },
  { id: "aasimar", name: "Aasimar", boosts: ["cha", "wis"], hp: 6, size: "Medium", speed: 25, traits: ["Humanoid", "Aasimar"], languages: ["Common", "Celestial"], feats: ["aasimar-lore", "aasimar-halo", "aasimar-celestial-eye"], blurb: "Mortal scions touched by celestial radiance." },
  { id: "tiefling", name: "Tiefling", boosts: ["cha", "int"], hp: 6, size: "Medium", speed: 25, traits: ["Humanoid", "Tiefling"], languages: ["Common", "Infernal"], feats: ["tiefling-lore", "tiefling-pitborn", "tiefling-fiendish-resistance"], blurb: "Planar-touched souls carrying infernal bloodlines." },
  { id: "kitsune", name: "Kitsune", boosts: ["cha", "dex"], hp: 6, size: "Medium", speed: 25, traits: ["Humanoid", "Kitsune"], languages: ["Common", "Sylvan"], feats: ["kitsune-lore", "kitsune-fox-shape", "kitsune-invigorating-breath"], blurb: "Shapeshifting fox spirits of wit and mischief." },
];

export const PF2E_ANCESTRY_MAP = Object.fromEntries(
  PF2E_ANCESTRIES.map((a) => [a.id, a]),
);

export interface Pf2eHeritageDef {
  id: string;
  name: string;
  ancestryId?: string; // undefined = universal heritage
  summary: string;
  feat?: string;
}

export const PF2E_HERITAGES: Pf2eHeritageDef[] = [
  { id: "standard", name: "Standard Heritage", summary: "No special heritage — the pure traits of your ancestry." },
  { id: "versatile", name: "Versatile Heritage", summary: "You gain one 1st-level general feat of your choice.", feat: "General feat" },
  // Human
  { id: "skilled-human", name: "Skilled Heritage", ancestryId: "human", summary: "You gain training in one additional skill of your choice.", feat: "Additional trained skill" },
  { id: "wintertouched-human", name: "Wintertouched Human", ancestryId: "human", summary: "Cold resistance 5 and training in Survival.", feat: "Cold resistance" },
  { id: "double-heart", name: "Double-Hearted", ancestryId: "human", summary: "Extraordinary endurance: you gain 8 additional Hit Points.", feat: "+8 HP" },
  // Elf
  { id: "cavern-elf", name: "Cavern Elf", ancestryId: "elf", summary: "Darkvision and a sensitivity to sunlight." },
  { id: "woodland-elf", name: "Woodland Elf", ancestryId: "elf", summary: "Stealth in forests and the ability to hide in brush.", feat: "Nature-adapted" },
  { id: "seer-elf", name: "Seer Elf", ancestryId: "elf", summary: "You can glimpse strands of fate — cast augury-like insight." },
  // Dwarf
  { id: "forge-dwarf", name: "Forge Dwarf", ancestryId: "dwarf", summary: "Fire resistance and expertise in crafting and metalwork.", feat: "Fire resistance" },
  { id: "rock-dwarf", name: "Rock Dwarf", ancestryId: "dwarf", summary: "Stonecunning and darkvision from a life under the mountain." },
  { id: "strong-blood-dwarf", name: "Strong-Blooded Dwarf", ancestryId: "dwarf", summary: "+2 to saving throws against poison and disease." },
  // Goblin
  { id: "razor-goblin", name: "Razor-Tooth Goblin", ancestryId: "goblin", summary: "A biting jaw attack — deal 1d6 piercing damage." },
  { id: "snow-goblin", name: "Snow Goblin", ancestryId: "goblin", summary: "Cold resistance, sure footing on ice and snow stealth." },
  { id: "tail-whisker-goblin", name: "Tail and Whisker Goblin", ancestryId: "goblin", summary: "Exaggerated ears and tail — +1 to Stealth and Perception." },
  // Halfling
  { id: "twilight-halfling", name: "Twilight Halfling", ancestryId: "halfling", summary: "See in the dark like a twilight cat — low-light vision." },
  { id: "nomadic-halfling", name: "Nomadic Halfling", ancestryId: "halfling", summary: "Acclimatize to the weather of any region." },
  { id: "jumpy-halfling", name: "Jumpy Halfling", ancestryId: "halfling", summary: "Startling reactions: you are never flat-footed while conscious." },
  // Orc
  { id: "badlands-orc", name: "Badlands Orc", ancestryId: "orc", summary: "Heat resistance and survival training for the wastes." },
  { id: "winter-orc", name: "Winter Orc", ancestryId: "orc", summary: "Cold resistance and unshakeable tundra instincts." },
  { id: "hold-scarred-orc", name: "Hold-Scarred Orc", ancestryId: "orc", summary: "Scars of old battles — +2 Hit Points per level." },
  // Gnome
  { id: "umbral-gnome", name: "Umbral Gnome", ancestryId: "gnome", summary: "Darkvision and a natural affinity for the shadows." },
  { id: "sensate-gnome", name: "Sensate Gnome", ancestryId: "gnome", summary: "Keen senses: precise scent and +1 to Perception." },
  { id: "wellspring-gnome", name: "Wellspring Gnome", ancestryId: "gnome", summary: "Bursting with fey magic — one innate cantrip." },
  // Kobold
  { id: "cavern-kobold", name: "Cavern Kobold", ancestryId: "kobold", summary: "Darkvision and a burrower's instinct." },
  { id: "jungle-kobold", name: "Jungle Kobold", ancestryId: "kobold", summary: "A climbing speed among vines and ruins." },
  { id: "spellscale-kobold", name: "Spellscale Kobold", ancestryId: "kobold", summary: "Innate draconic magic — one cantrip." },
  // Catfolk
  { id: "clawed-catfolk", name: "Clawed Catfolk", ancestryId: "catfolk", summary: "Retractable claws — a 1d4 slashing unarmed attack." },
  { id: "liminal-catfolk", name: "Liminal Catfolk", ancestryId: "catfolk", summary: "You can perceive the borders between worlds." },
  { id: "mountain-catfolk", name: "Mountain Catfolk", ancestryId: "catfolk", summary: "Sure-footed climbers with a climb speed." },
  // Tengu
  { id: "sky-tengu", name: "Sky Tengu", ancestryId: "tengu", summary: "You can glide — falling never deals damage." },
  { id: "forest-tengu", name: "Forest Tengu", ancestryId: "tengu", summary: "At home in the canopy — +1 to Perception." },
  { id: "storm-tengu", name: "Storm Tengu", ancestryId: "tengu", summary: "Electricity resistance from storm-kin blood." },
  // Lizardfolk
  { id: "frilled-lizardfolk", name: "Frilled Lizardfolk", ancestryId: "iruxi", summary: "An intimidating frill — bonus to Intimidation." },
  { id: "woodland-lizardfolk", name: "Woodland Lizardfolk", ancestryId: "iruxi", summary: "Climb speed and camouflage in green places." },
  { id: "wetland-lizardfolk", name: "Wetland Lizardfolk", ancestryId: "iruxi", summary: "A swim speed and amphibious breathing." },
  // Ratfolk
  { id: "deep-rat", name: "Deep Rat", ancestryId: "ysoki", summary: "Darkvision for the deepest tunnels." },
  { id: "sewer-rat", name: "Sewer Rat", ancestryId: "ysoki", summary: "Disease resistance and an iron stomach." },
  { id: "snow-rat", name: "Snow Rat", ancestryId: "ysoki", summary: "Cold resistance and sure footing on ice." },
  // Leshy
  { id: "fungus-leshy", name: "Fungus Leshy", ancestryId: "leshy", summary: "Poison resistance and darkvision in decay." },
  { id: "leaf-leshy", name: "Leaf Leshy", ancestryId: "leshy", summary: "Photosynthesize — you can go longer without food." },
  { id: "vine-leshy", name: "Vine Leshy", ancestryId: "leshy", summary: "Grasping vines — +1 to Athletics checks." },
  // Android
  { id: "artisan-android", name: "Artisan Android", ancestryId: "android", summary: "Precision-calibrated hands — +1 to Crafting." },
  { id: "laborer-android", name: "Laborer Android", ancestryId: "android", summary: "Heavy-duty chassis — +1 to Athletics." },
  { id: "warrior-android", name: "Warrior Android", ancestryId: "android", summary: "Combat protocols — +1 to attack rolls with simple weapons." },
  // Aasimar
  { id: "lawbringer-aasimar", name: "Lawbringer Aasimar", ancestryId: "aasimar", summary: "Radiant energy — +1 to Diplomacy and Intimidation." },
  { id: "redeemer-aasimar", name: "Redeemer Aasimar", ancestryId: "aasimar", summary: "Healing hands — treat wounds with +1 on Medicine." },
  // Tiefling
  { id: "hellspawn-tiefling", name: "Hellspawn Tiefling", ancestryId: "tiefling", summary: "Fiendish heritage — fire resistance 5." },
  { id: "beastbrood-tiefling", name: "Beastbrood Tiefling", ancestryId: "tiefling", summary: "Bestial traits — a claw or horn unarmed attack." },
  { id: "grimspawn-tiefling", name: "Grimspawn Tiefling", ancestryId: "tiefling", summary: "Dark energy — +1 to Intimidation and Occultism." },
  // Kitsune
  { id: "celestial-kitsune", name: "Celestial Kitsune", ancestryId: "kitsune", summary: "Radiant fox spirit — +1 to Diplomacy." },
  { id: "dark-kitsune", name: "Dark Kitsune", ancestryId: "kitsune", summary: "Shadow-kissed — darkvision and +1 to Stealth." },
];

export const PF2E_HERITAGE_MAP = Object.fromEntries(
  PF2E_HERITAGES.map((h) => [h.id, h]),
);

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

export const PF2E_BACKGROUNDS: Pf2eBackgroundDef[] = [
  { id: "acolyte", name: "Acolyte", boosts: ["wis", "int"], skills: ["religion"], feature: "You know the rites and hierarchies of your faith." },
  { id: "criminal", name: "Criminal", boosts: ["dex", "int"], skills: ["stealth", "thievery"], feature: "You have contacts in the underworld." },
  { id: "sage", name: "Scholar", boosts: ["int", "wis"], skills: ["arcana", "occultism"], feature: "You can recall a dizzying breadth of lore." },
  { id: "soldier", name: "Soldier", boosts: ["str", "con"], skills: ["athletics", "intimidation"], feature: "You know how to fight, march and survive." },
  { id: "farmhand", name: "Farmhand", boosts: ["str", "con"], skills: ["athletics", "nature"], feature: "Hardened by honest work under open skies." },
  { id: "urchin", name: "Urchin", boosts: ["dex", "cha"], skills: ["stealth", "society"], feature: "You know the secret corners of every city." },
  { id: "herbalist", name: "Herbalist", boosts: ["wis", "con"], skills: ["nature", "medicine"], feature: "You can identify and brew useful plants." },
  { id: "hunter", name: "Hunter", boosts: ["dex", "wis"], skills: ["survival", "stealth"], feature: "You track prey across any terrain." },
  { id: "artisan", name: "Artisan", boosts: ["int", "dex"], skills: ["crafting", "society"], feature: "You have a guild's training in a trade." },
  { id: "performer", name: "Performer", boosts: ["cha", "dex"], skills: ["performance", "acrobatics"], feature: "You command the attention of any room." },
  { id: "noble", name: "Noble", boosts: ["cha", "int"], skills: ["society", "diplomacy"], feature: "Titles and manners open doors." },
  { id: "traveler", name: "Traveler", boosts: ["cha", "wis"], skills: ["diplomacy", "survival"], feature: "You have walked a hundred roads and made a hundred friends." },
];

export const PF2E_BACKGROUND_MAP = Object.fromEntries(
  PF2E_BACKGROUNDS.map((b) => [b.id, b]),
);

// ---------------------------------------------------------------------------
// Feats — ancestry (level 1), general, and skill
// ---------------------------------------------------------------------------

export const PF2E_FEATS: Pf2eFeatDef[] = [
  // ---- Ancestry feats ----
  { id: "human-natural-ambition", name: "Natural Ambition", kind: "ancestry", level: 1, traits: ["Human"], ancestryId: "human", summary: "Gain a 1st-level class feat of your choice." },
  { id: "human-general-training", name: "General Training", kind: "ancestry", level: 1, traits: ["Human"], ancestryId: "human", summary: "Gain a 1st-level general feat of your choice." },
  { id: "human-cooperative-nature", name: "Cooperative Nature", kind: "ancestry", level: 1, traits: ["Human"], ancestryId: "human", summary: "You gain a +4 circumstance bonus to Aid checks." },
  { id: "elf-nimble", name: "Nimble Elf", kind: "ancestry", level: 1, traits: ["Elf"], ancestryId: "elf", summary: "Your Speed increases by 5 feet." },
  { id: "elf-lore", name: "Elven Lore", kind: "ancestry", level: 1, traits: ["Elf"], ancestryId: "elf", summary: "Trained in Arcana and Nature, and expert in recalling elven history." },
  { id: "elf-otherworldly-magic", name: "Otherworldly Magic", kind: "ancestry", level: 1, traits: ["Elf"], ancestryId: "elf", summary: "Gain a cantrip from the arcane or primal spell list." },
  { id: "dwarf-lore", name: "Dwarven Lore", kind: "ancestry", level: 1, traits: ["Dwarf"], ancestryId: "dwarf", summary: "Trained in Crafting, plus expertise recalling dwarven stonework and engineering." },
  { id: "dwarf-rock-runner", name: "Rock Runner", kind: "ancestry", level: 1, traits: ["Dwarf"], ancestryId: "dwarf", summary: "Ignore difficult terrain in rocky environments." },
  { id: "dwarf-forge-blessed", name: "Forge-Blessed", kind: "ancestry", level: 1, traits: ["Dwarf"], ancestryId: "dwarf", summary: "Fire resistance 5 and +1 to Crafting." },
  { id: "goblin-lore", name: "Goblin Lore", kind: "ancestry", level: 1, traits: ["Goblin"], ancestryId: "goblin", summary: "Trained in Stealth and Thievery, plus goblin engineering lore." },
  { id: "goblin-burn-it", name: "Burn It!", kind: "ancestry", level: 1, traits: ["Goblin"], ancestryId: "goblin", summary: "You deal 1 extra fire damage with fire spells and alchemical fire." },
  { id: "goblin-very-sneaky", name: "Very Sneaky", kind: "ancestry", level: 1, traits: ["Goblin"], ancestryId: "goblin", summary: "Your Stealth is less hindered by moving quickly." },
  { id: "halfling-lore", name: "Halfling Lore", kind: "ancestry", level: 1, traits: ["Halfling"], ancestryId: "halfling", summary: "Trained in Acrobatics, plus halfling history and lore." },
  { id: "halfling-sure-footed", name: "Sure-Footed", kind: "ancestry", level: 1, traits: ["Halfling"], ancestryId: "halfling", summary: "You are not flat-footed on uneven ground or when Balancing." },
  { id: "halfling-daring-act", name: "Daring Act", kind: "ancestry", level: 1, traits: ["Halfling"], ancestryId: "halfling", summary: "One action: Tumble Through a creature of any size; on a success you gain panache." },
  { id: "orc-lore", name: "Orc Lore", kind: "ancestry", level: 1, traits: ["Orc"], ancestryId: "orc", summary: "Trained in Intimidation, plus orc history and war traditions." },
  { id: "orc-ferocity", name: "Orc Ferocity", kind: "ancestry", level: 1, traits: ["Orc"], ancestryId: "orc", summary: "When reduced to 0 HP, stay at 1 HP instead (once per day)." },
  { id: "orc-tusks", name: "Tusks", kind: "ancestry", level: 1, traits: ["Orc"], ancestryId: "orc", summary: "Your tusks are a 1d6 piercing unarmed attack." },
  { id: "gnome-lore", name: "Gnome Lore", kind: "ancestry", level: 1, traits: ["Gnome"], ancestryId: "gnome", summary: "Trained in Arcana and Occultism, plus gnomish fey lore." },
  { id: "gnome-animal-accomplice", name: "Animal Accomplice", kind: "ancestry", level: 1, traits: ["Gnome"], ancestryId: "gnome", summary: "You gain a tiny animal companion you share empathy with." },
  { id: "gnome-fey-influence", name: "Fey Influence", kind: "ancestry", level: 1, traits: ["Gnome"], ancestryId: "gnome", summary: "Fey magic tints you — gain an innate cantrip." },
  { id: "kobold-lore", name: "Kobold Lore", kind: "ancestry", level: 1, traits: ["Kobold"], ancestryId: "kobold", summary: "Trained in Crafting and Thievery, plus trap lore." },
  { id: "kobold-cave-climber", name: "Cave Climber", kind: "ancestry", level: 1, traits: ["Kobold"], ancestryId: "kobold", summary: "You gain a climb Speed of 10 feet in natural terrain." },
  { id: "kobold-crafty", name: "Crafty", kind: "ancestry", level: 1, traits: ["Kobold"], ancestryId: "kobold", summary: "You can use raw materials to make basic temporary gear." },
  { id: "catfolk-lore", name: "Cat Lore", kind: "ancestry", level: 1, traits: ["Catfolk"], ancestryId: "catfolk", summary: "Trained in Acrobatics and Performance, plus catfolk traditions." },
  { id: "catfolk-cats-luck", name: "Cat's Luck", kind: "ancestry", level: 1, traits: ["Catfolk"], ancestryId: "catfolk", summary: "Once per day, reroll a failed Reflex save." },
  { id: "catfolk-sharpened-claws", name: "Sharpened Claws", kind: "ancestry", level: 1, traits: ["Catfolk"], ancestryId: "catfolk", summary: "Your claws deal 1d6 slashing and ignore 2 points of resistance." },
  { id: "tengu-lore", name: "Tengu Lore", kind: "ancestry", level: 1, traits: ["Tengu"], ancestryId: "tengu", summary: "Trained in Society, plus tengu history and bird-lore." },
  { id: "tengu-long-nosed", name: "Long-Nosed Form", kind: "ancestry", level: 1, traits: ["Tengu"], ancestryId: "tengu", summary: "A long beak grants +2 to checks to Recall Knowledge with taste." },
  { id: "tengu-unerring-eye", name: "Unerring Eye", kind: "ancestry", level: 1, traits: ["Tengu"], ancestryId: "tengu", summary: "A bonus to Perception checks to detect illusions and hidden objects." },
  { id: "iruxi-lore", name: "Iruxi Lore", kind: "ancestry", level: 1, traits: ["Lizardfolk"], ancestryId: "iruxi", summary: "Trained in Nature and Survival, plus iruxi history." },
  { id: "iruxi-unarmed-cunning", name: "Iruxi Unarmed Cunning", kind: "ancestry", level: 1, traits: ["Lizardfolk"], ancestryId: "iruxi", summary: "Your unarmed attacks gain the finesse trait." },
  { id: "iruxi-wetlands-walk", name: "Wetlands Walk", kind: "ancestry", level: 1, traits: ["Lizardfolk"], ancestryId: "iruxi", summary: "Ignore difficult terrain caused by mud, sand or water." },
  { id: "ysoki-lore", name: "Ysoki Lore", kind: "ancestry", level: 1, traits: ["Ratfolk"], ancestryId: "ysoki", summary: "Trained in Crafting and Society, plus ysoki scavenger lore." },
  { id: "ysoki-cheek-pouches", name: "Cheek Pouches", kind: "ancestry", level: 1, traits: ["Ratfolk"], ancestryId: "ysoki", summary: "You can store up to 4 items of negligible bulk in your cheeks." },
  { id: "ysoki-junk-tinker", name: "Junk Tinker", kind: "ancestry", level: 1, traits: ["Ratfolk"], ancestryId: "ysoki", summary: "Craft temporary items from scrap and debris." },
  { id: "leshy-lore", name: "Leshy Lore", kind: "ancestry", level: 1, traits: ["Leshy"], ancestryId: "leshy", summary: "Trained in Nature, plus knowledge of plants and natural places." },
  { id: "leshy-plant-empathy", name: "Plant Empathy", kind: "ancestry", level: 1, traits: ["Leshy"], ancestryId: "leshy", summary: "You can communicate simple concepts with plants." },
  { id: "leshy-verdant-burst", name: "Verdant Burst", kind: "ancestry", level: 1, traits: ["Leshy"], ancestryId: "leshy", summary: "When you die, you burst into a brief burst of plants." },
  { id: "android-lore", name: "Android Lore", kind: "ancestry", level: 1, traits: ["Android"], ancestryId: "android", summary: "Trained in Crafting, plus knowledge of technology and Androffa." },
  { id: "android-constructed-heart", name: "Constructed Heart", kind: "ancestry", level: 1, traits: ["Android"], ancestryId: "android", summary: "You heal from repairs — Medicine checks treat your wounds with +1." },
  { id: "android-nanite-surge", name: "Nanite Surge", kind: "ancestry", level: 1, traits: ["Android"], ancestryId: "android", summary: "Once per day, reroll a failed skill check as nanites aid you." },
  { id: "aasimar-lore", name: "Aasimar Lore", kind: "ancestry", level: 1, traits: ["Aasimar"], ancestryId: "aasimar", summary: "Trained in Religion, plus celestial history and heavens lore." },
  { id: "aasimar-halo", name: "Halo", kind: "ancestry", level: 1, traits: ["Aasimar"], ancestryId: "aasimar", summary: "A halo of light sheds 10 feet of bright light." },
  { id: "aasimar-celestial-eye", name: "Celestial Eye", kind: "ancestry", level: 1, traits: ["Aasimar"], ancestryId: "aasimar", summary: "Your eyes pierce deception — +1 to Perception against lies." },
  { id: "tiefling-lore", name: "Tiefling Lore", kind: "ancestry", level: 1, traits: ["Tiefling"], ancestryId: "tiefling", summary: "Trained in Society, plus infernal planes lore." },
  { id: "tiefling-pitborn", name: "Pitborn", kind: "ancestry", level: 1, traits: ["Tiefling"], ancestryId: "tiefling", summary: "Devil-touched — +1 to Diplomacy and Religion checks." },
  { id: "tiefling-fiendish-resistance", name: "Fiendish Resistance", kind: "ancestry", level: 1, traits: ["Tiefling"], ancestryId: "tiefling", summary: "You gain resistance 5 to fire and negative energy." },
  { id: "kitsune-lore", name: "Kitsune Lore", kind: "ancestry", level: 1, traits: ["Kitsune"], ancestryId: "kitsune", summary: "Trained in Deception and Society, plus kitsune folklore." },
  { id: "kitsune-fox-shape", name: "Fox Shape", kind: "ancestry", level: 1, traits: ["Kitsune"], ancestryId: "kitsune", summary: "You can transform into a small fox (one action, unlimited)." },
  { id: "kitsune-invigorating-breath", name: "Invigorating Breath", kind: "ancestry", level: 1, traits: ["Kitsune"], ancestryId: "kitsune", summary: "One action: heal yourself for 1d8 Hit Points (once per hour)." },

  // ---- General feats ----
  { id: "fleet", name: "Fleet", kind: "general", level: 1, traits: ["General"], summary: "Your Speed increases by 5 feet." },
  { id: "toughness", name: "Toughness", kind: "general", level: 1, traits: ["General"], summary: "Increase your maximum HP by your level; recover from dying more easily." },
  { id: "diehard", name: "Diehard", kind: "general", level: 1, traits: ["General"], summary: "You die at 4 HP below 0 instead of 3, and don't die until fully lost." },
  { id: "canny-acumen", name: "Canny Acumen", kind: "general", level: 1, traits: ["General"], summary: "Increase proficiency in one saving throw or Perception to trained." },
  { id: "incredible-initiative", name: "Incredible Initiative", kind: "general", level: 1, traits: ["General"], summary: "You gain a +2 circumstance bonus to initiative rolls." },
  { id: "hefty-hauler", name: "Hefty Hauler", kind: "general", level: 1, traits: ["General"], summary: "Your carrying capacity increases by 2 Bulk." },
  { id: "fast-recovery", name: "Fast Recovery", kind: "general", level: 1, traits: ["General"], summary: "You recover from persistent damage and diseases faster." },
  { id: "adopted-ancestry", name: "Adopted Ancestry", kind: "general", level: 1, traits: ["General"], summary: "You can take ancestry feats of one other ancestry." },
  { id: "ancestral-paragon", name: "Ancestral Paragon", kind: "general", level: 1, traits: ["General"], summary: "Gain one additional 1st-level ancestry feat." },
  { id: "light-armor-training", name: "Light Armor Training", kind: "general", level: 1, traits: ["General"], summary: "You become trained in light armor." },
  { id: "armor-training", name: "Armor Training", kind: "general", level: 1, traits: ["General"], summary: "You become trained in medium and heavy armor." },
  { id: "unconventional-weaponry", name: "Unconventional Weaponry", kind: "general", level: 1, traits: ["General"], summary: "Gain training with an uncommon weapon of your ancestry." },

  // ---- Skill feats ----
  { id: "assurance", name: "Assurance", kind: "skill", level: 1, traits: ["Skill"], summary: "With one skill, you can forgo the roll and take 10 + your proficiency bonus." },
  { id: "dubious-knowledge", name: "Dubious Knowledge", kind: "skill", level: 1, traits: ["Skill"], summary: "On a failed Recall Knowledge, you learn one true fact and one false one." },
  { id: "experienced-professional", name: "Experienced Professional", kind: "skill", level: 1, traits: ["Skill"], summary: "Earn 3 gp per day with your trained profession skill." },
  { id: "group-coercion", name: "Group Coercion", kind: "skill", level: 1, traits: ["Skill"], summary: "When Coercing, you can affect up to two additional targets." },
  { id: "intimidating-glare", name: "Intimidating Glare", kind: "skill", level: 1, traits: ["Skill"], summary: "Demoralize without needing to speak a shared language." },
  { id: "quick-coercion", name: "Quick Coercion", kind: "skill", level: 1, traits: ["Skill"], summary: "Coerce a creature in only one round of conversation." },
  { id: "read-lips", name: "Read Lips", kind: "skill", level: 1, traits: ["Skill"], summary: "You can read the lips of someone you can see." },
  { id: "survey-wildlife", name: "Survey Wildlife", kind: "skill", level: 1, traits: ["Skill"], summary: "Learn the presence and type of large animals in the area." },
  { id: "titan-wrestler", name: "Titan Wrestler", kind: "skill", level: 1, traits: ["Skill"], summary: "Grapple, Trip or Shove creatures up to two sizes larger than you." },
  { id: "subtle-theft", name: "Subtle Theft", kind: "skill", level: 1, traits: ["Skill"], summary: "When stealing, observers take a −2 penalty to Perception." },
  { id: "steady-balance", name: "Steady Balance", kind: "skill", level: 1, traits: ["Skill"], summary: "You are not flat-footed while Balancing or on uneven ground." },
  { id: "battle-medicine", name: "Battle Medicine", kind: "skill", level: 1, traits: ["Skill"], summary: "One action: Treat Wounds on a creature, once per day per creature." },
];

export const PF2E_FEAT_MAP = Object.fromEntries(PF2E_FEATS.map((f) => [f.id, f]));

// ---------------------------------------------------------------------------
// Classes — Player Core twelve
// ---------------------------------------------------------------------------

export const PF2E_CLASSES: Pf2eClassDef[] = [
  { id: "fighter", name: "Fighter", keyAbility: "str", hp: 10, perLevel: 6, trainedSkills: ["athletics", "intimidation"], blurb: "Weapon experts unmatched in martial skill.", startingItems: ["Longsword", "Chain shirt", "Steel shield", "Adventurer's pack"] },
  { id: "rogue", name: "Rogue", keyAbility: "dex", hp: 8, perLevel: 4, trainedSkills: ["acrobatics", "stealth", "thievery", "society"], blurb: "Skirmishers who strike where it hurts.", startingItems: ["Shortsword", "Dagger", "Leather armor", "Thieves' tools", "Adventurer's pack"] },
  { id: "wizard", name: "Wizard", keyAbility: "int", hp: 6, perLevel: 4, trainedSkills: ["arcana", "occultism", "society"], blurb: "Scholars of the arcane arts.", startingItems: ["Quarterstaff", "Spellbook", "Arcane focus", "Adventurer's pack"] },
  { id: "cleric", name: "Cleric", keyAbility: "wis", hp: 8, perLevel: 4, trainedSkills: ["religion", "medicine", "society"], blurb: "Divine spellcasters of faith.", startingItems: ["Mace", "Chain shirt", "Steel shield", "Religious symbol", "Healer's tools", "Adventurer's pack"] },
  { id: "ranger", name: "Ranger", keyAbility: "dex", hp: 10, perLevel: 6, trainedSkills: ["athletics", "nature", "survival", "stealth"], blurb: "Hunters who master terrain and prey.", startingItems: ["Longbow", "Arrows (20)", "Hatchet", "Leather armor", "Adventurer's pack"] },
  { id: "bard", name: "Bard", keyAbility: "cha", hp: 8, perLevel: 4, trainedSkills: ["performance", "diplomacy", "occultism", "society"], blurb: "Performers who weave magic into song.", startingItems: ["Shortsword", "Leather armor", "Musical instrument (lute)", "Adventurer's pack"] },
  { id: "monk", name: "Monk", keyAbility: "dex", hp: 10, perLevel: 6, trainedSkills: ["acrobatics", "athletics", "stealth"], blurb: "Masters of unarmed combat and ki.", startingItems: ["Bo staff", "Adventurer's pack"] },
  { id: "alchemist", name: "Alchemist", keyAbility: "int", hp: 8, perLevel: 4, trainedSkills: ["crafting", "medicine", "nature", "occultism"], blurb: "Scientists of explosives and elixirs.", startingItems: ["Alchemist's kit", "Leather armor", "Lesser alchemist's fire (2)", "Adventurer's pack"] },
  { id: "barbarian", name: "Barbarian", keyAbility: "str", hp: 12, perLevel: 6, trainedSkills: ["athletics", "intimidation", "nature", "survival"], blurb: "Rage-driven warriors.", startingItems: ["Greataxe", "Hide armor", "Adventurer's pack"] },
  { id: "sorcerer", name: "Sorcerer", keyAbility: "cha", hp: 6, perLevel: 4, trainedSkills: ["arcana", "diplomacy", "society"], blurb: "Magic in the blood.", startingItems: ["Quarterstaff", "Arcane focus", "Adventurer's pack"] },
  { id: "champion", name: "Champion", keyAbility: "str", hp: 10, perLevel: 6, trainedSkills: ["religion", "athletics", "diplomacy"], blurb: "Holy warriors of a cause.", startingItems: ["Longsword", "Chain mail", "Steel shield", "Religious symbol", "Adventurer's pack"] },
  { id: "druid", name: "Druid", keyAbility: "wis", hp: 8, perLevel: 4, trainedSkills: ["nature", "medicine", "survival", "religion"], blurb: "Guardians of the natural world.", startingItems: ["Sickle", "Leather armor", "Wooden shield", "Druidic focus", "Adventurer's pack"] },
];

export const PF2E_CLASS_MAP = Object.fromEntries(
  PF2E_CLASSES.map((c) => [c.id, c]),
);

// ---------------------------------------------------------------------------
// Armor — with proficiency category, price and Bulk
// ---------------------------------------------------------------------------

export interface Pf2eArmorDef {
  id: string;
  name: string;
  category: "unarmored" | "light" | "medium" | "heavy";
  acBonus: number;
  /** Maximum Dexterity modifier that applies to AC. */
  dexCap?: number;
  /** Price in silver pieces. */
  price: number;
  bulk: string;
  note?: string;
}

export const PF2E_ARMORS: Pf2eArmorDef[] = [
  { id: "none", name: "Unarmored", category: "unarmored", acBonus: 0, price: 0, bulk: "—" },
  { id: "padded", name: "Padded Armor", category: "light", acBonus: 1, dexCap: 5, price: 2, bulk: "L" },
  { id: "leather", name: "Leather Armor", category: "light", acBonus: 1, dexCap: 4, price: 20, bulk: "1", note: "Flexible" },
  { id: "studded", name: "Studded Leather", category: "light", acBonus: 2, dexCap: 3, price: 30, bulk: "1" },
  { id: "chain-shirt", name: "Chain Shirt", category: "light", acBonus: 2, dexCap: 3, price: 50, bulk: "L" },
  { id: "hide", name: "Hide Armor", category: "medium", acBonus: 3, dexCap: 2, price: 20, bulk: "1" },
  { id: "scale", name: "Scale Mail", category: "medium", acBonus: 3, dexCap: 2, price: 40, bulk: "1" },
  { id: "breastplate", name: "Breastplate", category: "medium", acBonus: 4, dexCap: 1, price: 130, bulk: "1" },
  { id: "splint", name: "Splint Mail", category: "heavy", acBonus: 5, dexCap: 1, price: 60, bulk: "2" },
  { id: "chain-mail", name: "Chain Mail", category: "heavy", acBonus: 5, dexCap: 1, price: 60, bulk: "2" },
  { id: "plate", name: "Full Plate", category: "heavy", acBonus: 6, dexCap: 0, price: 300, bulk: "3", note: "Str 18" },
];

export const PF2E_ARMOR_MAP = Object.fromEntries(
  PF2E_ARMORS.map((a) => [a.id, a]),
);

// ---------------------------------------------------------------------------
// Weapons — simple & martial with traits, price and Bulk
// ---------------------------------------------------------------------------

export const PF2E_WEAPONS: Pf2eWeaponDef[] = [
  // Simple
  { id: "dagger", name: "Dagger", category: "simple", hands: 1, damageDice: "1d4", damageType: "P", traits: ["Agile", "Finesse", "Thrown 10 ft"], price: 2, bulk: "L" },
  { id: "club", name: "Club", category: "simple", hands: 1, damageDice: "1d6", damageType: "B", traits: ["Thrown 10 ft"], price: 0, bulk: "1" },
  { id: "staff", name: "Staff", category: "simple", hands: 1, damageDice: "1d4", damageType: "B", traits: ["Two-hand d8"], price: 0, bulk: "1" },
  { id: "spear", name: "Spear", category: "simple", hands: 1, damageDice: "1d6", damageType: "P", traits: ["Thrown 20 ft"], price: 10, bulk: "1" },
  { id: "light-mace", name: "Light Mace", category: "simple", hands: 1, damageDice: "1d4", damageType: "B", traits: ["Agile", "Finesse", "Shove"], price: 40, bulk: "L" },
  { id: "heavy-mace", name: "Heavy Mace", category: "simple", hands: 1, damageDice: "1d6", damageType: "B", traits: ["Shove"], price: 10, bulk: "1" },
  { id: "sickle", name: "Sickle", category: "simple", hands: 1, damageDice: "1d4", damageType: "S", traits: ["Agile", "Finesse", "Trip"], price: 20, bulk: "L" },
  { id: "javelin", name: "Javelin", category: "simple", hands: 1, damageDice: "1d6", damageType: "P", traits: ["Thrown 30 ft"], price: 10, bulk: "L" },
  { id: "sling", name: "Sling", category: "simple", hands: 1, damageDice: "1d6", damageType: "B", traits: ["Propulsive", "Range 50 ft"], price: 0, bulk: "L" },
  { id: "shortbow", name: "Shortbow", category: "simple", hands: 2, damageDice: "1d6", damageType: "P", traits: ["Deadly d10", "Range 60 ft"], price: 30, bulk: "1" },
  { id: "crossbow", name: "Crossbow", category: "simple", hands: 2, damageDice: "1d8", damageType: "P", traits: ["Range 120 ft", "Reload 1"], price: 30, bulk: "1" },
  { id: "quarterstaff", name: "Quarterstaff", category: "simple", hands: 2, damageDice: "1d4", damageType: "B", traits: ["Monk", "Trip", "Two-hand d8"], price: 0, bulk: "1" },
  // Martial
  { id: "shortsword", name: "Shortsword", category: "martial", hands: 1, damageDice: "1d6", damageType: "P", traits: ["Agile", "Finesse", "Versatile S"], price: 90, bulk: "1" },
  { id: "rapier", name: "Rapier", category: "martial", hands: 1, damageDice: "1d6", damageType: "P", traits: ["Deadly d8", "Disarm", "Finesse"], price: 200, bulk: "1" },
  { id: "scimitar", name: "Scimitar", category: "martial", hands: 1, damageDice: "1d6", damageType: "S", traits: ["Finesse", "Sweep"], price: 150, bulk: "1" },
  { id: "longsword", name: "Longsword", category: "martial", hands: 1, damageDice: "1d8", damageType: "S", traits: ["Versatile P"], price: 100, bulk: "1" },
  { id: "warhammer", name: "Warhammer", category: "martial", hands: 1, damageDice: "1d8", damageType: "B", traits: ["Shove"], price: 150, bulk: "1" },
  { id: "greataxe", name: "Greataxe", category: "martial", hands: 2, damageDice: "1d12", damageType: "S", traits: ["Forceful", "Sweep"], price: 200, bulk: "2" },
  { id: "greatsword", name: "Greatsword", category: "martial", hands: 2, damageDice: "1d12", damageType: "S", traits: ["Versatile P"], price: 200, bulk: "2" },
  { id: "halberd", name: "Halberd", category: "martial", hands: 2, damageDice: "1d10", damageType: "P", traits: ["Reach", "Versatile S"], price: 300, bulk: "2" },
  { id: "longbow", name: "Longbow", category: "martial", hands: 2, damageDice: "1d8", damageType: "P", traits: ["Deadly d10", "Range 100 ft", "Volley 30 ft"], price: 600, bulk: "2" },
  { id: "hand-crossbow", name: "Hand Crossbow", category: "martial", hands: 1, damageDice: "1d6", damageType: "P", traits: ["Range 60 ft", "Reload 1"], price: 300, bulk: "L" },
  { id: "light-hammer", name: "Light Hammer", category: "martial", hands: 1, damageDice: "1d6", damageType: "B", traits: ["Agile", "Thrown 20 ft"], price: 30, bulk: "L" },
  { id: "throwing-knife", name: "Throwing Knife", category: "martial", hands: 1, damageDice: "1d4", damageType: "P", traits: ["Agile", "Thrown 10 ft"], price: 30, bulk: "L" },
];

export const PF2E_WEAPON_MAP = Object.fromEntries(
  PF2E_WEAPONS.map((w) => [w.id, w]),
);

// ---------------------------------------------------------------------------
// Adventuring gear — price in silver, Bulk, and what it does
// ---------------------------------------------------------------------------

export const PF2E_GEAR: Pf2eGearDef[] = [
  { id: "adventurers-pack", name: "Adventurer's Pack", category: "adventuring", price: 10, bulk: "1", summary: "Backpack, bedroll, belt pouch, chalk, flint & steel, rope, rations, soap, torches, waterskin." },
  { id: "backpack", name: "Backpack", category: "adventuring", price: 10, bulk: "L", summary: "Carries up to 4 Bulk of gear." },
  { id: "bedroll", name: "Bedroll", category: "adventuring", price: 1, bulk: "L", summary: "A warm place to sleep outdoors." },
  { id: "rations", name: "Rations (1 week)", category: "consumable", price: 4, bulk: "L", summary: "Enough food and water for one week." },
  { id: "waterskin", name: "Waterskin", category: "adventuring", price: 1, bulk: "L", summary: "Holds 1 day of water." },
  { id: "rope", name: "Rope (50 ft)", category: "adventuring", price: 5, bulk: "L", summary: "Hempen rope, 50 feet." },
  { id: "torch", name: "Torch", category: "consumable", price: 1, bulk: "L", summary: "Sheds 20 ft of bright light for 1 hour." },
  { id: "lantern", name: "Hooded Lantern", category: "adventuring", price: 70, bulk: "1", summary: "Sheds 30 ft of bright light; hood adjusts it." },
  { id: "chalk", name: "Chalk (10)", category: "adventuring", price: 1, bulk: "—", summary: "Mark walls and trails." },
  { id: "mirror", name: "Hand Mirror", category: "adventuring", price: 10, bulk: "—", summary: "Peek around corners." },
  { id: "flint-steel", name: "Flint and Steel", category: "adventuring", price: 1, bulk: "—", summary: "Start fires." },
  { id: "tent", name: "Tent", category: "adventuring", price: 20, bulk: "1", summary: "Shelter for one person." },
  { id: "crowbar", name: "Crowbar", category: "tool", price: 5, bulk: "L", summary: "+2 to Force Open checks." },
  { id: "grappling-hook", name: "Grappling Hook", category: "tool", price: 1, bulk: "L", summary: "Anchor a rope." },
  { id: "pitons", name: "Pitons (10)", category: "tool", price: 1, bulk: "L", summary: "Spikes for climbing." },
  { id: "hammer", name: "Hammer", category: "tool", price: 1, bulk: "L", summary: "Drive pitons and break things." },
  { id: "compass", name: "Compass", category: "tool", price: 10, bulk: "—", summary: "Never lose your bearings." },
  { id: "healers-tools", name: "Healer's Tools", category: "tool", price: 50, bulk: "1", summary: "Required to Treat Wounds." },
  { id: "thieves-tools", name: "Thieves' Tools", category: "tool", price: 30, bulk: "L", summary: "Required to Pick Locks." },
  { id: "alchemists-lab", name: "Alchemist's Lab", category: "tool", price: 50, bulk: "2", summary: "Required for alchemical crafting." },
  { id: "artisans-tools", name: "Artisan's Tools", category: "tool", price: 40, bulk: "1", summary: "Required to Craft with a trade." },
  { id: "musical-instrument", name: "Musical Instrument", category: "tool", price: 80, bulk: "1", summary: "Perform with your chosen instrument." },
  { id: "religious-symbol", name: "Religious Symbol", category: "tool", price: 1, bulk: "—", summary: "Focus for divine spells." },
  { id: "druidic-focus", name: "Druidic Focus", category: "tool", price: 10, bulk: "L", summary: "Focus for primal spells." },
  { id: "spellbook", name: "Spellbook", category: "adventuring", price: 10, bulk: "1", summary: "A wizard's spellbook." },
  { id: "component-pouch", name: "Spell Component Pouch", category: "tool", price: 5, bulk: "L", summary: "Material components for spells." },
  { id: "manacles", name: "Manacles", category: "adventuring", price: 30, bulk: "—", summary: "Restrain captives." },
  { id: "signal-whistle", name: "Signal Whistle", category: "adventuring", price: 1, bulk: "—", summary: "Audible for a mile." },
  { id: "soap", name: "Soap", category: "adventuring", price: 1, bulk: "—", summary: "Stay clean on the road." },
  { id: "whetstone", name: "Whetstone", category: "tool", price: 1, bulk: "—", summary: "Sharpen a weapon over 10 minutes." },
];

export const PF2E_GEAR_MAP = Object.fromEntries(PF2E_GEAR.map((g) => [g.id, g]));
