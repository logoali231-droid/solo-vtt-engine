import type { AdventureState, Character } from "./types";
import { serializeAdventure } from "./serializer";

const CHARACTER_KEY = "oraculum.character.v1";
const ADVENTURE_KEY = "oraculum.adventure.v1";

export function saveCharacter(character: Character): void {
  try {
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(character));
  } catch {
    // storage unavailable (private mode) — non-fatal
  }
}

export function loadCharacter(): Character | null {
  try {
    const raw = localStorage.getItem(CHARACTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Character;
    if (!parsed || typeof parsed !== "object" || !("system" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCharacter(): void {
  try {
    localStorage.removeItem(CHARACTER_KEY);
    localStorage.removeItem(ADVENTURE_KEY);
  } catch {
    // noop
  }
}

export function saveAdventure(adventure: AdventureState): void {
  try {
    localStorage.setItem(ADVENTURE_KEY, JSON.stringify(adventure));
  } catch {
    // non-fatal
  }
}

export function loadAdventure(): AdventureState | null {
  try {
    const raw = localStorage.getItem(ADVENTURE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdventureState;
    if (!parsed || !("character" in parsed) || !("logs" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Export the strict LLM payload (character + dice logs) as a JSON file. */
export function exportAdventureJSON(adventure: AdventureState): void {
  const blob = new Blob([JSON.stringify(serializeAdventure(adventure), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oraculum-${adventure.character.name.toLowerCase().replace(/\s+/g, "-") || "character"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAdventureJSON(file: File): Promise<AdventureState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (
          !data ||
          typeof data !== "object" ||
          !("character" in data) ||
          !("logs" in data)
        ) {
          throw new Error("Not a valid Oraculum adventure file");
        }
        resolve(data as AdventureState);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Invalid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}
