import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  Character,
  Companion,
  DnDCharacter,
  GameSystem,
  GmLanguage,
  DiceResult,
  GurpsCharacter,
  GurpsExtensionState,
  GurpsLifeMode,
  InventoryItem,
  LorebookEntry,
  Pf2eCharacter,
  PfRank,
  Territory,
  Wallet,
} from "@/lib/rpg/types";
import type { DndDerived, GurpsDerived, Pf2eDerived } from "@/lib/rpg/character";
import CampaignPanel from "./CampaignPanel";
import CompanionPanel from "./CompanionPanel";
import ConditionsPanel from "./ConditionsPanel";
import GearPanel from "./GearPanel";
import Pf2eGearPanel from "./Pf2eGearPanel";
import GurpsGearPanel from "./GurpsGearPanel";
import GurpsExtensionsPanel from "./GurpsExtensionsPanel";
import LorebookPanel from "./LorebookPanel";
import TerritoryPanel from "./TerritoryPanel";
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
  /** Returns the resolved dice synchronously for GURPS extension rolls; sheets ignore the return. */
  onRoll: (r: RollRequest) => DiceResult | undefined;
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
  /** Equip magic gear from the shop — sets the slot AND applies its enchant. */
  onSetMagicWeapon?: (id: string, bonus: number) => void;
  onSetMagicArmor?: (id: string, bonus: number) => void;
  onSetMagicShield?: (bonus: number) => void;
  /** Custom Enchanting Bench — attempt to enchant the equipped slot (+1/+2/+3). */
  onEnchant?: (target: "weapon" | "armor" | "shield", tier: 1 | 2 | 3) => void;
  // pf2e
  onPfSetSkillRank: (skill: string, rank: PfRank) => void;
  onPfSetSaveRank: (ability: string, rank: PfRank) => void;
  onPfSetPerceptionRank: (rank: PfRank) => void;
  onPfSetArmor: (id: string) => void;
  onPfSpendAction: (n: number) => void;
  onPfResetActions: () => void;
  onPfDamage: (n: number) => void;
  onPfHeal: (n: number) => void;
  // gurps
  onGurpsDamage: (n: number) => void;
  onGurpsHeal: (n: number) => void;
  onGurpsFatigue: (n: number) => void;
  onGurpsRecover: (n: number) => void;
  /** Equip GURPS armor from the shop — sets the slot, feeds the DR engine. */
  onGurpsSetArmor: (id: string) => void;
  /** Life & Livelihood extension — persists a slice of ext state. */
  onGurpsExt?: (patch: Partial<GurpsExtensionState>) => void;
  /** Life Mode tag — re-frames the whole GURPS life-sim (set at Adventure Setup). */
  onSetLifeMode?: (m: GurpsLifeMode) => void;
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
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
  companions?: Companion[];
  onCompanionChange?: (companions: Companion[]) => void;
  onCompanionAttack?: (id: string) => void;
  territories?: Territory[];
  onTerritoriesChange?: (territories: Territory[]) => void;
  lifeMode?: string;
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
  wallet,
  onWalletChange,
  companions = [],
  onCompanionChange,
  onCompanionAttack,
  territories = [],
  onTerritoriesChange,
  lifeMode,
  campaign,
  gmLanguage = "en",
}: Props) {
  const pt = gmLanguage === "pt-BR";
  const [tab, setTab] = useState<"sheet" | "party" | "gear" | "conditions" | "lorebook" | "campaign" | "life" | "world">("sheet");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950 px-2 pt-2">
        {(
          [
            ["sheet", "Sheet"],
            ["party", "Party"],
            ["gear", "Gear"],
            ["conditions", "Conditions"],
            ["lorebook", "Lorebook"],
            ["campaign", "Campaign"],
            ["world", pt ? "Mundo" : "World"],
            ...(system === "gurps" ? ([["life", "Life"]] as const) : []),
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
              onSetMagicWeapon={actions.onSetMagicWeapon}
              onSetMagicArmor={actions.onSetMagicArmor}
              onSetMagicShield={actions.onSetMagicShield}
              onEnchant={actions.onEnchant}
              wallet={wallet}
              onWalletChange={onWalletChange}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {system === "pf2e" ? (
                <Pf2eGearPanel
                  character={character as Pf2eCharacter}
                  derived={derived as Pf2eDerived}
                  inventory={inventory}
                  onInventoryChange={(items) => onInventoryChange?.(items)}
                  onSetArmor={actions.onPfSetArmor}
                  wallet={wallet}
                  onWalletChange={onWalletChange}
                />
              ) : (
                <GurpsGearPanel
                  character={character as GurpsCharacter}
                  derived={derived as GurpsDerived}
                  inventory={inventory}
                  onInventoryChange={(items) => onInventoryChange?.(items)}
                  onSetArmor={actions.onGurpsSetArmor}
                  wallet={wallet}
                  onWalletChange={onWalletChange}
                />
              )}
            </div>
          ))}
        {tab === "life" && system === "gurps" && (
          <GurpsExtensionsPanel
            character={character as GurpsCharacter}
            derived={derived as GurpsDerived}
            onRoll={actions.onRoll}
            onExt={(patch) => actions.onGurpsExt?.(patch)}
            onSetLifeMode={actions.onSetLifeMode}
            onFpSpend={(n) => actions.onGurpsFatigue(n)}
            wallet={wallet}
            onWalletChange={onWalletChange}
            gmLanguage={gmLanguage}
          />
        )}
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
        {tab === "world" && onTerritoriesChange && (
          <TerritoryPanel
            system={system}
            territories={territories}
            onChange={onTerritoriesChange}
            language={gmLanguage}
            lifeMode={lifeMode}
          />
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
