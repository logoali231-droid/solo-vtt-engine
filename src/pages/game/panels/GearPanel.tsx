import { cn } from "@/lib/utils";
import type { DnDCharacter, InventoryItem, Wallet } from "@/lib/rpg/types";
import { fmtWallet, spToWallet, uid, walletToSp } from "@/lib/rpg/types";
import type { DndDerived } from "@/lib/rpg/character";
import { formatMod } from "@/lib/rpg/dice";
import { ARMORS, ARMOR_MAP, CLASS_MAP, WEAPONS, WEAPON_MAP } from "@/lib/rpg/data/dnd";
import {
  DND_RARITY_LABELS,
  ENCHANT_PROPERTIES,
  ENCHANT_TIERS,
  enchantCost,
  enchantDc,
  enchantPropertyCost,
  fmtShopPrice,
  generateDndShop,
  type DndRarity,
  type DndShopItem,
  type EnchantTarget,
} from "@/lib/rpg/data/dnd-shop";
import {
  Backpack,
  Coins,
  FlaskConical,
  Gem,
  Minus,
  Plus,
  RefreshCw,
  Shield,
  ShoppingBag,
  Store,
  Sword,
  Trash2,
  Wand2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface Props {
  character: DnDCharacter;
  derived: DndDerived;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  onSetWeapon: (id: string) => void;
  onSetArmor: (id: string) => void;
  onToggleShield: () => void;
  onAttack: (attackId: string) => void;
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
  onSetMagicWeapon?: (id: string, bonus: number) => void;
  onSetMagicArmor?: (id: string, bonus: number) => void;
  onSetMagicShield?: (bonus: number) => void;
  onEnchant?: (target: EnchantTarget, tier: 1 | 2 | 3) => void;
  onEnchantProperty?: (propId: string) => void;
  /** Strip the infused property off the weapon — it is lost, but the slot frees up. */
  onStripProperty?: () => void;
}

export default function GearPanel({ character: c, derived: d, inventory, onInventoryChange, onSetWeapon, onSetArmor, onToggleShield, onAttack, wallet, onWalletChange, onSetMagicWeapon, onSetMagicArmor, onSetMagicShield, onEnchant, onEnchantProperty, onStripProperty }: Props) {
  const armor = ARMOR_MAP[c.armorId];
  // The shop stock regenerates whenever the hero changes (level, class,
  // subclass) and on manual restock — derived state, no effect needed.
  const [stockVersion, setStockVersion] = useState(0);
  // stockVersion intentionally forces a re-roll on the manual “Restock” button —
  // generateDndShop is random, so re-running it must be a state change, not a
  // pure recompute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stock = useMemo(() => generateDndShop(c), [c, stockVersion]);

  return (
    <div className="flex flex-col gap-4">
      {wallet && onWalletChange && <WalletEditor wallet={wallet} onChange={onWalletChange} />}

      {/* Attack cards */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Sword className="size-3.5" /> Attacks
        </p>
        <div className="flex flex-col gap-2">
          {d.attacks.map((a) => {
            const toHit = d.mods[a.ability] + d.profBonus + (a.enchant ?? 0);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onAttack(a.id)}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-all hover:border-amber-500/50 hover:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {a.name}
                    {(a.enchant ?? 0) > 0 && (
                      <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                        Magic +{a.enchant}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {a.count}×d{a.sides} {a.range && `· ${a.range}`} · {a.properties.join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-amber-300">
                    +{toHit} <span className="text-xs text-slate-500">to hit</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {a.count}d{a.sides}{formatMod(d.mods[a.ability] + (a.enchant ?? 0))}
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
        {(c.magicWeaponBonus ?? 0) > 0 && (
          <p className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[10px] text-amber-300/90">
            Magic weapon equipped from the shop — +{c.magicWeaponBonus} to attack and damage rolls.
            Pick a mundane weapon above to unequip the enchantment.
          </p>
        )}
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
        {(c.magicArmorBonus ?? 0) > 0 && (
          <p className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[10px] text-amber-300/90">
            Magic armor from the shop — +{c.magicArmorBonus} AC. Pick mundane armor above to unequip it.
          </p>
        )}
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
          Shield {c.shield ? `equipped (+${2 + (c.magicShieldBonus ?? 0)} AC)` : "—"}
        </button>
        {(c.magicShieldBonus ?? 0) > 0 && (
          <p className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[10px] text-amber-300/90">
            Magic shield from the shop — +{c.magicShieldBonus} AC on top of the shield's +2. Toggle the
            shield off to stow it.
          </p>
        )}
        {armor.stealthDis && (
          <p className="mt-2 text-[10px] text-slate-500">{armor.note ?? "Disadvantage on Stealth (bulky armor)"}</p>
        )}
      </div>

      {/* Enchanting Bench — the player's own arcane forge. Every rule here is
          local: tier gates, material costs, DCs and the d20 + Int + prof check
          all resolve through the app's dice engine. The AI never decides gear. */}
      {onEnchant && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-300">
            <Wand2 className="size-3.5" /> Enchanting Bench
          </p>
          <p className="mb-2 text-[10px] leading-relaxed text-slate-500">
            Pay the materials, then the dice engine rolls <span className="font-semibold text-slate-300">d20 + Int + prof</span>{" "}
            vs the tier DC — success weaves the magic into the equipped piece, failure spends the materials.
            {c.classId === "artificer" && (
              <span className="ml-1 font-semibold text-violet-300">Artificer: −2 DC on every check.</span>
            )}
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                { target: "weapon" as const, label: "Weapon", base: WEAPON_MAP[c.weaponId]?.name ?? "—", current: c.magicWeaponBonus ?? 0, disabled: false },
                { target: "armor" as const, label: "Armor", base: c.armorId === "none" ? "Unarmored" : (ARMOR_MAP[c.armorId]?.name ?? "—"), current: c.magicArmorBonus ?? 0, disabled: c.armorId === "none" },
                { target: "shield" as const, label: "Shield", base: "Shield", current: c.magicShieldBonus ?? 0, disabled: !c.shield },
              ]
            ).map((row) => (
              <div key={row.target} className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                <p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-slate-200">
                  {row.label}: {row.base}
                  {row.current > 0 ? (
                    <span className="rounded bg-violet-500/20 px-1 py-px text-[9px] font-bold text-violet-300">
                      magic +{row.current}
                    </span>
                  ) : (
                    <span className="text-[9px] font-normal uppercase tracking-wide text-slate-600">mundane</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ENCHANT_TIERS.map((t) => {
                    const locked = c.level < t.minLevel || row.disabled;
                    return (
                      <button
                        key={t.bonus}
                        type="button"
                        disabled={locked}
                        onClick={() => onEnchant(row.target, t.bonus)}
                        title={locked ? (row.disabled ? "Equip this slot first" : `Requires level ${t.minLevel}`) : `Cost ${fmtShopPrice(enchantCost(c, row.target, t))} · DC ${enchantDc(c, t)}`}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors",
                          locked
                            ? "cursor-not-allowed border-slate-800 text-slate-700"
                            : "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:border-violet-400 hover:bg-violet-500/20",
                        )}
                      >
                        {t.label}
                        <span className="ml-1 font-normal text-slate-500">
                          {fmtShopPrice(enchantCost(c, row.target, t))} · DC {enchantDc(c, t)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Property Infusion — minor weapon properties, resolved by the dice engine */}
          {onEnchantProperty && (
            <div className="mt-3 border-t border-violet-500/20 pt-2">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/80">
                  Property Infusion — weapon only
                </p>
                {c.weaponProperty && onStripProperty && (
                  <button
                    type="button"
                    onClick={() => {
                      onStripProperty();
                      toast("Property stripped from the weapon — the slot is free.");
                    }}
                    className="shrink-0 rounded border border-red-500/40 px-1.5 py-0.5 text-[9px] font-bold text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Strip property
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {ENCHANT_PROPERTIES.map((prop) => {
                  const locked = c.level < prop.minLevel;
                  const current = c.weaponProperty === prop.id;
                  const dc = prop.dc - (c.classId === "artificer" ? 2 : 0);
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      disabled={locked}
                      onClick={() => onEnchantProperty(prop.id)}
                      title={
                        locked
                          ? `Requires level ${prop.minLevel}`
                          : `${fmtShopPrice(enchantPropertyCost(c, prop))} materials · DC ${dc} · Int + prof`
                      }
                      className={cn(
                        "flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                        current
                          ? "border-emerald-500/60 bg-emerald-500/10"
                          : locked
                            ? "cursor-not-allowed border-slate-800 text-slate-700"
                            : "border-violet-500/30 bg-violet-500/5 hover:border-violet-400 hover:bg-violet-500/15",
                      )}
                    >
                      <div>
                        <p className={cn("text-[11px] font-semibold", current ? "text-emerald-300" : "text-slate-200")}>
                          {prop.name}
                          {current && <span className="ml-1.5 text-[9px] font-bold uppercase text-emerald-400">active</span>}
                        </p>
                        <p className="text-[9px] leading-relaxed text-slate-500">{prop.desc}</p>
                      </div>
                      <span className="shrink-0 pt-0.5 text-right text-[9px] font-semibold text-slate-500">
                        {fmtShopPrice(enchantPropertyCost(c, prop))}
                        <br />DC {dc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <ShopSection
        character={c}
        stock={stock}
        onRestock={() => setStockVersion((v) => v + 1)}
        wallet={wallet}
        onWalletChange={onWalletChange}
        inventory={inventory}
        onInventoryChange={onInventoryChange}
        onSetMagicWeapon={onSetMagicWeapon}
        onSetMagicArmor={onSetMagicArmor}
        onSetMagicShield={onSetMagicShield}
      />

      <InventoryEditor inventory={inventory} onChange={onInventoryChange} />
    </div>
  );
}

/**
 * Mechanical purse editor — gp/sp/cp steppers, independent of the story's gold.
 * Also exposes a read-only balance helper for the shop panels.
 */
export function WalletEditor({
  wallet,
  onChange,
  compact = false,
}: {
  wallet: Wallet;
  onChange: (w: Wallet) => void;
  compact?: boolean;
}) {
  const totalSp = walletToSp(wallet);
  const adjust = (key: keyof Wallet, delta: number) => {
    const next = { ...wallet, [key]: Math.max(0, wallet[key] + delta) };
    // Normalize upward: carry overflow into the next denomination so the
    // purse never drifts (e.g. 12 sp → 1 gp 2 sp).
    onChange(spToWallet(walletToSp(next)));
  };

  const rows: { key: keyof Wallet; label: string; unit: string }[] = [
    { key: "gp", label: "Gold", unit: "gp" },
    { key: "sp", label: "Silver", unit: "sp" },
    { key: "cp", label: "Copper", unit: "cp" },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="mb-2 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">
          <Coins className="size-3.5" /> Purse
        </span>
        <span className="font-mono text-[11px] font-semibold text-amber-300">{fmtWallet(wallet)}</span>
      </p>
      {!compact && (
        <p className="mb-2 text-[10px] text-slate-500">
          Your wallet is tracked mechanically — spend it in shops, add loot the GM hands over. It is
          independent of the story's campaign gold.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-2">
            <span className="w-14 text-[11px] font-medium text-slate-300">{r.label}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjust(r.key, -1)}
                className="flex size-6 items-center justify-center rounded border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
                aria-label={`Decrease ${r.label} by 1`}
              >
                <Minus className="size-3" />
              </button>
              <span className="w-14 text-center font-mono text-sm font-bold text-slate-100">
                {wallet[r.key]} {r.unit}
              </span>
              <button
                type="button"
                onClick={() => adjust(r.key, 1)}
                className="flex size-6 items-center justify-center rounded border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
                aria-label={`Increase ${r.label} by 1`}
              >
                <Plus className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <p className="mt-2 text-[10px] text-slate-600">Total value: {totalSp} sp</p>
      )}
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

// ---------------------------------------------------------------------------
// Adventurer's Shop — level- and class-tailored stock with gp pricing.
// ---------------------------------------------------------------------------

const RARITY_STYLE: Record<DndRarity, string> = {
  common: "border-slate-700 text-slate-400",
  uncommon: "border-emerald-500/40 text-emerald-300",
  rare: "border-sky-500/40 text-sky-300",
  "very-rare": "border-violet-500/40 text-violet-300",
};

function ShopSection({
  character: c,
  stock,
  onRestock,
  wallet,
  onWalletChange,
  inventory,
  onInventoryChange,
  onSetMagicWeapon,
  onSetMagicArmor,
  onSetMagicShield,
}: {
  character: DnDCharacter;
  stock: DndShopItem[];
  onRestock: () => void;
  wallet?: Wallet;
  onWalletChange?: (w: Wallet) => void;
  inventory: InventoryItem[];
  onInventoryChange: (items: InventoryItem[]) => void;
  onSetMagicWeapon?: (id: string, bonus: number) => void;
  onSetMagicArmor?: (id: string, bonus: number) => void;
  onSetMagicShield?: (bonus: number) => void;
}) {
  const className = CLASS_MAP[c.classId]?.name ?? "Adventurer";
  const affordable = (price: number) => (wallet ? walletToSp(wallet) >= price * 100 : true);

  const buy = (item: DndShopItem) => {
    if (!affordable(item.price)) {
      toast(`Not enough coin — ${fmtShopPrice(item.price)} needed for ${item.name}.`);
      return;
    }
    // Mechanical purse: 1 gp = 100 sp in the app's display convention.
    if (wallet && onWalletChange) {
      onWalletChange(spToWallet(walletToSp(wallet) - item.price * 100));
    }
    onInventoryChange([...inventory, { id: uid(), name: item.name, qty: 1 }]);
    // Enchanted gear slots straight into the character and feeds the engine.
    if (item.baseWeaponId && item.enchant && onSetMagicWeapon) {
      onSetMagicWeapon(item.baseWeaponId, item.enchant);
    }
    if (item.baseArmorId && item.enchant && onSetMagicArmor) {
      onSetMagicArmor(item.baseArmorId, item.enchant);
    }
    // Shields (mundane or enchanted) equip through the shield slot — an
    // enchanted one also stores its +N AC bonus for the engine.
    if (item.category === "shield" && onSetMagicShield) {
      onSetMagicShield(item.enchant ?? 0);
    }
    toast(`Bought ${item.name} for ${fmtShopPrice(item.price)}.`);
  };

  const groups: { label: string; icon: ReactNode; items: DndShopItem[] }[] = [
    { label: "Weapons", icon: <Sword className="size-3.5" />, items: stock.filter((i) => i.category === "weapon") },
    { label: "Armor & Shields", icon: <Shield className="size-3.5" />, items: stock.filter((i) => i.category === "armor" || i.category === "shield") },
    { label: "Potions", icon: <FlaskConical className="size-3.5" />, items: stock.filter((i) => i.category === "potion") },
    { label: "Gear", icon: <Backpack className="size-3.5" />, items: stock.filter((i) => i.category === "gear") },
    { label: "Magic Items", icon: <Wand2 className="size-3.5" />, items: stock.filter((i) => i.category === "magic") },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Store className="size-3.5" /> Adventurer's Shop
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
            Stocked for a <span className="font-semibold text-slate-300">Lv {c.level} {className}</span>
            {c.subclassId && (
              <>
                {" · "}
                <span className="font-semibold text-amber-300/90">
                  {CLASS_MAP[c.classId]?.subclasses.find((s) => s.id === c.subclassId)?.name ?? c.subclassId}
                </span>
              </>
            )}{" "}
            — the higher the level, the better (and pricier) the gear on the shelves.
          </p>
        </div>
        <button
          type="button"
          onClick={onRestock}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
          aria-label="Restock the shop"
        >
          <RefreshCw className="size-3" /> Restock
        </button>
      </div>
      <p className="mb-2 flex items-center gap-1.5 text-[10px] text-slate-600">
        <ShoppingBag className="size-3" /> Prices in gold; purchases go into your pack. Enchanted weapons and
        armor equip immediately and apply their bonus to rolls.
      </p>
      <div className="flex flex-col gap-3">
        {groups.map((g) =>
          g.items.length > 0 ? (
            <div key={g.label}>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {g.icon} {g.label}
              </p>
              <div className="flex flex-col gap-1.5">
                {g.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-slate-200">
                        {item.name}
                        <span
                          className={cn(
                            "rounded border px-1 py-px text-[8px] font-bold uppercase tracking-wide",
                            RARITY_STYLE[item.rarity],
                          )}
                        >
                          {DND_RARITY_LABELS[item.rarity]}
                        </span>
                        {item.enchant ? (
                          <span className="rounded bg-amber-500/15 px-1 py-px text-[8px] font-bold text-amber-300">
                            +{item.enchant}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => buy(item)}
                      disabled={!affordable(item.price)}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors",
                        affordable(item.price)
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "cursor-not-allowed border border-slate-800 text-slate-600",
                      )}
                    >
                      <Gem className="size-3" /> {fmtShopPrice(item.price)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
