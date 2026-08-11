import type { AdventurePrefs, GameSystem, GurpsLifeMode } from "@/lib/rpg/types";
import { campaignBriefing, gurpsLifeModeOf, GURPS_LIFE_MODES, prefsOf } from "@/lib/rpg/types";
import { cn } from "@/lib/utils";
import { Dices, Map, ScrollText, Shield, Swords, Tags, Users } from "lucide-react";
import { PickField, SectionLabel, StepShell, type PickOption } from "../ui";

interface PrefsFieldDef {
  key: keyof AdventurePrefs;
  label: string;
  options: PickOption[];
}

/** Canonical campaign directives — the GM follows exactly these strings, so no
 *  typos or ambiguous free-text ever reaches the narrator. */
const WORLD_FIELDS: PrefsFieldDef[] = [
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
    key: "worldEra",
    label: "World era",
    options: [
      { value: "ancient / mythic", label: "Ancient / mythic" },
      { value: "medieval", label: "Medieval" },
      { value: "renaissance", label: "Renaissance" },
      { value: "industrial", label: "Industrial" },
      { value: "modern", label: "Modern" },
      { value: "far future", label: "Far future" },
      { value: "timeless", label: "Timeless / dreamlike" },
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
    key: "magicLevel",
    label: "Magic level",
    options: [
      { value: "no magic", label: "None — the world is mundane" },
      { value: "low magic", label: "Low — rare & mysterious" },
      { value: "standard fantasy", label: "Standard — as the books describe" },
      { value: "high magic", label: "High — spells & enchantments are common" },
      { value: "magic everywhere", label: "Saturated — the world is steeped in it" },
    ],
  },
];

