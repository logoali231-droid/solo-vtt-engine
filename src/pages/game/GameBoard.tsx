import { toast } from "sonner";
import {
  getDndDerived,
  getGurpsDerived,
  getPf2eDerived,
  applyConditions,
} from "@/lib/rpg/character";
import { CONDITIONS } from "@/lib/rpg/data/conditions";
import { CLASS_MAP } from "@/lib/rpg/data/dnd";
import { GURPS_SKILL_MAP } from "@/lib/rpg/data/gurps";
import { PF2E_CLASS_MAP } from "@/lib/rpg/data/pf2e";
import {
  buildDiceResult,
  d as rollDie,
  formatMod,
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
  saveAdventure,
} from "@/lib/rpg/storage";
import { generateOpening, localRespond } from "@/lib/rpg/gm/local";
import { useGmClient } from "@/lib/rpg/gm/live";
import type {
  AdventureState,
  Character,
  DnDCharacter,
  EnemyState,
  FeatureDef,
  GmTurn,
  GurpsCharacter,
  LogEntry,
  Pf2eCharacter,
  PendingBonus,
  RollModifierLine,
} from "@/lib/rpg/types";
import { uid } from "@/lib/rpg/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CharacterPanel, { type PanelActions } from "./panels/CharacterPanel";
import CommandCenter from "./center/CommandCenter";
import NarrativeHub from "./center/NarrativeHub";
import TopBar from "./TopBar";
import type { RollRequest } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const COND_EFFECTS = Object.fromEntries(CONDITIONS.map((cd) => [cd.id, cd.effects]));

interface Props {
  character: Character;
  onNewCharacter: () => void;
  onSignOut: () => void;
}

