import type { AdventurePrefs } from "@/lib/rpg/types";
import { prefsOf } from "@/lib/rpg/types";
import { PickField, SectionLabel, StepShell, type PickOption } from "../ui";

interface PrefsFieldDef {
  key: keyof AdventurePrefs;
  label: string;
  options: PickOption[];
}

/** Canonical campaign directives — the GM follows exactly these strings, so no
 *  typos or ambiguous free-text ever reaches the narrator. */
const PREFS_FIELDS: PrefsFieldDef[] = [
  {
    key: "genre",
    label: "Genre",
    options: [
      { value: "high fantasy", label: "High fantasy" },
      { value: "dark fantasy", label: "Dark fantasy" },
      { value: "sword & sorcery", label: "Sword & sorcery" },
      { value: "mythic & epic", label: "Mythic & epic" },
      { value: "fairy tale", label: "Fairy tale" },
      { value: "sci-fi", label: "Sci-fi" },
      { value: "space opera", label: "Space opera" },
      { value: "cyberpunk", label: "Cyberpunk" },
      { value: "post-apocalyptic", label: "Post-apocalyptic" },
      { value: "steampunk", label: "Steampunk" },
      { value: "horror", label: "Horror" },
      { value: "western", label: "Western" },
    ],
  },
  {
    key: "tone",
    label: "Tone",
    options: [
      { value: "lighthearted & comedic", label: "Lighthearted & comedic" },
      { value: "heroic & epic", label: "Heroic & epic" },
      { value: "serious & grounded", label: "Serious & grounded" },
      { value: "dark & gritty", label: "Dark & gritty" },
      { value: "mysterious & eerie", label: "Mysterious & eerie" },
      { value: "melancholic", label: "Melancholic" },
      { value: "whimsical", label: "Whimsical" },
      { value: "romantic", label: "Romantic" },
    ],
  },
  {
    key: "style",
    label: "Adventure style",
    options: [
      { value: "dungeon crawl", label: "Dungeon crawl" },
      { value: "mystery & investigation", label: "Mystery & investigation" },
      { value: "heist", label: "Heist" },
      { value: "political intrigue", label: "Political intrigue" },
      { value: "war campaign", label: "War campaign" },
      { value: "exploration", label: "Exploration" },
      { value: "survival", label: "Survival" },
      { value: "sandbox", label: "Open-world sandbox" },
      { value: "monster hunt", label: "Monster hunt" },
      { value: "epic quest", label: "Epic quest" },
      { value: "settlement building", label: "Settlement building" },
    ],
  },
  {
    key: "setting",
    label: "Starting location",
    options: [
      { value: "village", label: "Village" },
      { value: "town / city", label: "Town / city" },
      { value: "tavern", label: "Tavern" },
      { value: "wilderness", label: "Wilderness" },
      { value: "dungeon entrance", label: "Dungeon entrance" },
      { value: "castle / court", label: "Castle / court" },
      { value: "frontier outpost", label: "Frontier outpost" },
      { value: "ship", label: "Ship" },
      { value: "academy", label: "Academy" },
      { value: "undercity", label: "Undercity" },
    ],
  },
  {
    key: "difficulty",
    label: "Difficulty",
    options: [
      { value: "lenient", label: "Lenient" },
      { value: "standard", label: "Standard" },
      { value: "challenging", label: "Challenging" },
      { value: "deadly", label: "Deadly" },
    ],
  },
  {
    key: "focus",
    label: "Focus",
    options: [
      { value: "balanced", label: "Balanced" },
      { value: "combat-heavy", label: "Combat-heavy" },
      { value: "roleplay-heavy", label: "Roleplay-heavy" },
      { value: "exploration-heavy", label: "Exploration-heavy" },
      { value: "puzzle-heavy", label: "Puzzle-heavy" },
    ],
  },
];

/** Compact chips summarizing the chosen adventure setup (used on review screens). */
export function PrefsSummaryChips({ prefs }: { prefs: Partial<AdventurePrefs> }) {
  const p = prefsOf(prefs);
  const chipRows: [string, string][] = [
    ["Genre", p.genre],
    ["Tone", p.tone],
    ["Style", p.style],
    ["Setting", p.setting],
    ["Difficulty", p.difficulty],
    ["Focus", p.focus],
  ];
  const chips = chipRows.filter(([, v]) => v !== "");
  if (chips.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-stone-200 bg-white p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
        Adventure setup
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(([k, v]) => (
          <span
            key={k}
            className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700"
          >
            {k}: {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdventureSetupStep({
  prefs,
  setPrefs,
}: {
  prefs: Partial<AdventurePrefs>;
  setPrefs: (v: Partial<AdventurePrefs>) => void;
}) {
  return (
    <StepShell
      title="Adventure Setup"
      subtitle="Shape the campaign before it begins — the Game Master follows these directives and opens your story in the right world. Leave anything blank and the GM improvises it."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {PREFS_FIELDS.map((f) => (
          <PickField
            key={f.key}
            label={f.label}
            value={prefs[f.key] ?? ""}
            onChange={(v) => setPrefs({ ...prefs, [f.key]: v })}
            options={f.options}
          />
        ))}
        <div className="sm:col-span-2">
          <SectionLabel hint="Optional">Premise / hook</SectionLabel>
          <p className="mb-2 text-xs leading-relaxed text-stone-400">
            A one-line idea for the Game Master to build on — a rumor, a crime, a mystery, a
            prophecy. Leave blank for a completely improvised opening.
          </p>
          <textarea
            value={prefs.premise ?? ""}
            onChange={(e) => setPrefs({ ...prefs, premise: e.target.value })}
            placeholder="e.g. The king's courier vanished on the Old Watchtower Road — the last thing he carried was a letter with your name on it."
            rows={3}
            className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>
      </div>
    </StepShell>
  );
}
