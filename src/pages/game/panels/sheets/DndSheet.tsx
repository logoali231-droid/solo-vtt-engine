import { cn } from "@/lib/utils";
import {
  ABILITIES,
  ABILITY_LABELS,
  type DnDCharacter,
  type FeatureDef,
} from "@/lib/rpg/types";
import type { DndDerived } from "@/lib/rpg/character";
import { formatMod } from "@/lib/rpg/dice";
import { CLASS_MAP } from "@/lib/rpg/data/dnd";
import { knownSpellsFor } from "@/lib/rpg/data/spells";
import type { SpellDef } from "@/lib/rpg/types";
import { BookOpen } from "lucide-react";
import { Wand2, Zap } from "lucide-react";
import IdentityChips from "./IdentityChips";
import type { SheetProps } from "../../types";

interface Props extends SheetProps<DnDCharacter> {
  derived: DndDerived;
  actions: {
    damage: (n: number) => void;
    heal: (n: number) => void;
    toggleSpellSlot: (i: number) => void;
    togglePact: () => void;
    toggleInfusion: () => void;
    useResource: (id: string) => void;
  };
}

export default function DndSheet({ character: c, derived: d, onRoll, onUseFeature, actions }: Props) {
  const klass = CLASS_MAP[c.classId];
  const hpCurrent = Math.max(0, d.hpMax - c.state.hpDamage);
  const hpTotal = hpCurrent + c.state.tempHp;
  const hpPct = Math.min(100, Math.round((hpTotal / Math.max(1, d.hpMax)) * 100));

  const flashAvailable =
    klass.id === "artificer" && c.level >= 7 && c.subclassId !== undefined;

  const featureUsesLeft = (f: FeatureDef): number | null => {
    if (!f.uses) return null;
    const max = f.uses(c);
    const used = c.state.resourceUses[f.id] ?? 0;
    return Math.max(0, max - used);
  };

  const spellSlots = d.spellSlots;
  const pact = d.pact;
  const spells: SpellDef[] = knownSpellsFor(klass.id, c.level);
  const canCast = (sp: SpellDef): boolean => {
    if (sp.level === 0) return true;
    if (pact) return c.state.pactUsed < pact.count;
    for (let i = sp.level - 1; i < spellSlots.length; i++) {
      if (spellSlots[i] > 0 && (c.state.spellSlotsUsed[i] ?? 0) < spellSlots[i]) return true;
    }
    return false;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-[#c9b88d] bg-[#f3e9d1] text-[#3b2f1b] shadow-[inset_0_0_40px_rgba(140,110,60,0.18),0_12px_32px_-16px_rgba(0,0,0,0.7)]">
      {/* Parchment header */}
      <div className="border-b-2 border-double border-[#c9b88d] bg-[#efe2c4] px-4 py-3 text-center">
        <p className="font-display text-lg font-bold tracking-wide text-[#3b2f1b]">{c.name}</p>
        <p className="text-[11px] font-semibold tracking-widest text-[#7a6436]">
          {d.raceName} {d.className} · {d.subclassName}
        </p>
        <p className="mt-0.5 text-[10px] italic text-[#8a7444]">
          {d.backgroundName} · Level {c.level} {c.customOrigin && "· Tasha's Custom Origin"}
        </p>
        <IdentityChips identity={c.identity} tone="light" />
        {c.state.activeStatus.length > 0 && (
          <div className="mt-1.5 flex flex-wrap justify-center gap-1">
            {c.state.activeStatus.map((s) => (
              <span key={s} className="rounded-full bg-red-800/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* HP */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#6b5530]">
            <span>Hit Points</span>
            <span>
              {hpTotal}{c.state.tempHp > 0 ? ` + ${c.state.tempHp} temp` : ""} / {d.hpMax}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#d9c9a2]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                hpPct > 50 ? "bg-[#5a7d4a]" : hpPct > 20 ? "bg-[#b08a3e]" : "bg-[#a3442e]",
              )}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex gap-1">
            {[5, 1].map((n) => (
              <button key={`d${n}`} type="button" onClick={() => actions.damage(n)}
                className="rounded border border-[#c9b88d] bg-[#efe2c4] px-2 py-0.5 text-[10px] font-bold text-[#8a3a28] hover:bg-[#e6d5ae]">
                −{n}
              </button>
            ))}
            {[1, 5].map((n) => (
              <button key={`h${n}`} type="button" onClick={() => actions.heal(n)}
                className="rounded border border-[#c9b88d] bg-[#efe2c4] px-2 py-0.5 text-[10px] font-bold text-[#3d6b2f] hover:bg-[#e6d5ae]">
                +{n}
              </button>
            ))}
          </div>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-4 gap-2">
          {[
            ["AC", d.ac],
            ["Proficiency", `+${d.profBonus}`],
            ["Initiative", formatMod(d.initiative)],
            ["Speed", `${d.speed} ft`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#c9b88d] bg-[#efe2c4] px-1 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a6436]">{label}</p>
              <p className="font-display text-lg font-bold leading-tight text-[#3b2f1b]">{value}</p>
            </div>
          ))}
        </div>

        {/* Abilities */}
        <div className="grid grid-cols-3 gap-2">
          {ABILITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onRoll({ label: `${ABILITY_LABELS[a]} Check`, kind: "check", ability: a })}
              className="group rounded-lg border border-[#c9b88d] bg-[#efe2c4] px-1 py-2 text-center transition-colors hover:bg-[#e6d5ae]"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#7a6436]">{ABILITY_LABELS[a]}</p>
              <p className="font-display text-xl font-bold leading-tight text-[#3b2f1b]">{d.scores[a]}</p>
              <p className="text-[10px] font-semibold text-[#6b5530]">{formatMod(d.mods[a])}</p>
            </button>
          ))}
        </div>

        {/* Saving throws */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">Saving Throws</p>
          <div className="flex flex-col gap-1">
            {d.savingThrows.map((s) => (
              <button
                key={s.ability}
                type="button"
                onClick={() =>
                  onRoll({
                    label: `${ABILITY_LABELS[s.ability]} Saving Throw`,
                    kind: "save",
                    ability: s.ability,
                    proficient: true,
                    flashOfGenius: flashAvailable,
                  })
                }
                className="flex items-center justify-between rounded-md border border-[#d4c49a] bg-[#f8f0dc] px-2.5 py-1.5 text-left transition-colors hover:bg-[#efe2c4]"
              >
                <span className="text-[11px] font-medium text-[#4a3a20]">
                  {ABILITY_LABELS[s.ability]}
                  {flashAvailable && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-violet-200/70 px-1 py-px text-[8px] font-bold text-violet-800">
                      <Zap className="size-2.5" /> Flash of Genius
                    </span>
                  )}
                </span>
                <span className="text-xs font-bold text-[#3b2f1b]">{formatMod(s.total)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">
            Skills <span className="normal-case tracking-normal text-[#8a7444]">(click to roll)</span>
          </p>
          <div className="flex flex-col gap-px">
            {d.skills
              .slice()
              .sort((a, b) => Number(b.proficient) - Number(a.proficient) || a.name.localeCompare(b.name))
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    onRoll({
                      label: s.name,
                      kind: "skill",
                      ability: s.ability,
                      skill: s.id,
                      proficient: s.proficient,
                    })
                  }
                  className="flex items-center justify-between rounded-md px-2 py-[3px] text-left transition-colors hover:bg-[#e6d5ae]"
                >
                  <span className="text-[11px] text-[#4a3a20]">
                    {s.proficient && <span className="mr-1 inline-block size-1.5 rounded-full bg-[#5a7d4a]" />}
                    {s.name}
                    {s.expert && (
                      <span className="ml-1 rounded bg-violet-200/70 px-1 py-px text-[8px] font-bold text-violet-800">
                        EX
                      </span>
                    )}
                  </span>
                  <span className={cn("text-[11px] font-bold", s.proficient ? "text-[#3b2f1b]" : "text-[#8a7444]")}>
                    {formatMod(s.total)}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Spell slots */}
        {(spellSlots.length > 0 || pact) && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">
              {pact ? "Pact Magic" : "Spell Slots"}
            </p>
            {pact ? (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pact.count }).map((_, i) => {
                  const used = i < c.state.pactUsed;
                  return (
                    <button key={i} type="button" onClick={actions.togglePact}
                      className={cn(
                        "size-6 rounded-md border text-[10px] font-bold transition-colors",
                        used ? "border-[#8a3a28] bg-[#8a3a28] text-[#f3e9d1]" : "border-[#c9b88d] bg-[#f8f0dc] text-[#6b5530] hover:bg-[#efe2c4]",
                      )}>
                      {pact.slotLevel}
                    </button>
                  );
                })}
                <span className="ml-1 text-[10px] italic text-[#8a7444]">level {pact.slotLevel} slots</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {spellSlots.map((max, i) => {
                  if (max === 0) return null;
                  const used = c.state.spellSlotsUsed[i] ?? 0;
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-7 text-[10px] font-bold text-[#6b5530]">Lv {i + 1}</span>
                      {Array.from({ length: max }).map((_, j) => (
                        <button key={j} type="button" onClick={() => actions.toggleSpellSlot(i)}
                          className={cn(
                            "size-5 rounded-full border transition-colors",
                            j < used
                              ? "border-[#6b2f8f] bg-[#6b2f8f]/80"
                              : "border-[#c9b88d] bg-[#f8f0dc] hover:bg-[#efe2c4]",
                          )} />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Spellbook */}
        {spells.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">
              <BookOpen className="size-3" /> Spellbook
              <span className="normal-case tracking-normal text-[#8a7444]">(tap to cast)</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {spells.map((sp) => {
                const usable = canCast(sp);
                return (
                  <div key={sp.id} className="rounded-md border border-[#d4c49a] bg-[#f8f0dc] px-2.5 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 text-[11px] font-bold text-[#3b2f1b]">
                        <span className="truncate">{sp.name}</span>
                        <span className="ml-1.5 text-[9px] font-semibold text-[#8a7444]">
                          {sp.level === 0 ? "Cantrip" : `Lv ${sp.level}`} · {sp.school}
                        </span>
                      </p>
                      <button
                        type="button"
                        disabled={!usable}
                        onClick={() =>
                          onRoll({ label: sp.name, kind: "check", spellId: sp.id })
                        }
                        title={
                          usable
                            ? `Cast ${sp.name}${sp.level > 0 ? ` (costs a${sp.level === 1 ? "" : ` level-${sp.level}`} slot)` : " (free)"}`
                            : "No spell slot available — rest to recover"
                        }
                        className="shrink-0 rounded bg-[#3b2f1b] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#f3e9d1] transition-colors hover:bg-[#5a4a2a] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Cast
                      </button>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[#6b5530]">
                      {sp.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Infusions */}
        {d.infusions > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">
              <Wand2 className="size-3" /> Infusions {c.state.infusionsUsed}/{d.infusions}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: d.infusions }).map((_, i) => (
                <button key={i} type="button" onClick={actions.toggleInfusion}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors",
                    i < c.state.infusionsUsed ? "border-[#3d6b2f] bg-[#3d6b2f] text-[#f3e9d1]" : "border-[#c9b88d] bg-[#f8f0dc] text-[#6b5530] hover:bg-[#efe2c4]",
                  )}>
                  {klass.subclasses.find((s) => s.id === c.subclassId)?.name === "Artillerist" && i === 0 ? "Cannon" : "Infusion"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {klass.resources.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">Class Resources</p>
            <div className="flex flex-wrap gap-1.5">
              {klass.resources.map((r) => {
                const max = r.max(c);
                const used = c.state.resourceUses[r.id] ?? 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => actions.useResource(r.id)}
                    className="rounded-lg border border-[#c9b88d] bg-[#efe2c4] px-2.5 py-1 text-[10px] font-semibold text-[#4a3a20] transition-colors hover:bg-[#e6d5ae]"
                  >
                    {r.label}: <span className="font-bold">{Math.max(0, max - used)}/{max}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feats & Talents */}
        {d.feats.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">
              Feats & Talents
            </p>
            <div className="flex flex-col gap-1.5">
              {d.feats.map((f) => (
                <div key={f.id} className="rounded-md border border-[#cbb98e] bg-[#f8f0dc] px-2.5 py-1.5">
                  <p className="text-[11px] font-bold text-[#3b2f1b]">
                    {f.name}
                    <span className="ml-1.5 text-[9px] font-semibold text-[#8a7444]">{f.source}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[#6b5530]">{f.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7a6436]">Features</p>
          <div className="flex flex-col gap-1.5">
            {d.features.map((f) => {
              const left = featureUsesLeft(f);
              const usable = !!f.hook && left !== null && left > 0;
              return (
                <div key={f.id} className="rounded-md border border-[#d4c49a] bg-[#f8f0dc] px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-[#3b2f1b]">
                      {f.name}
                      <span className="ml-1.5 text-[9px] font-semibold text-[#8a7444]">Lv {f.level}</span>
                    </p>
                    {usable && (
                      <button
                        type="button"
                        onClick={() => onUseFeature?.(f.id)}
                        className="rounded bg-[#3b2f1b] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#f3e9d1] transition-colors hover:bg-[#5a4a2a]"
                      >
                        Use {left}/{f.uses!(c)}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-[#6b5530]">{f.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
