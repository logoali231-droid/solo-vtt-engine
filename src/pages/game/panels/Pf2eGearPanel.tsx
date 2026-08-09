import { cn } from "@/lib/utils";
import type { InventoryItem, Pf2eCharacter, Pf2eGearDef, Pf2eWeaponDef } from "@/lib/rpg/types";
import { uid } from "@/lib/rpg/types";
import type { Pf2eDerived } from "@/lib/rpg/character";
import { PF2E_ARMORS, PF2E_GEAR, PF2E_WEAPONS } from "@/lib/rpg/data/pf2e";
import { Backpack, Coins, Plus, Shield, Sword } from "lucide-react";
import { InventoryEditor } from "./GearPanel";

function spPrice(sp: number): string {
  if (sp <= 0) return "—";
  if (sp % 100 === 0) return `${sp / 100} gp`;
  if (sp >= 100) return `${Math.floor(sp / 100)} gp ${sp % 100} sp`;
  return `${sp} sp`;
}

function ShopItem({
  name,
  price,
  bulk,
  tags,
  summary,
  onAdd,
}: {
  name: string;
  price: string;
  bulk: string;
  tags: string[];
  summary?: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-200">
          {name}
          <span className="ml-1.5 font-mono text-[9px] text-slate-500">{price}</span>
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {tags.join(" · ")}{bulk !== "—" ? ` · Bulk ${bulk}` : ""}
        </p>
        {summary && <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500/80">{summary}</p>}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex size-6 shrink-0 items-center justify-center rounded border border-teal-500/50 text-teal-300 transition-colors hover:bg-teal-500/20"
        aria-label={`Add ${name} to inventory`}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export default function Pf2eGearPanel({
  character: c,
  derived: d,
  inventory,
  onInventoryChange,
  onSetArmor,
}: {
  character: Pf2eCharacter;
  derived: Pf2eDerived;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  onSetArmor: (id: string) => void;
}) {
  const armor = PF2E_ARMORS.find((a) => a.id === c.armorId) ?? PF2E_ARMORS[0];

  const addItem = (name: string, qty = 1) =>
    onInventoryChange([...inventory, { id: uid(), name, qty }]);

  const weaponGroups: { label: string; items: Pf2eWeaponDef[] }[] = [
    { label: "Simple weapons", items: PF2E_WEAPONS.filter((w) => w.category === "simple") },
    { label: "Martial weapons", items: PF2E_WEAPONS.filter((w) => w.category === "martial") },
  ];

  const gearGroups: { label: string; items: Pf2eGearDef[] }[] = [
    { label: "Adventuring gear", items: PF2E_GEAR.filter((g) => g.category === "adventuring" || g.category === "consumable") },
    { label: "Tools", items: PF2E_GEAR.filter((g) => g.category === "tool") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Armor */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Shield className="size-3.5" /> Armor · AC {d.ac}
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PF2E_ARMORS.map((a) => {
            const active = a.id === c.armorId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSetArmor(a.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-teal-400 bg-teal-400/15"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600",
                )}
              >
                <p className={cn("text-[11px] font-semibold", active ? "text-teal-200" : "text-slate-300")}>{a.name}</p>
                <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                  +{a.acBonus} AC · {a.category} · {spPrice(a.price)}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">
          Equipped: <span className="text-slate-300">{armor.name}</span> — your Dexterity modifier contributes{" "}
          {Math.min(Math.max(0, d.mods.dex), armor.dexCap ?? 99) >= 0 ? "+" : ""}
          {Math.min(Math.max(0, d.mods.dex), armor.dexCap ?? 99)} to AC.
        </p>
      </div>

      {/* Weapons */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Sword className="size-3.5" /> Weapons
        </p>
        {weaponGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{group.label}</p>
            <div className="flex flex-col gap-1.5">
              {group.items.map((w) => (
                <ShopItem
                  key={w.id}
                  name={w.name}
                  price={spPrice(w.price)}
                  bulk={w.bulk}
                  tags={[`${w.damageDice} ${w.damageType}`, w.hands === 2 ? "Two-handed" : "One-handed", ...w.traits]}
                  onAdd={() => addItem(w.name)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gear catalog */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Backpack className="size-3.5" /> Gear catalog
        </p>
        {gearGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{group.label}</p>
            <div className="flex flex-col gap-1.5">
              {group.items.map((g) => (
                <ShopItem
                  key={g.id}
                  name={g.name}
                  price={spPrice(g.price)}
                  bulk={g.bulk}
                  tags={[g.category]}
                  summary={g.summary}
                  onAdd={() => addItem(g.name)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Inventory */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Coins className="size-3.5" /> Carried loot
        </p>
        <InventoryEditor inventory={inventory} onChange={onInventoryChange} />
      </div>
    </div>
  );
}
