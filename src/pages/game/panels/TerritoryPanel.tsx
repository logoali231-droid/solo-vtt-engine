import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  GameSystem,
  GmLanguage,
  Territory,
  TerritoryEra,
  TerritoryKind,
} from "@/lib/rpg/types";
import {
  createTerritory,
  rebuildTerritory,
  rerollTerritoryField,
  territoryEra,
  TERRITORY_ERA_LABEL,
  TERRITORY_KINDS,
  territorySummary,
  type TerritoryField,
} from "@/lib/rpg/data/territory";
import { Dices, Globe2, Map as MapIcon, RefreshCcw, Trash2 } from "lucide-react";

interface Props {
  system: GameSystem;
  territories: Territory[];
  onChange: (territories: Territory[]) => void;
  language: GmLanguage;
  /** GURPS Life Mode tag - picks which era the generator rolls in. */
  lifeMode?: string;
}

interface FieldDef {
  key: TerritoryField;
  labelEn: string;
  labelPt: string;
}

const FIELDS: FieldDef[] = [
  { key: "ruler", labelEn: "Ruler", labelPt: "Governante" },
  { key: "government", labelEn: "Government", labelPt: "Governo" },
  { key: "scale", labelEn: "Scale", labelPt: "Tamanho" },
  { key: "economy", labelEn: "Economy", labelPt: "Economia" },
  { key: "military", labelEn: "Military", labelPt: "Militar" },
  { key: "trait", labelEn: "Trait", labelPt: "Característica" },
  { key: "magicTech", labelEn: "Magic / Tech", labelPt: "Magia / Tecnologia" },
  { key: "culture", labelEn: "Culture", labelPt: "Cultura" },
  { key: "factions", labelEn: "Factions", labelPt: "Facções" },
  { key: "conflict", labelEn: "Conflict", labelPt: "Conflito" },
  { key: "secret", labelEn: "Secret", labelPt: "Segredo" },
  { key: "relations", labelEn: "Relations", labelPt: "Relações" },
];

const ERA_TONE: Record<TerritoryEra, string> = {
  fantasy: "bg-amber-500/10 text-amber-300",
  modern: "bg-sky-500/10 text-sky-300",
  cyber: "bg-fuchsia-500/10 text-fuchsia-300",
};

export default function TerritoryPanel({
  system,
  territories,
  onChange,
  language,
  lifeMode,
}: Props) {
  const pt = language === "pt-BR";
  const [kind, setKind] = useState<TerritoryKind>("kingdom");

  const systemName =
    system === "dnd5e" ? "D&D 5e" : system === "pf2e" ? "PF2e" : "GURPS";

  const eraLabel = (t: Territory) =>
    pt ? TERRITORY_ERA_LABEL[t.era].pt : TERRITORY_ERA_LABEL[t.era].en;

  const add = () => {
    const era = territoryEra(system, lifeMode);
    const t = createTerritory(kind, era, language);
    onChange([t, ...territories]);
  };

  const update = (id: string, patch: Partial<Territory>) =>
    onChange(territories.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));

  const remove = (id: string) => onChange(territories.filter((t) => t.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {/* Intro */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Globe2 className="size-3.5" /> {pt ? "Gerador de territórios" : "Territory generator"}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {pt
            ? `Construa o reino, país, empresa ou sociedade onde a campanha vive — ${systemName}. Cada território gerado é alimentado ao GM para manter o mundo consistente.`
            : `Build the kingdom, country, company or society your campaign lives in — ${systemName}. Every generated territory is fed to the Game Master so the world stays consistent.`}
        </p>
        <p className="mt-1 text-[10px] text-slate-600">
          {pt
            ? "GURPS segue a tag de Modo de Vida; D&D 5e e PF2e geram na era de fantasia."
            : "GURPS follows the Life Mode tag; D&D 5e and PF2e roll in the fantasy era."}
        </p>
      </div>

      {/* Kind picker + generate */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {pt ? "Tipo de território" : "Territory kind"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TERRITORY_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              title={pt ? k.hint.pt : k.hint.en}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                kind === k.id
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                  : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-200",
              )}
            >
              {pt ? k.label.pt : k.label.en}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={add}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            <Dices className="size-3.5" /> {pt ? "Gerar território" : "Generate territory"}
          </button>
          {territories.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              title={pt ? "Limpar tudo" : "Clear all"}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-500 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Generated territories */}
      {territories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center">
          <MapIcon className="mx-auto size-5 text-slate-700" />
          <p className="mt-2 text-[11px] text-slate-600">
            {pt
              ? "Nenhum território ainda. Escolha um tipo acima e gere o primeiro."
              : "No territories yet. Pick a kind above and generate the first one."}
          </p>
        </div>
      ) : (
        territories.map((t) => {
          const kindLabel = TERRITORY_KINDS.find((k) => k.id === t.kind);
          return (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold leading-tight text-slate-100">{t.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ERA_TONE[t.era])}>
                      {eraLabel(t)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-amber-300/90">
                    {pt ? kindLabel?.label.pt : kindLabel?.label.en}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const rebuilt = rebuildTerritory(t);
                      update(t.id, rebuilt);
                    }}
                    title={pt ? "Gerar novamente" : "Rebuild"}
                    aria-label={pt ? "Gerar novamente" : "Rebuild"}
                    className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    <Dices className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    title={pt ? "Excluir" : "Delete"}
                    aria-label={pt ? "Excluir" : "Delete"}
                    className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* One-line pitch */}
              <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-[11px] italic leading-relaxed text-slate-300">
                {territorySummary(t, language)}
              </p>

              {/* Field grid */}
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <div
                    key={f.key}
                    className="group rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        {pt ? f.labelPt : f.labelEn}
                      </p>
                      <button
                        type="button"
                        onClick={() => update(t.id, rerollTerritoryField(t, f.key))}
                        title={pt ? "Rolar novamente" : "Re-roll"}
                        aria-label={`${pt ? "Rolar novamente" : "Re-roll"} ${f.labelEn}`}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-slate-700 opacity-70 transition-colors hover:bg-amber-500/10 hover:text-amber-300 group-hover:opacity-100"
                      >
                        <RefreshCcw className="size-3" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                      {f.key === "factions" ? t.factions.join(" · ") || "—" : t[f.key]}
                    </p>
                  </div>
                ))}
              </div>

              {/* GM note */}
              <textarea
                value={t.note}
                onChange={(e) => update(t.id, { note: e.target.value })}
                aria-label={pt ? "Nota do GM" : "GM note"}
                placeholder={pt ? "Nota do GM — segredos, conexões, ideias…" : "GM note — secrets, hooks, connections…"}
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[11px] text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
              />
            </div>
          );
        })
      )}
    </div>
  );
}
