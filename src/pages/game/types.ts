import type { AbilityId, DiceKind, PfRank } from "@/lib/rpg/types";

/** A request to resolve a rules-compliant check through the dice engine. */
export interface RollRequest {
  label: string;
  kind: DiceKind;
  dc?: number;
  ability?: AbilityId;
  skill?: string;
  proficient?: boolean;
  rank?: PfRank;
  pf2eBonus?: number;
  gurpsTarget?: number;
  flashOfGenius?: boolean;
  usePending?: boolean;
  /** When set, dispatches the curated spellbook cast flow instead of a plain check. */
  spellId?: string;
}

export interface SheetProps<T> {
  character: T;
  onRoll: (request: RollRequest) => void;
  onUseFeature?: (featureId: string) => void;
}