const STORY_FIELDS: PrefsFieldDef[] = [
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
    key: "villain",
    label: "The force against you",
    options: [
      { value: "personal rival", label: "A personal rival" },
      { value: "criminal syndicate", label: "A criminal syndicate" },
      { value: "corrupt authority", label: "Corrupt authority" },
      { value: "ancient evil", label: "An ancient evil" },
      { value: "monstrous threat", label: "A monstrous threat" },
      { value: "rival adventurer", label: "A rival adventurer" },
      { value: "the wilds themselves", label: "The wilds themselves" },
      { value: "a dark prophecy", label: "A dark prophecy" },
    ],
  },
  {
    key: "stakes",
    label: "What's at stake",
    options: [
      { value: "personal", label: "Personal — your name, your past, your future" },
      { value: "a community", label: "A community — a village or town's survival" },
      { value: "a kingdom", label: "A kingdom — thrones and borders" },
      { value: "the world", label: "The world — the fate of all that lives" },
      { value: "the cosmos", label: "The cosmos — reality itself" },
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
];

const JOURNEY_FIELDS: PrefsFieldDef[] = [
  {
    key: "companions",
    label: "Company",
    options: [
      { value: "true solo", label: "True solo — lone wolf" },
      { value: "one companion", label: "One companion — a trusted sidekick" },
      { value: "small band", label: "Small band — a few allies" },
      {
        value: "as the adventure evolves",
        label: "Decided as the adventure evolves — the road introduces companions when the story needs them",
      },
      {
        value: "dice decides",
        label: "Decided by dice — roll when a companion might cross your path",
      },
    ],
  },
  {
    key: "pace",
    label: "Pace",
    options: [
      { value: "leisurely", label: "Leisurely — savor every scene" },
      { value: "steady", label: "Steady — balanced forward motion" },
      { value: "fast-paced", label: "Fast-paced — constant momentum" },
      { value: "breathless", label: "Breathless — one crisis after another" },
    ],
  },
  {
    key: "narrator",
    label: "Narrator's voice",
    options: [
      { value: "vivid literary", label: "Vivid & literary — rich sensory prose" },
      { value: "terse & noir", label: "Terse & noir — hard-boiled, clipped" },
      { value: "warm storyteller", label: "Warm storyteller — cozy, inviting" },
      { value: "dry humor", label: "Dry humor — wry, witty asides" },
      { value: "cinematic epic", label: "Cinematic epic — sweeping, dramatic beats" },
    ],
  },
];

const ALL_FIELDS: PrefsFieldDef[] = [...WORLD_FIELDS, ...STORY_FIELDS, ...JOURNEY_FIELDS];

function SectionCard({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">{title}</p>
          <p className="text-[11px] text-stone-400">{hint}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** Compact chips summarizing the chosen adventure setup (used on review screens). */
export function PrefsSummaryChips({ prefs }: { prefs: Partial<AdventurePrefs> }) {
  const p = prefsOf(prefs);
  const lifeModeName =
    p.lifeMode && p.lifeMode !== "all"
      ? GURPS_LIFE_MODES.find((m) => m.id === p.lifeMode)?.name ?? p.lifeMode
      : "";
  const chipRows: [string, string][] = [
    ...(lifeModeName ? ([["Life mode", lifeModeName]] as [string, string][]) : []),
    ["Genre", p.genre],
    ["Era", p.worldEra],
    ["Setting", p.setting],
    ["Magic", p.magicLevel],
    ["Tone", p.tone],
    ["Style", p.style],
    ["Villain", p.villain],
    ["Stakes", p.stakes],
    ["Difficulty", p.difficulty],
    ["Focus", p.focus],
    ["Company", p.companions],
    ["Pace", p.pace],
    ["Narrator", p.narrator],
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
        {p.premise && (
          <span className="max-w-full truncate rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Premise: {p.premise}
          </span>
        )}
      </div>
    </div>
  );
}

/** A scroll-styled preview of the exact briefing the GM will follow. */
function CampaignBriefing({ prefs }: { prefs: Partial<AdventurePrefs> }) {
  const p = prefsOf(prefs);
  const briefing = campaignBriefing(p);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50 via-[#fbf6ec] to-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-amber-200/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 size-40 rounded-full bg-orange-200/20 blur-2xl" />
      <div className="relative">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700/80">
            <ScrollText className="size-3.5" /> Campaign briefing · live preview
          </p>
          <span className="rounded-full bg-amber-600/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            The GM reads exactly this
          </span>
        </div>
        <p className="font-display text-xl font-semibold tracking-tight text-stone-900">
          {p.genre && p.tone ? `A ${p.tone} ${p.genre} tale` : "Your campaign"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{briefing}</p>
      </div>
    </div>
  );
}

/** GURPS Life Mode tag — a world tag that re-frames the Life & Livelihood
 *  extension. Picking an era filters the jobs, universities, social scenes,
 *  businesses and (cyber / medieval) content across the whole game: the Life
 *  panel, the chat resolver and the AI's rules context all follow it. */
function GurpsLifeModeTag({
  prefs,
  setPrefs,
}: {
  prefs: Partial<AdventurePrefs>;
  setPrefs: (v: Partial<AdventurePrefs>) => void;
}) {
  const mode = gurpsLifeModeOf(prefs);
  return (
    <div className="rounded-xl border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Tags className="size-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">GURPS · Life Mode tag</p>
          <p className="text-[11px] text-stone-400">
            This tag completely re-frames the Life &amp; Livelihood extension — jobs, universities, social scenes,
            businesses and worlds change to match. GURPS only.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {GURPS_LIFE_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setPrefs({ ...prefs, lifeMode: m.id as GurpsLifeMode })}
            className={cn(
              "rounded-xl border p-3 text-left transition-all duration-150",
              mode === m.id
                ? "border-emerald-500 bg-emerald-600/10 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                : "border-stone-200 bg-white hover:border-emerald-300 hover:shadow-sm",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={cn("text-sm font-bold", mode === m.id ? "text-emerald-900" : "text-stone-900")}>
                {m.name}
              </p>
              {mode === m.id && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Active
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">{m.tagline}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{m.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdventureSetupStep({
  prefs,
  setPrefs,
  system,
}: {
  prefs: Partial<AdventurePrefs>;
  setPrefs: (v: Partial<AdventurePrefs>) => void;
  system?: GameSystem;
}) {
  const randomize = () => {
    // The Life Mode tag is chosen deliberately (it re-frames the whole GURPS
    // life-sim) — the surprise roller never touches it.
    const next: Record<string, string | undefined> = { ...prefs };
    for (const f of ALL_FIELDS) {
      const pick = f.options[Math.floor(Math.random() * f.options.length)];
      next[f.key] = pick.value;
    }
    setPrefs(next as Partial<AdventurePrefs>);
  };

  const renderField = (f: PrefsFieldDef) => (
    <PickField
      key={f.key}
      label={f.label}
      value={prefs[f.key] ?? ""}
      onChange={(v) => setPrefs({ ...prefs, [f.key]: v })}
      options={f.options}
    />
  );

  return (
    <StepShell
      title="Adventure Setup"
      subtitle="Shape the campaign before it begins — the Game Master follows these directives and opens your story in the right world. Leave anything blank and the GM improvises it."
    >
      <CampaignBriefing prefs={prefs} />

      {system === "gurps" && <GurpsLifeModeTag prefs={prefs} setPrefs={setPrefs} />}

      <div className="flex items-center justify-between gap-3">
        <SectionLabel hint="Pick every field — each one shapes your opening">Directives</SectionLabel>
        <button
          type="button"
          onClick={randomize}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-100"
        >
          <Dices className="size-3.5" /> Surprise me
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <SectionCard
          icon={<Map className="size-4" />}
          title="The World"
          hint="Where and when your story begins"
        >
          {WORLD_FIELDS.map(renderField)}
        </SectionCard>

        <SectionCard
          icon={<Swords className="size-4" />}
          title="The Story"
          hint="The conflict that will hunt you down"
        >
          {STORY_FIELDS.map(renderField)}
        </SectionCard>

        <SectionCard
          icon={<Users className="size-4" />}
          title="The Journey"
          hint="How you travel, and who tells the tale"
        >
          {JOURNEY_FIELDS.map(renderField)}
        </SectionCard>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">Premise / hook</p>
              <p className="text-[11px] text-stone-400">Optional — your own spark for the GM to build on</p>
            </div>
          </div>
          <textarea
            value={prefs.premise ?? ""}
            onChange={(e) => setPrefs({ ...prefs, premise: e.target.value })}
            placeholder="e.g. The king's courier vanished on the Old Watchtower Road — the last thing he carried was a letter with your name on it."
            rows={3}
            className={cn(
              "w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200",
            )}
          />
        </div>
      </div>
    </StepShell>
  );
}
