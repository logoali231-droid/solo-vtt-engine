import type { CharacterIdentity } from "@/lib/rpg/types";
import { identityOf } from "@/lib/rpg/types";

/** Compact identity strip rendered inside each themed sheet header. */
export default function IdentityChips({
  identity,
  tone = "light",
}: {
  identity: Partial<CharacterIdentity> | undefined;
  tone?: "light" | "dark" | "amber";
}) {
  const i = identityOf(identity);
  const parts: string[] = [];
  if (i.pronouns) parts.push(i.pronouns);
  if (i.gender) parts.push(i.gender);
  if (i.sexuality) parts.push(i.sexuality);
  if (i.age) parts.push(`${i.age} yrs`);
  if (i.height || i.weight) parts.push([i.height, i.weight].filter(Boolean).join(" · "));
  if (i.eyeColor) parts.push(`${i.eyeColor} eyes`);
  if (i.hairColor) parts.push(`${i.hairColor} hair`);
  if (i.skinColor) parts.push(`${i.skinColor} skin`);

  const toneCls =
    tone === "amber"
      ? "text-amber-600/70"
      : tone === "dark"
        ? "text-slate-500"
        : "text-[#8a7444]";

  if (parts.length === 0) return null;
  return (
    <p className={`mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[9px] ${toneCls}`}>
      {parts.map((p, idx) => (
        <span key={idx} className="capitalize">
          {p}
        </span>
      ))}
    </p>
  );
}
