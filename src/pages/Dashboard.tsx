import { useAuth } from "@/hooks/use-auth";
import {
  deleteAdventure,
  deleteFromLibrary,
  listAdventures,
  listSavedCharacters,
  saveCharacter,
} from "@/lib/rpg/storage";
import type { AdventureRecord, AdventureState, Character, SavedCharacterRecord } from "@/lib/rpg/types";
import {
  Bug,
  Compass,
  Dices,
  LogOut,
  Plus,
  Settings2,
  Sparkles,
  Swords,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import Wizard from "@/components/creation/Wizard";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import BugReportPanel from "@/components/dashboard/BugReportPanel";
import GameBoard from "@/pages/game/GameBoard";

type Tab = "adventures" | "characters" | "settings" | "bugreport";

function SystemBadge({ system }: { system: SavedCharacterRecord["system"] | AdventureRecord["system"] }) {
  const map: Record<string, string> = {
    dnd5e: "bg-red-500/10 text-red-600",
    pf2e: "bg-teal-500/10 text-teal-600",
    gurps: "bg-amber-500/10 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[system] ?? ""}`}>
      {system === "dnd5e" ? "D&D 5e" : system.toUpperCase()}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-stone-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-stone-500">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800"
      >
        <Plus className="size-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"hub" | "wizard" | "game">("hub");
  const [tab, setTab] = useState<Tab>("adventures");
  const [character, setCharacter] = useState<Character | null>(null);
  const [initialAdventure, setInitialAdventure] = useState<AdventureState | null>(null);
  // Lists are re-read every time the hub mounts so returning from a game
  // shows the freshest sessions and prefabs.
  const [adventures, setAdventures] = useState<AdventureRecord[]>(() => listAdventures());
  const [library, setLibrary] = useState<SavedCharacterRecord[]>(() => listSavedCharacters());

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const refresh = () => {
    setAdventures(listAdventures());
    setLibrary(listSavedCharacters());
  };

  const goWizard = () => {
    refresh();
    setView("wizard");
  };

  const handleLock = (c: Character) => {
    saveCharacter(c);
    setCharacter(c);
    setInitialAdventure(null);
    setView("game");
  };

  // Start a brand-new adventure from a saved prefab (hero).
  const handlePickPrefab = (c: Character) => {
    saveCharacter(c);
    setCharacter(c);
    setInitialAdventure(null);
    setView("game");
  };

  // Resume a saved session — carries its full state into the game.
  const handleContinue = (record: AdventureRecord) => {
    saveCharacter(record.character);
    setCharacter(record.character);
    setInitialAdventure(record.adventure);
    setView("game");
  };

  const removeAdventure = (id: string) => {
    deleteAdventure(id);
    setAdventures(listAdventures());
  };

  const removePrefab = (id: string) => {
    deleteFromLibrary(id);
    setLibrary(listSavedCharacters());
  };

  // Phase 1 — Character Creation Wizard
  if (view === "wizard") {
    return <Wizard key="new" onLock={handleLock} initial={null} />;
  }

  // Phase 2 — Solo Game Dashboard
  if (view === "game" && character) {
    return (
      <GameBoard
        character={character}
        initialAdventure={initialAdventure}
        onNewCharacter={goWizard}
        onSignOut={handleSignOut}
        onBackToHub={() => {
          refresh();
          setView("hub");
        }}
      />
    );
  }

  // Hub — Adventures / Characters / Settings
  const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "adventures", label: "Adventures", icon: <Swords className="size-4" /> },
    { id: "characters", label: "Characters", icon: <Users className="size-4" /> },
    { id: "settings", label: "Settings", icon: <Settings2 className="size-4" /> },
    { id: "bugreport", label: "Bug report", icon: <Bug className="size-4" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f0] text-stone-900 supports-[height:100dvh]:min-h-dvh">
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
              <Dices className="size-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight">Oraculum</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
                Solo Tabletop VTT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        {/* Tabs */}
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg border-x border-t px-4 py-2 text-xs font-bold transition-colors",
                  tab === t.id
                    ? "border-stone-200 bg-[#f7f5f0] text-stone-900"
                    : "border-transparent text-stone-400 hover:text-stone-700",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {/* ---------------------------------------------------------------- */}
        {/* ADVENTURES TAB */}
        {/* ---------------------------------------------------------------- */}
        {tab === "adventures" && (
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Your adventures</h1>
                <p className="mt-1 text-sm text-stone-500">
                  Resume a campaign, or forge a brand-new one from a hero.
                </p>
              </div>
              <button
                type="button"
                onClick={goWizard}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800 sm:mt-0"
              >
                <Plus className="size-3.5" />
                New adventure
              </button>
            </div>

            {adventures.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={<Compass className="size-6" />}
                  title="No adventures yet"
                  body="Every campaign you start is saved here automatically — create a hero and your first adventure begins."
                  actionLabel="Create a character & adventure"
                  onAction={goWizard}
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {adventures.map((r) => (
                  <div
                    key={r.id}
                    className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-400/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-900">{r.label}</p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {r.character.name} ·{" "}
                          {new Date(r.updatedAt).toLocaleDateString()}{" "}
                          {new Date(r.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <SystemBadge system={r.system} />
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                      {r.adventure.sceneTitle} — {r.adventure.location}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleContinue(r)}
                        className="flex-1 rounded-lg bg-stone-900 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAdventure(r.id)}
                        title="Delete adventure"
                        className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-red-200 hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CHARACTERS (PREFAB LIBRARY) TAB */}
        {/* ---------------------------------------------------------------- */}
        {tab === "characters" && (
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Character prefabs</h1>
                <p className="mt-1 text-sm text-stone-500">
                  Reusable heroes saved from your games — start any adventure with them.
                </p>
              </div>
              <button
                type="button"
                onClick={goWizard}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800 sm:mt-0"
              >
                <Plus className="size-3.5" />
                New character
              </button>
            </div>

            {library.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={<User className="size-6" />}
                  title="No saved heroes yet"
                  body="Finish a creation wizard run, then use the “Save to library” button in the game to keep a hero here for reuse."
                  actionLabel="Create your first hero"
                  onAction={goWizard}
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {library.map((r) => (
                  <div
                    key={r.id}
                    className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-400/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-900">{r.label}</p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {r.character.name} · {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <SystemBadge system={r.system} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePickPrefab(r.character)}
                        className="flex-1 rounded-lg bg-stone-900 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800"
                      >
                        Start adventure
                      </button>
                      <button
                        type="button"
                        onClick={() => removePrefab(r.id)}
                        title="Delete from library"
                        className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-red-200 hover:text-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* SETTINGS TAB */}
        {/* ---------------------------------------------------------------- */}
        {tab === "settings" && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">AI & game settings</h1>
            <p className="mt-1 text-sm text-stone-500">
              Pick the model that narrates your adventure — the free AI Horde option needs no key.
            </p>
            <div className="mt-6 max-w-2xl">
              <SettingsPanel />
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-[11px] text-stone-500">
              <Sparkles className="size-4 shrink-0 text-amber-500" />
              Settings are stored only in this browser. The built-in provider falls back to free AI
              Horde when no platform OpenAI key is configured, so Live mode works with zero accounts.
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* BUG REPORT TAB                                                   */}
        {/* ---------------------------------------------------------------- */}
        {tab === "bugreport" && (
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Bug report</h1>
            <p className="mt-1 text-sm text-stone-500">
              Found something off? Describe it in detail and export a clean report — attach a saved
              session so the bug can be reproduced exactly.
            </p>
            <div className="mt-6">
              <BugReportPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
