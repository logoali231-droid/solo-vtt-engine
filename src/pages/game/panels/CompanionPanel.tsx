import { cn } from "@/lib/utils";
import { gurpsThrust } from "@/lib/rpg/dice";
import type { Companion, GameSystem } from "@/lib/rpg/types";
import { uid } from "@/lib/rpg/types";
import {
  HeartPulse,
  Minus,
  Pencil,
  Plus,
  Shield,
  Swords,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  system: GameSystem;
  companions: Companion[];
  onChange: (companions: Companion[]) => void;
  onAttack: (id: string) => void;
}

const DND_ROLES = [
  "Fighter",
  "Rogue",
  "Cleric",
  "Wizard",
  "Bard",
  "Ranger",
  "Paladin",
  "Barbarian",
  "Druid",
  "Sorcerer",
  "Warlock",
  "Monk",
  "Artificer",
];

const DAMAGE_PRESETS = ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6"];

const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500";
const inputCls =
  "h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition-colors focus:border-amber-500/60";

interface Draft {
  name: string;
  role: string;
  notes: string;
  level: number;
  maxHp: number;
  ac: number;
  attackBonus: number;
  damageDice: string;
  damageFlat: number;
  st: number;
  dx: number;
  iq: number;
  ht: number;
  skillTarget: number;
}

function freshDraft(system: GameSystem): Draft {
  return {
    name: "",
    role: system === "gurps" ? "Brawler" : "Fighter",
    notes: "",
    level: system === "gurps" ? 1 : 3,
    maxHp: 10,
    ac: 12,
    attackBonus: 4,
    damageDice: "1d6",
    damageFlat: 2,
    st: 12,
    dx: 12,
    iq: 10,
    ht: 11,
    skillTarget: 12,
  };
}

function damageString(dice: string, flat: number): string {
  if (flat === 0) return dice;
  return `${dice}${flat > 0 ? `+${flat}` : flat}`;
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-1.5 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <p className={cn("mt-0.5 font-mono text-sm font-bold text-slate-100", accent)}>
        {value}
      </p>
    </div>
  );
}

