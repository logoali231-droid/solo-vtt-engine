import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import type { CharacterIdentity } from "@/lib/rpg/types";
import { SectionLabel } from "../ui";

/** Sentinel value that switches a pick-list field into custom-entry mode. */
const CUSTOM = "__custom__";

interface PickField {
  key: keyof CharacterIdentity;
  label: string;
  options: { value: string; label: string }[];
}

/** Canonical pick-lists — the Game Master reads exactly these strings, so no
 *  free-text typos or paraphrasing ever reaches the AI or the sheet. */
const PICK_FIELDS: PickField[] = [
  {
    key: "gender",
    label: "Gender / presentation",
    options: [
      { value: "woman", label: "Woman" },
      { value: "man", label: "Man" },
      { value: "nonbinary", label: "Nonbinary" },
      { value: "genderfluid", label: "Genderfluid" },
      { value: "agender", label: "Agender" },
      { value: "trans woman", label: "Trans woman" },
      { value: "trans man", label: "Trans man" },
      { value: "androgynous", label: "Androgynous" },
    ],
  },
  {
    key: "pronouns",
    label: "Pronouns",
    options: [
      { value: "she/her", label: "She / her" },
      { value: "he/him", label: "He / him" },
      { value: "they/them", label: "They / them" },
      { value: "she/they", label: "She / they" },
      { value: "he/they", label: "He / they" },
      { value: "it/its", label: "It / its" },
      { value: "any", label: "Any" },
    ],
  },
  {
    key: "sexuality",
    label: "Sexuality",
    options: [
      { value: "straight", label: "Straight" },
      { value: "gay", label: "Gay" },
      { value: "lesbian", label: "Lesbian" },
      { value: "bisexual", label: "Bisexual" },
      { value: "pansexual", label: "Pansexual" },
      { value: "asexual", label: "Asexual" },
      { value: "aromantic", label: "Aromantic" },
      { value: "aromantic asexual", label: "Aromantic asexual (aroace)" },
      { value: "queer", label: "Queer" },
      { value: "unknowable", label: "Unknowable / divine" },
    ],
  },
  {
    key: "age",
    label: "Age",
    options: [
      { value: "young (late teens)", label: "Young — late teens" },
      { value: "young adult (20s)", label: "Young adult — 20s" },
      { value: "adult (30s–40s)", label: "Adult — 30s–40s" },
      { value: "middle-aged (50s–60s)", label: "Middle-aged — 50s–60s" },
      { value: "elderly (70+)", label: "Elderly — 70+" },
      { value: "ageless / immortal", label: "Ageless / immortal" },
    ],
  },
  {
    key: "height",
    label: "Height",
    options: [
      { value: "very short", label: "Very short" },
      { value: "short", label: "Short" },
      { value: "average", label: "Average" },
      { value: "tall", label: "Tall" },
      { value: "very tall", label: "Very tall" },
    ],
  },
  {
    key: "weight",
    label: "Weight / build",
    options: [
      { value: "slight / slender", label: "Slight / slender" },
      { value: "average", label: "Average" },
      { value: "sturdy", label: "Sturdy" },
      { value: "heavy / broad", label: "Heavy / broad" },
    ],
  },
  {
    key: "eyeColor",
    label: "Eye color",
    options: [
      { value: "brown", label: "Brown" },
      { value: "blue", label: "Blue" },
      { value: "green", label: "Green" },
      { value: "hazel", label: "Hazel" },
      { value: "grey", label: "Grey" },
      { value: "amber", label: "Amber" },
      { value: "black", label: "Black" },
      { value: "violet", label: "Violet" },
      { value: "heterochromia", label: "Heterochromia (two colors)" },
    ],
  },
  {
    key: "hairColor",
    label: "Hair color",
    options: [
      { value: "black", label: "Black" },
      { value: "brown", label: "Brown" },
      { value: "blonde", label: "Blonde" },
      { value: "red", label: "Red" },
      { value: "grey / white", label: "Grey / white" },
      { value: "silver", label: "Silver" },
      { value: "dyed", label: "Dyed (blue, pink…)" },
      { value: "bald", label: "Bald" },
    ],
  },
  {
    key: "skinColor",
    label: "Skin tone",
    options: [
      { value: "fair", label: "Fair" },
      { value: "light", label: "Light" },
      { value: "medium", label: "Medium" },
      { value: "olive", label: "Olive" },
      { value: "tan", label: "Tan" },
      { value: "brown", label: "Brown" },
      { value: "dark brown", label: "Dark brown" },
      { value: "deep", label: "Deep" },
    ],
  },
];

