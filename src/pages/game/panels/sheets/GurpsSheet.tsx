import { cn } from "@/lib/utils";
import type { GurpsCharacter } from "@/lib/rpg/types";
import type { GurpsDerived } from "@/lib/rpg/character";
import { GURPS_ARMOR_MAP } from "@/lib/rpg/data/gurps";
import IdentityChips from "./IdentityChips";
import type { RollRequest, SheetProps } from "../../types";

interface Props extends SheetProps<GurpsCharacter> {
  derived: GurpsDerived;
  actions: {
    damage: (n: number) => void;
    heal: (n: number) => void;
    fatigue: (n: number) => void;
    recover: (n: number) => void;
  };
}

function AttrBox({
  code,
  name,
  value,
  extra,
}: {
  code: string;
  name: string;
  value: number;
  extra?: string;
}) {
  return (
    <div className="rounded border border-amber-900/40 bg-[#1c1810] px-2 py-2 text-center">
      <p className="font-mono text-[9px] font-bold text-amber-600/70">{code} · {name}</p>
      <p className="font-mono text-lg font-bold text-amber-200">{value}</p>
      {extra && <p className="font-mono text-[8px] text-amber-600/50">{extra}</p>}
    </div>
  );
}

export default function GurpsSheet({ character: c, derived: d, onRoll, actions }: Props) {
  const hpCurrent = Math.max(0, d.hpMax - c.state.hpDamage);
  const fpCurrent = Math.max(0, d.fpMax - c.state.fpDamage);
  const armor = GURPS_ARMOR_MAP[c.armorId];

  const rollAttr = (code: "st" | "dx" | "iq" | "ht", name: string, target: number) =>
    onRoll({
      label: `${name} Roll (${target})`,
      kind: "check",
      gurpsTarget: target,
    });

  return (
    <div className="overflow-hidden rounded-xl border border-amber-900/50 bg-[#14110b] font-mono shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="border-b border-amber-900/40 bg-[#1c1810] px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-amber-100">{c.name.toUpperCase()}</p>
            <p className="text-[9px] text-amber-600/70">GURPS CHARACTER SHEET · {d.pointTotal} pts</p>
            <IdentityChips identity={c.identity} tone="amber" />
          </div>
          <span className="rounded border border-amber-900/60 px-2 py-0.5 text-[9px] font-bold text-amber-400">
            BUDGET {c.points.budget}
          </span>
        </div>
        {/* Vital stats */}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          <AttrBox code="HP" name="Hit Points" value={hpCurrent} extra={`/ ${d.hpMax}`} />
          <AttrBox code="FP" name="Fatigue" value={fpCurrent} extra={`/ ${d.fpMax}`} />
          <AttrBox code="DR" name="Resistance" value={d.dr} extra={armor.name} />
          <AttrBox code="MV" name="Move" value={d.move} extra={`BS ${d.basicSpeed.toFixed(2)}`} />
          <AttrBox code="DO" name="Dodge" value={d.dodge} />
        </div>
        <div className="mt-2 flex gap-1">
          <button type="button" onClick={() => actions.damage(1)} className="flex-1 rounded border border-red-900/60 py-0.5 text-[9px] text-red-400 hover:bg-red-950/40">DMG −1</button>
          <button type="button" onClick={() => actions.heal(1)} className="flex-1 rounded border border-emerald-900/60 py-0.5 text-[9px] text-emerald-400 hover:bg-emerald-950/40">HEAL +1</button>
          <button type="button" onClick={() => actions.fatigue(1)} className="flex-1 rounded border border-amber-900/60 py-0.5 text-[9px] text-amber-500 hover:bg-amber-950/40">FP −1</button>
          <button type="button" onClick={() => actions.recover(1)} className="flex-1 rounded border border-sky-900/60 py-0.5 text-[9px] text-sky-400 hover:bg-sky-950/40">FP +1</button>
        </div>
      </div>

      {/* Attributes */}
      <div className="border-b border-amber-900/40 px-4 py-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">Primary Attributes · roll 3d6 under</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { code: "ST", name: "STRENGTH", value: c.attributes.st, stat: "st" as const },
            { code: "DX", name: "DEXTERITY", value: c.attributes.dx, stat: "dx" as const },
            { code: "IQ", name: "INTELLIGENCE", value: c.attributes.iq, stat: "iq" as const },
            { code: "HT", name: "HEALTH", value: c.attributes.ht, stat: "ht" as const },
          ].map((a) => (
            <button key={a.code} type="button"
              onClick={() => rollAttr(a.stat, a.name, a.value)}
              className="rounded border border-amber-900/40 bg-[#1c1810] px-1 py-2 text-center transition-colors hover:border-amber-500/60">
              <p className="text-[9px] font-bold text-amber-600/70">{a.code} · {a.name}</p>
              <p className="text-lg font-bold text-amber-200">{a.value}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
          Skills · click to roll 3d6 vs level
        </p>
        {d.skills.length === 0 && (
          <p className="text-[10px] italic text-amber-600/50">No skills trained — roll raw attributes (default level = stat − 5).</p>
        )}
        <div className="flex flex-col gap-1">
          {d.skills.map((s) => (
            <button key={s.id} type="button"
              onClick={() => onRoll({ label: `${s.name} (${s.level})`, kind: "skill", gurpsTarget: s.level })}
              className="flex items-center justify-between rounded border border-amber-900/40 bg-[#1c1810] px-2.5 py-1.5 text-left transition-colors hover:border-amber-500/60">
              <span className="text-[10px] text-amber-100">
                {s.name.toUpperCase()}
                <span className="ml-2 text-[8px] text-amber-600/60">{s.points} pts</span>
              </span>
              <span className={cn("text-xs font-bold", s.level >= 12 ? "text-emerald-400" : s.level >= 10 ? "text-amber-300" : "text-red-400")}>
                {s.level}
              </span>
            </button>
          ))}
        </div>
        {/* Advantages */}
        {d.advantages.length > 0 && (
          <div className="border-t border-amber-900/40 px-4 py-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-amber-600/60">
              Advantages & Talents
            </p>
            <div className="flex flex-col gap-1">
              {d.advantages.map((a) => (
                <div key={a.id} className="rounded border border-amber-900/40 bg-[#1c1810] px-2.5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-100">
                      {a.name.toUpperCase()}
                    </span>
                    <span className="text-[8px] font-bold text-amber-500">{a.points} pts</span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-amber-600/60">{a.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Disadvantages */}
        {d.disadvantages.length > 0 && (
          <div className="border-t border-amber-900/40 px-4 py-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-red-400/70">
              Disadvantages
            </p>
            <div className="flex flex-col gap-1">
              {d.disadvantages.map((a) => (
                <div key={a.id} className="rounded border border-red-900/40 bg-[#1c1810] px-2.5 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-300">
                      {a.name.toUpperCase()}
                    </span>
                    <span className="text-[8px] font-bold text-red-400">{a.points} pts</span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-amber-600/60">{a.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Points ledger */}
        <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
          {[
            ["ATTRIBUTES", c.points.attributes],
            ["ADVANTAGES", c.points.advantages],
            ["DISADV", c.points.disadvantages ?? 0],
            ["SKILLS", c.points.skills],
            ["TOTAL", d.pointTotal],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-amber-900/40 bg-[#1c1810] py-1.5">
              <p className="text-[8px] font-bold text-amber-600/60">{label}</p>
              <p className="text-sm font-bold text-amber-200">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
