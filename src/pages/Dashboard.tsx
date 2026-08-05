import { useAuth } from "@/hooks/use-auth";
import { loadCharacter, saveCharacter } from "@/lib/rpg/storage";
import type { Character } from "@/lib/rpg/types";
import { useState } from "react";
import { useNavigate } from "react-router";
import Wizard from "@/components/creation/Wizard";
import GameBoard from "@/pages/game/GameBoard";

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
