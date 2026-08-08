import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { chatWithProvider, GM_PROVIDERS, providerOf } from "@/lib/rpg/gm/providers";
import { loadGmSettings, saveGmSettings } from "@/lib/rpg/storage";
import type { GmLanguage, GmSettings } from "@/lib/rpg/types";
import { Loader2, PlugZap } from "lucide-react";
import { useState } from "react";

export default function SettingsPanel() {
  const [settings, setSettings] = useState<GmSettings>(() => loadGmSettings());
  const [testing, setTesting] = useState(false);

  const patch = (p: Partial<GmSettings>) => {
    const next = { ...settings, ...p };
    setSettings(next);
    saveGmSettings(next);
  };

  const provider = providerOf(settings.provider);

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
