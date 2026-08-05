import { cn } from "@/lib/utils";
import type { DnDCharacter } from "@/lib/rpg/types";
import type { DndDerived } from "@/lib/rpg/character";
import { formatMod } from "@/lib/rpg/dice";
import { ARMORS, ARMOR_MAP, WEAPONS, WEAPON_MAP } from "@/lib/rpg/data/dnd";
import { Shield, Sword } from "lucide-react";

interface Props {
  character: DnDCharacter;
  derived: DndDerived;
  onSetWeapon: (id: string) => void;
  onSetArmor: (id: string) => void;
  onToggleShield: () => void;
  onAttack: (attackId: string) => void;
}

export default function GearPanel({ character: c, derived: d, onSetWeapon, onSetArmor, onToggleShield, onAttack }: Props) {
  const weapon = WEAPON_MAP[c.weaponId];
  const armor = ARMOR_MAP[c.armorId];

  return (
    <div className="flex flex-col gap-4">
      {/* Attack cards */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Sword className="size-3.5" /> Attacks
        </p>
        <div className="flex flex-col gap-2">
          {d.attacks.map((a) => {
            const toHit = d.mods[a.ability] + d.profBonus;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAttack(a.id)}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-all hover:border-amber-500/50 hover:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{a.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {a.count}×d{a.sides} {a.range && `· ${a.range}`} · {a.properties.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-amber-300">
                    +{toHit} <span className="text-xs text-slate-500">to hit</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {a.count}d{a.sides}{formatMod(d.mods[a.ability])}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weapon slot */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Weapon Slot</p>
        <div className="flex flex-wrap gap-1.5">
          {WEAPONS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSetWeapon(w.id)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                c.weaponId === w.id
                  ? "border-amber-500/70 bg-amber-500/10 text-amber-200"
                  : "border-slate-800 text-slate-400 hover:border-slate-600",
              )}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* Armor slot */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Shield className="size-3.5" /> Armor Slot · AC {d.ac}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ARMORS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSetArmor(a.id)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                c.armorId === a.id
                  ? "border-amber-500/70 bg-amber-500/10 text-amber-200"
                  : "border-slate-800 text-slate-400 hover:border-slate-600",
              )}
            >
              {a.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggleShield}
          className={cn(
            "mt-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            c.shield
              ? "border-amber-500/70 bg-amber-500/10 text-amber-200"
              : "border-slate-800 text-slate-400 hover:border-slate-600",
          )}
        >
          Shield {c.shield ? "equipped (+2 AC)" : "—"}
        </button>
        {armor.stealthDis && (
          <p className="mt-2 text-[10px] text-slate-500">{armor.note ?? "Disadvantage on Stealth (bulky armor)"}</p>
        )}
      </div>
    </div>
  );
}
