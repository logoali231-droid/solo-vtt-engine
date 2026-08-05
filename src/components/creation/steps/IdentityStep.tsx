import { cn } from "@/lib/utils";
import type { CharacterIdentity } from "@/lib/rpg/types";
import { SectionLabel } from "../ui";

const FIELDS: {
  key: keyof CharacterIdentity;
  label: string;
  placeholder: string;
  wide?: boolean;
}[] = [
  { key: "gender", label: "Gender / presentation", placeholder: "e.g. woman, nonbinary…" },
  { key: "pronouns", label: "Pronouns", placeholder: "e.g. she/her" },
  { key: "sexuality", label: "Sexuality", placeholder: "e.g. bi, aroace, unknowable…" },
  { key: "age", label: "Age", placeholder: "e.g. 27" },
  { key: "height", label: "Height", placeholder: "e.g. 5'9\" / 175 cm" },
  { key: "weight", label: "Weight", placeholder: "e.g. 150 lb / 68 kg" },
  { key: "eyeColor", label: "Eye color", placeholder: "e.g. grey-green" },
  { key: "hairColor", label: "Hair color", placeholder: "e.g. copper red" },
  { key: "skinColor", label: "Skin tone", placeholder: "e.g. warm brown" },
  { key: "personality", label: "Personality", placeholder: "Traits, mannerisms, fears, sense of humor…", wide: true },
  { key: "features", label: "Distinguishing features", placeholder: "Scars, tattoos, jewelry, voice, smell…", wide: true },
];

export default function IdentityStep({
  identity,
  setIdentity,
}: {
  identity: Partial<CharacterIdentity>;
  setIdentity: (v: Partial<CharacterIdentity>) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <SectionLabel>Identity &amp; appearance</SectionLabel>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-stone-400">
        These details shape how the Game Master describes and roleplays your hero. Leave anything
        blank and the GM will improvise it.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={cn(f.wide && "sm:col-span-2")}>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-stone-400">
              {f.label}
            </label>
            {f.wide ? (
              <textarea
                value={identity[f.key] ?? ""}
                onChange={(e) => setIdentity({ ...identity, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                rows={2}
                className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            ) : (
              <input
                value={identity[f.key] ?? ""}
                onChange={(e) => setIdentity({ ...identity, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
