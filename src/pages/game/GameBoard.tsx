import { toast } from "sonner";
import {
  getDndDerived,
  getGurpsDerived,
  getPf2eDerived,
  applyConditions,
} from "@/lib/rpg/character";
import { CONDITIONS, CONDITION_MAP } from "@/lib/rpg/data/conditions";
import { CLASS_MAP } from "@/lib/rpg/data/dnd";
import { SPELL_MAP } from "@/lib/rpg/data/spells";
import { GURPS_SKILL_MAP } from "@/lib/rpg/data/gurps";
import { PF2E_CLASS_MAP } from "@/lib/rpg/data/pf2e";
import {
  buildDiceResult,
  d as rollDie,
  formatMod,
  gurpsThrust,
  parseDice,
  pf2eOutcome,
  pfTierBonus,
  resolve3d6,
  resolveD20Check,
  rollDice,
  sum,
} from "@/lib/rpg/dice";
import {
  exportAdventureJSON,
  importAdventureJSON,
  loadAdventure,
  loadAdsSettings,
  loadGmSettings,
  loadLorebook,
  saveAdventure,
  saveAdsSettings,
  saveGmSettings,
  saveLorebook,
  saveToLibrary,
} from "@/lib/rpg/storage";
import { generateOpening } from "@/lib/rpg/gm/local";
import { useGmClient } from "@/lib/rpg/gm/live";
import {
  shouldSummarize,
  summarizeConversation,
} from "@/lib/rpg/gm/providers";
import { compileLorebook } from "@/lib/rpg/lorebook";
import { playDiceRoll } from "@/lib/rpg/sfx";
import { speak, speakDice, useA11yApplied } from "@/lib/rpg/a11y";
import { detectSkillCheck } from "@/lib/rpg/skillDetect";
import type {
  AdventureState,
  AdsSettings,
  Character,
  DiceResult,
  DnDCharacter,
  EnemyState,
  FeatureDef,
  GameSystem,
  GmLanguage,
  GmSettings,
  GmTurn,
  GurpsCharacter,
  InventoryItem,
  LogEntry,
  LorebookEntry,
  Pf2eCharacter,
  PendingBonus,
  RollModifierLine,
} from "@/lib/rpg/types";
import {
  ABILITY_LABELS,
  adventureScene,
  campaignBriefing,
  EMPTY_WALLET,
  prefsOf,
  uid,
} from "@/lib/rpg/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdSlot from "./AdSlot";
import CharacterPanel, { type PanelActions } from "./panels/CharacterPanel";
import CommandCenter from "./center/CommandCenter";
import NarrativeHub from "./center/NarrativeHub";
import TopBar from "./TopBar";
import type { RollRequest } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const COND_EFFECTS = Object.fromEntries(CONDITIONS.map((cd) => [cd.id, cd.effects]));
interface Props {
  character: Character;
  initialAdventure?: AdventureState | null; // resume a specific saved session
  onNewCharacter: () => void;
  onSignOut: () => void;
  onBackToHub?: () => void; // leave the game and return to the hub (adventures/characters/settings)
}

function xpNeededFor(level: number, system: GameSystem): number {
  return system === "pf2e" ? 1000 : level * 300;
}

function charLevel(ch: Character): number {
  return ch.system === "gurps" ? 1 : ch.level;
}

