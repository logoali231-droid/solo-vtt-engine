import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  Character,
  Companion,
  DnDCharacter,
  GameSystem,
  GmLanguage,
  GurpsCharacter,
  InventoryItem,
  LorebookEntry,
  Pf2eCharacter,
  PfRank,
} from "@/lib/rpg/types";
import type { DndDerived, GurpsDerived, Pf2eDerived } from "@/lib/rpg/character";
import CampaignPanel from "./CampaignPanel";
import CompanionPanel from "./CompanionPanel";
import ConditionsPanel from "./ConditionsPanel";
import GearPanel, { InventoryEditor } from "./GearPanel";
import LorebookPanel from "./LorebookPanel";
import DndSheet from "./sheets/DndSheet";
import GurpsSheet from "./sheets/GurpsSheet";
import Pf2eSheet from "./sheets/Pf2eSheet";
import type { RollRequest } from "../types";

export interface CampaignPanelData {
  sceneTitle: string;
  location: string;
  quests: string[];
  xp: number;
  gold: number;
  memory?: string;
  level: number;
  maxLevel: number;
  xpNeeded: number;
  gurpsSpare?: number;
  onScene: (title: string, location: string) => void;
  onAddQuest: (q: string) => void;
  onRemoveQuest: (i: number) => void;
  onAwardXp: (n: number) => void;
  onLevelUp: () => void;
  onGold: (n: number) => void;
  onRewardCp: () => void;
  onClearHistory: () => void;
}

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
  lorebook?: LorebookEntry[];
  onLorebookChange?: (entries: LorebookEntry[]) => void;
  inventory?: InventoryItem[];
  onInventoryChange?: (items: InventoryItem[]) => void;
  companions?: Companion[];
  onCompanionChange?: (companions: Companion[]) => void;
  onCompanionAttack?: (id: string) => void;
  campaign?: CampaignPanelData;
  gmLanguage?: GmLanguage;
}

export default function CharacterPanel({
  system,
  character,
  derived,
  actions,
  lorebook = [],
  onLorebookChange,
  inventory = [],
  onInventoryChange,
  companions = [],
  onCompanionChange,
  onCompanionAttack,
  campaign,
  gmLanguage = "en",
}: Props) {
  const [tab, setTab] = useState<"sheet" | "party" | "gear" | "conditions" | "lorebook" | "campaign">("sheet");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-950 px-2 pt-2">
        {(
          [
            ["sheet", "Sheet"],
            ["party", "Party"],
            ["gear", "Gear"],
            ["conditions", "Conditions"],
            ["lorebook", "Lorebook"],
            ["campaign", "Campaign"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-t-lg px-3 py-2 text-[11px] font-semibold transition-colors sm:px-4 sm:text-xs",
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
              inventory={inventory}
              onInventoryChange={(items) => onInventoryChange?.(items)}
              onSetWeapon={actions.onSetWeapon}
              onSetArmor={actions.onSetArmor}
              onToggleShield={actions.onToggleShield}
              onAttack={actions.onAttack}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-relaxed text-slate-400">
                {system === "pf2e"
                  ? "Pathfinder equipment is tracked through the action economy — equip weapons and gear from the sheet. Track your carried loot below."
                  : "GURPS gear is budgeted with character points; your DR shows on the sheet. Track your carried loot below."}
              </div>
              <InventoryEditor
                inventory={inventory}
                onChange={(items) => onInventoryChange?.(items)}
              />
            </div>
          ))}
        {tab === "conditions" && (
          <ConditionsPanel
            system={system}
            active={(character as { state: { conditions: string[] } }).state.conditions}
            onToggle={actions.onToggleCondition}
          />
        )}
        {tab === "lorebook" && onLorebookChange && (
          <LorebookPanel entries={lorebook} onChange={onLorebookChange} />
        )}
        {tab === "party" &&
          (onCompanionChange && onCompanionAttack ? (
            <CompanionPanel
              system={system}
              companions={companions}
              onChange={onCompanionChange}
              onAttack={onCompanionAttack}
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold text-slate-200">Your Company</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Recruit companions, give them stat blocks and roll their attacks with the same
                rules engine — available from the desktop layout.
              </p>
            </div>
          ))}
        {tab === "campaign" && campaign && (
          <CampaignPanel system={system} language={gmLanguage} {...campaign} />
        )}
      </div>
    </div>
  );
}
