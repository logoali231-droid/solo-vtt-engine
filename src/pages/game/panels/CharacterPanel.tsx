import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  Character,
  DnDCharacter,
  GameSystem,
  GurpsCharacter,
  Pf2eCharacter,
  PfRank,
} from "@/lib/rpg/types";
import type { DndDerived, GurpsDerived, Pf2eDerived } from "@/lib/rpg/character";
import ConditionsPanel from "./ConditionsPanel";
import GearPanel from "./GearPanel";
import DndSheet from "./sheets/DndSheet";
import GurpsSheet from "./sheets/GurpsSheet";
import Pf2eSheet from "./sheets/Pf2eSheet";
import type { RollRequest } from "../types";

export interface PanelActions {
  onRoll: (r: RollRequest) => void;
  onUseFeature: (featureId: string) => void;
  onToggleCondition: (id: string) => void;
  // dnd
  onDndDamage: (n: number) => void;
  onDndHeal: (n: number) => void;
  onToggleSpellSlot: (i: number) => void;
  onTogglePact: () => void;
  onToggleInfusion: () => void;
  onUseResource: (id: string) => void;
  onSetWeapon: (id: string) => void;
  onSetArmor: (id: string) => void;
  onToggleShield: () => void;
  onAttack: (attackId: string) => void;
  // pf2e
  onPfSetSkillRank: (skill: string, rank: PfRank) => void;
  onPfSetSaveRank: (ability: string, rank: PfRank) => void;
  onPfSetPerceptionRank: (rank: PfRank) => void;
  onPfSpendAction: (n: number) => void;
  onPfResetActions: () => void;
  onPfDamage: (n: number) => void;
  onPfHeal: (n: number) => void;
  // gurps
  onGurpsDamage: (n: number) => void;
  onGurpsHeal: (n: number) => void;
  onGurpsFatigue: (n: number) => void;
  onGurpsRecover: (n: number) => void;
}

interface Props {
  system: GameSystem;
  character: Character;
  derived: DndDerived | Pf2eDerived | GurpsDerived;
  actions: PanelActions;
}

export default function CharacterPanel({ system, character, derived, actions }: Props) {
  const [tab, setTab] = useState<"sheet" | "gear" | "conditions">("sheet");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-950 px-2 pt-2">
        {(
          [
            ["sheet", "Sheet"],
            ["gear", "Gear"],
            ["conditions", "Conditions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors",
              tab === id
                ? "border border-b-0 border-slate-800 bg-slate-900 text-amber-300"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-950 p-3">
        {tab === "sheet" &&
          (system === "dnd5e" ? (
            <DndSheet
              character={character as DnDCharacter}
              derived={derived as DndDerived}
              onRoll={actions.onRoll}
              onUseFeature={actions.onUseFeature}
              actions={{
                damage: actions.onDndDamage,
                heal: actions.onDndHeal,
                toggleSpellSlot: actions.onToggleSpellSlot,
                togglePact: actions.onTogglePact,
                toggleInfusion: actions.onToggleInfusion,
                useResource: actions.onUseResource,
              }}
            />
          ) : system === "pf2e" ? (
            <Pf2eSheet
              character={character as Pf2eCharacter}
              derived={derived as Pf2eDerived}
              onRoll={actions.onRoll}
              actions={{
                setSkillRank: actions.onPfSetSkillRank,
                setSaveRank: actions.onPfSetSaveRank,
                setPerceptionRank: actions.onPfSetPerceptionRank,
                spendAction: actions.onPfSpendAction,
                resetActions: actions.onPfResetActions,
                damage: actions.onPfDamage,
                heal: actions.onPfHeal,
              }}
            />
          ) : (
            <GurpsSheet
              character={character as GurpsCharacter}
              derived={derived as GurpsDerived}
              onRoll={actions.onRoll}
              actions={{
                damage: actions.onGurpsDamage,
                heal: actions.onGurpsHeal,
                fatigue: actions.onGurpsFatigue,
                recover: actions.onGurpsRecover,
              }}
            />
          ))}
        {tab === "gear" &&
          (system === "dnd5e" ? (
            <GearPanel
              character={character as DnDCharacter}
              derived={derived as DndDerived}
              onSetWeapon={actions.onSetWeapon}
              onSetArmor={actions.onSetArmor}
              onToggleShield={actions.onToggleShield}
              onAttack={actions.onAttack}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
              {system === "pf2e"
                ? "Pathfinder equipment slots live in the action economy — equip items from the sheet as you adventure."
                : "GURPS gear is tracked by points. Your DR is shown on the sheet."}
            </div>
          ))}
        {tab === "conditions" && (
          <ConditionsPanel
            system={system}
            active={(character as { state: { conditions: string[] } }).state.conditions}
            onToggle={actions.onToggleCondition}
          />
        )}
      </div>
    </div>
  );
}