function createAdventure(
  character: Character,
  language: GmLanguage = "en",
  settings?: GmSettings,
): AdventureState {
  const system = character.system;
  // Open the campaign according to the player's Adventure Setup choices.
  const scene = adventureScene(prefsOf(character.adventurePrefs));
  // New players start with the free AI wired in: the default provider is AI
  // Horde (no key, unlimited), so Live mode works out of the box and the
  // opening scene is AI-written. Any provider failure falls back to the
  // offline narrator automatically.
  const liveByDefault = settings?.provider === "horde";
  const adventure: AdventureState = {
    id: uid(),
    system,
    character,
    logs: [],
    diceLog: [],
    sceneTitle: scene.title,
    location: scene.location,
    quest: [scene.quest],
    enemies: [],
    companions: [],
    gmMode: liveByDefault ? "live" : "local",
    aiIntroPending: true,
    xp: 0,
    // Seed class starting wealth + equipment chosen in the wizard. The wallet
    // is the mechanical purse (gp/sp/cp) the shop spends from; gold is the
    // story-facing campaign number.
    gold:
      "startingGold" in character
        ? ((character as { startingGold?: number }).startingGold ?? 0)
        : 0,
    wallet: {
      gp:
        "startingGold" in character
          ? ((character as { startingGold?: number }).startingGold ?? 0)
          : 0,
      sp: 0,
      cp: 0,
    },
    inventory:
      "startingInventory" in character
        ? ((character as { startingInventory?: InventoryItem[] }).startingInventory ?? [])
        : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const opening = generateOpening(adventure, language);
  adventure.logs.push({
    id: uid(),
    kind: "gm",
    text: opening,
    timestamp: Date.now(),
  });
  // The player's Adventure Setup directives, echoed so the campaign brief is
  // always visible at the top of the narrative hub.
  adventure.logs.push({
    id: uid(),
    kind: "system",
    text: `Campaign briefing — ${campaignBriefing(prefsOf(character.adventurePrefs))}`,
    timestamp: Date.now(),
  });
  adventure.logs.push({
    id: uid(),
    kind: "system",
    text: "Your character sheet is live — click any ability, save or skill to roll it. Describe actions below.",
    timestamp: Date.now(),
  });
  adventure.logs.push({
    id: uid(),
    kind: "system",
    text: adventure.gmMode === "live"
      ? "GM mode: Live AI — AI Horde (free, no key, community GPUs). Switch to Local or pick another provider in the AI menu anytime."
      : "GM mode: Local narrator (offline). Switch to Live AI in the AI menu — a free model is preconfigured.",
    timestamp: Date.now(),
  });
  return adventure;
}

const ENEMY_TABLES: Record<string, EnemyState[]> = {
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

function randomEnemy(system: AdventureState["system"]): EnemyState {
  const table = ENEMY_TABLES[system];
  const e = table[Math.floor(Math.random() * table.length)];
  return { ...e, id: `${e.id}-${uid().slice(0, 4)}` };
}

function fingerprint(c: Character): string {
  if (c.system === "dnd5e") {
    return `dnd5e:${c.name}:${c.raceId}:${c.classId}:${c.subclassId}:${c.level}`;
  }
  if (c.system === "pf2e") {
    return `pf2e:${c.name}:${c.ancestryId}:${c.classId}`;
  }
  return `gurps:${c.name}:${JSON.stringify(c.attributes)}`;
}

export default function GameBoard({
  character,
  initialAdventure,
  onNewCharacter,
  onSignOut,
  onBackToHub,
}: Props) {
  // Applies high-contrast / large-text mode and keeps it synced with the OS
  // (auto mode) and the TopBar dialog while the board is mounted.
  useA11yApplied();
  const [settings, setSettings] = useState<GmSettings>(() => loadGmSettings());
  const [ads, setAds] = useState<AdsSettings>(() => loadAdsSettings());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lorebook, setLorebook] = useState<LorebookEntry[]>(() =>
    loadLorebook(fingerprint(character)),
  );
  const [adventure, setAdventure] = useState<AdventureState>(() => {
    if (initialAdventure) {
      return fingerprint(initialAdventure.character) === fingerprint(character)
        ? initialAdventure
        : createAdventure(character, settings.language, settings);
    }
    const saved = loadAdventure();
    if (saved && fingerprint(saved.character) === fingerprint(character)) {
      // Old saves predate the mechanical wallet — backfill it from the story
      // gold so the shop keeps working after an update.
      if (!saved.wallet) {
        saved.wallet = { gp: saved.gold ?? 0, sp: 0, cp: 0 };
      }
      return saved;
    }
    return createAdventure(character, settings.language, settings);
  });
  const [gmBusy, setGmBusy] = useState(false);
  // The DC preference is the only manual roll preference — persist it so a
  // player's choice survives reloads (clamped to the same 5–30 range the UI uses).
  const [rollPrefs, setRollPrefs] = useState<{ dc: number }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("oraculum.rollprefs") ?? "null") as { dc?: unknown } | null;
      const dc = typeof saved?.dc === "number" ? saved.dc : NaN;
      return { dc: Number.isFinite(dc) && dc >= 5 && dc <= 30 ? dc : 13 };
    } catch {
      return { dc: 13 };
    }
  });
  const [featurePicker, setFeaturePicker] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const gm = useGmClient(settings);
  const adventureRef = useRef(adventure);
  const settingsRef = useRef(settings);
  const loreRef = useRef(lorebook);
  // Keep refs in sync after every render — event handlers read them, so refs
  // must never be touched during render (React Compiler rule).
  useEffect(() => {
    adventureRef.current = adventure;
    settingsRef.current = settings;
    loreRef.current = lorebook;
  });

  const system = adventure.system;
  const c = adventure.character as Character;

  useEffect(() => {
    saveAdventure(adventure);
  }, [adventure]);

  useEffect(() => {
    saveGmSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveAdsSettings(ads);
  }, [ads]);

  useEffect(() => {
    saveLorebook(fingerprint(c), lorebook);
  }, [c, lorebook]);

  const derived = useMemo(() => {
    if (c.system === "dnd5e") return getDndDerived(c as DnDCharacter);
    if (c.system === "pf2e") return getPf2eDerived(c as Pf2eCharacter);
    return getGurpsDerived(c as GurpsCharacter);
  }, [c]);

  // -------------------------------------------------------------------------
  // AI opening scene — replaces the template intro with one written by the
  // live GM, grounded in the Adventure Setup choices (streamed token by
  // token). Falls back silently to the local template on any failure.
  // -------------------------------------------------------------------------
  const aiIntroBusy = useRef(false);

  const regenerateOpening = useCallback(
    async (snap: AdventureState): Promise<boolean> => {
      const firstGm = snap.logs.find((l) => l.kind === "gm");
      if (!firstGm) return false;
      try {
        const reply = await gm.streamAiOpening(snap, (acc) => {
          setAdventure((prev) => ({
            ...prev,
            logs: prev.logs.map((l) =>
              l.id === firstGm.id ? { ...l, text: acc } : l,
            ),
            updatedAt: Date.now(),
          }));
        });
        if (!reply.usedFallback && reply.text) {
          speak(reply.text, settingsRef.current.language === "pt-BR" ? "pt-BR" : "en-US");
          setAdventure((prev) => ({
            ...prev,
            logs: prev.logs.map((l) =>
              l.id === firstGm.id ? { ...l, text: reply.text } : l,
            ),
            updatedAt: Date.now(),
          }));
          return true;
        }
      } catch {
        // keep the local template opening
      }
      return false;
    },
    [gm],
  );

  useEffect(() => {
    if (adventure.gmMode !== "live" || !adventure.aiIntroPending || aiIntroBusy.current) {
      return;
    }
    aiIntroBusy.current = true;
    void (async () => {
      try {
        // Only rewrite the intro while the story is still at the very beginning.
        if (adventureRef.current.logs.length > 4) {
          setAdventure((prev) =>
            prev.aiIntroPending ? { ...prev, aiIntroPending: false, updatedAt: Date.now() } : prev,
          );
          return;
        }
        const ok = await regenerateOpening(adventureRef.current);
        if (ok) {
          setAdventure((prev) => ({
            ...prev,
            aiIntroPending: false,
            updatedAt: Date.now(),
          }));
        }
      } finally {
        aiIntroBusy.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adventure.aiIntroPending, adventure.gmMode, adventure.logs.length, regenerateOpening]);

  // -------------------------------------------------------------------------
  // Log helpers
  // -------------------------------------------------------------------------
  const pushLog = useCallback(
    (kind: LogEntry["kind"], text: string, dice?: AdventureState["diceLog"][number]) => {
      // Dice sounds + read-aloud fire at the single choke point every roll
      // flows through (skills, attacks, saves, spells, healing, rerolls) — but
      // never on load, since loading history doesn't call pushLog.
      if (kind === "dice" && dice) {
        playDiceRoll({ outcome: dice.outcome, count: dice.rolls.length });
        const lang = settingsRef.current.language === "pt-BR" ? "pt-BR" : "en-US";
        speakDice(dice, lang);
      }
      setAdventure((prev) => ({
        ...prev,
        logs: [...prev.logs, { id: uid(), kind, text, dice, timestamp: Date.now() }],
        diceLog: dice ? [...prev.diceLog.slice(-19), dice] : prev.diceLog,
        updatedAt: Date.now(),
      }));
    },
    [],
  );

  const updateChar = useCallback((fn: (c: Character) => Character) => {
    setAdventure((prev) => ({ ...prev, character: fn(prev.character), updatedAt: Date.now() }));
  }, []);

  const gmRespond = useCallback(
    async (turn: GmTurn) => {
      setGmBusy(true);
      try {
        const snap = adventureRef.current;
        const recent = snap.logs.slice(-6).map((l) => l.text);
        const lore = compileLorebook(loreRef.current, recent, turn.playerText ?? "");
        const entryId = uid();
        setAdventure((prev) => ({
          ...prev,
          logs: [...prev.logs, { id: entryId, kind: "gm" as const, text: "", timestamp: Date.now() }],
          updatedAt: Date.now(),
        }));
        const reply = await gm.streamRespond(
          { ...turn, lorebook: lore || undefined },
          snap,
          (acc) => {
            setAdventure((prev) => ({
              ...prev,
              logs: prev.logs.map((l) => (l.id === entryId ? { ...l, text: acc } : l)),
              updatedAt: Date.now(),
            }));
          },
        );
        const finalText = reply.text || adventureRef.current.logs.find((l) => l.id === entryId)?.text || "";
        if (finalText) {
          speak(finalText, settingsRef.current.language === "pt-BR" ? "pt-BR" : "en-US");
        }
        setAdventure((prev) => ({
          ...prev,
          logs: prev.logs.map((l) =>
            l.id === entryId ? { ...l, text: finalText } : l,
          ),
          updatedAt: Date.now(),
        }));
        if (reply.usedFallback && snap.gmMode === "live") {
          toast.info(
            settingsRef.current.language === "pt-BR"
              ? "GM ao vivo indisponível — o narrador local assumiu."
              : "Live GM unavailable — switched to the local narrator.",
          );
        }
      } finally {
        setGmBusy(false);
      }
    },
    [gm],
  );

  // Auto-summarization: condense the oldest history into a memory recap
  // once the session grows past the threshold (client-side providers only).
  const summarizeNow = useCallback(
    async (snap: AdventureState) => {
      try {
        const lines = snap.logs
          .filter((l) => l.kind === "gm" || l.kind === "player" || l.kind === "combat")
          .slice(-24)
          .map((l) => l.text)
          .filter(Boolean);
        const summary = await summarizeConversation(settingsRef.current, lines);
        if (summary) {
          setAdventure((prev) => ({ ...prev, memory: summary, updatedAt: Date.now() }));
          pushLog("system", "Session memory updated.");
        }
      } catch {
        // summarization is best-effort — never block play
      }
    },
    [pushLog],
  );

  // -------------------------------------------------------------------------
  // Automatic advantage / disadvantage — derived from context, never toggled.
  // Sources: hero conditions (applyConditions), hero unseen status, and the
  // target enemy's own conditions (prone / restrained / blinded / hidden…).
  // -------------------------------------------------------------------------
  const TARGET_GRANTS_ADV = ["restrained", "blinded", "stunned", "incapacitated", "unconscious", "paralyzed"];

  const targetAttackContext = (
    enemy: EnemyState | null | undefined,
    ranged: boolean,
  ): { advantage: boolean; disadvantage: boolean; advSources: string[]; disSources: string[] } => {
    const advSources: string[] = [];
    const disSources: string[] = [];
    for (const c of enemy?.conditions ?? []) {
      const name = CONDITION_MAP[c]?.name.toLowerCase() ?? c;
      if (c === "prone") {
        if (ranged) disSources.push("ranged attack vs prone target");
        else advSources.push("target is prone (melee)");
      } else if (c === "hidden" || c === "invisible") {
        disSources.push("can't see the target");
      } else if (TARGET_GRANTS_ADV.includes(c)) {
        advSources.push(`target is ${name}`);
      }
    }
    return {
      advantage: advSources.length > 0,
      disadvantage: disSources.length > 0,
      advSources,
      disSources,
    };
  };

  // -------------------------------------------------------------------------
  // Core dice engine entry point
  // -------------------------------------------------------------------------
  function roll(request: RollRequest): DiceResult | undefined {
      const snap = adventureRef.current;
      const system = snap.system;

      // Spellbook cast — dispatched to the curated casting flow.
      if (request.spellId) {
        castSpell(request.spellId);
        return undefined;
      }

      if (system === "dnd5e") {
        const char = snap.character as DnDCharacter;
        const d = getDndDerived(char);
        const ctxKind = request.kind === "attack" ? "attack" : request.kind === "save" ? "save" : "check";
        const cond = applyConditions("dnd5e", char.state.conditions, {
          kind: ctxKind,
          ability: request.ability,
        }, COND_EFFECTS);

        // Advantage / disadvantage is ALWAYS derived from context — there is
        // no manual toggle. Sources: the hero's own conditions (poisoned →
        // disadvantage…), rage / reckless / fighting spirit, unseen-attacker
        // status (hidden / invisible), and the target enemy's state.
        let advantage = cond.advantage;
        let disadvantage = cond.disadvantage;
        const advSources: string[] = [];
        const disSources: string[] = [];
        if (char.state.activeStatus.includes("raging") && request.ability === "str") {
          advantage = true;
          advSources.push("raging");
        }
        if (
          char.state.activeStatus.includes("reckless") ||
          char.state.activeStatus.includes("fighting-spirit")
        ) {
          if (request.kind === "attack") {
            advantage = true;
            advSources.push(char.state.activeStatus.includes("reckless") ? "reckless attack" : "fighting spirit");
          }
        }
        // Unseen attacker — hidden or invisible heroes strike with advantage.
        if (
          request.kind === "attack" &&
          (char.state.conditions.includes("hidden") ||
            char.state.conditions.includes("invisible") ||
            char.state.activeStatus.includes("hidden") ||
            char.state.activeStatus.includes("invisible"))
        ) {
          advantage = true;
          advSources.push("unseen attacker");
        }
        // Target state — a disabled / exposed foe grants advantage; a hidden
        // or prone-at-range foe forces disadvantage.
        if (request.kind === "attack") {
          const atk = d.attacks.find((a) => request.label.startsWith(a.name));
          const ranged = atk ? atk.range != null && atk.range !== "—" : false;
          const tctx = targetAttackContext(firstAliveEnemy(), ranged);
          if (tctx.advantage) {
            advantage = true;
            advSources.push(...tctx.advSources);
          }
          if (tctx.disadvantage) {
            disadvantage = true;
            disSources.push(...tctx.disSources);
          }
        }

        const extra: RollModifierLine[] = [...cond.lines];
        let featureUsed: string | undefined;
        let pending: PendingBonus[] = char.state.pending;

        if (request.usePending !== false && pending.length > 0) {
          for (const pb of pending) {
            if (pb.die) extra.push({ label: pb.label, value: rollDie(pb.die), source: "feature" });
            else if (pb.flat) extra.push({ label: pb.label, value: pb.flat, source: "feature" });
          }
          pending = [];
        }
        if (request.flashOfGenius && request.kind === "save") {
          extra.push({ label: "Flash of Genius", value: d.mods.int, source: "feature" });
          featureUsed = "Flash of Genius";
        }

        const abilityMod = request.ability ? d.mods[request.ability] : 0;
        const bonus = request.proficient ? d.profBonus : 0;
        const res = resolveD20Check({
          dc: request.dc ?? rollPrefs.dc,
          abilityMod,
          bonus,
          advantage,
          disadvantage,
          extra,
          system: "dnd5e",
          autoFail: cond.autoFail,
        });
        const dice = buildDiceResult({
          system: "dnd5e",
          label: request.label,
          kind: request.kind,
          rolls: res.rolls,
          diceNotation: `${advantage || disadvantage ? "2d20 kh" : "1d20"} + ${res.modifiers.reduce((a, l) => a + l.value, 0)}`,
          modifiers: res.modifiers,
          total: res.total,
          target: request.dc ?? rollPrefs.dc,
          outcome: res.outcome,
          critical: res.nat20 || res.nat1,
          advantage,
          disadvantage,
          advSources: advSources.length > 0 ? advSources : undefined,
          disSources: disSources.length > 0 ? disSources : undefined,
          breakdown: res.breakdown,
          featureUsed,
        });

        const charNext: Character = {
          ...char,
          state: {
            ...char.state,
            pending,
            resourceUses:
              featureUsed === "Flash of Genius"
                ? { ...char.state.resourceUses, "flash-of-genius": (char.state.resourceUses["flash-of-genius"] ?? 0) + 1 }
                : char.state.resourceUses,
          },
        };
        setAdventure((prev) => ({
          ...prev,
          character: charNext,
          logs: [...prev.logs, { id: uid(), kind: "dice", text: "", dice, timestamp: Date.now() }],
          diceLog: [...prev.diceLog.slice(-19), dice],
          updatedAt: Date.now(),
        }));
        // Every roll result is handed to the GM automatically — the AI sees the
        // outcome and narrates it (crits included). suppressCritNarrate is set
        // only by the free-text skill detector, which already sends the dice
        // together with the player's words to avoid a double narration.
        if (request.kind === "attack") void attackDamageFlow(dice, charNext);
        else if (!request.suppressCritNarrate) {
          void gmRespond({ dice });
        }
        return dice;
      }

      if (system === "pf2e") {
        const char = snap.character as Pf2eCharacter;
        const d = getPf2eDerived(char);
        const cond = applyConditions("pf2e", char.state.conditions, { kind: "check" }, COND_EFFECTS);
        const rank = request.rank ?? "untrained";
        const tierBonus = pfTierBonus(rank, char.level);
        const extra: RollModifierLine[] = [...cond.lines];
        // PF2e has no advantage mechanic — status penalties from conditions
        // (via applyConditions) are the automatic context here.
        const res = resolveD20Check({
          dc: request.dc ?? rollPrefs.dc,
          abilityMod: request.ability ? d.mods[request.ability] : 0,
          bonus: tierBonus + (request.pf2eBonus ?? 0),
          extra,
          system: "pf2e",
          natAdjust: true,
        });
        const dice = buildDiceResult({
          system: "pf2e",
          label: request.label,
          kind: request.kind,
          rolls: res.rolls,
          diceNotation: `1d20 + ${res.modifiers.reduce((a, l) => a + l.value, 0)}`,
          modifiers: res.modifiers,
          total: res.total,
          target: request.dc ?? rollPrefs.dc,
          outcome: res.outcome,
          critical: res.nat20 || res.nat1,
          breakdown: res.breakdown,
        });
        const consumesAction = request.kind === "attack" || request.kind === "skill" || request.kind === "check";
        setAdventure((prev) => {
          const pfc = prev.character as Pf2eCharacter;
          const next: Character = {
            ...pfc,
            state: { ...pfc.state, actions: Math.max(0, pfc.state.actions - (consumesAction ? 1 : 0)) },
          };
          return {
            ...prev,
            character: next,
            logs: [...prev.logs, { id: uid(), kind: "dice", text: "", dice, timestamp: Date.now() }],
            diceLog: [...prev.diceLog.slice(-19), dice],
            updatedAt: Date.now(),
          };
        });
        if (request.kind === "attack") void attackDamageFlow(dice, char);
        else if (!request.suppressCritNarrate) void gmRespond({ dice });
        return dice;
      }

      // GURPS
      const char = snap.character as GurpsCharacter;
      const cond = applyConditions("gurps", char.state.conditions, { kind: "check" }, COND_EFFECTS);
      const target = Math.max(3, (request.gurpsTarget ?? 10) + cond.flatPenalty);
      const res = resolve3d6(target);
      const dice = buildDiceResult({
        system: "gurps",
        label: request.label,
        kind: request.kind,
        rolls: res.rolls,
        diceNotation: "3d6",
        modifiers: cond.lines,
        total: res.total,
        target,
        outcome: res.outcome,
        margin: res.margin,
        critical: res.outcome === "critical-success" || res.outcome === "critical-failure",
        breakdown: res.breakdown,
      });
      setAdventure((prev) => ({
        ...prev,
        logs: [...prev.logs, { id: uid(), kind: "dice", text: "", dice, timestamp: Date.now() }],
        diceLog: [...prev.diceLog.slice(-19), dice],
        updatedAt: Date.now(),
      }));
      if (request.kind === "attack") void attackDamageFlow(dice, char);
      else if (!request.suppressCritNarrate) void gmRespond({ dice });
      return dice;
  }

  // -------------------------------------------------------------------------
  // Combat: attack → damage → enemy state
  // -------------------------------------------------------------------------
  const firstAliveEnemy = (): EnemyState | null =>
    adventureRef.current.enemies.find((e) => e.hp > 0) ?? null;

  // -------------------------------------------------------------------------
  // Kill rewards — XP (D&D/PF2e) or character points (GURPS), gold and loot.
  // Automatically levels the hero when the XP threshold is crossed.
  // -------------------------------------------------------------------------
  const awardKill = useCallback((enemy: EnemyState) => {
    const snap = adventureRef.current;
    const isGurps = snap.system === "gurps";
    const gained = enemy.xp ?? (snap.system === "dnd5e" ? 50 : snap.system === "pf2e" ? 40 : 1);
    const gold = enemy.gold ?? 0;
    const loot = enemy.loot ?? [];
    setAdventure((prev) => {
      const logs: LogEntry[] = [];
      let character = prev.character;
      let xp = prev.xp ?? 0;
      let goldNext = prev.gold ?? 0;
      let walletNext = prev.wallet ?? EMPTY_WALLET;
      let inventory = prev.inventory ?? [];

      if (isGurps) {
        const cp = Math.max(1, gained);
        const gp = prev.character as GurpsCharacter;
        character = { ...gp, points: { ...gp.points, budget: gp.points.budget + cp } };
        logs.push({
          id: uid(), kind: "system" as const,
          text: `+${cp} character points awarded — added to your budget.`,
          timestamp: Date.now(),
        });
      } else {
        xp += gained;
        let leveled = false;
        let level = charLevel(prev.character);
        while (level < 20 && xp >= xpNeededFor(level, prev.system)) {
          xp -= xpNeededFor(level, prev.system);
          level += 1;
          leveled = true;
        }
        if (leveled) {
          character = { ...(prev.character as DnDCharacter | Pf2eCharacter), level };
          logs.push({
            id: uid(), kind: "system" as const,
            text: `Level up! ${prev.character.name} is now level ${level}.`,
            timestamp: Date.now(),
          });
        }
      }

      goldNext = goldNext + gold;
      walletNext = { ...walletNext, gp: walletNext.gp + gold };
      for (const item of loot) {
        const existing = inventory.find((i) => i.name === item);
        if (existing) {
          inventory = inventory.map((i) =>
            i.id === existing.id ? { ...i, qty: i.qty + 1 } : i,
          );
        } else {
          inventory = [...inventory, { id: uid(), name: item, qty: 1 }];
        }
      }

      const lootText = loot.length > 0 ? ` Loot: ${loot.join(", ")}.` : "";
      logs.push({
        id: uid(), kind: "combat" as const,
        text: `You claim the spoils: ${gold > 0 ? `${gold} gold.` : "nothing of value."}${lootText}${isGurps ? "" : ` (+${gained} XP)`}`,
        timestamp: Date.now(),
      });
      return {
        ...prev,
        character,
        xp,
        gold: goldNext,
        wallet: walletNext,
        inventory,
        logs: [...prev.logs, ...logs],
        updatedAt: Date.now(),
      };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Spellbook casting — consumes a slot (or is free for cantrips), then
  // resolves the spell through the dice engine: attack rolls vs AC, save
  // spells as the target's roll vs your spell save DC, auto-hits and heals.
  // -------------------------------------------------------------------------
  function castSpell(spellId: string) {
      const snap = adventureRef.current;
      if (snap.system !== "dnd5e") return;
      const char = snap.character as DnDCharacter;
      const spell = SPELL_MAP[spellId];
      if (!spell) return;
      const d = getDndDerived(char);
      const spellAbility = d.spellAbility ?? "int";
      const spellMod = d.mods[spellAbility];
      const saveDc = 8 + d.profBonus + spellMod;
      const enemy = snap.enemies.find((e) => e.hp > 0);

      // --- Slot cost (cantrips are free) ---
      if (spell.level > 0) {
        if (char.classId === "warlock" && d.pact) {
          if (char.state.pactUsed >= d.pact.count) {
            toast("No pact magic slots left — rest to recover.");
            return;
          }
          updateChar((ch) =>
            ch.system === "dnd5e"
              ? { ...ch, state: { ...ch.state, pactUsed: ch.state.pactUsed + 1 } }
              : ch,
          );
        } else {
          const slots = d.spellSlots;
          let slotIdx = -1;
          for (let i = spell.level - 1; i < slots.length; i++) {
            if (slots[i] > 0 && (char.state.spellSlotsUsed[i] ?? 0) < slots[i]) {
              slotIdx = i;
              break;
            }
          }
          if (slotIdx === -1) {
            toast("No spell slots of that level (or higher) left — rest to recover.");
            return;
          }
          updateChar((ch) => {
            if (ch.system !== "dnd5e") return ch;
            const used = [...(ch.state.spellSlotsUsed ?? [])];
            used[slotIdx] = (used[slotIdx] ?? 0) + 1;
            return { ...ch, state: { ...ch.state, spellSlotsUsed: used } };
          });
        }
      }

      // --- Heal spells ---
      if (spell.healDice) {
        const p = parseDice(spell.healDice);
        const rolled = rollDice(p.count, p.sides);
        const healed = sum(rolled) + p.flat + Math.max(0, spellMod);
        updateChar((ch) =>
          ch.system === "dnd5e"
            ? { ...ch, state: { ...ch.state, hpDamage: Math.max(0, ch.state.hpDamage - healed) } }
            : ch,
        );
        const dice = buildDiceResult({
          system: "dnd5e",
          label: spell.name,
          kind: "heal",
          rolls: rolled,
          diceNotation: `${p.count}d${p.sides}${p.flat !== 0 ? (p.flat > 0 ? `+${p.flat}` : p.flat) : ""} + ${formatMod(spellMod)}`,
          modifiers: [{ label: ABILITY_LABELS[spellAbility], value: spellMod, source: "ability" }],
          total: healed,
          outcome: "success",
          breakdown: `Healed ${healed} HP`,
        });
        pushLog("dice", "", dice);
        pushLog("system", `You cast ${spell.name} — ${healed} HP restored.`);
        void gmRespond({ playerText: `I cast ${spell.name}.` });
        return;
      }

      // --- Auto-hit spells (e.g. Magic Missile) ---
      if (spell.autoHit) {
        const p = parseDice(spell.damage ?? "1d4+1");
        const rolled = rollDice(p.count, p.sides);
        const total = sum(rolled) + p.flat;
        const dice = buildDiceResult({
          system: "dnd5e",
          label: spell.name,
          kind: "damage",
          rolls: rolled,
          diceNotation: spell.damage ?? "1d4+1",
          modifiers: [],
          total,
          outcome: "success",
          breakdown: `Magic Missile strikes unerringly for ${total} damage`,
        });
        pushLog("dice", "", dice);
        if (enemy) {
          setAdventure((prev) => ({
            ...prev,
            enemies: prev.enemies.map((e) =>
              e.id === enemy.id ? { ...e, hp: Math.max(0, e.hp - total) } : e,
            ),
            updatedAt: Date.now(),
          }));
          const slain = enemy.hp - total <= 0;
          pushLog(
            "combat",
            slain
              ? `${enemy.name} is destroyed by the darts of force.`
              : `${enemy.name} takes ${total} force damage (${Math.max(0, enemy.hp - total)} HP left).`,
          );
          if (slain) awardKill(enemy);
        } else {
          pushLog("combat", `${spell.name} arcs through the air — but there is no enemy in the scene.`);
        }
        void gmRespond({ playerText: `I cast ${spell.name}.` });
        return;
      }

      // --- Attack-roll spells ---
      if (spell.attack) {
        // Same automatic context engine as weapon attacks: unseen attacker
        // and the target's state (spells resolve at range, so a prone foe
        // imposes disadvantage instead of granting melee advantage).
        const heroState = snap.character as DnDCharacter;
        const advSources: string[] = [];
        const disSources: string[] = [];
        let advantage = false;
        let disadvantage = false;
        if (
          heroState.state.conditions.includes("hidden") ||
          heroState.state.conditions.includes("invisible") ||
          heroState.state.activeStatus.includes("hidden") ||
          heroState.state.activeStatus.includes("invisible")
        ) {
          advantage = true;
          advSources.push("unseen attacker");
        }
        const tctx = targetAttackContext(enemy, true);
        if (tctx.advantage) {
          advantage = true;
          advSources.push(...tctx.advSources);
        }
        if (tctx.disadvantage) {
          disadvantage = true;
          disSources.push(...tctx.disSources);
        }
        const targetAC = enemy?.ac ?? rollPrefs.dc;
        const res = resolveD20Check({
          dc: targetAC,
          abilityMod: spellMod,
          bonus: d.profBonus,
          advantage,
          disadvantage,
          system: "dnd5e",
        });
        const dice = buildDiceResult({
          system: "dnd5e",
          label: `${spell.name} (spell attack vs AC ${targetAC})`,
          kind: "attack",
          rolls: res.rolls,
          diceNotation: `${advantage || disadvantage ? "2d20 kh" : "1d20"} + ${spellMod + d.profBonus}`,
          modifiers: [
            { label: "Spell ability", value: spellMod, source: "ability" },
            { label: "Proficiency", value: d.profBonus, source: "proficiency" },
          ],
          total: res.total,
          target: targetAC,
          outcome: res.outcome,
          critical: res.nat20 || res.nat1,
          advantage,
          disadvantage,
          advSources: advSources.length > 0 ? advSources : undefined,
          disSources: disSources.length > 0 ? disSources : undefined,
          breakdown: res.breakdown,
        });
        pushLog("dice", "", dice);
        const hit = res.outcome === "success" || res.outcome === "critical-success";
        if (!enemy) {
          pushLog("combat", `${spell.name} is ready to fly — but there is no enemy in the scene.`);
        } else if (!hit) {
          pushLog("combat", `${spell.name} misses ${enemy.name}.`);
        } else {
          const p = parseDice(spell.damage ?? "1d8");
          const count = res.nat20 ? p.count * 2 : p.count;
          const rolled = rollDice(count, p.sides);
          const total = sum(rolled) + p.flat;
          const dmgDice = buildDiceResult({
            system: "dnd5e",
            label: `${spell.name} — damage`,
            kind: "damage",
            rolls: rolled,
            diceNotation: `${count}d${p.sides}${p.flat !== 0 ? (p.flat > 0 ? `+${p.flat}` : p.flat) : ""}`,
            modifiers: [],
            total,
            outcome: "success",
            breakdown: `${spell.name} deals ${total} damage`,
          });
          pushLog("dice", "", dmgDice);
          setAdventure((prev) => ({
            ...prev,
            enemies: prev.enemies.map((e) =>
              e.id === enemy.id ? { ...e, hp: Math.max(0, e.hp - total) } : e,
            ),
            updatedAt: Date.now(),
          }));
          const slain = enemy.hp - total <= 0;
          pushLog(
            "combat",
            slain
              ? `${enemy.name} falls to your ${spell.name}.`
              : `${enemy.name} takes ${total} damage (${Math.max(0, enemy.hp - total)} HP left).`,
          );
          if (slain) awardKill(enemy);
        }
        void gmRespond({ playerText: `I cast ${spell.name}.` });
        return;
      }

      // --- Save spells: the target rolls against your spell save DC ---
      const res = resolveD20Check({
        dc: saveDc,
        abilityMod: 0,
        bonus: 0,
        system: "dnd5e",
      });
      const dice = buildDiceResult({
        system: "dnd5e",
        label: `${spell.name} (${ABILITY_LABELS[spell.save ?? "dex"]} save DC ${saveDc})`,
        kind: "save",
        rolls: res.rolls,
        diceNotation: "1d20 (target's save)",
        modifiers: [],
        total: res.total,
        target: saveDc,
        outcome: res.outcome,
        critical: res.nat20 || res.nat1,
        breakdown: res.breakdown,
      });
      pushLog("dice", "", dice);
      const saved = res.outcome === "success" || res.outcome === "critical-success";
      if (!enemy) {
        pushLog("combat", `You cast ${spell.name} — the magic settles, but there is no enemy in the scene.`);
      } else {
        const p = parseDice(spell.damage ?? "2d6");
        const rolled = rollDice(p.count, p.sides);
        const raw = sum(rolled) + p.flat;
        const total = saved ? Math.max(1, Math.floor(raw / 2)) : raw;
        const dmgDice = buildDiceResult({
          system: "dnd5e",
          label: `${spell.name} — damage`,
          kind: "damage",
          rolls: rolled,
          diceNotation: `${p.count}d${p.sides}${p.flat !== 0 ? (p.flat > 0 ? `+${p.flat}` : p.flat) : ""}${saved ? " (halved)" : ""}`,
          modifiers: [],
          total,
          outcome: "success",
          breakdown: saved
            ? `${spell.name} deals half damage (${total}) on a successful save`
            : `${spell.name} deals full damage (${total})`,
        });
        pushLog("dice", "", dmgDice);
        setAdventure((prev) => ({
          ...prev,
          enemies: prev.enemies.map((e) =>
            e.id === enemy.id ? { ...e, hp: Math.max(0, e.hp - total) } : e,
          ),
          updatedAt: Date.now(),
        }));
        const slain = enemy.hp - total <= 0;
        pushLog(
          "combat",
          saved
            ? `${enemy.name} braces against the magic and takes only ${total} damage.`
            : slain
              ? `${enemy.name} is consumed by your ${spell.name}.`
              : `${enemy.name} takes ${total} damage (${Math.max(0, enemy.hp - total)} HP left).`,
        );
        if (slain) awardKill(enemy);
      }
      void gmRespond({ playerText: `I cast ${spell.name}.` });
  }

  async function attackDamageFlow(attackDice: AdventureState["diceLog"][number], char: Character) {
    const enemy = firstAliveEnemy();
    const hit = attackDice.outcome === "success" || attackDice.outcome === "critical-success";
    if (!enemy) {
      pushLog("combat", "There is no enemy in the scene. Use “New Encounter” to set one up — or the GM will, if you press on.");
      if (adventureRef.current.gmMode === "live") void gmRespond({ action: "attack" });
      return;
    }
    if (!hit) {
      pushLog("combat", `Your attack misses ${enemy.name} (AC ${enemy.ac}). The creature holds its ground.`);
      void gmRespond({ dice: attackDice });
      return;
    }

    // damage roll
    let damageTotal = 0;
    const rolls: number[] = [];
    const labels: string[] = [];
    if (system === "dnd5e") {
      const dnd = char as DnDCharacter;
      const d = getDndDerived(dnd);
      const attack =
        d.attacks.find((a) => attackDice.label.startsWith(a.name)) ?? d.attacks[0];
      const count = attack.count;
      const dmgRolls = rollDice(count, attack.sides);
      const bonus = d.mods[attack.ability];
      rolls.push(...dmgRolls);
      labels.push(`${count}d${attack.sides}`);
      damageTotal = sum(dmgRolls) + Math.max(0, bonus);
      // extra damage dice (smite, fury, artillerist…)
      const extraDmg = d.features.find((f) => f.hook?.kind === "extraDamage" && f.hook.die > 0 && f.level <= dnd.level);
      if (extraDmg) {
        const e = rollDice(1, (extraDmg.hook as { die: number }).die);
        rolls.push(...e);
        labels.push(`1d${(extraDmg.hook as { die: number }).die} (${extraDmg.name})`);
        damageTotal += sum(e);
      }
      // sneak attack when advantage
      if (dnd.classId === "rogue" && attackDice.advantage) {
        const sneak = Math.ceil(dnd.level / 2);
        const s = rollDice(sneak, 6);
        rolls.push(...s);
        labels.push(`${sneak}d6 (Sneak Attack)`);
        damageTotal += sum(s);
      }
      // pending damage bonuses
      for (const pb of dnd.state.damagePending) {
        if (pb.die) {
          const e = rollDice(1, pb.die);
          rolls.push(...e);
          labels.push(`1d${pb.die} (${pb.label})`);
          damageTotal += sum(e);
        }
      }
    } else if (system === "pf2e") {
      const pf = char as Pf2eCharacter;
      const klass = PF2E_CLASS_MAP[pf.classId];
      const r = rollDice(1, 8);
      rolls.push(...r);
      labels.push("1d8");
      damageTotal = sum(r) + Math.max(0, getPf2eDerived(pf).mods[klass.keyAbility]);
    } else {
      const gp = char as GurpsCharacter;
      const st = gp.attributes.st;
      // GURPS thrust damage table — rolls the correct dice for high ST
      const thr = gurpsThrust(st);
      const r = rollDice(parseDice(thr.notation).count, 6);
      rolls.push(...r);
      labels.push(thr.notation);
      damageTotal = Math.max(1, sum(r) + thr.flat);
    }

    const dmgDice = buildDiceResult({
      system,
      label: `${attackDice.label} — Damage`,
      kind: "damage",
      rolls,
      diceNotation: labels.join(" + "),
      modifiers: [],
      total: damageTotal,
      outcome: "success",
      breakdown: `${labels.join(" + ")} = ${damageTotal} damage`,
    });

    setAdventure((prev) => {
      const enemies = prev.enemies.map((e) =>
        e.id === enemy.id ? { ...e, hp: Math.max(0, e.hp - damageTotal) } : e,
      );
      return { ...prev, enemies, updatedAt: Date.now() };
    });
    pushLog("dice", "", dmgDice);
    if (enemy.hp - damageTotal <= 0) {
      pushLog("combat", `${enemy.name} is slain. The immediate threat is gone — the scene falls quiet.`);
      awardKill(enemy);
    } else {
      pushLog("combat", `${enemy.name} takes ${damageTotal} damage (${Math.max(0, enemy.hp - damageTotal)} HP left).`);
    }
    void gmRespond({ dice: attackDice });
  }

  // -------------------------------------------------------------------------
  // Companion combat — party members roll through the same rules engine
  // -------------------------------------------------------------------------
  const companionAttack = useCallback(
    (companionId: string) => {
      const snap = adventureRef.current;
      const comp = (snap.companions ?? []).find((cp) => cp.id === companionId);
      if (!comp) return;
      const enemy = snap.enemies.find((e) => e.hp > 0);
      const targetAC = enemy?.ac ?? rollPrefs.dc;

      let dice: DiceResult;
      if (snap.system === "gurps") {
        // GURPS: 3d6 under the companion's combat skill target.
        const target = comp.skillTarget ?? comp.attributes?.dx ?? 10;
        const res = resolve3d6(target);
        dice = buildDiceResult({
          system: "gurps",
          label: `${comp.name} — attack (target ${target})`,
          kind: "attack",
          rolls: res.rolls,
          diceNotation: "3d6",
          modifiers: [],
          total: res.total,
          target,
          outcome: res.outcome,
          margin: res.margin,
          critical:
            res.outcome === "critical-success" || res.outcome === "critical-failure",
          breakdown: res.breakdown,
        });
      } else {
        // D&D 5e / PF2e: 1d20 + attack bonus vs AC (PF2e uses degrees of success).
        const res = resolveD20Check({
          dc: targetAC,
          abilityMod: 0,
          bonus: comp.attackBonus,
          system: snap.system,
        });
        dice = buildDiceResult({
          system: snap.system,
          label: `${comp.name} — attack vs AC ${targetAC}`,
          kind: "attack",
          rolls: res.rolls,
          diceNotation: `1d20 + ${comp.attackBonus}`,
          modifiers: [
            { label: "Attack bonus", value: comp.attackBonus, source: "proficiency" },
          ],
          total: res.total,
          target: targetAC,
          outcome: res.outcome,
          critical: res.nat20 || res.nat1,
          breakdown: res.breakdown,
        });
      }

      setAdventure((prev) => ({
        ...prev,
        logs: [
          ...prev.logs,
          { id: uid(), kind: "dice", text: "", dice, timestamp: Date.now() },
        ],
        diceLog: [...prev.diceLog.slice(-19), dice],
        updatedAt: Date.now(),
      }));

      const hit = dice.outcome === "success" || dice.outcome === "critical-success";
      if (!enemy) {
        pushLog(
          "combat",
          `${comp.name} is ready to strike, but there is no enemy in the scene. Use “New Encounter” to set one up.`,
        );
        return;
      }
      if (!hit) {
        pushLog(
          "combat",
          `${comp.name}'s attack misses ${enemy.name} (AC ${enemy.ac}).`,
        );
        void gmRespond({ dice });
        return;
      }

      // Damage: D&D 5e / PF2e critical hits double the dice; GURPS keeps its table.
      const parsed = parseDice(comp.damage);
      const critDouble = snap.system !== "gurps" && dice.outcome === "critical-success";
      const count = critDouble ? parsed.count * 2 : parsed.count;
      const rolls = rollDice(count, parsed.sides);
      const total = Math.max(1, sum(rolls) + parsed.flat);
      const notation = `${count}d${parsed.sides}${parsed.flat !== 0 ? (parsed.flat > 0 ? `+${parsed.flat}` : parsed.flat) : ""}`;
      const dmgDice = buildDiceResult({
        system: snap.system,
        label: `${comp.name} — damage`,
        kind: "damage",
        rolls,
        diceNotation: notation,
        modifiers: [],
        total,
        outcome: "success",
        breakdown: `${notation} = ${total} damage`,
      });

      setAdventure((prev) => ({
        ...prev,
        enemies: prev.enemies.map((e) =>
          e.id === enemy.id ? { ...e, hp: Math.max(0, e.hp - total) } : e,
        ),
        updatedAt: Date.now(),
      }));
      pushLog("dice", "", dmgDice);
      const slain = enemy.hp - total <= 0;
      pushLog(
        "combat",
        slain
          ? `${comp.name} slays ${enemy.name}.`
          : `${comp.name} hits ${enemy.name} for ${total} damage (${Math.max(0, enemy.hp - total)} HP left).`,
      );
      if (slain) awardKill(enemy);
      void gmRespond({ dice });
    },
    [rollPrefs.dc, pushLog, gmRespond, awardKill],
  );

  // -------------------------------------------------------------------------
  // Player command + quick actions
  // -------------------------------------------------------------------------
  const sendCommand = useCallback(
    (text: string) => {
      pushLog("player", text);
      const snap = adventureRef.current;
      // Skill-intent detection: if the command implies a rules check
      // (investigate, sneak, persuade, climb…), resolve it through the dice
      // engine and hand the outcome to the GM — dice first, narration second.
      const autoCheck = detectSkillCheck(text, snap);
      if (autoCheck) {
        const dice = roll(autoCheck);
        void gmRespond({ playerText: text, dice });
        return;
      }
      const narrative = snap.logs.filter(
        (l) => l.kind === "gm" || l.kind === "player" || l.kind === "combat",
      ).length;
      if (
        snap.gmMode === "live" &&
        settingsRef.current.provider !== "builtin" &&
        shouldSummarize(narrative, !!snap.memory)
      ) {
        void summarizeNow(snap);
      }
      void gmRespond({ playerText: text });
    },
    [pushLog, gmRespond, summarizeNow, roll],
  );

  const shortRest = useCallback(() => {
    const snap = adventureRef.current;
    if (snap.system === "dnd5e") {
      const char = snap.character as DnDCharacter;
      const klass = CLASS_MAP[char.classId];
      const d = getDndDerived(char);
      const resourceUses = { ...char.state.resourceUses };
      for (const r of klass.resources) {
        if (r.rest !== "none") resourceUses[r.id] = 0;
      }
      const pactUsed = char.classId === "warlock" ? 0 : char.state.pactUsed;
      // Roll the class's actual hit die (d6/d8/d10/d12) on a short rest
      const hd = klass.hitDie ?? 10;
      const rolled = rollDie(hd);
      const heal = rolled + d.mods.con;
      const healDice = buildDiceResult({
        system: "dnd5e",
        label: `Short Rest — Hit Die (d${hd})`,
        kind: "heal",
        rolls: [rolled],
        diceNotation: `1d${hd} + ${formatMod(d.mods.con)}`,
        modifiers: [{ label: "Constitution", value: d.mods.con, source: "ability" }],
        total: heal,
        outcome: "success",
        breakdown: `Recovered ${heal} HP`,
      });
      const charNext: Character = {
        ...char,
        state: { ...char.state, resourceUses, pactUsed, hpDamage: Math.max(0, char.state.hpDamage - heal) },
      };
      setAdventure((prev) => ({
        ...prev,
        character: charNext,
        logs: [...prev.logs,
          { id: uid(), kind: "system", text: "Short rest — resources replenished", timestamp: Date.now() },
          { id: uid(), kind: "dice", text: "", dice: healDice, timestamp: Date.now() },
        ],
        diceLog: [...prev.diceLog.slice(-19), healDice],
        updatedAt: Date.now(),
      }));
      void gmRespond({ playerText: "I take a short rest." });
    } else if (snap.system === "pf2e") {
      const heal = rollDice(2, 8);
      const total = sum(heal);
      const healDice = buildDiceResult({
        system: "pf2e", label: "Treat Wounds", kind: "heal", rolls: heal,
        diceNotation: "2d8", modifiers: [], total, outcome: "success",
        breakdown: `Healed ${total} HP`,
      });
      setAdventure((prev) => {
        const pfc = prev.character as Pf2eCharacter;
        const next: Character = {
          ...pfc,
          state: { ...pfc.state, actions: 3, hpDamage: Math.max(0, pfc.state.hpDamage - total) },
        };
        return {
          ...prev,
          character: next,
          logs: [...prev.logs, { id: uid(), kind: "dice", text: "", dice: healDice, timestamp: Date.now() }],
          diceLog: [...prev.diceLog.slice(-19), healDice],
          updatedAt: Date.now(),
        };
      });
      void gmRespond({ playerText: "I refocus and tend to my wounds." });
    } else {
      const char = snap.character as GurpsCharacter;
      const d = getGurpsDerived(char);
      const recover = Math.max(1, Math.floor(d.hpMax / 3));
      const charNext: Character = { ...char, state: { ...char.state, fpDamage: 0, hpDamage: Math.max(0, char.state.hpDamage - recover) } };
      setAdventure((prev) => ({ ...prev, character: charNext, updatedAt: Date.now() }));
      pushLog("system", `Rest: fatigue cleared, ${recover} HP recovered.`);
      void gmRespond({ playerText: "I rest for an hour." });
    }
  }, [gmRespond, pushLog]);

  const longRest = useCallback(() => {
    updateChar((ch) => {
      if (ch.system === "dnd5e") {
        const c2 = ch as DnDCharacter;
        return {
          ...c2,
          state: {
            ...c2.state,
            hpDamage: 0,
            tempHp: 0,
            resourceUses: {},
            spellSlotsUsed: [],
            pactUsed: 0,
            infusionsUsed: 0,
            pending: [],
            damagePending: [],
            activeStatus: [],
          },
        };
      }
      if (ch.system === "pf2e") {
        return { ...ch, state: { ...ch.state, hpDamage: 0, actions: 3 } };
      }
      return { ...ch, state: { ...ch.state, hpDamage: 0, fpDamage: 0 } };
    });
    pushLog("system", "Long rest — fully recovered.");
    void gmRespond({ playerText: "I take a long rest." });
  }, [updateChar, pushLog, gmRespond]);

  // -------------------------------------------------------------------------
  // Campaign: level up, CP reward, fresh scene
  // -------------------------------------------------------------------------
  const levelUp = useCallback(() => {
    const snap = adventureRef.current;
    if (snap.system === "gurps") return;
    const lvl = charLevel(snap.character);
    const needed = xpNeededFor(lvl, snap.system);
    if ((snap.xp ?? 0) < needed || lvl >= 20) return;
    setAdventure((prev) => {
      const ch = prev.character;
      if (ch.system === "gurps") return prev;
      const next: Character = { ...ch, level: ch.level + 1 };
      return {
        ...prev,
        character: next,
        xp: (prev.xp ?? 0) - needed,
        logs: [
          ...prev.logs,
          {
            id: uid(),
            kind: "system",
            text: `Level up! ${next.name} is now level ${next.level}.`,
            timestamp: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const rewardCp = useCallback(() => {
    updateChar((ch) =>
      ch.system === "gurps"
        ? { ...ch, points: { ...ch.points, budget: ch.points.budget + 5 } }
        : ch,
    );
    pushLog("system", "+5 character points awarded — budget increased.");
  }, [updateChar, pushLog]);

  const clearHistory = useCallback(() => {
    setAdventure((prev) => {
      const fresh: AdventureState = {
        ...prev,
        logs: [],
        diceLog: [],
        enemies: [],
        aiIntroPending: true,
        updatedAt: Date.now(),
      };
      const opening = generateOpening(fresh, settingsRef.current.language);
      fresh.logs = [
        { id: uid(), kind: "gm", text: opening, timestamp: Date.now() },
        {
          id: uid(),
          kind: "system",
          text:
            settingsRef.current.language === "pt-BR"
              ? "Nova cena — sua história continua."
              : "Fresh scene — your story continues.",
          timestamp: Date.now(),
        },
      ];
      return fresh;
    });
    toast.success(
      settingsRef.current.language === "pt-BR"
        ? "Nova cena iniciada."
        : "Fresh scene started.",
    );
  }, []);

  const triggerFeature = useCallback(
    (featureId: string) => {
      const snap = adventureRef.current;
      if (snap.system !== "dnd5e") return;
      const char = snap.character as DnDCharacter;
      const d = getDndDerived(char);
      const allFeatures = [...CLASS_MAP[char.classId].features, ...(CLASS_MAP[char.classId].subclasses.find((s) => s.id === char.subclassId)?.features ?? [])];
      const f = allFeatures.find((x) => x.id === featureId);
      if (!f) return;

      const max = f.uses?.(char);
      const used = char.state.resourceUses[f.id] ?? 0;
      if (max !== undefined && used >= max) {
        toast("No uses of this feature left — rest to recover.");
        return;
      }

      const hook = f.hook;
      const nextState = { ...char.state };
      let logText = `You use ${f.name}.`;

      if (hook?.kind === "addDie" || hook?.kind === "addFlat") {
        const pb: PendingBonus = {
          id: uid(),
          label: f.name,
          featureId: f.id,
          die: hook.kind === "addDie" ? hook.die : undefined,
          flat: hook.kind === "addFlat" ? (typeof hook.flat === "function" ? hook.flat(char) : hook.flat) : undefined,
          kind: hook.kind === "addDie" ? "addDie" : "addFlat",
        };
        nextState.pending = [...nextState.pending, pb];
        logText = `${f.name} is ready — your next check gains ${pb.die ? `a d${pb.die}` : `${formatMod(pb.flat ?? 0)}`}.`;
      } else if (hook?.kind === "tempHp") {
        const bonus = hook.ability ? d.mods[hook.ability] : 0;
        const gained = rollDie(hook.die) + Math.max(0, bonus);
        nextState.tempHp += gained;
        logText = `${f.name}: you gain ${gained} temporary HP.`;
      } else if (hook?.kind === "healDie") {
        const count = hook.count ?? 1;
        const healed = sum(rollDice(count, hook.die)) + (hook.ability ? Math.max(0, d.mods[hook.ability]) : 0);
        nextState.hpDamage = Math.max(0, nextState.hpDamage - healed);
        logText = `${f.name}: you recover ${healed} HP.`;
      } else if (hook?.kind === "extraDamage") {
        nextState.damagePending = [...nextState.damagePending, { id: uid(), label: f.name, featureId: f.id, die: hook.die, kind: "addDie" }];
        logText = `${f.name} is ready — your next attack deals +${hook.die > 0 ? `1d${hook.die}` : "bonus"} damage.`;
      } else if (hook?.kind === "status") {
        if (nextState.activeStatus.includes(hook.status)) {
          nextState.activeStatus = nextState.activeStatus.filter((s) => s !== hook.status);
          logText = `${f.name} ends (${hook.status} off).`;
        } else {
          nextState.activeStatus = [...nextState.activeStatus, hook.status];
          logText = `${f.name} — you are now ${hook.status === "raging" ? "raging" : hook.status === "bladesong" ? "in a bladesong" : hook.status === "reckless" ? "attacking recklessly" : "swelled by Giant's Might"}.`;
        }
      } else if (hook?.kind === "advantageOn") {
        nextState.activeStatus = [...nextState.activeStatus.filter((s) => s !== f.id), f.id];
        logText = `${f.name} — your attacks have advantage until the end of the turn.`;
      } else if (hook?.kind === "acBonus") {
        if (nextState.activeStatus.includes("bladesong")) {
          nextState.activeStatus = nextState.activeStatus.filter((s) => s !== "bladesong");
          logText = `${f.name} ends.`;
        } else {
          nextState.activeStatus = [...nextState.activeStatus, "bladesong"];
          logText = `${f.name} — bladesong active (+Int AC, advantage on Dexterity checks).`;
        }
      } else {
        logText = `${f.name}: ${f.summary}`;
      }

      if (max !== undefined) nextState.resourceUses[f.id] = used + 1;
      const charNext: Character = { ...char, state: nextState };
      setAdventure((prev) => ({ ...prev, character: charNext, updatedAt: Date.now() }));
      pushLog("system", logText);
      if (f.rest === "short" || f.rest === "long") {
        // flavor only
      }
      void gmRespond({ playerText: `I use my ${f.name}.` });
    },
    [gmRespond, pushLog],
  );

  const quickAction = useCallback(
    (id: string) => {
      const snap = adventureRef.current;
      switch (id) {
        case "attack": {
          const enemy = snap.enemies.find((e) => e.hp > 0);
          const targetAC = enemy?.ac ?? rollPrefs.dc;
          if (snap.system === "dnd5e") {
            const char = snap.character as DnDCharacter;
            const d = getDndDerived(char);
            const atk = d.attacks[0];
            roll({
              label: `${atk.name} vs AC ${targetAC}`,
              kind: "attack",
              dc: targetAC,
              proficient: true,
              ability: atk.ability,
            });
          } else if (snap.system === "pf2e") {
            const char = snap.character as Pf2eCharacter;
            const klass = PF2E_CLASS_MAP[char.classId];
            roll({ label: `Strike vs AC ${targetAC}`, kind: "attack", dc: targetAC, ability: klass.keyAbility, rank: "trained" });
          } else {
            const char = snap.character as GurpsCharacter;
            const d = getGurpsDerived(char);
            const melee = d.skills
              .filter((s) => GURPS_SKILL_MAP[s.id]?.stat === "dx")
              .sort((a, b) => b.level - a.level)[0];
            roll({
              label: `${melee ? melee.name : "Brawling (default)"} vs defense 9`,
              kind: "attack",
              gurpsTarget: 9,
            });
          }
          break;
        }
        case "perception":
          if (snap.system === "dnd5e") roll({ label: "Wisdom (Perception)", kind: "skill", ability: "wis", skill: "perception", proficient: true });
          else if (snap.system === "gurps") roll({ label: "Perception (IQ)", kind: "check", gurpsTarget: (snap.character as GurpsCharacter).attributes.iq });
          else roll({ label: "Perception", kind: "check", ability: "wis", rank: (snap.character as Pf2eCharacter).perceptionRank });
          break;
        case "short-rest":
        case "refocus":
        case "rest":
          shortRest();
          break;
        case "long-rest":
          longRest();
          break;
        case "class-feature":
          setFeaturePicker(true);
          break;
        case "encounter": {
          const enemy = randomEnemy(snap.system);
          setAdventure((prev) => ({ ...prev, enemies: [...prev.enemies, enemy], updatedAt: Date.now() }));
          pushLog(
            "combat",
            `${enemy.name} appears — AC ${enemy.ac}, ${enemy.hp} HP. Roll attacks from the sheet to engage.`,
          );
          void gmRespond({ action: "encounter" });
          break;
        }
        case "stride":
        case "raise-shield": {
          updateChar((ch) =>
            ch.system === "pf2e"
              ? { ...ch, state: { ...ch.state, actions: Math.max(0, ch.state.actions - 1) } }
              : ch,
          );
          pushLog("system", id === "stride" ? "You Stride (1 action spent)." : "You Raise a Shield (+2 AC until your next turn begins).");
          void gmRespond({ playerText: id === "stride" ? "I stride forward." : "I raise my shield." });
          break;
        }
        case "recall-knowledge":
          roll({ label: "Recall Knowledge", kind: "skill", ability: "int", skill: "arcana", rank: (snap.character as Pf2eCharacter).skillRanks.arcana ?? "untrained" });
          break;
        case "dodge": {
          const char = snap.character as GurpsCharacter;
          const d = getGurpsDerived(char);
          roll({ label: "Dodge", kind: "check", gurpsTarget: d.dodge });
          break;
        }
        case "concentrate": {
          updateChar((ch) =>
            ch.system === "gurps"
              ? { ...ch, state: { ...ch.state, fpDamage: Math.max(0, ch.state.fpDamage - 1) } }
              : ch,
          );
          pushLog("system", "You concentrate, recovering 1 FP.");
          break;
        }
      }
    },
    [roll, shortRest, longRest, pushLog, updateChar, gmRespond, rollPrefs.dc],
  );

  // -------------------------------------------------------------------------
  // Reroll from dice card
  // -------------------------------------------------------------------------
  const rerollDice = useCallback(
    (diceId: string) => {
      const snap = adventureRef.current;
      const entry = snap.logs.find((l) => l.dice?.id === diceId);
      if (!entry?.dice) return;
      const original = entry.dice;
      if (snap.system === "gurps") {
        const res = resolve3d6(original.target ?? 10);
        const dice = buildDiceResult({
          system: "gurps", label: original.label, kind: original.kind, rolls: res.rolls,
          diceNotation: "3d6", modifiers: [], total: res.total, target: original.target,
          outcome: res.outcome, margin: res.margin,
          critical: res.outcome === "critical-success" || res.outcome === "critical-failure",
          breakdown: res.breakdown,
        });
        pushLog("dice", "", dice);
        void gmRespond({ dice });
        return;
      }
      // A reroll preserves the ORIGINAL automatic context — advantage and
      // disadvantage were derived from the situation when the first roll was
      // made, and nothing about the situation changed for a reroll.
      const useAdv = original.advantage === true;
      const useDis = original.disadvantage === true;
      const first = rollDie(20);
      const second = useAdv || useDis ? rollDie(20) : first;
      const kept = useAdv && !useDis ? Math.max(first, second) : useDis && !useAdv ? Math.min(first, second) : first;
      const flat = original.modifiers.reduce((a, l) => a + l.value, 0);
      const total = kept + flat;
      const dc = original.target ?? rollPrefs.dc;
      // PF2e uses the official degree-of-success matrix (a natural 1/20 shifts
      // the degree by exactly one step); D&D 5e is binary with auto-crits.
      const outcome =
        snap.system === "pf2e"
          ? pf2eOutcome(total, dc, kept)
          : kept === 20
            ? "critical-success"
            : kept === 1
              ? "critical-failure"
              : total >= dc
                ? "success"
                : "failure";
      const dice = buildDiceResult({
        system: snap.system,
        label: original.label,
        kind: original.kind,
        // Only include the second die when advantage/disadvantage actually
        // rolled one — a plain reroll must render a single die face.
        rolls: useAdv || useDis ? [first, second] : [first],
        diceNotation: `${useAdv || useDis ? "2d20 kh" : "1d20"} + ${flat}`,
        modifiers: original.modifiers,
        total,
        target: dc,
        outcome,
        critical: kept === 20 || kept === 1,
        advantage: useAdv,
        disadvantage: useDis,
        advSources: original.advSources,
        disSources: original.disSources,
        breakdown: `${kept} + ${flat} = ${total} vs DC ${dc} → ${outcome.replace("-", " ").toUpperCase()}`,
      });
      pushLog("dice", "", dice);
      void gmRespond({ dice });
    },
    [pushLog, gmRespond, rollPrefs.dc],
  );

  // -------------------------------------------------------------------------
  // Condition toggling
  // -------------------------------------------------------------------------
  const toggleCondition = useCallback(
    (id: string) => {
      const def = CONDITIONS.find((cd) => cd.id === id);
      // Read the PRE-toggle state from the ref — updateChar is async, so
      // reading the ref after the update would invert the log message below.
      const wasOn = (adventureRef.current.character as { state: { conditions: string[] } }).state.conditions.includes(id);
      updateChar((ch) => {
        const conditions = ch.state.conditions;
        const next = conditions.includes(id) ? conditions.filter((x) => x !== id) : [...conditions, id];
        if (ch.system === "dnd5e") return { ...ch, state: { ...ch.state, conditions: next } };
        if (ch.system === "pf2e") return { ...ch, state: { ...ch.state, conditions: next } };
        return { ...ch, state: { ...ch.state, conditions: next } };
      });
      if (def) {
        pushLog("system", wasOn ? `${def.name} removed.` : `${def.name} applied — penalties now active in the dice engine.`);
      }
    },
    [updateChar, pushLog],
  );


  // Toggle a condition on the current foe — feeds the automatic
  // advantage/disadvantage engine (a prone goblin grants melee advantage,
  // a hidden one forces disadvantage, etc.).
  const toggleEnemyCondition = useCallback(
    (id: string) => {
      const snap = adventureRef.current;
      const target = snap.enemies.find((e) => e.hp > 0);
      if (!target) {
        pushLog("system", "No enemy in the scene — use “New Encounter” to set one up first.");
        return;
      }
      const has = (target.conditions ?? []).includes(id);
      const def = CONDITIONS.find((cd) => cd.id === id);
      setAdventure((prev) => ({
        ...prev,
        enemies: prev.enemies.map((e) =>
          e.id === target.id
            ? {
                ...e,
                conditions: has
                  ? (e.conditions ?? []).filter((c) => c !== id)
                  : [...(e.conditions ?? []), id],
              }
            : e,
        ),
        updatedAt: Date.now(),
      }));
      pushLog(
        "system",
        has
          ? `${target.name} is no longer ${def?.name.toLowerCase() ?? id}.`
          : `${target.name} is now ${def?.name.toLowerCase() ?? id} — the dice engine will apply it automatically.`,
      );
    },
    [pushLog],
  );
  // -------------------------------------------------------------------------
  // Panel actions bundle
  // -------------------------------------------------------------------------
  const panelActions: PanelActions = {
    onRoll: roll,
    onUseFeature: triggerFeature,
    onToggleCondition: toggleCondition,
    onDndDamage: (n) =>
      updateChar((ch) =>
        ch.system === "dnd5e"
          ? { ...ch, state: { ...ch.state, hpDamage: ch.state.hpDamage + n } }
          : ch,
      ),
    onDndHeal: (n) =>
      updateChar((ch) =>
        ch.system === "dnd5e"
          ? { ...ch, state: { ...ch.state, hpDamage: Math.max(0, ch.state.hpDamage - n) } }
          : ch,
      ),
    onToggleSpellSlot: (i) =>
      updateChar((ch) => {
        if (ch.system !== "dnd5e") return ch;
        const used = [...(ch.state.spellSlotsUsed ?? [])];
        used[i] = used[i] === 1 ? 0 : 1;
        return { ...ch, state: { ...ch.state, spellSlotsUsed: used } };
      }),
    onTogglePact: () =>
      updateChar((ch) =>
        ch.system === "dnd5e"
          ? { ...ch, state: { ...ch.state, pactUsed: ch.state.pactUsed > 0 ? 0 : 1 } }
          : ch,
      ),
    onToggleInfusion: () =>
      updateChar((ch) =>
        ch.system === "dnd5e"
          ? { ...ch, state: { ...ch.state, infusionsUsed: ch.state.infusionsUsed > 0 ? 0 : 1 } }
          : ch,
      ),
    onUseResource: (id) => {
      const snap = adventureRef.current;
      if (snap.system !== "dnd5e") return;
      const char = snap.character as DnDCharacter;
      const res = CLASS_MAP[char.classId].resources.find((r) => r.id === id);
      const max = res?.max(char) ?? 1;
      const used = char.state.resourceUses[id] ?? 0;
      const nextUsed = used >= max ? 0 : used + 1;
      updateChar((ch) =>
        ch.system === "dnd5e"
          ? { ...ch, state: { ...ch.state, resourceUses: { ...ch.state.resourceUses, [id]: nextUsed } } }
          : ch,
      );
    },
    onSetWeapon: (id) => updateChar((ch) => (ch.system === "dnd5e" ? { ...ch, weaponId: id } : ch)),
    onSetArmor: (id) => updateChar((ch) => (ch.system === "dnd5e" ? { ...ch, armorId: id } : ch)),
    onToggleShield: () => updateChar((ch) => (ch.system === "dnd5e" ? { ...ch, shield: !ch.shield } : ch)),
    onAttack: (attackId) => {
      const snap = adventureRef.current;
      if (snap.system !== "dnd5e") return;
      const d = getDndDerived(snap.character as DnDCharacter);
      const atk = d.attacks.find((a) => a.id === attackId) ?? d.attacks[0];
      const enemy = snap.enemies.find((e) => e.hp > 0);
      roll({ label: `${atk.name} vs AC ${enemy?.ac ?? rollPrefs.dc}`, kind: "attack", dc: enemy?.ac ?? rollPrefs.dc, proficient: true, ability: atk.ability });
    },
    onPfSetSkillRank: (skill, rank) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, skillRanks: { ...ch.skillRanks, [skill]: rank } }
          : ch,
      ),
    onPfSetSaveRank: (ability, rank) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, saveRanks: { ...ch.saveRanks, [ability]: rank } }
          : ch,
      ),
    onPfSetPerceptionRank: (rank) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, perceptionRank: rank }
          : ch,
      ),
    onPfSetArmor: (id) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, armorId: id }
          : ch,
      ),
    onPfSpendAction: (n) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, state: { ...ch.state, actions: Math.max(0, ch.state.actions - n) } }
          : ch,
      ),
    onPfResetActions: () =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, state: { ...ch.state, actions: 3 } }
          : ch,
      ),
    onPfDamage: (n) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, state: { ...ch.state, hpDamage: ch.state.hpDamage + n } }
          : ch,
      ),
    onPfHeal: (n) =>
      updateChar((ch) =>
        ch.system === "pf2e"
          ? { ...ch, state: { ...ch.state, hpDamage: Math.max(0, ch.state.hpDamage - n) } }
          : ch,
      ),
    onGurpsDamage: (n) =>
      updateChar((ch) =>
        ch.system === "gurps"
          ? { ...ch, state: { ...ch.state, hpDamage: ch.state.hpDamage + n } }
          : ch,
      ),
    onGurpsHeal: (n) =>
      updateChar((ch) =>
        ch.system === "gurps"
          ? { ...ch, state: { ...ch.state, hpDamage: Math.max(0, ch.state.hpDamage - n) } }
          : ch,
      ),
    onGurpsFatigue: (n) =>
      updateChar((ch) =>
        ch.system === "gurps"
          ? { ...ch, state: { ...ch.state, fpDamage: ch.state.fpDamage + n } }
          : ch,
      ),
    onGurpsRecover: (n) =>
      updateChar((ch) =>
        ch.system === "gurps"
          ? { ...ch, state: { ...ch.state, fpDamage: Math.max(0, ch.state.fpDamage - n) } }
          : ch,
      ),
  };

  // -------------------------------------------------------------------------
  // Derived display strings
  // -------------------------------------------------------------------------
  const hpText = useMemo(() => {
    if (c.system === "dnd5e") {
      const d = derived as ReturnType<typeof getDndDerived>;
      return `${Math.max(0, d.hpMax - (c as DnDCharacter).state.hpDamage)}/${d.hpMax} HP`;
    }
    if (c.system === "pf2e") {
      const d = derived as ReturnType<typeof getPf2eDerived>;
      return `${Math.max(0, d.hpMax - (c as Pf2eCharacter).state.hpDamage)}/${d.hpMax} HP`;
    }
    const d = derived as ReturnType<typeof getGurpsDerived>;
    return `${Math.max(0, d.hpMax - (c as GurpsCharacter).state.hpDamage)}/${d.hpMax} HP`;
  }, [c, derived]);

  const usableFeatures: FeatureDef[] = useMemo(() => {
    if (system !== "dnd5e") return [];
    const char = c as DnDCharacter;
    const klass = CLASS_MAP[char.classId];
    const subclass = klass.subclasses.find((s) => s.id === char.subclassId);
    return [...klass.features, ...(subclass?.features ?? [])]
      .filter((f) => f.level <= char.level && f.hook && f.hook.kind !== "narrative")
      .filter((f) => {
        if (!f.uses) return true;
        return (char.state.resourceUses[f.id] ?? 0) < f.uses(char);
      });
  }, [system, c]);

  // -------------------------------------------------------------------------
  // Import / export / GM mode
  // -------------------------------------------------------------------------
  const handleImport = (file: File) => {
    importAdventureJSON(file)
      .then((adv) => {
        if (adv.system !== system) throw new Error("Imported file is for a different ruleset");
        if (!adv.wallet) adv.wallet = { gp: adv.gold ?? 0, sp: 0, cp: 0 };
        setAdventure(adv);
        toast.success("Adventure imported.");
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 supports-[height:100dvh]:h-dvh">

    <a
      href="#oracle-main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:border focus:border-amber-500/60 focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-amber-300"
    >
      Skip to game content
    </a>
      <TopBar
        adventure={adventure}
        hpText={hpText}
        settings={settings}
        ads={ads}
        onSettings={setSettings}
        onAds={setAds}
        onOpenSheet={() => setSheetOpen(true)}
        onGmMode={(m) => setAdventure((prev) => ({ ...prev, gmMode: m, updatedAt: Date.now() }))}
        onNewCharacter={onNewCharacter}
        onBackToHub={onBackToHub}
        onExport={() => exportAdventureJSON(adventure)}
        onImport={handleImport}
        onSaveToLibrary={() => {
          setSaveLabel(c.name);
          setSaveDialog(true);
        }}
        onSignOut={onSignOut}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[360px] shrink-0 border-r border-slate-800 lg:block">
          <CharacterPanel
            system={system}
            character={c}
            derived={derived}
            actions={panelActions}
            lorebook={lorebook}
            onLorebookChange={setLorebook}
            inventory={adventure.inventory ?? []}
            onInventoryChange={(items) =>
              setAdventure((prev) => ({
                ...prev,
                inventory: items,
                updatedAt: Date.now(),
              }))
            }
            wallet={adventure.wallet}
            onWalletChange={(wallet) =>
              setAdventure((prev) => ({
                ...prev,
                wallet,
                updatedAt: Date.now(),
              }))
            }
            companions={adventure.companions ?? []}
            onCompanionChange={(items) =>
              setAdventure((prev) => ({
                ...prev,
                companions: items,
                updatedAt: Date.now(),
              }))
            }
            onCompanionAttack={companionAttack}
            gmLanguage={settings.language}
            campaign={{
              sceneTitle: adventure.sceneTitle,
              location: adventure.location,
              quests: adventure.quest,
              xp: adventure.xp ?? 0,
              gold: adventure.gold ?? 0,
              memory: adventure.memory,
              level: charLevel(c),
              maxLevel: system === "gurps" ? charLevel(c) : 20,
              xpNeeded: system === "gurps" ? 0 : xpNeededFor(charLevel(c), system),
              gurpsSpare:
                system === "gurps"
                  ? (c as GurpsCharacter).points.budget -
                    (derived as ReturnType<typeof getGurpsDerived>).pointTotal
                  : undefined,
              onScene: (title, location) =>
                setAdventure((prev) => ({
                  ...prev,
                  sceneTitle: title,
                  location,
                  updatedAt: Date.now(),
                })),
              onAddQuest: (q) =>
                setAdventure((prev) => ({
                  ...prev,
                  quest: [...prev.quest, q],
                  updatedAt: Date.now(),
                })),
              onRemoveQuest: (i) =>
                setAdventure((prev) => ({
                  ...prev,
                  quest: prev.quest.filter((_, j) => j !== i),
                  updatedAt: Date.now(),
                })),
              onAwardXp: (n) =>
                setAdventure((prev) => ({
                  ...prev,
                  xp: (prev.xp ?? 0) + n,
                  updatedAt: Date.now(),
                })),
              onLevelUp: levelUp,
              onGold: (n) =>
                setAdventure((prev) => ({
                  ...prev,
                  gold: Math.max(0, (prev.gold ?? 0) + n),
                  updatedAt: Date.now(),
                })),
              onRewardCp: rewardCp,
              onClearHistory: clearHistory,
            }}
          />
        </aside>
        <main id="oracle-main" className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <NarrativeHub logs={adventure.logs} onReroll={rerollDice} />
            <CommandCenter
              system={system}
              onSend={sendCommand}
              onQuickAction={quickAction}
              onRoll={roll}
              busy={gmBusy}
              rollPrefs={rollPrefs}
              setRollPrefs={(p) => {
                setRollPrefs(p);
                try {
                  localStorage.setItem("oraculum.rollprefs", JSON.stringify(p));
                } catch {
                  /* storage unavailable — in-memory only */
                }
              }}
              pendingCount={
                c.system === "dnd5e" ? (c as DnDCharacter).state.pending.length + (c as DnDCharacter).state.damagePending.length : 0
              }
              enemyConditions={adventure.enemies.find((e) => e.hp > 0)?.conditions ?? []}
              onEnemyConditionToggle={toggleEnemyCondition}
            />
          </div>
          <AdSlot settings={ads} />
        </main>
      </div>

      {/* Feature picker */}
      <Dialog open={featurePicker} onOpenChange={setFeaturePicker}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Use a Class Feature</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {usableFeatures.length === 0 && (
              <p className="text-sm text-slate-500">No features with remaining uses are available right now.</p>
            )}
            {usableFeatures.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  triggerFeature(f.id);
                  setFeaturePicker(false);
                }}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-left transition-colors hover:border-amber-500/50"
              >
                <p className="text-sm font-semibold text-slate-100">
                  {f.name}
                  <span className="ml-2 text-[10px] font-bold uppercase text-slate-500">
                    Lv {f.level} · {f.rest === "short" ? "short rest" : f.rest === "long" ? "long rest" : "—"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{f.summary}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile character sheet drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          className="w-[92vw] max-w-[360px] border-slate-800 bg-slate-950 p-0 sm:w-[360px]"
        >
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3 pr-12">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Character · {c.name}
              </p>
            </div>
            <div className="min-h-0 flex-1">
              <CharacterPanel
                system={system}
                character={c}
                derived={derived}
                actions={panelActions}
                lorebook={lorebook}
                onLorebookChange={setLorebook}
                inventory={adventure.inventory ?? []}
                onInventoryChange={(items) =>
                  setAdventure((prev) => ({
                    ...prev,
                    inventory: items,
                    updatedAt: Date.now(),
                  }))
                }
                wallet={adventure.wallet}
                onWalletChange={(wallet) =>
                  setAdventure((prev) => ({
                    ...prev,
                    wallet,
                    updatedAt: Date.now(),
                  }))
                }
                companions={adventure.companions ?? []}
                onCompanionChange={(items) =>
                  setAdventure((prev) => ({
                    ...prev,
                    companions: items,
                    updatedAt: Date.now(),
                  }))
                }
                onCompanionAttack={companionAttack}
                gmLanguage={settings.language}
                campaign={{
                  sceneTitle: adventure.sceneTitle,
                  location: adventure.location,
                  quests: adventure.quest,
                  xp: adventure.xp ?? 0,
                  gold: adventure.gold ?? 0,
                  memory: adventure.memory,
                  level: charLevel(c),
                  maxLevel: system === "gurps" ? charLevel(c) : 20,
                  xpNeeded: system === "gurps" ? 0 : xpNeededFor(charLevel(c), system),
                  gurpsSpare:
                    system === "gurps"
                      ? (c as GurpsCharacter).points.budget -
                        (derived as ReturnType<typeof getGurpsDerived>).pointTotal
                      : undefined,
                  onScene: (title, location) =>
                    setAdventure((prev) => ({
                      ...prev,
                      sceneTitle: title,
                      location,
                      updatedAt: Date.now(),
                    })),
                  onAddQuest: (q) =>
                    setAdventure((prev) => ({
                      ...prev,
                      quest: [...prev.quest, q],
                      updatedAt: Date.now(),
                    })),
                  onRemoveQuest: (i) =>
                    setAdventure((prev) => ({
                      ...prev,
                      quest: prev.quest.filter((_, j) => j !== i),
                      updatedAt: Date.now(),
                    })),
                  onAwardXp: (n) =>
                    setAdventure((prev) => ({
                      ...prev,
                      xp: (prev.xp ?? 0) + n,
                      updatedAt: Date.now(),
                    })),
                  onLevelUp: levelUp,
                  onGold: (n) =>
                    setAdventure((prev) => ({
                      ...prev,
                      gold: Math.max(0, (prev.gold ?? 0) + n),
                      updatedAt: Date.now(),
                    })),
                  onRewardCp: rewardCp,
                  onClearHistory: clearHistory,
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Save to library */}
      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Save to Character Library</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-slate-400">
              Saved heroes are reusable across adventures and listed on your library screen.
            </p>
            <input
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              aria-label="Library label"
              placeholder="Library label"
              className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
            />
            <button
              type="button"
              onClick={() => {
                saveToLibrary(c, saveLabel);
                toast.success(
                  settings.language === "pt-BR"
                    ? "Herói salvo na biblioteca."
                    : "Character saved to library.",
                );
                setSaveDialog(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              Save hero
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
