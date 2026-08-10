import { cn } from "@/lib/utils";
import type { InventoryItem, Pf2eCharacter, Pf2eGearDef, Pf2eWeaponDef, Wallet } from "@/lib/rpg/types";
import { spToWallet, uid, walletToSp } from "@/lib/rpg/types";
import type { Pf2eDerived } from "@/lib/rpg/character";
import { PF2E_ARMORS, PF2E_GEAR, PF2E_WEAPONS } from "@/lib/rpg/data/pf2e";
import { Backpack, Coins, Plus, Shield, Sword } from "lucide-react";
import { toast } from "sonner";
import { InventoryEditor, WalletEditor } from "./GearPanel";

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
  disabled = false,
}: {
  name: string;
  price: string;
  bulk: string;
  tags: string[];
  summary?: string;
  onAdd: () => void;
  disabled?: boolean;
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
        disabled={disabled}
        className="flex size-6 shrink-0 items-center justify-center rounded border border-teal-500/50 text-teal-300 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-700"
        aria-label={`Buy ${name}${price !== "—" ? ` for ${price}` : ""}`}
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
  wallet,
  onWalletChange,
}: {
  character: Pf2eCharacter;
  derived: Pf2eDerived;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  onSetArmor: (id: string) => void;
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
}) {
  const armor = PF2E_ARMORS.find((a) => a.id === c.armorId) ?? PF2E_ARMORS[0];

  const canBuy = (price: number) => (wallet ? walletToSp(wallet) >= price : true);

  /** Equip a new armor — charges its price unless you already own/use it. */
  const equipArmor = (id: string) => {
    const def = PF2E_ARMORS.find((a) => a.id === id);
    if (!def) return;
    if (id === c.armorId) return;
    if (def.price > 0) {
      if (!wallet || !onWalletChange) {
        onSetArmor(id);
        return;
      }
      if (!canBuy(def.price)) {
        toast(`Not enough coin — ${spPrice(def.price)} needed for ${def.name}.`);
        return;
      }
      onWalletChange(spToWallet(walletToSp(wallet) - def.price));
      toast(`Purchased ${def.name} for ${spPrice(def.price)}.`);
    }
    onSetArmor(id);
  };

  /** Buy an item from the catalog: deduct its sp price from the purse, then add it. */
  const buyItem = (name: string, price: number) => {
    if (!wallet || !onWalletChange) {
      onInventoryChange([...inventory, { id: uid(), name, qty: 1 }]);
      return;
    }
    if (!canBuy(price)) {
      toast(`Not enough coin — ${spPrice(price)} needed.`);
      return;
    }
    onWalletChange(spToWallet(walletToSp(wallet) - price));
    onInventoryChange([...inventory, { id: uid(), name, qty: 1 }]);
    toast(`Purchased ${name} for ${spPrice(price)}.`);
  };

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
      {wallet && onWalletChange && <WalletEditor wallet={wallet} onChange={onWalletChange} compact />}

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
                onClick={() => equipArmor(a.id)}
                disabled={a.price > 0 && !canBuy(a.price) && a.id !== c.armorId}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left transition-colors",
                  active
                    ? "border-teal-400 bg-teal-400/15"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600",
                  a.price > 0 && !canBuy(a.price) && a.id !== c.armorId &&
                    "cursor-not-allowed opacity-40 hover:border-slate-800",
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
                  onAdd={() => buyItem(w.name, w.price)}
                  disabled={!canBuy(w.price)}
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
                  onAdd={() => buyItem(g.name, g.price)}
                  disabled={!canBuy(g.price)}
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
