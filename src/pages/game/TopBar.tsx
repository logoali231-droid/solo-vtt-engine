import { cn } from "@/lib/utils";
import type { AdventureState, AdsSettings, GmLanguage, GmSettings } from "@/lib/rpg/types";
import { GM_PROVIDERS, providerOf } from "@/lib/rpg/gm/providers";
import { estimatedRevenue, readAdsStats, type AdsStats } from "./AdSlot";
import {
  BadgeDollarSign,
  BookmarkPlus,
  Dices,
  Download,
  LogOut,
  Megaphone,
  Plus,
  Settings2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  adventure: AdventureState;
  hpText: string;
  settings: GmSettings;
  ads: AdsSettings;
  onSettings: (s: GmSettings) => void;
  onAds: (a: AdsSettings) => void;
  onGmMode: (mode: "local" | "live") => void;
  onNewCharacter: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSaveToLibrary: () => void;
  onSignOut: () => void;
}

export default function TopBar({
  adventure,
  hpText,
  settings,
  ads,
  onSettings,
  onAds,
  onGmMode,
  onNewCharacter,
  onExport,
  onImport,
  onSaveToLibrary,
  onSignOut,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adsOpen, setAdsOpen] = useState(false);
  const [adsStats, setAdsStats] = useState<AdsStats>(() => readAdsStats());

  // Live stats readout while the Ads dialog is open.
  useEffect(() => {
    if (!adsOpen) return;
    const id = window.setInterval(() => setAdsStats(readAdsStats()), 1000);
    return () => window.clearInterval(id);
  }, [adsOpen]);

  const patchAds = (p: Partial<AdsSettings>) => onAds({ ...ads, ...p });

  const patch = (p: Partial<GmSettings>) => onSettings({ ...settings, ...p });
  const provider = providerOf(settings.provider);
  const lang = settings.language;

  return (
    <>
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
            <Dices className="size-4.5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none tracking-tight text-slate-100">Oraculum</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Phase 2 · Solo VTT · {adventure.system.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mx-auto hidden min-w-0 flex-col items-center md:flex">
          <p className="max-w-md truncate text-sm font-semibold text-slate-200">{adventure.sceneTitle}</p>
          <p className="max-w-md truncate text-[11px] text-slate-500">{adventure.location}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-400 lg:inline">
            {hpText}
          </span>
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            {(["local", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onGmMode(m)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
                  adventure.gmMode === m
                    ? m === "live"
                      ? "bg-teal-500 text-slate-950"
                      : "bg-amber-500 text-slate-950"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {m === "live" ? "Live GM" : "Local GM"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="GM settings — provider, model, language"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-teal-500/50 hover:text-teal-300"
          >
            <Settings2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setAdsOpen(true)}
            title="Ads — screen-time sponsor slot & revenue"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border transition-colors",
              ads.enabled
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:text-amber-200"
                : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300",
            )}
          >
            <Megaphone className="size-4" />
          </button>
          <button
            type="button"
            onClick={onSaveToLibrary}
            title="Save to character library"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300"
          >
            <BookmarkPlus className="size-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Export JSON"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Import JSON"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
          >
            <Upload className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={onNewCharacter}
            title="New character (back to Phase 1)"
            className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300"
          >
            <Plus className="size-3.5" /> New
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            className="flex size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* GM Settings */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">GM Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                AI Provider
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GM_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      patch({
                        provider: p.id,
                        model: p.models[0] ?? settings.model,
                      })
                    }
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-colors",
                      settings.provider === p.id
                        ? "border-teal-400/70 bg-teal-400/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600",
                    )}
                  >
                    <p className="text-xs font-bold text-slate-100">{p.name}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{p.tagline}</p>
                    <span
                      className={cn(
                        "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        p.tier === "builtin"
                          ? "bg-amber-500/15 text-amber-300"
                          : p.tier === "free"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : p.tier === "local"
                              ? "bg-sky-500/15 text-sky-300"
                              : "bg-violet-500/15 text-violet-300",
                      )}
                    >
                      {p.tier}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Model
              </p>
              <input
                list="gm-model-options"
                value={settings.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder={provider.models[0] ?? "model id…"}
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none transition-colors focus:border-teal-500/60"
              />
              <datalist id="gm-model-options">
                {provider.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                Pick a suggestion or type any model ID — e.g. a HuggingFace repo like{" "}
                <span className="font-mono text-teal-300/70">SanjiWatsuki/Kunoichi-DPO-v2-7B</span>.
              </p>
            </div>

            {provider.needsBaseUrl && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Base URL (Ollama / LM Studio / OpenAI-compatible)
                </p>
                <input
                  value={settings.baseUrl}
                  onChange={(e) => patch({ baseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-teal-500/60"
                />
              </div>
            )}

            {provider.needsKey && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  API key <span className="normal-case text-slate-600">· stored only in this browser</span>
                </p>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => patch({ apiKey: e.target.value })}
                  placeholder={provider.keyPlaceholder ?? "sk-…"}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-teal-500/60"
                />
              </div>
            )}

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                GM language
              </p>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                {(["en", "pt-BR"] as GmLanguage[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => patch({ language: l })}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors",
                      lang === l
                        ? l === "pt-BR"
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-amber-500 text-slate-950"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {l === "pt-BR" ? "Português (BR)" : "English"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                Controls the local narrator, the opening scene and the live GM's narration language.
              </p>
            </div>

            <p className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-500">
              The built-in provider uses the platform's <code className="text-amber-300/80">OPENAI_API_KEY</code>{" "}
              (set in Keys). Client providers (Groq, Gemini, HuggingFace, OpenRouter, Ollama) call their APIs
              directly from your browser using the key above — nothing is stored server-side. If a live call
              fails, the offline local narrator takes over automatically.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screen-time Ads Settings */}
      <Dialog open={adsOpen} onOpenChange={setAdsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <BadgeDollarSign className="size-4 text-amber-400" />
              Screen-Time Ads
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div>
                <p className="text-xs font-bold text-slate-100">Sponsor slot</p>
                <p className="text-[10px] leading-snug text-slate-500">
                  A compact strip that refreshes while you play — one long session = many impressions,
                  like Freebuff's model.
                </p>
              </div>
              <button
                type="button"
                onClick={() => patchAds({ enabled: !ads.enabled })}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  ads.enabled ? "bg-amber-500" : "bg-slate-700",
                )}
                aria-label="Toggle sponsor slot"
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                    ads.enabled ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Ad provider
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "demo" as const, name: "Demo cards", desc: "Works now, zero accounts" },
                    { id: "adsense" as const, name: "AdSense", desc: "Google slot, static" },
                    { id: "iframe" as const, name: "iframe tag", desc: "Venatus / Setupad / Playwire" },
                  ]
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patchAds({ provider: p.id })}
                    className={cn(
                      "rounded-xl border p-2.5 text-left transition-colors",
                      ads.provider === p.id
                        ? "border-amber-400/70 bg-amber-400/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600",
                    )}
                  >
                    <p className="text-xs font-bold text-slate-100">{p.name}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {ads.provider !== "adsense" && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Screen-time refresh
                </p>
                <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                  {[30, 60, 90].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => patchAds({ refreshSeconds: s })}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors",
                        ads.refreshSeconds === s
                          ? "bg-amber-500 text-slate-950"
                          : "text-slate-500 hover:text-slate-300",
                      )}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  A 4-hour session at 30s ≈ 480 fresh impressions from one player. Refreshes only while
                  the strip is visible, so impressions stay viewable.
                </p>
              </div>
            )}

            {ads.provider === "adsense" && (
              <>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    AdSense client ID
                  </p>
                  <input
                    value={ads.adsenseClient}
                    onChange={(e) => patchAds({ adsenseClient: e.target.value })}
                    placeholder="ca-pub-1234567890"
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    AdSense slot ID
                  </p>
                  <input
                    value={ads.adsenseSlot}
                    onChange={(e) => patchAds({ adsenseSlot: e.target.value })}
                    placeholder="1234567890"
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-amber-500/60"
                  />
                </div>
                <p className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-500">
                  Google policy forbids auto-refreshing standard AdSense units, so AdSense stays static
                  here. For the auto-refresh screen-time model, use a gaming network's iframe tag or the
                  built-in demo cards.
                </p>
              </>
            )}

            {ads.provider === "iframe" && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Ad network display URL
                </p>
                <input
                  value={ads.iframeUrl}
                  onChange={(e) => patchAds({ iframeUrl: e.target.value })}
                  placeholder="https://… (Venatus / Setupad / Playwire iframe tag)"
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-amber-500/60"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  Paste any iframe-based ad tag. It auto-refreshes on the screen-time interval while
                  visible. These networks are managed (no self-serve) — Setupad and Newor Media are the
                  more accessible entry points.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                This session
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-2xl font-bold text-slate-100">
                    {adsStats.impressions.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">viewable impressions</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-amber-300">
                    ${estimatedRevenue(adsStats).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500">est. revenue @ $1.25 eCPM</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                The screen-time model: a player who stays 4 hours generates ~240–480 impressions instead
                of 1 — enough volume to fund the free AI providers in GM Settings.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
