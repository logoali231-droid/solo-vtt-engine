import { cn } from "@/lib/utils";
import type { DnDCharacter, InventoryItem } from "@/lib/rpg/types";
import { uid } from "@/lib/rpg/types";
import type { DndDerived } from "@/lib/rpg/character";
import { formatMod } from "@/lib/rpg/dice";
import { ARMORS, ARMOR_MAP, WEAPONS } from "@/lib/rpg/data/dnd";
import { Backpack, Minus, Plus, Shield, Sword, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  character: DnDCharacter;
  derived: DndDerived;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  onSetWeapon: (id: string) => void;
  onSetArmor: (id: string) => void;
  onToggleShield: () => void;
  onAttack: (attackId: string) => void;
}

export default function GearPanel({ character: c, derived: d, inventory, onInventoryChange, onSetWeapon, onSetArmor, onToggleShield, onAttack }: Props) {
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

      <InventoryEditor inventory={inventory} onChange={onInventoryChange} />
    </div>
  );
}

export function InventoryEditor({
  inventory,
  onChange,
}: {
  inventory: InventoryItem[];
  onChange: (items: InventoryItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const existing = inventory.find((i) => i.name.toLowerCase() === n.toLowerCase());
    if (existing) {
      onChange(inventory.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + Math.max(1, qty) } : i)));
    } else {
      onChange([...inventory, { id: uid(), name: n, qty: Math.max(1, qty) }]);
    }
    setName("");
    setQty(1);
  };

  const changeQty = (id: string, delta: number) => {
    onChange(
      inventory.map((i) => {
        if (i.id !== id) return i;
        const next = i.qty + delta;
        return next <= 0 ? { ...i, qty: 0 } : { ...i, qty: next };
      }),
    );
  };

  const remove = (id: string) => onChange(inventory.filter((i) => i.id !== id));

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
        <Backpack className="size-3.5" /> Inventory ({inventory.length})
      </p>
      <div className="mb-2 flex gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="Item name"
          placeholder="Item — rope, potion, key…"
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
        <input
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          type="number"
          aria-label="Quantity"
          min={1}
          className="h-9 w-14 rounded-lg border border-slate-800 bg-slate-950 px-2 text-center text-xs text-slate-100 outline-none focus:border-amber-500/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={!name.trim()}
          className="flex h-9 items-center gap-1 rounded-lg bg-amber-500 px-3 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {inventory.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-[11px] text-slate-600">
            Your pack is empty. Add loot, tools and quest items here.
          </p>
        )}
        {inventory.map((i) => (
          <div
            key={i.id}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5",
              i.qty === 0 && "opacity-50",
            )}
          >
            <span className="min-w-0 truncate text-xs font-medium text-slate-200">{i.name}</span>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => changeQty(i.id, -1)}
                className="flex size-6 items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-slate-200">
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center font-mono text-xs font-bold text-slate-100">{i.qty}</span>
              <button type="button" onClick={() => changeQty(i.id, 1)}
                className="flex size-6 items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-slate-200">
                <Plus className="size-3" />
              </button>
              <button type="button" onClick={() => remove(i.id)}
                className="ml-1 flex size-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
