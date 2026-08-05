import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import type { AdventureState, GmTurn } from "../types";
import { payloadToJson, serializeAdventure } from "../serializer";
import { localRespond } from "./local";

export interface GmReply {
  text: string;
  usedFallback: boolean;
}

/** Live GM: streams the serialized payload to the completion endpoint via a
 *  Convex action. Falls back to the local narrator when the endpoint is not
 *  configured or errors, so the game never dead-ends. */
export function useGmClient() {
  const generate = useAction(api.gm.generate);

  async function respond(
    turn: GmTurn,
    adventure: AdventureState,
  ): Promise<GmReply> {
    if (adventure.gmMode === "live") {
      try {
        const payload = payloadToJson(serializeAdventure(adventure));
        const history = adventure.logs
          .filter(
            (l) =>
              l.kind === "gm" ||
              l.kind === "player" ||
              l.kind === "combat",
          )
          .slice(-14)
          .map((l) => l.text);
        const res = await generate({ payload, history });
        if (res.ok && res.text) {
          return { text: res.text, usedFallback: false };
        }
      } catch {
        // fall through to local narrator
      }
    }
    return { text: localRespond(turn, adventure), usedFallback: true };
  }

  return { respond };
}
