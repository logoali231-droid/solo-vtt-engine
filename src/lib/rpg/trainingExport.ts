/**
 * Oraculum — Training Data Export
 * Converts a saved adventure into Unsloth-ready Alpaca-format training rows.
 * Each player action + GM reply pair becomes one row:
 *   { instruction, input, output }
 * Also outputs a ChatML variant for models trained in that format.
 *
 * Usage:
 *   import { exportTrainingData } from "./trainingExport";
 *   exportTrainingData(adventure);  // triggers browser download
 */

import type { AdventureState } from "./types";
import { campaignBriefing, prefsOf } from "./types";
import { getDndDerived, getGurpsDerived, getPf2eDerived } from "./character";
import { dndRulesContext, pf2eRulesContext } from "./data/adventure-samples";
import { gurpsRulesContext } from "./data/gurps-extensions";

/** Short GM system prompt snippet included as `input` context per row. */
function buildInputContext(adventure: AdventureState): string {
  const rules =
    adventure.system === "dnd5e"
      ? "D&D 5e (PHB + Xanathar's + Tasha's Cauldron of Everything)"
      : adventure.system === "pf2e"
        ? "Pathfinder 2e (Core Rulebook)"
        : "GURPS 4e (Basic Set)";
  const brief = campaignBriefing(prefsOf(adventure.character.adventurePrefs));
  return [
    `You are the Game Master for a solo tabletop RPG. Ruleset: ${rules}.`,
    `Campaign briefing: ${brief}`,
    "Narrate in second-person prose. React directly to what the player wrote.",
  ].join(" ");
}

/** Extract player move + GM reply pairs from adventure logs. */
function extractPairs(adventure: AdventureState): Array<{ player: string; gm: string }> {
  const pairs: Array<{ player: string; gm: string }> = [];
  const logs = adventure.logs;
  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];
    if (entry.kind !== "player") continue;
    const playerText = entry.text.trim();
    if (!playerText) continue;
    // Find the next GM reply after this player move
    let gmText = "";
    for (let j = i + 1; j < logs.length; j++) {
      if (logs[j].kind === "gm") {
        gmText = logs[j].text.trim();
        break;
      }
      if (logs[j].kind === "player") break; // next player turn, no GM reply yet
    }
    if (gmText) pairs.push({ player: playerText, gm: gmText });
  }
  return pairs;
}

/** Convert adventure logs into Alpaca-format training rows and trigger a
 *  browser download of both .jsonl and .json files. */
export function exportTrainingData(adventure: AdventureState): void {
  const inputContext = buildInputContext(adventure);
  const pairs = extractPairs(adventure);

  if (pairs.length === 0) {
    // Nothing to train on — still valid, just empty
    const empty = JSON.stringify([], null, 2);
    download("oraculum-training.json", empty, "application/json");
    return;
  }

  // --- Alpaca format ---
  const alpacaRows = pairs.map((p) => ({
    instruction: p.player,
    input: inputContext,
    output: p.gm,
  }));

  // --- ChatML format (for models trained with messages template) ---
  const chatmlRows = pairs.map((p) => ({
    messages: [
      { role: "system", content: inputContext },
      { role: "user", content: p.player },
      { role: "assistant", content: p.gm },
    ],
  }));

  // Write both files
  const jsonl = alpacaRows.map((r) => JSON.stringify(r)).join("\n");
  const json = JSON.stringify(alpacaRows, null, 2);
  const chatml = JSON.stringify(chatmlRows, null, 2);

  const name = adventure.character.name.toLowerCase().replace(/\s+/g, "-") || "character";
  download(`oraculum-training-${name}.jsonl`, jsonl, "application/jsonl");
  download(`oraculum-training-${name}.json`, json, "application/json");
  download(`oraculum-training-${name}-chatml.json`, chatml, "application/json");
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
