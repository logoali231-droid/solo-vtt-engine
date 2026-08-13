import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  chatWithProvider,
  GM_PROVIDERS,
  hordeModelStatus,
  HORDE_RPG_MODELS,
  NARRATOR_LENGTHS,
  providerOf,
} from "@/lib/rpg/gm/providers";
import type { HordeStatusResult } from "@/lib/rpg/gm/providers";
import { loadGmSettings, saveGmSettings } from "@/lib/rpg/storage";
import type { GmLanguage, GmSettings } from "@/lib/rpg/types";
import { Ghost, Loader2, PlugZap, RefreshCw, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPanel() {
  const [settings, setSettings] = useState<GmSettings>(() => loadGmSettings());
  const [testing, setTesting] = useState(false);
  const [hordeStatus, setHordeStatus] = useState<HordeStatusResult | null>(null);
  const [checkingHorde, setCheckingHorde] = useState(false);
  const hordeStatusAction = useAction(api.gm.hordeStatus);

  const patch = (p: Partial<GmSettings>) => {
    const next = { ...settings, ...p };
    setSettings(next);
    saveGmSettings(next);
  };

  const provider = providerOf(settings.provider);

  /** Live availability check against the AI Horde network. The convex action
   *  is the primary path (no CORS), the client fetch is the fallback. */
  const checkHorde = async (model?: string) => {
    setCheckingHorde(true);
    try {
      const target = model ?? settings.model;
      let res: HordeStatusResult;
      try {
        const r = await hordeStatusAction({ model: target || undefined });
        res = (r ?? { ok: false, selected: null, models: [] }) as HordeStatusResult;
      } catch {
        res = await hordeModelStatus(target);
      }
      setHordeStatus(res);
      if (!res.ok) {
        toast.error(res.detail ?? "AI Horde status check failed.");
      }
    } finally {
      setCheckingHorde(false);
    }
  };

  // Auto-check once when the horde provider becomes active. checkHorde is
  // async — it only sets state after the network/Convex call settles, so this
  // is a fetch-on-mount pattern, not a synchronous cascade.
  useEffect(() => {
    if (settings.provider === "horde" && !hordeStatus) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch guard
      void checkHorde();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider]);

  const selectHordeModel = (name: string) => {
    patch({ model: name });
    void checkHorde(name);
  };

  const testConnection = async () => {
    if (settings.provider === "builtin") {
      toast.info(
        "The built-in provider routes through the platform backend — OpenAI (OPENAI_API_KEY in Keys) or a free AI Horde fallback when no key is set. Start a game and send a message to verify.",
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
      toast.error(err instanceof Error ? err.message.slice(0, 160) : "Connection failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* One-click free setups */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Start free — one tap
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
            <p className="mt-0.5 text-[10px] leading-snug text-stone-400">
              Community GPUs · no key · unlimited. Expect a short queue.
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300">
              Free · no key
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              patch({ provider: "gemini", model: "gemini-2.5-flash" });
              toast.info("Gemini selected — paste your free key (AIza…) below, then Test connection.");
            }}
            className="rounded-xl border border-stone-200 bg-white p-2.5 text-left transition-colors hover:border-stone-300"
          >
            <p className="text-xs font-bold text-stone-800">Google Gemini</p>
            <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
              Free API key, generous daily quota, strong storytelling.
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Free key
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              patch({ provider: "groq", model: "llama-3.3-70b-versatile" });
              toast.info("Groq selected — paste your free key (gsk_…) below, then Test connection.");
            }}
            className="rounded-xl border border-stone-200 bg-white p-2.5 text-left transition-colors hover:border-stone-300"
          >
            <p className="text-xs font-bold text-stone-800">Groq</p>
            <p className="mt-0.5 text-[10px] leading-snug text-stone-500">
              Blazing-fast open models · ~1k free requests/day.
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Free key
            </span>
          </button>
        </div>
      </div>

      {/* Provider grid */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          AI provider
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GM_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => patch({ provider: p.id, model: p.models[0] ?? settings.model })}
              className={cn(
                "rounded-xl border p-2.5 text-left transition-colors",
                settings.provider === p.id
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              <p className="text-xs font-bold text-stone-800">{p.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-500">{p.tagline}</p>
              <span
                className={cn(
                  "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  p.tier === "builtin"
                    ? "bg-amber-500/15 text-amber-600"
                    : p.tier === "free"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : p.tier === "local"
                        ? "bg-sky-500/15 text-sky-600"
                        : "bg-violet-500/15 text-violet-600",
                )}
              >
                {p.tier}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Model</p>
        <div className="flex flex-wrap gap-1.5">
          {provider.models.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => patch({ model: m })}
              className={cn(
                "max-w-full truncate rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors",
                settings.model === m
                  ? "border-teal-500 bg-teal-500/10 text-teal-800"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          list="settings-model-options"
          value={settings.model}
          onChange={(e) => patch({ model: e.target.value })}
          placeholder={provider.models[0] ?? "model id…"}
          className="mt-2 h-9 w-full rounded-lg border border-stone-300 bg-white px-3 font-mono text-xs text-stone-800 outline-none transition-colors focus:border-teal-500"
        />
        <datalist id="settings-model-options">
          {provider.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      {/* AI Horde — live model availability */}
      {settings.provider === "horde" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                AI Horde · model status
              </p>
              {/* Anonymous vs. priority key badge — reflects the current key state */}
              <span
                title={
                  settings.apiKey
                    ? "Account key active — Kudos and queue priority."
                    : "No key — anonymous mode (0000000000 token)."
                }
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  settings.apiKey
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-emerald-500/15 text-emerald-300",
                )}
              >
                {settings.apiKey ? (
                  <>
                    <Star className="size-2.5" />
                    Priority
                  </>
                ) : (
                  <>
                    <Ghost className="size-2.5" />
                    Anonymous
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void checkHorde()}
              disabled={checkingHorde}
              className="flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {checkingHorde ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              {checkingHorde ? "Checking…" : "Check again"}
            </button>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-emerald-200/60">
            AI Horde is an open volunteer GPU network — a model only works while
            a worker is hosting it right now. This checks the live network.
          </p>

          {/* Optional Horde key — anonymous (0000000000) works; a free account
              key buys queue priority via Kudos. */}
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-900/40 p-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              AI Horde API key (Optional)
            </p>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => patch({ apiKey: e.target.value })}
              placeholder="Place your Horde AI key here (Optional)"
              autoComplete="off"
              className="h-9 w-full rounded-lg border border-emerald-500/30 bg-emerald-950 px-3 font-mono text-xs text-emerald-100 outline-none transition-colors placeholder:text-emerald-200/40 focus:border-emerald-400"
            />
            <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-200/60">
              No key needed — anonymous requests work (they use the
              0000000000 token). A free account key from{" "}
              <a
                href="https://aihorde.net"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-200"
              >
                aihorde.net
              </a>{" "}
              earns Kudos and jumps your requests ahead in the queue. Stored only
              in this browser.
            </p>
          </div>

          {/* Selected model verdict */}
          {hordeStatus && (
            <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-900/40 p-2.5">
              <p className="break-all font-mono text-[11px] font-bold text-emerald-100">
                {settings.model || "(no model set)"}
              </p>
              {hordeStatus.selected?.running ? (
                <p className="mt-0.5 text-[10px] font-semibold text-emerald-300">
                  ● Running — {hordeStatus.selected.workers} worker
                  {hordeStatus.selected.workers === 1 ? "" : "s"}
                  {hordeStatus.selected.queued > 0
                    ? `, ${hordeStatus.selected.queued} queued`
                    : ""}
                  {hordeStatus.selected.eta != null
                    ? `, ~${hordeStatus.selected.eta}s ETA`
                    : ""}
                </p>
              ) : hordeStatus.ok ? (
                <p className="mt-0.5 text-[10px] font-semibold text-amber-300">
                  ○ Not running right now — no worker currently hosts it. Pick
                  a model below that is, or type another name from aihorde.net.
                </p>
              ) : (
                <p className="mt-0.5 text-[10px] font-semibold text-rose-300">
                  Check failed — {hordeStatus.detail ?? "network error"}
                </p>
              )}
            </div>
          )}
          {!hordeStatus && !checkingHorde && (
            <p className="mt-2 text-[10px] text-emerald-200/60">
              Press “Check again” to see which models are live.
            </p>
          )}

          {/* Live RPG shortlist */}
          {hordeStatus?.ok && hordeStatus.models.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                RPG shortlist · live network
              </p>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
                {hordeStatus.models.map((m) => {
                  const info = HORDE_RPG_MODELS.find((x) => x.name === m.name);
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => selectHordeModel(m.name)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                        m.running
                          ? "border-emerald-500/30 bg-emerald-900/30 hover:bg-emerald-900/60"
                          : "border-stone-800 bg-emerald-950/30 opacity-60 hover:opacity-90",
                        settings.model === m.name &&
                          "ring-1 ring-emerald-400/60",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          m.running ? "bg-emerald-400" : "bg-stone-600",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[10px] font-semibold text-emerald-100">
                          {m.name}
                        </span>
                        {info && (
                          <span className="block text-[9px] text-emerald-200/50">
                            {info.size} · {info.style}
                          </span>
                        )}
                      </span>
                      {m.running && (
                        <span className="shrink-0 text-[9px] font-bold text-emerald-300">
                          {m.workers}w{m.queued > 0 ? ` · ${m.queued}q` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Base URL */}
      {provider.needsBaseUrl && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Base URL (Ollama / LM Studio / OpenAI-compatible)
          </p>
          <input
            value={settings.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="http://localhost:11434"
            className="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 font-mono text-xs text-stone-800 outline-none focus:border-teal-500"
          />
        </div>
      )}

      {/* API key */}
      {provider.needsKey && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            API key <span className="normal-case text-stone-400">· stored only in this browser</span>
          </p>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value })}
            placeholder={provider.keyPlaceholder ?? "sk-…"}
            className="h-9 w-full rounded-lg border border-stone-300 bg-white px-3 font-mono text-xs text-stone-800 outline-none focus:border-teal-500"
          />
        </div>
      )}

      {/* Narrator length */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Narrator length
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NARRATOR_LENGTHS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => patch({ narratorLength: l.id })}
              className={cn(
                "rounded-xl border p-2.5 text-left transition-colors",
                settings.narratorLength === l.id
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              <p className="text-xs font-bold text-stone-800">{l.label}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-500">{l.hint}</p>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-stone-400">
          How long each narration should be. Dynamic adapts to the scene —
          climactic moments go long, travel and minor beats stay short.
        </p>
      </div>

      {/* Language + temperature */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            GM language
          </p>
          <div className="flex rounded-lg border border-stone-300 bg-white p-0.5">
            {(["en", "pt-BR"] as GmLanguage[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => patch({ language: l })}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors",
                  settings.language === l
                    ? l === "pt-BR"
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-900 text-amber-300"
                    : "text-stone-500 hover:text-stone-800",
                )}
              >
                {l === "pt-BR" ? "Português (BR)" : "English"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Creativity <span className="normal-case">· {settings.temperature.toFixed(1)}</span>
          </p>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => patch({ temperature: Number(e.target.value) })}
            className="mt-2 w-full accent-stone-900"
          />
          <div className="mt-0.5 flex justify-between text-[9px] text-stone-400">
            <span>Precise</span>
            <span>Wild</span>
          </div>
        </div>
      </div>

      {/* Test connection */}
      <button
        type="button"
        onClick={testConnection}
        disabled={testing}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
      >
        {testing ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
        Test connection
      </button>

      <p className="rounded-lg border border-stone-200 bg-white p-2.5 text-[10px] leading-relaxed text-stone-500">
        The built-in provider routes through the platform backend: OpenAI when an{" "}
        <code className="text-amber-600">OPENAI_API_KEY</code> is set (Keys), otherwise it falls back to
        free AI Horde — no key, no cost. AI Horde also runs through the backend, so it works with zero
        accounts and no browser CORS. Client providers (Groq, Gemini, HuggingFace, OpenRouter, Ollama)
        call their APIs directly from your browser — nothing is stored server-side. If a live call fails,
        the offline local narrator takes over automatically.
      </p>
    </div>
  );
}
