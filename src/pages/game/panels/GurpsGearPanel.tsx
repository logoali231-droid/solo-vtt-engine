import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type {
  GurpsCharacter,
  GurpsLifeMode,
  InventoryItem,
  Wallet,
} from "@/lib/rpg/types";
import { gurpsLifeModeOf, GURPS_LIFE_MODES } from "@/lib/rpg/types";
import type { GurpsDerived } from "@/lib/rpg/character";
import { GURPS_ARMOR_MAP } from "@/lib/rpg/data/gurps";
import {
  fmtGurpsPrice,
  generateGurpsShop,
  GURPS_QUALITY_LABELS,
  gurpsPointTotal,
  type GurpsQuality,
  type GurpsShopItem,
} from "@/lib/rpg/data/gurps-shop";
import { InventoryEditor, WalletEditor } from "./GearPanel";
import {
  Backpack,
  Coins,
  FlaskConical,
  Gem,
  Landmark,
  RefreshCw,
  Shield,
  ShoppingBag,
  Store,
  Sword,
} from "lucide-react";
import { toast } from "sonner";
import { uid } from "@/lib/rpg/types";

const QUALITY_STYLE: Record<GurpsQuality, string> = {
  standard: "border-amber-800/50 text-amber-500",
  fine: "border-teal-500/40 text-teal-300",
  masterwork: "border-violet-500/40 text-violet-300",
};

