import { useAuth } from "@/hooks/use-auth";
import {
  deleteFromLibrary,
  listSavedCharacters,
  loadCharacter,
  saveCharacter,
} from "@/lib/rpg/storage";
import type { Character, SavedCharacterRecord } from "@/lib/rpg/types";
import { Dices, Plus, Sparkles, Trash2, User } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import Wizard from "@/components/creation/Wizard";
import GameBoard from "@/pages/game/GameBoard";

function SystemBadge({ system }: { system: SavedCharacterRecord["system"] }) {
  const map: Record<string, string> = {
    dnd5e: "bg-red-500/10 text-red-300",
    pf2e: "bg-teal-500/10 text-teal-300",
    gurps: "bg-amber-500/10 text-amber-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[system] ?? ""}`}>
      {system === "dnd5e" ? "D&D 5e" : system.toUpperCase()}
    </span>
  );
}

function StartScreen({
  onPick,
  onNew,
  onSignOut,
}: {
  onPick: (c: Character) => void;
  onNew: () => void;
  onSignOut: () => void;
}) {
  const [library, setLibrary] = useState<SavedCharacterRecord[]>(() => listSavedCharacters());

  const remove = (id: string) => {
    deleteFromLibrary(id);
    setLibrary(listSavedCharacters());
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f0] text-stone-900">
      <header className="flex items-center justify-between border-b border-stone-200/80 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
            <Dices className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight">Oraculum</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
              Character Library
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-stone-900 text-amber-400">
            <Sparkles className="size-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Choose your hero</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
            Start a fresh character with the creation wizard, or pick a saved hero from your
            library and jump straight into a new adventure.
          </p>
        </div>

        <button
          type="button"
          onClick={onNew}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50/50 py-5 text-sm font-bold text-amber-800 transition-all hover:border-amber-500 hover:bg-amber-50"
        >
          <Plus className="size-5" /> Create a new character
        </button>

        <div className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">
            Saved heroes ({library.length})
          </p>
          {library.length === 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <User className="mx-auto size-8 text-stone-300" />
              <p className="mt-2 text-sm text-stone-500">
                No saved heroes yet. Finish a wizard run, then use the{" "}
                <span className="font-semibold text-stone-700">Save to library</span> button in the
                game to keep a hero here.
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {library.map((r) => (
              <div
                key={r.id}
                className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-amber-400/60 hover:shadow-md"
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
                    onClick={() => onPick(r.character)}
                    className="flex-1 rounded-lg bg-stone-900 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-stone-800"
                  >
                    Start adventure
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    title="Delete from library"
                    className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition-colors hover:border-red-200 hover:text-red-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(() => loadCharacter());
  const [creating, setCreating] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleLock = (c: Character) => {
    saveCharacter(c);
    setCharacter(c);
    setCreating(false);
  };

  const handlePick = useCallback((c: Character) => {
    saveCharacter(c);
    setCharacter(c);
    setCreating(false);
  }, []);

  // Library start screen — no active hero yet
  if (!character && !creating) {
    return (
      <StartScreen
        onPick={handlePick}
        onNew={() => setCreating(true)}
        onSignOut={handleSignOut}
      />
    );
  }

  // Phase 1 — Character Creation Wizard
  if (creating || !character) {
    return <Wizard key={character ? "edit" : "new"} onLock={handleLock} initial={character ?? null} />;
  }

  // Phase 2 — Solo Game Dashboard
  return (
    <GameBoard
      character={character}
      onNewCharacter={() => setCreating(true)}
      onSignOut={handleSignOut}
    />
  );
}
