import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdventureState, AdsSettings, GmLanguage, GmSettings } from "@/lib/rpg/types";
import { chatWithProvider, GM_PROVIDERS, providerOf } from "@/lib/rpg/gm/providers";
import { estimatedRevenue, readAdsStats, type AdsStats } from "./AdSlot";
import {
  Accessibility,
  BadgeDollarSign,
  BookmarkPlus,
  Dices,
  Download,
  Eye,
  Home,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  PlugZap,
  Plus,
  Settings2,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { InstallApp } from "@/components/InstallApp";
import {
  getVoices,
  speak,
  subscribeVoices,
  useA11ySettings,
} from "@/lib/rpg/a11y";
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
  onOpenSheet: () => void;
  onGmMode: (mode: "local" | "live") => void;
  onNewCharacter: () => void;
  onBackToHub?: () => void;
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
  onOpenSheet,
  onGmMode,
  onNewCharacter,
  onBackToHub,
  onExport,
  onImport,
  onSaveToLibrary,
  onSignOut,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adsOpen, setAdsOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [adsStats, setAdsStats] = useState<AdsStats>(() => readAdsStats());
  const [testing, setTesting] = useState(false);
  const [a11y, setA11y] = useA11ySettings();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getVoices());
  const [testingVoice, setTestingVoice] = useState(false);

  // Refresh the voice list when the browser finishes loading voices.
  useEffect(() => subscribeVoices(() => setVoices(getVoices())), []);

  const patchA11y = (p: Partial<typeof a11y>) => setA11y({ ...a11y, ...p });

  const testConnection = async () => {
    if (settings.provider === "builtin") {
      toast.info(
        "The built-in provider routes through the platform backend — OpenAI (OPENAI_API_KEY in Keys) or a free AI Horde fallback when no key is set. Switch to Live and send a message to verify.",
      );
      return;
    }
    setTesting(true);
    try {
      await chatWithProvider(settings, [
        { role: "system", content: "Reply with exactly: OK" },
        { role: "user", content: "ping" },
      ]);
      toast.success("Connected — the model responded.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message.slice(0, 160) : "Connection failed.",
      );
    } finally {
      setTesting(false);
    }
  };

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
      <header className="flex flex-wrap shrink-0 items-center gap-x-1.5 gap-y-1.5 border-b border-slate-800 bg-slate-950/95 px-2.5 py-2 sm:gap-x-3 sm:gap-y-2 sm:px-4 sm:py-2.5">
        <button
          type="button"
          onClick={onOpenSheet}
          title="Character sheet"
          aria-label="Open character sheet"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300 lg:hidden"
        >
          <Menu className="size-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="hidden size-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 min-[420px]:flex">
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
          <span className="hidden rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] font-bold text-emerald-400 xl:inline">
            {hpText}
          </span>
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            {(["local", "live"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onGmMode(m)}
                aria-pressed={adventure.gmMode === m}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors sm:px-2.5",
                  adventure.gmMode === m
                    ? m === "live"
                      ? "bg-teal-500 text-slate-950"
                      : "bg-amber-500 text-slate-950"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {m === "live" ? "Live" : "Local"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="AI model, provider & API key"
            aria-label="AI model, provider and API key"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-teal-500/50 hover:text-teal-300"
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
          <button
            type="button"
            onClick={() => setA11yOpen(true)}
            title="Accessibility — high contrast, large text & read-aloud"
            aria-label="Accessibility settings"
            aria-pressed={a11y.hc !== "off" || a11y.large !== "normal" || a11y.reader}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border transition-colors",
              a11y.hc !== "off" || a11y.large !== "normal" || a11y.reader
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:text-amber-200"
                : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300",
            )}
          >
            <Accessibility className="size-4" />
          </button>
          <InstallApp variant="icon" />
          <button
            type="button"
            onClick={() => setAdsOpen(true)}
            title="Ads — screen-time sponsor slot & revenue"
            aria-label="Ads settings"
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
            aria-label="Save to character library"
            className="hidden size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300 sm:flex"
          >
            <BookmarkPlus className="size-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Export JSON"
            aria-label="Export adventure as JSON"
            className="hidden size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200 sm:flex"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Import JSON"
            aria-label="Import adventure from JSON"
            className="hidden size-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:text-slate-200 sm:flex"
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
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              title="Back to the hub (adventures, characters, settings)"
              aria-label="Back to the hub"
              className="flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-teal-500/50 hover:text-teal-300"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">Hub</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNewCharacter}
            title="New character (back to Phase 1)"
            aria-label="Create a new character"
            className="flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-300"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
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
            <DialogTitle className="text-base font-semibold">AI Model & GM Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* One-click free setups */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Start playing free — one tap
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    patch({ provider: "horde", model: "koboldcpp/L3-8B-Stheno-v3.2-IQ3_S-imat" });
                    toast.success("AI Horde is on — 100% free & unlimited, no key needed.");
                  }}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-2.5 text-left transition-colors hover:bg-emerald-500/10"
                >
                  <p className="text-xs font-bold text-emerald-200">AI Horde</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-400">Community GPUs · no key · unlimited. Expect a queue of seconds to minutes.</p>
                  <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">Free · no key</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    patch({ provider: "gemini", model: "gemini-2.5-flash" });
                    toast.info("Gemini selected — paste your free key (AIza…) below, then Test connection.");
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left transition-colors hover:border-slate-600"
                >
                  <p className="text-xs font-bold text-slate-100">Google Gemini</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-400">Free API key, generous daily quota, strong storytelling.</p>
                  <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">Free key</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    patch({ provider: "groq", model: "llama-3.3-70b-versatile" });
                    toast.info("Groq selected — paste your free key (gsk_…) below, then Test connection.");
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-left transition-colors hover:border-slate-600"
                >
                  <p className="text-xs font-bold text-slate-100">Groq</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-400">Blazing-fast open models · ~1k free requests/day.</p>
                  <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">Free key</span>
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                New players already start on <span className="text-emerald-300/80">AI Horde</span> — the only provider with zero accounts and zero cost.
              </p>
            </div>

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
              <div className="flex flex-wrap gap-1.5">
                {provider.models.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patch({ model: m })}
                    className={cn(
                      "max-w-full truncate rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors",
                      settings.model === m
                        ? "border-teal-400/70 bg-teal-400/10 text-teal-200"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-slate-200",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                list="gm-model-options"
                aria-label="Model ID"
                value={settings.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder={provider.models[0] ?? "model id…"}
                className="mt-2 h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none transition-colors focus:border-teal-500/60"
              />
              <datalist id="gm-model-options">
                {provider.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                Tap a chip or type any model ID — e.g. a HuggingFace repo like{" "}
                <span className="font-mono text-teal-300/70">SanjiWatsuki/Kunoichi-DPO-v2-7B</span>.
              </p>
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PlugZap className="size-3.5" />
                )}
                Test connection
              </button>
            </div>

            {provider.needsBaseUrl && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Base URL (Ollama / LM Studio / OpenAI-compatible)
                </p>
                <input
                  value={settings.baseUrl}
                  aria-label="Base URL"
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
                  aria-label="API key"
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
              The built-in provider routes through the platform backend: OpenAI when an{" "}
              <code className="text-amber-300/80">OPENAI_API_KEY</code> is set (Keys), otherwise it falls back
              to free AI Horde — no key, no cost. AI Horde also runs through the backend, so it works with zero
              accounts and no browser CORS. Client providers (Groq, Gemini, HuggingFace, OpenRouter, Ollama) call
              their APIs directly from your browser using the key above — nothing is stored server-side. If a live
              call fails, the offline local narrator takes over automatically.
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { id: "demo" as const, name: "Demo cards", desc: "Works now, zero accounts" },
                    { id: "adsense" as const, name: "AdSense", desc: "Google, free, no traffic minimum" },
                    { id: "script" as const, name: "Custom tag", desc: "Adsterra / Monetag / PropellerAds" },
                    { id: "iframe" as const, name: "iframe URL", desc: "Display-URL networks" },
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
                  the strip is visible, so impressions stay viewable. Networks that pay per display
                  (CPM) profit from this — you're paid per 1,000 viewable impressions, not per click.
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
                    aria-label="AdSense client ID"
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
                    aria-label="AdSense slot ID"
                    onChange={(e) => patchAds({ adsenseSlot: e.target.value })}
                    placeholder="1234567890"
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-amber-500/60"
                  />
                </div>
                <p className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-500">
                  AdSense is free to join and accepts new/small sites — you just need a real public
                  domain with original content (approval takes a few days). It pays a mix of clicks and
                  per-1,000-impressions (CPM). Google policy forbids auto-refreshing standard units, so
                  AdSense stays static here; the screen-time refresh model uses the other modes.
                </p>
              </>
            )}

            {ads.provider === "script" && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Ad network script tag
                </p>
                <textarea
                  value={ads.adScript}
                  aria-label="Ad network script tag"
                  onChange={(e) => patchAds({ adScript: e.target.value })}
                  placeholder={'<script async src="https://…"></script>'}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500/60"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  Paste the exact snippet from any self-serve CPM network —{" "}
                  <span className="text-slate-300">Adsterra</span> (banners / social bar),{" "}
                  <span className="text-slate-300">Monetag</span> (in-page push),{" "}
                  <span className="text-slate-300">PropellerAds</span> (on-page push). All are
                  free to join, accept small/new sites, and pay per impression (CPM) with ~$5
                  payouts via PayPal. It auto-refreshes on the screen-time interval while visible.
                </p>
              </div>
            )}

            {ads.provider === "iframe" && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Ad network display URL
                </p>
                <input
                  value={ads.iframeUrl}
                  aria-label="Ad network display URL"
                  onChange={(e) => patchAds({ iframeUrl: e.target.value })}
                  placeholder="https://… (PropellerAds / Venatus / Setupad iframe tag)"
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-xs text-slate-100 outline-none focus:border-amber-500/60"
                />
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  Paste any iframe-based ad tag. It auto-refreshes on the screen-time interval while
                  visible.
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

      {/* Accessibility — high contrast, large text & read-aloud */}
      <Dialog open={a11yOpen} onOpenChange={setA11yOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Accessibility className="size-4 text-amber-400" />
              Accessibility
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            {/* High contrast */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-100">High-contrast mode</p>
                <Eye className="size-3.5 text-amber-300" />
              </div>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                {(
                  [
                    { id: "auto" as const, label: "Auto" },
                    { id: "on" as const, label: "On" },
                    { id: "off" as const, label: "Off" },
                  ]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={a11y.hc === o.id}
                    onClick={() => patchA11y({ hc: o.id })}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors",
                      a11y.hc === o.id
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                Auto follows your device's "increase contrast" setting. On deepens every surface to
                black, brightens text and borders, and thickens the focus ring.
              </p>
            </div>

            {/* Text scale */}
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-100">Larger text</p>
              <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                {(
                  [
                    { id: "normal" as const, label: "100%" },
                    { id: "115" as const, label: "115%" },
                    { id: "130" as const, label: "130%" },
                  ]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={a11y.large === o.id}
                    onClick={() => patchA11y({ large: o.id })}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors",
                      a11y.large === o.id
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                Scales the whole interface — panels, sheets and dice — proportionally.
              </p>
            </div>

            {/* Read aloud */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-100">Read game text aloud</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                    GM narration and dice results are spoken as they land — no extra apps needed.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={a11y.reader}
                  aria-label="Toggle read-aloud screen reader"
                  onClick={() => patchA11y({ reader: !a11y.reader })}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    a11y.reader ? "bg-amber-500" : "bg-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                      a11y.reader ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </div>

              {a11y.reader && (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="size-3.5 shrink-0 text-amber-300" />
                    <select
                      aria-label="Reader voice"
                      value={a11y.voiceURI ?? ""}
                      onChange={(e) => patchA11y({ voiceURI: e.target.value || null })}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 outline-none focus:border-amber-500/60"
                    >
                      <option value="">Auto — best for the GM language</option>
                      {voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="a11y-rate" className="text-[10px] font-semibold text-slate-400">
                        Speed
                      </label>
                      <span className="font-mono text-[10px] text-amber-300">
                        {a11y.rate.toFixed(1)}×
                      </span>
                    </div>
                    <input
                      id="a11y-rate"
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={a11y.rate}
                      aria-label="Reading speed"
                      onChange={(e) => patchA11y({ rate: Number(e.target.value) })}
                      className="h-1.5 w-full cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="a11y-pitch" className="text-[10px] font-semibold text-slate-400">
                        Pitch
                      </label>
                      <span className="font-mono text-[10px] text-amber-300">
                        {a11y.pitch.toFixed(1)}×
                      </span>
                    </div>
                    <input
                      id="a11y-pitch"
                      type="range"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      value={a11y.pitch}
                      aria-label="Voice pitch"
                      onChange={(e) => patchA11y({ pitch: Number(e.target.value) })}
                      className="h-1.5 w-full cursor-pointer accent-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTestingVoice(true);
                      speak(
                        "The candlelight flickers as you step into the ruined hall. Your move, adventurer.",
                        lang === "pt-BR" ? "pt-BR" : "en-US",
                      );
                      window.setTimeout(() => setTestingVoice(false), 600);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    {testingVoice ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <VolumeX className="size-3.5" />
                    )}
                    Test voice
                  </button>
                </div>
              )}
            </div>

            <p className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[10px] leading-relaxed text-slate-500">
              The read-aloud feature uses your browser's built-in speech engine — everything stays
              on-device, works offline, and respects your device's text-to-speech settings. All
              choices here are saved to this browser and apply to every adventure.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