function ShopRow({
  item,
  equipped = false,
  onBuy,
  canAfford,
}: {
  item: GurpsShopItem;
  equipped?: boolean;
  onBuy: () => void;
  canAfford: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-900/40 bg-[#1c1810] px-2.5 py-2">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-amber-100">
          {item.name}
          <span
            className={cn(
              "rounded border px-1 py-px text-[8px] font-bold uppercase tracking-wide",
              QUALITY_STYLE[item.quality],
            )}
          >
            {GURPS_QUALITY_LABELS[item.quality]}
          </span>
          {item.damageText && (
            <span className="rounded bg-red-500/10 px-1 py-px font-mono text-[8px] font-bold text-red-300">
              {item.damageText}
            </span>
          )}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-amber-600/60">
          {item.description}
        </p>
        <p className="mt-0.5 text-[8px] font-mono text-amber-700/50">
          {item.tags.join(" · ")}
          {item.weight && item.weight !== "—" ? ` · ${item.weight}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {equipped && (
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-300">
            Equipped
          </span>
        )}
        <button
          type="button"
          onClick={onBuy}
          disabled={!canAfford || equipped}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors",
            canAfford && !equipped
              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
              : "cursor-not-allowed border border-amber-900/40 text-amber-700/50",
          )}
          aria-label={`Buy ${item.name} for ${fmtGurpsPrice(item.price)}`}
        >
          <Gem className="size-3" /> {fmtGurpsPrice(item.price)}
        </button>
      </div>
    </div>
  );
}

interface Props {
  character: GurpsCharacter;
  derived: GurpsDerived;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  /** Equip armor — sets the character's armor slot (feeds DR). */
  onSetArmor: (id: string) => void;
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
}

export default function GurpsGearPanel({
  character: c,
  derived: d,
  inventory,
  onInventoryChange,
  onSetArmor,
  wallet,
  onWalletChange,
}: Props) {
  const mode: GurpsLifeMode = gurpsLifeModeOf(c.adventurePrefs);
  const modeDef = GURPS_LIFE_MODES.find((m) => m.id === mode) ?? GURPS_LIFE_MODES[3];
  const points = gurpsPointTotal(c);

  const [stock, setStock] = useState<GurpsShopItem[]>(() => generateGurpsShop(c, mode));
  useEffect(() => {
    setStock(generateGurpsShop(c, mode));
  }, [points, mode]);

  const equippedArmor = GURPS_ARMOR_MAP[c.armorId];
  const canAfford = (price: number) => (wallet ? wallet.gp >= price : true);

  const spend = (price: number): boolean => {
    if (!wallet || !onWalletChange) return true;
    if (wallet.gp < price) return false;
    onWalletChange({ ...wallet, gp: wallet.gp - price });
    return true;
  };

  const addToPack = (name: string) => {
    const existing = inventory.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onInventoryChange(
        inventory.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + 1 } : i)),
      );
    } else {
      onInventoryChange([...inventory, { id: uid(), name, qty: 1 }]);
    }
  };

  /** Buy an item — deduct gp, add to the pack, equip armor into the slot. */
  const buy = (item: GurpsShopItem) => {
    if (item.armorId && c.armorId === item.armorId) return;
    if (!spend(item.price)) {
      toast(`Not enough coin — ${fmtGurpsPrice(item.price)} needed for ${item.name}.`);
      return;
    }
    if (item.armorId) {
      onSetArmor(item.armorId);
      toast(`Equipped ${item.name} for ${fmtGurpsPrice(item.price)} — DR ${item.dr}.`);
      return;
    }
    addToPack(item.name);
    toast(`Bought ${item.name} for ${fmtGurpsPrice(item.price)}.`);
  };

  const groups: { label: string; icon: React.ReactNode; items: GurpsShopItem[] }[] = [
    { label: "Weapons", icon: <Sword className="size-3.5" />, items: stock.filter((i) => i.category === "weapon") },
    { label: "Gear", icon: <Backpack className="size-3.5" />, items: stock.filter((i) => i.category === "gear") },
    { label: "Consumables", icon: <FlaskConical className="size-3.5" />, items: stock.filter((i) => i.category === "consumable") },
    { label: "Life extras", icon: <Landmark className="size-3.5" />, items: stock.filter((i) => i.category === "life") },
  ];

  return (
    <div className="flex flex-col gap-4">
      {wallet && onWalletChange && <WalletEditor wallet={wallet} onChange={onWalletChange} compact />}

      {/* Armor — equips the DR engine directly */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Shield className="size-3.5" /> Armor · DR {d.dr}
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {stock
            .filter((i) => i.category === "armor")
            .map((a) => {
              const active = a.armorId === c.armorId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => buy(a)}
                  disabled={a.armorId === c.armorId}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-amber-900/40 bg-[#1c1810] hover:border-amber-600",
                    a.armorId === c.armorId && "cursor-default",
                  )}
                >
                  <p className={cn("text-[11px] font-semibold", active ? "text-emerald-200" : "text-amber-100")}>
                    {a.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-amber-600/60">
                    DR {a.dr} · {a.weight} · {fmtGurpsPrice(a.price)}
                  </p>
                  {a.quality !== "standard" && (
                    <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-teal-300">
                      {GURPS_QUALITY_LABELS[a.quality]}
                    </p>
                  )}
                </button>
              );
            })}
        </div>
        <p className="mt-1.5 text-[10px] text-amber-600/60">
          Equipped: <span className="text-amber-300">{equippedArmor.name}</span> — armor DR flows into the
          sheet's DR box automatically.
        </p>
      </div>

      {/* Shop header */}
      <div className="rounded-xl border border-amber-900/40 bg-[#14110b] p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
              <Store className="size-3.5" /> Gear & Goods
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-amber-600/60">
              Stocked for a <span className="font-semibold text-amber-300">{points} pt</span> build in the{" "}
              <span className="font-semibold text-teal-300">{modeDef.name}</span> world — more points, better
              (and pricier) gear on the shelves.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStock(generateGurpsShop(c, mode))}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-700/60 px-2.5 py-1.5 text-[10px] font-semibold text-amber-300 transition-colors hover:border-amber-500 hover:text-amber-200"
            aria-label="Restock the shop"
          >
            <RefreshCw className="size-3" /> Restock
          </button>
        </div>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] text-amber-700/50">
          <ShoppingBag className="size-3" /> Prices in the mechanical gp purse. Weapons follow your trained
          skills; armor equips straight into the DR engine.
        </p>
        <div className="flex flex-col gap-3">
          {groups.map((g) =>
            g.items.length > 0 ? (
              <div key={g.label}>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                  {g.icon} {g.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {g.items.map((item) => (
                    <ShopRow
                      key={item.id}
                      item={item}
                      canAfford={canAfford(item.price)}
                      onBuy={() => buy(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null,
          )}
          {stock.filter((i) => i.category === "weapon").length === 0 && (
            <p className="rounded-lg border border-dashed border-amber-900/40 p-3 text-center text-[10px] text-amber-700/50">
              No weapons on the shelves for this world — the smithy works other trades.
            </p>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Coins className="size-3.5" /> Carried loot
        </p>
        <InventoryEditor inventory={inventory} onChange={onInventoryChange} />
      </div>
    </div>
  );
}