function createAdventure(character: Character): AdventureState {
  const system = character.system;
  const adventure: AdventureState = {
    system,
    character,
    logs: [],
    diceLog: [],
    sceneTitle: "The Road Begins",
    location: "The Old Watchtower Road",
    quest: ["Find the sealed door beneath the hills"],
    enemies: [],
    gmMode: "local",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const opening = generateOpening(adventure);
  adventure.logs.push({
    id: uid(),
    kind: "gm",
    text: opening,
    timestamp: Date.now(),
  });
  adventure.logs.push({
    id: uid(),
    kind: "system",
    text: "Your character sheet is live — click any ability, save or skill to roll it. Describe actions below.",
    timestamp: Date.now(),
  });
  return adventure;
}

const ENEMY_TABLES: Record<string, EnemyState[]> = {
  dnd5e: [
    { id: "goblin", name: "Goblin", ac: 15, hp: 7, maxHp: 7, attackBonus: 4, damage: "1d6+2" },
    { id: "bandit", name: "Bandit", ac: 12, hp: 11, maxHp: 11, attackBonus: 3, damage: "1d8+1" },
    { id: "skeleton", name: "Skeleton", ac: 13, hp: 13, maxHp: 13, attackBonus: 4, damage: "1d6+2" },
    { id: "zombie", name: "Zombie", ac: 8, hp: 22, maxHp: 22, attackBonus: 3, damage: "1d6+1" },
    { id: "orc", name: "Orc", ac: 13, hp: 15, maxHp: 15, attackBonus: 5, damage: "1d12+3" },
    { id: "owlbear", name: "Owlbear", ac: 13, hp: 59, maxHp: 59, attackBonus: 7, damage: "1d10+5" },
  ],
  pf2e: [
    { id: "goblin-warrior", name: "Goblin Warrior", ac: 16, hp: 9, maxHp: 9, attackBonus: 6, damage: "1d6" },
    { id: "skeleton-guard", name: "Skeleton Guard", ac: 15, hp: 12, maxHp: 12, attackBonus: 6, damage: "1d6+2" },
    { id: "orc-brute", name: "Orc Brute", ac: 15, hp: 22, maxHp: 22, attackBonus: 8, damage: "1d12+3" },
    { id: "worg", name: "Worg", ac: 14, hp: 26, maxHp: 26, attackBonus: 9, damage: "2d6+4" },
  ],
  gurps: [
    { id: "thug", name: "Thug", ac: 9, hp: 11, maxHp: 11, attackBonus: 11, damage: "1d6" },
    { id: "orc-soldier", name: "Orc Soldier", ac: 9, hp: 13, maxHp: 13, attackBonus: 12, damage: "1d6+2" },
    { id: "guard-lieutenant", name: "Guard Lieutenant", ac: 10, hp: 15, maxHp: 15, attackBonus: 14, damage: "1d6+2" },
  ],
};

function randomEnemy(system: AdventureState["system"]): EnemyState {
  const table = ENEMY_TABLES[system];
  const e = table[Math.floor(Math.random() * table.length)];
  return { ...e, id: `${e.id}-${uid().slice(0, 4)}` };
}

export default function GameBoard({ character, onNewCharacter, onSignOut }: Props) {
  const [adventure, setAdventure] = useState<AdventureState>(() => {
    const saved = loadAdventure();
    if (saved && saved.character.name === character.name && saved.system === character.system) {
      return saved;
    }
    return createAdventure(character);
  });
  const [gmBusy, setGmBusy] = useState(false);
  const [rollPrefs, setRollPrefs] = useState({ adv: false, dis: false, dc: 13 });
  const [featurePicker, setFeaturePicker] = useState(false);
  const gm = useGmClient();
  const adventureRef = useRef(adventure);
  adventureRef.current = adventure;

  const system = adventure.system;
  const c = adventure.character as Character;

  useEffect(() => {
    saveAdventure(adventure);
  }, [adventure]);

  const derived = useMemo(() => {
    if (c.system === "dnd5e") return getDndDerived(c as DnDCharacter);
    if (c.system === "pf2e") return getPf2eDerived(c as Pf2eCharacter);
    return getGurpsDerived(c as GurpsCharacter);
  }, [c]);

  // -------------------------------------------------------------------------
  // Log helpers
  // -------------------------------------------------------------------------
  const pushLog = useCallback(
    (kind: LogEntry["kind"], text: string, dice?: AdventureState["diceLog"][number]) => {
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
        const reply = await gm.respond(turn, adventureRef.current);
        if (reply.text) pushLog("gm", reply.text);
        if (reply.usedFallback && adventureRef.current.gmMode === "live") {
          toast.info("Live GM unavailable — switched to the local narrator.");
        }
      } finally {
        setGmBusy(false);
      }
    },
    [gm, pushLog],
  );

  // -------------------------------------------------------------------------
  // Core dice engine entry point
  // -------------------------------------------------------------------------
  const roll = useCallback(
    (request: RollRequest) => {
      const snap = adventureRef.current;
      const system = snap.system;

      if (system === "dnd5e") {
        const char = snap.character as DnDCharacter;
        const d = getDndDerived(char);
        const ctxKind = request.kind === "attack" ? "attack" : request.kind === "save" ? "save" : "check";
        const cond = applyConditions("dnd5e", char.state.conditions, {
          kind: ctxKind,
          ability: request.ability,
        }, COND_EFFECTS);

        let advantage = rollPrefs.adv || cond.advantage;
        let disadvantage = rollPrefs.dis || cond.disadvantage;
        if (char.state.activeStatus.includes("raging") && request.ability === "str") advantage = true;
        if (
          char.state.activeStatus.includes("reckless") ||
          char.state.activeStatus.includes("fighting-spirit")
        ) {
          if (request.kind === "attack") advantage = true;
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
        if (request.kind === "attack") void attackDamageFlow(dice, charNext);
        else if (res.outcome === "critical-success" || res.outcome === "critical-failure") {
          void gmRespond({ dice });
        }
        return;
      }

      if (system === "pf2e") {
        const char = snap.character as Pf2eCharacter;
        const d = getPf2eDerived(char);
        const cond = applyConditions("pf2e", char.state.conditions, { kind: "check" }, COND_EFFECTS);
        const rank = request.rank ?? "untrained";
        const tierBonus = pfTierBonus(rank, char.level);
        const extra: RollModifierLine[] = [...cond.lines];
        const res = resolveD20Check({
          dc: request.dc ?? rollPrefs.dc,
          abilityMod: request.ability ? d.mods[request.ability] : 0,
          bonus: tierBonus + (request.pf2eBonus ?? 0),
          advantage: rollPrefs.adv,
          disadvantage: rollPrefs.dis,
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
        else if (res.outcome === "critical-success" || res.outcome === "critical-failure") void gmRespond({ dice });
        return;
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
      else if (res.outcome === "critical-success" || res.outcome === "critical-failure") void gmRespond({ dice });
    },
    [rollPrefs, pushLog, gmRespond],
  );

  // -------------------------------------------------------------------------
  // Combat: attack → damage → enemy state
  // -------------------------------------------------------------------------
  const firstAliveEnemy = (): EnemyState | null =>
    adventureRef.current.enemies.find((e) => e.hp > 0) ?? null;

  const attackDamageFlow = async (attackDice: AdventureState["diceLog"][number], char: Character) => {
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
      // thrust damage table (simplified)
      const thr = st <= 9 ? "1d6-2" : st <= 11 ? "1d6-1" : st <= 13 ? "1d6" : st <= 15 ? "1d6+1" : st <= 17 ? "1d6+2" : "2d6-1";
      const flat = thr === "1d6-2" ? -2 : thr === "1d6-1" ? -1 : thr === "1d6+1" ? 1 : thr === "1d6+2" ? 2 : 0;
      const r = rollDice(1, 6);
      rolls.push(...r);
      labels.push(thr);
      damageTotal = Math.max(1, sum(r) + flat);
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
    } else {
      pushLog("combat", `${enemy.name} takes ${damageTotal} damage (${Math.max(0, enemy.hp - damageTotal)} HP left).`);
    }
    void gmRespond({ dice: attackDice });
  };

  // -------------------------------------------------------------------------
  // Player command + quick actions
  // -------------------------------------------------------------------------
  const sendCommand = useCallback(
    (text: string) => {
      pushLog("player", text);
      void gmRespond({ playerText: text });
    },
    [pushLog, gmRespond],
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
      const heal = rollDie(10) + d.mods.con;
      const healDice = buildDiceResult({
        system: "dnd5e",
        label: "Short Rest — Hit Die",
        kind: "heal",
        rolls: [heal],
        diceNotation: `1d10 + ${formatMod(d.mods.con)}`,
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
      const char = snap.character as Pf2eCharacter;
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

  const useFeature = useCallback(
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
    (diceId: string, opts: { advantage?: boolean; disadvantage?: boolean }) => {
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
        return;
      }
      const first = rollDie(20);
      const second = opts.advantage || opts.disadvantage ? rollDie(20) : first;
      const kept = opts.advantage && !opts.disadvantage ? Math.max(first, second) : opts.disadvantage && !opts.advantage ? Math.min(first, second) : first;
      const flat = original.modifiers.reduce((a, l) => a + l.value, 0);
      const total = kept + flat;
      const isP2 = snap.system === "pf2e";
      let outcome = original.outcome;
      if (isP2) {
        const degrees = total - (original.target ?? rollPrefs.dc);
        outcome = kept === 20 ? (degrees >= -9 ? "critical-success" : "success") : kept === 1 ? (degrees <= 9 ? "critical-failure" : "failure") : degrees >= 10 ? "critical-success" : degrees >= 0 ? "success" : degrees >= -10 ? "failure" : "critical-failure";
      } else {
        outcome = kept === 20 ? "critical-success" : kept === 1 ? "critical-failure" : total >= (original.target ?? rollPrefs.dc) ? "success" : "failure";
      }
      const dice = buildDiceResult({
        system: snap.system,
        label: original.label,
        kind: original.kind,
        rolls: [first, second],
        diceNotation: `${opts.advantage || opts.disadvantage ? "2d20 kh" : "1d20"} + ${flat}`,
        modifiers: original.modifiers,
        total,
        target: original.target ?? rollPrefs.dc,
        outcome,
        critical: kept === 20 || kept === 1,
        advantage: opts.advantage,
        disadvantage: opts.disadvantage,
        breakdown: `${kept} + ${flat} = ${total} vs DC ${original.target ?? rollPrefs.dc} → ${outcome.replace("-", " ").toUpperCase()}`,
      });
      pushLog("dice", "", dice);
    },
    [pushLog, rollPrefs.dc],
  );

  // -------------------------------------------------------------------------
  // Condition toggling
  // -------------------------------------------------------------------------
  const toggleCondition = useCallback(
    (id: string) => {
      const def = CONDITIONS.find((cd) => cd.id === id);
      updateChar((ch) => {
        const conditions = ch.state.conditions;
        const next = conditions.includes(id) ? conditions.filter((x) => x !== id) : [...conditions, id];
        if (ch.system === "dnd5e") return { ...ch, state: { ...ch.state, conditions: next } };
        if (ch.system === "pf2e") return { ...ch, state: { ...ch.state, conditions: next } };
        return { ...ch, state: { ...ch.state, conditions: next } };
      });
      if (def) {
        const nowOn = (adventureRef.current.character as { state: { conditions: string[] } }).state.conditions.includes(id);
        pushLog("system", nowOn ? `${def.name} applied — penalties now active in the dice engine.` : `${def.name} removed.`);
      }
    },
    [updateChar, pushLog],
  );

  // -------------------------------------------------------------------------
  // Panel actions bundle
  // -------------------------------------------------------------------------
  const panelActions: PanelActions = {
    onRoll: roll,
    onUseFeature: useFeature,
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
        setAdventure(adv);
        toast.success("Adventure imported.");
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <TopBar
        adventure={adventure}
        hpText={hpText}
        onGmMode={(m) => setAdventure((prev) => ({ ...prev, gmMode: m, updatedAt: Date.now() }))}
        onNewCharacter={onNewCharacter}
        onExport={() => exportAdventureJSON(adventure)}
        onImport={handleImport}
        onSignOut={onSignOut}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="w-[360px] shrink-0 border-r border-slate-800">
          <CharacterPanel
            system={system}
            character={c}
            derived={derived}
            actions={panelActions}
          />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <NarrativeHub logs={adventure.logs} onReroll={rerollDice} />
            <CommandCenter
              system={system}
              onSend={sendCommand}
              onQuickAction={quickAction}
              onRoll={roll}
              busy={gmBusy}
              rollPrefs={rollPrefs}
              setRollPrefs={setRollPrefs}
              pendingCount={
                c.system === "dnd5e" ? (c as DnDCharacter).state.pending.length + (c as DnDCharacter).state.damagePending.length : 0
              }
            />
          </div>
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
                  useFeature(f.id);
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
    </div>
  );
}
