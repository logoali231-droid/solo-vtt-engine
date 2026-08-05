import type {
  AdventureState,
  Character,
  GmSettings,
  LorebookEntry,
  SavedCharacterRecord,
} from "./types";
import { DEFAULT_GM_SETTINGS, uid } from "./types";
import { serializeAdventure } from "./serializer";

const CHARACTER_KEY = "oraculum.character.v1";
const ADVENTURE_KEY = "oraculum.adventure.v1";
const SETTINGS_KEY = "oraculum.gmSettings.v1";
const LOREBOOK_KEY = "oraculum.lorebook.v1";
const LIBRARY_KEY = "oraculum.library.v1";

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

// ---------------------------------------------------------------------------
// GM settings (AI provider config — localStorage only, never the database)
// ---------------------------------------------------------------------------

export function loadGmSettings(): GmSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_GM_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GmSettings>;
    return { ...DEFAULT_GM_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_GM_SETTINGS };
  }
}

export function saveGmSettings(settings: GmSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Lorebook (per-campaign world facts)
// ---------------------------------------------------------------------------

export function loadLorebook(): LorebookEntry[] {
  try {
    const raw = localStorage.getItem(LOREBOOK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LorebookEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveLorebook(entries: LorebookEntry[]): void {
  try {
    localStorage.setItem(LOREBOOK_KEY, JSON.stringify(entries));
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Saved Characters Library (global, reusable across adventures)
// ---------------------------------------------------------------------------

export function listSavedCharacters(): SavedCharacterRecord[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedCharacterRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveToLibrary(character: Character, label: string): SavedCharacterRecord {
  const records = listSavedCharacters();
  const record: SavedCharacterRecord = {
    id: uid(),
    label: label.trim() || character.name,
    system: character.system,
    character,
    createdAt: Date.now(),
  };
  const next = [record, ...records].slice(0, 40);
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
  } catch {
    // non-fatal
  }
  return record;
}

export function deleteFromLibrary(id: string): void {
  try {
    localStorage.setItem(
      LIBRARY_KEY,
      JSON.stringify(listSavedCharacters().filter((r) => r.id !== id)),
    );
  } catch {
    // non-fatal
  }
}

export function loadFromLibrary(id: string): Character | null {
  const record = listSavedCharacters().find((r) => r.id === id);
  return record?.character ?? null;
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
