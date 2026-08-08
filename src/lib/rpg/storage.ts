import type {
  AdventureRecord,
  AdventureState,
  AdsSettings,
  Character,
  GmSettings,
  LorebookEntry,
  SavedCharacterRecord,
} from "./types";
import { DEFAULT_ADS_SETTINGS, DEFAULT_GM_SETTINGS, uid } from "./types";
import { serializeAdventure } from "./serializer";

const CHARACTER_KEY = "oraculum.character.v1";
const ADVENTURE_KEY = "oraculum.adventure.v1";
const ADVENTURES_KEY = "oraculum.adventures.v1"; // saved-session library
const SETTINGS_KEY = "oraculum.gmSettings.v1";
const LOREBOOK_KEY = "oraculum.lorebook.v1"; // legacy global array
const LOREBOOK_V2_KEY = "oraculum.lorebook.v2"; // per-campaign map
const LIBRARY_KEY = "oraculum.library.v1";
const ADS_KEY = "oraculum.adsSettings.v1";

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

/** Backfill a stable id so every session can live in the Adventures library. */
function withAdventureId(a: AdventureState): AdventureState {
  return a.id ? a : { ...a, id: uid() };
}

export function saveAdventure(adventure: AdventureState): void {
  const stamped = withAdventureId(adventure);
  try {
    localStorage.setItem(ADVENTURE_KEY, JSON.stringify(stamped));
    upsertAdventureRecord(stamped);
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
// Adventures library (all saved sessions, newest first)
// ---------------------------------------------------------------------------

function readAdventureRecords(): AdventureRecord[] {
  try {
    const raw = localStorage.getItem(ADVENTURES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdventureRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAdventureRecords(records: AdventureRecord[]): void {
  try {
    localStorage.setItem(ADVENTURES_KEY, JSON.stringify(records));
  } catch {
    // non-fatal
  }
}

function upsertAdventureRecord(adventure: AdventureState): void {
  const stamped = withAdventureId(adventure);
  const records = readAdventureRecords();
  const existing = records.find((r) => r.id === stamped.id);
  const record: AdventureRecord = {
    id: stamped.id!,
    label: existing?.label ?? `${stamped.character.name} · ${stamped.sceneTitle}`,
    system: stamped.system,
    character: stamped.character,
    adventure: stamped,
    createdAt: existing?.createdAt ?? stamped.createdAt,
    updatedAt: stamped.updatedAt,
  };
  const next = [record, ...records.filter((r) => r.id !== stamped.id)];
  writeAdventureRecords(next.slice(0, 50));
}

export function listAdventures(): AdventureRecord[] {
  const records = readAdventureRecords();
  // Adopt any legacy single-slot adventure that was never registered.
  const legacy = loadAdventure();
  if (legacy && !records.some((r) => r.adventure.id === legacy.id || (legacy.id && r.id === legacy.id))) {
    const stamped = withAdventureId(legacy);
    upsertAdventureRecord(stamped);
    return readAdventureRecords();
  }
  return records;
}

export function deleteAdventure(id: string): void {
  writeAdventureRecords(readAdventureRecords().filter((r) => r.id !== id));
  try {
    const current = loadAdventure();
    if (current?.id === id) localStorage.removeItem(ADVENTURE_KEY);
  } catch {
    // non-fatal
  }
}

export function loadAdventureById(id: string): AdventureState | null {
  return readAdventureRecords().find((r) => r.id === id)?.adventure ?? null;
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
// Screen-time ads settings (localStorage only)
// ---------------------------------------------------------------------------

export function loadAdsSettings(): AdsSettings {
  try {
    const raw = localStorage.getItem(ADS_KEY);
    if (!raw) return { ...DEFAULT_ADS_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AdsSettings>;
    return { ...DEFAULT_ADS_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_ADS_SETTINGS };
  }
}

export function saveAdsSettings(settings: AdsSettings): void {
  try {
    localStorage.setItem(ADS_KEY, JSON.stringify(settings));
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Lorebook (world facts — scoped per campaign via a campaign key)
// ---------------------------------------------------------------------------

/** Load legacy global lorebook entries (v1) for migration. */
function loadLegacyLorebook(): LorebookEntry[] {
  try {
    const raw = localStorage.getItem(LOREBOOK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LorebookEntry[]) : [];
  } catch {
    return [];
  }
}

function loadLorebookMap(): Record<string, LorebookEntry[]> {
  try {
    const raw = localStorage.getItem(LOREBOOK_V2_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, LorebookEntry[]>) : {};
  } catch {
    return {};
  }
}

export function loadLorebook(campaignKey: string): LorebookEntry[] {
  const map = loadLorebookMap();
  if (map[campaignKey]) return map[campaignKey];
  // Migrate the legacy global entries into this campaign on first access.
  const legacy = loadLegacyLorebook();
  if (legacy.length > 0) {
    const next = { ...map, [campaignKey]: legacy };
    try {
      localStorage.setItem(LOREBOOK_V2_KEY, JSON.stringify(next));
      localStorage.removeItem(LOREBOOK_KEY);
    } catch {
      // non-fatal
    }
    return legacy;
  }
  return [];
}

export function saveLorebook(campaignKey: string, entries: LorebookEntry[]): void {
  try {
    const map = loadLorebookMap();
    localStorage.setItem(
      LOREBOOK_V2_KEY,
      JSON.stringify({ ...map, [campaignKey]: entries }),
    );
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
