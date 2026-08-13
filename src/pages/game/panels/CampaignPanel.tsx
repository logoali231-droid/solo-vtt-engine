import { cn } from "@/lib/utils";
import type { GmLanguage } from "@/lib/rpg/types";
import {
  Brain,
  Coins,
  MapPin,
  Plus,
  RefreshCcw,
  ScrollText,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface Props {
  system: string;
  sceneTitle: string;
  location: string;
  quests: string[];
  xp: number;
  gold: number;
  memory?: string;
  /** Compiled learned-memory context — facts the engine extracted from play. */
  learned?: string;
  learnedCount?: number;
  onClearLearned?: () => void;
  level: number;
  maxLevel: number;
  xpNeeded: number;
  gurpsSpare?: number;
  language: GmLanguage;
  onScene: (title: string, location: string) => void;
  onAddQuest: (q: string) => void;
  onRemoveQuest: (i: number) => void;
  onAwardXp: (n: number) => void;
  onLevelUp: () => void;
  onGold: (n: number) => void;
  onRewardCp: () => void;
  onClearHistory: () => void;
}

export default function CampaignPanel({
  system,
  sceneTitle,
  location,
  quests,
  xp,
  gold,
  memory,
  learned,
  learnedCount,
  onClearLearned,
  level,
  maxLevel,
  xpNeeded,
  gurpsSpare,
  language,
  onScene,
  onAddQuest,
  onRemoveQuest,
  onAwardXp,
  onLevelUp,
  onGold,
  onRewardCp,
  onClearHistory,
}: Props) {
  const pt = language === "pt-BR";
  const [questInput, setQuestInput] = useState("");
  const [goldInput, setGoldInput] = useState("");

  const levelReady = xp >= xpNeeded && level < maxLevel;
  const xpPct = Math.min(100, Math.round((xp / Math.max(1, xpNeeded)) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Scene */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <MapPin className="size-3.5" /> Scene
        </p>
        <input
          value={sceneTitle}
          onChange={(e) => onScene(e.target.value, location)}
          aria-label={pt ? "Título da cena" : "Scene title"}
          placeholder={pt ? "Título da cena" : "Scene title"}
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
        <input
          value={location}
          onChange={(e) => onScene(sceneTitle, e.target.value)}
          aria-label={pt ? "Local" : "Location"}
          placeholder={pt ? "Local" : "Location"}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
        />
      </div>

      {/* Quests */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <ScrollText className="size-3.5" /> {pt ? "Missões" : "Quests"}
        </p>
        <div className="mb-2 flex gap-1.5">
          <input
            value={questInput}
            onChange={(e) => setQuestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && questInput.trim()) {
                onAddQuest(questInput.trim());
                setQuestInput("");
              }
            }}
            aria-label={pt ? "Nova missão…" : "New quest…"}
            placeholder={pt ? "Nova missão…" : "New quest…"}
            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
          />
          <button
            type="button"
            onClick={() => {
              if (questInput.trim()) {
                onAddQuest(questInput.trim());
                setQuestInput("");
              }
            }}
            disabled={!questInput.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {quests.length === 0 && (
            <p className="text-[11px] italic text-slate-600">{pt ? "Nenhuma missão ativa." : "No active quests."}</p>
          )}
          {quests.map((q, i) => (
            <div key={`${q}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5">
              <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate-300">{q}</span>
              <button
                type="button"
                onClick={() => onRemoveQuest(i)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Progression */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Star className="size-3.5" /> {system === "gurps" ? "Character Points" : "Progression"}
        </p>
        {system === "gurps" ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-100">{gurpsSpare ?? 0} CP</p>
              <p className="text-[10px] text-slate-500">{pt ? "pontos não gastos" : "unspent points"}</p>
            </div>
            <button
              type="button"
              onClick={onRewardCp}
              className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
            >
              +5 CP
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">Lv {level}</span>
              <span className="font-mono text-slate-300">
                {xp} / {xpNeeded} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className={cn("h-full rounded-full transition-all", levelReady ? "bg-amber-400" : "bg-teal-500/70")}
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => onAwardXp(50)}
                className="flex-1 rounded-lg border border-slate-700 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-200"
              >
                +50 XP
              </button>
              <button
                type="button"
                onClick={onLevelUp}
                disabled={!levelReady}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors",
                  levelReady
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    : "cursor-not-allowed border border-slate-800 text-slate-600",
                )}
              >
                {pt ? "Subir de nível" : "Level Up"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Gold */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
          <Coins className="size-3.5" /> Gold
        </p>
        <p className="mb-2 font-mono text-lg font-bold text-amber-300">{gold} gp</p>
        <div className="flex gap-1.5">
          <input
            value={goldInput}
            onChange={(e) => setGoldInput(e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder={pt ? "Valor" : "Amount"}
            className="h-8 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500/60"
          />
          <button
            type="button"
            onClick={() => {
              const n = Number(goldInput) || 0;
              onGold(n);
              setGoldInput("");
            }}
            className="h-8 rounded-lg bg-amber-500 px-3 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            {pt ? "Ajustar" : "Set"}
          </button>
        </div>
      </div>

      {/* Memory */}
      {memory && (
        <div className="rounded-xl border border-slate-800 bg-violet-950/30 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-300">
            <Brain className="size-3.5" /> {pt ? "Memória da sessão" : "Session memory"}
          </p>
          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-violet-200/70">{memory}</p>
        </div>
      )}

      {/* Learned memory — code-based GM learning, extracted from play */}
      {learned && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
              <Brain className="size-3.5" />
              {pt ? "O que o GM aprendeu" : "What the GM learned"}
              {typeof learnedCount === "number" && learnedCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                  {learnedCount}
                </span>
              )}
            </p>
            {onClearLearned && (
              <button
                type="button"
                onClick={onClearLearned}
                title={pt ? "Apagar memória aprendida" : "Clear learned memory"}
                className="rounded p-1 text-emerald-400/60 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-emerald-200/70">{learned}</p>
          <p className="mt-1.5 text-[9px] text-emerald-400/40">
            {pt
              ? "Fatos extraídos automaticamente das suas interações e injetados no GM a cada resposta."
              : "Facts extracted automatically from your interactions and injected into the GM on every reply."}
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-red-400/80">
          {pt ? "Nova cena" : "Fresh scene"}
        </p>
        <p className="mb-2 text-[11px] leading-relaxed text-red-200/50">
          {pt
            ? "Apaga o histórico do chat e dispara uma nova cena de abertura. A ficha e o progresso são mantidos."
            : "Clears the chat history and fires a brand-new opening scene. Your sheet and progress are kept."}
        </p>
        <button
          type="button"
          onClick={onClearHistory}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-800/60 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-950/60"
        >
          <RefreshCcw className="size-3.5" /> {pt ? "Começar nova cena" : "Start fresh scene"}
        </button>
      </div>
    </div>
  );
}