export default function CompanionPanel({ system, companions, onChange, onAttack }: Props) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => freshDraft(system));

  const openNew = () => {
    setEditingId(null);
    setDraft(freshDraft(system));
    setBuilderOpen(true);
  };

  const openEdit = (c: Companion) => {
    setEditingId(c.id);
    const attrs = c.attributes ?? { st: 12, dx: 12, iq: 10, ht: 11 };
    setDraft({
      name: c.name,
      role: c.role,
      notes: c.notes ?? "",
      level: c.level,
      maxHp: c.maxHp,
      ac: c.ac,
      attackBonus: c.attackBonus,
      damageDice: c.damage,
      damageFlat: 0,
      st: attrs.st,
      dx: attrs.dx,
      iq: attrs.iq,
      ht: attrs.ht,
      skillTarget: c.skillTarget ?? attrs.dx,
    });
    setBuilderOpen(true);
  };

  const thrust = useMemo(
    () => (system === "gurps" ? gurpsThrust(draft.st) : { notation: "", flat: 0 }),
    [system, draft.st],
  );

  const save = () => {
    const name = draft.name.trim();
    if (name.length < 1) return;
    const isGurps = system === "gurps";
    const base: Companion = {
      id: editingId ?? uid(),
      name,
      role: draft.role.trim() || "Ally",
      level: Math.max(1, draft.level || 1),
      maxHp: Math.max(1, draft.maxHp || 1),
      hp: Math.max(1, draft.maxHp || 1),
      ac: Math.max(1, draft.ac || 1),
      attackBonus: Math.max(0, draft.attackBonus || 0),
      damage: isGurps
        ? thrust.notation
        : damageString(draft.damageDice, draft.damageFlat),
      notes: draft.notes.trim() || undefined,
      createdAt: Date.now(),
    };
    if (isGurps) {
      base.attributes = { st: draft.st, dx: draft.dx, iq: draft.iq, ht: draft.ht };
      base.skillTarget = Math.max(3, draft.skillTarget || draft.dx);
    }
    const existing = companions.find((c) => c.id === base.id);
    const next = existing
      ? companions.map((c) => (c.id === base.id ? { ...c, ...base, hp: c.hp } : c))
      : [...companions, base];
    onChange(next);
    setBuilderOpen(false);
  };

  const hpDelta = (id: string, delta: number) =>
    onChange(
      companions.map((c) =>
        c.id === id
          ? { ...c, hp: Math.min(c.maxHp, Math.max(0, c.hp + delta)) }
          : c,
      ),
    );

  const remove = (id: string) => onChange(companions.filter((c) => c.id !== id));

  const rulesNote =
    system === "dnd5e"
      ? "Attacks roll 1d20 + attack bonus vs the enemy's AC — natural 20 is a critical hit and doubles the damage dice."
      : system === "pf2e"
        ? "Attacks roll 1d20 + attack bonus vs the enemy's AC, resolved with the four degrees of success (natural 20/1 shift the degree)."
        : "Attacks roll 3d6 under the combat skill target. Damage comes from the ST thrust-damage table.";

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-amber-400" />
            <p className="text-xs font-bold text-slate-100">Your Company</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            <Plus className="size-3.5" /> Recruit
          </button>
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{rulesNote}</p>
      </div>

      {companions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <Swords className="mx-auto size-6 text-slate-700" />
          <p className="mt-2 text-xs font-semibold text-slate-400">No companions yet</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
            Recruit allies who fight with you — they get their own stat block and roll
            through the same rules engine.
          </p>
        </div>
      )}

      {companions.map((c) => {
        const gurps = system === "gurps";
        const pct = c.maxHp > 0 ? Math.round((c.hp / c.maxHp) * 100) : 0;
        return (
          <article
            key={c.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-100">{c.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/80">
                  {c.role} · Lv {c.level}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAttack(c.id)}
                  title={`${c.name} attacks`}
                  className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
                >
                  <Swords className="size-3" /> Attack
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  title="Edit companion"
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  title="Dismiss companion"
                  className="flex size-7 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <StatTile
                icon={<HeartPulse className="size-2.5" />}
                label="HP"
                value={`${c.hp}/${c.maxHp}`}
                accent={c.hp <= 0 ? "text-red-400" : "text-emerald-300"}
              />
              <StatTile
                icon={<Shield className="size-2.5" />}
                label={gurps ? "ST" : "AC"}
                value={gurps ? String(c.attributes?.st ?? 10) : String(c.ac)}
              />
              <StatTile
                icon={<Target className="size-2.5" />}
                label={gurps ? "Skill" : "Atk"}
                value={gurps ? String(c.skillTarget ?? c.attributes?.dx ?? 10) : `+${c.attackBonus}`}
              />
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <StatTile icon={<Swords className="size-2.5" />} label="Dmg" value={c.damage} />
              <div className="flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => hpDelta(c.id, -1)}
                  className="flex size-6 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:text-red-300"
                >
                  <Minus className="size-3" />
                </button>
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-red-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => hpDelta(c.id, 1)}
                  className="flex size-6 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors hover:text-emerald-300"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            </div>
            {c.notes && (
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{c.notes}</p>
            )}
          </article>
        );
      })}

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingId ? "Edit companion" : "Recruit a companion"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Bryn the Shieldmaiden"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Role / Class</label>
                {system === "dnd5e" ? (
                  <select
                    value={draft.role}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                    className={inputCls}
                  >
                    {DND_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={draft.role}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                    placeholder={system === "gurps" ? "e.g. Brawler, Scout…" : "e.g. Acrobat, Skirmisher…"}
                    className={inputCls}
                  />
                )}
              </div>
            </div>

            {system === "gurps" ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {(["st", "dx", "iq", "ht"] as const).map((k) => (
                    <div key={k}>
                      <label className={labelCls}>{k.toUpperCase()}</label>
                      <input
                        type="number"
                        value={draft[k]}
                        onChange={(e) =>
                          setDraft({ ...draft, [k]: parseInt(e.target.value, 10) || 10 })
                        }
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Combat skill (target)</label>
                    <input
                      type="number"
                      value={draft.skillTarget}
                      onChange={(e) =>
                        setDraft({ ...draft, skillTarget: parseInt(e.target.value, 10) || 3 })
                      }
                      className={inputCls}
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Attacks roll 3d6 under this number.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Thrust damage (ST)</label>
                    <div className="flex h-9 items-center rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-amber-300">
                      {thrust.notation}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">Auto from the ST table.</p>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Max HP</label>
                  <input
                    type="number"
                    value={draft.maxHp}
                    onChange={(e) =>
                      setDraft({ ...draft, maxHp: parseInt(e.target.value, 10) || 1 })
                    }
                    className={inputCls}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    GURPS HP normally equals ST — override for beefier allies.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Level</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={draft.level}
                      onChange={(e) =>
                        setDraft({ ...draft, level: parseInt(e.target.value, 10) || 1 })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Max HP</label>
                    <input
                      type="number"
                      value={draft.maxHp}
                      onChange={(e) =>
                        setDraft({ ...draft, maxHp: parseInt(e.target.value, 10) || 1 })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Armor Class</label>
                    <input
                      type="number"
                      value={draft.ac}
                      onChange={(e) =>
                        setDraft({ ...draft, ac: parseInt(e.target.value, 10) || 1 })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Attack bonus</label>
                    <input
                      type="number"
                      value={draft.attackBonus}
                      onChange={(e) =>
                        setDraft({ ...draft, attackBonus: parseInt(e.target.value, 10) || 0 })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Damage dice</label>
                    <select
                      value={draft.damageDice}
                      onChange={(e) => setDraft({ ...draft, damageDice: e.target.value })}
                      className={inputCls}
                    >
                      {DAMAGE_PRESETS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Damage bonus</label>
                    <input
                      type="number"
                      value={draft.damageFlat}
                      onChange={(e) =>
                        setDraft({ ...draft, damageFlat: parseInt(e.target.value, 10) || 0 })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <p className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-500">
                  {system === "dnd5e"
                    ? "D&D 5e: attacks roll 1d20 + attack bonus vs AC (natural 20 crits, doubling dice)."
                    : "Pathfinder 2e: attacks roll 1d20 + attack bonus vs AC with the four degrees of success."}
                </p>
              </>
            )}

            <div>
              <label className={labelCls}>Notes (optional)</label>
              <input
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Personality, bond, orders…"
                className={inputCls}
              />
            </div>

            <button
              type="button"
              disabled={draft.name.trim().length < 1}
              onClick={save}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" />
              {editingId ? "Save changes" : "Recruit companion"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