/** Open-ended prose — too creative to enumerate, so these stay free-text. */
const PROSE_FIELDS: { key: keyof CharacterIdentity; label: string; placeholder: string }[] = [
  {
    key: "personality",
    label: "Personality",
    placeholder: "Traits, mannerisms, fears, sense of humor…",
  },
  {
    key: "features",
    label: "Distinguishing features",
    placeholder: "Scars, tattoos, jewelry, voice, smell…",
  },
];

const fieldCls =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

export default function IdentityStep({
  identity,
  setIdentity,
}: {
  identity: Partial<CharacterIdentity>;
  setIdentity: (v: Partial<CharacterIdentity>) => void;
}) {
  // Explicit custom-mode flags: "Custom…" with an EMPTY value must still show
  // the text input (deriving mode from the value alone can't tell "empty
  // custom" apart from "nothing chosen yet").
  const [customKeys, setCustomKeys] = useState<Record<string, boolean>>({});

  const isInList = (key: keyof CharacterIdentity, value: string) =>
    PICK_FIELDS.find((p) => p.key === key)?.options.some((o) => o.value === value) ?? false;

  const exitCustom = (key: keyof CharacterIdentity) => {
    setCustomKeys((prev) => ({ ...prev, [key]: false }));
    setIdentity({ ...identity, [key]: "" });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <SectionLabel>Identity &amp; appearance</SectionLabel>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-stone-400">
        Pick from the lists so the Game Master reads <span className="font-semibold text-stone-500">exactly</span> what
        you choose — no typos, no guessing. Choose “Custom…” only if you need something off-list. Personality and
        features are free-form, since those are yours to write. Leave anything blank and the GM will improvise it.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PICK_FIELDS.map((f) => {
          const value = identity[f.key] ?? "";
          const customMode = customKeys[f.key] === true || (value !== "" && !isInList(f.key, value));
          return (
            <div key={f.key}>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-stone-400">
                {f.label}
              </label>
              {customMode ? (
                <div className="relative">
                  <input
                    value={value}
                    onChange={(e) => setIdentity({ ...identity, [f.key]: e.target.value })}
                    placeholder="Type your own…"
                    autoFocus
                    className={cn(fieldCls, "border-amber-400 pr-10")}
                  />
                  <button
                    type="button"
                    title="Clear and pick from the list"
                    onClick={() => exitCustom(f.key)}
                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={value}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next === CUSTOM) {
                        // Reveal the custom input; keep the field empty until typed.
                        setCustomKeys((prev) => ({ ...prev, [f.key]: true }));
                        setIdentity({ ...identity, [f.key]: "" });
                      } else {
                        setCustomKeys((prev) => ({ ...prev, [f.key]: false }));
                        setIdentity({ ...identity, [f.key]: next });
                      }
                    }}
                    className={cn(fieldCls, "cursor-pointer appearance-none pr-8", value === "" && "text-stone-400")}
                  >
                    <option value="" disabled>
                      Choose…
                    </option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value} className="text-stone-900">
                        {o.label}
                      </option>
                    ))}
                    <option value={CUSTOM} className="text-stone-900">
                      Custom…
                    </option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                </div>
              )}
            </div>
          );
        })}
        {PROSE_FIELDS.map((f) => (
          <div key={f.key} className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-stone-400">
              {f.label}
            </label>
            <textarea
              value={identity[f.key] ?? ""}
              onChange={(e) => setIdentity({ ...identity, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              rows={2}
              className={cn(fieldCls, "resize-none")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
