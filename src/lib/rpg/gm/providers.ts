// ============================================================================
// Oraculum — Multi-provider Game Master AI layer.
// All provider config lives in localStorage (see storage.ts), never the DB.
// Providers: Built-in (Convex/OpenAI), Groq, Google Gemini, HuggingFace,
// OpenRouter, and local / Ollama-style OpenAI-compatible endpoints.
// ============================================================================

import type { GmSettings } from "../types";

export interface GmProviderDef {
  id: GmSettings["provider"];
  name: string;
  tagline: string;
  tier: "builtin" | "free" | "key" | "local";
  needsKey: boolean;
  needsBaseUrl?: boolean;
  models: string[];
  keyPlaceholder?: string;
}

// ---------------------------------------------------------------------------
// AI Horde — curated RPG-focused model catalog.
//
// AI Horde is an open, volunteer-run GPU network: a model only works while at
// least one worker is currently hosting it. The catalog below is the RPG
// shortlist (roleplay-tuned storytellers of every size). Availability is
// checked live against the network — see hordeModelStatus() and the convex
// `gm.hordeStatus` action — because workers come and go.
// ---------------------------------------------------------------------------

export interface HordeRpgModel {
  name: string;
  size: string;
  style: string;
}

export const HORDE_RPG_MODELS: HordeRpgModel[] = [
  { name: "koboldcpp/L3-8B-Stheno-v3.2-IQ3_S-imat", size: "8B", style: "Roleplay storyteller — fast, smart, reliable" },
  { name: "koboldcpp/Llama-3.2-3B", size: "3B", style: "Lightning-fast general storytelling" },
  { name: "aphrodite/TheDrummer/Skyfall-31B-v4.2", size: "31B", style: "High-quality roleplay with rich prose" },
  { name: "TheBloke/MythoMax-L2-13B-GPTQ", size: "13B", style: "Classic creative-writing / RP all-rounder" },
  { name: "koboldcpp/MythoMax-L2-13B-GGUF", size: "13B", style: "Same classic storyteller, GGUF build" },
  { name: "KoboldAI/LLaMA2-13B-Tiefighter", size: "13B", style: "Long-time roleplay staple of the Horde" },
  { name: "TheBloke/Mistral-7B-Instruct-v0.2-GPTQ", size: "7B", style: "Fast instruct — decent narration, low queue" },
  { name: "KoboldAI/OPT-13B-Erebus", size: "13B", style: "Old-school creative writing / adventure" },
  { name: "TheBloke/Llama-2-7B-Chat-GPTQ", size: "7B", style: "Quick general chat when queues spike" },
  { name: "TheBloke/Llama-2-13B-Chat-GPTQ", size: "13B", style: "Balanced general storytelling" },
  { name: "TheBloke/Pygmalion-13B-SuperHOT-8K-GPTQ", size: "13B", style: "Roleplay with 8K context window" },
  { name: "TheDrummer/Rocinante-12B-v1.1", size: "12B", style: "Modern roleplay — strong prose" },
  { name: "TheDrummer/Unholy-V1-12B", size: "12B", style: "Creative writing with a darker edge" },
  { name: "TheDrummer/Mirage-8B", size: "8B", style: "Smooth roleplay storyteller" },
  { name: "TheDrummer/Lobotomized-Llama-3.2-3B", size: "3B", style: "Fast roleplay, mature-content tolerant" },
];


export const GM_PROVIDERS: GmProviderDef[] = [
  {
    id: "builtin",
    name: "Oraculum Built-in",
    tagline: "Platform backend router — OpenAI (platform key) or free AI Horde fallback. Zero client config.",
    tier: "builtin",
    needsKey: false,
    models: ["gpt-4o-mini"],
  },
  {
    id: "groq",
    name: "Groq",
    tagline: "Blazing-fast open models. Free tier: ~1k requests/day.",
    tier: "free",
    needsKey: true,
    models: ["llama-3.3-70b-versatile", "openai/gpt-oss-20b", "moonshotai/kimi-k2-instruct", "qwen/qwen3-32b"],
    keyPlaceholder: "gsk_…",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Free API key, generous daily quota, strong storytelling.",
    tier: "free",
    needsKey: true,
    models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"],
    keyPlaceholder: "AIza…",
  },
  {
    id: "huggingface",
    name: "HuggingFace",
    tagline: "Inference API with a free monthly quota using your HF token. Great for RPG/roleplay-tuned models.",
    tier: "free",
    needsKey: true,
    models: [
      "mistralai/Mistral-7B-Instruct-v0.3",
      "teknium/OpenHermes-2.5-Mistral-7B",
      "SanjiWatsuki/Kunoichi-DPO-v2-7B",
      "NeverSleep/Llama-3-Lumimaid-8B",
      "Tarek07/Dungeonmaster-V2.4-Expanded-LLaMa-70B",
      "mradermacher/Dungeonmaster-V2.4-Expanded-LLaMa-70B-GGUF",
      "Neshi245/DnDmodel",
      "chendren/dnd-unified-1.5b",
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
    keyPlaceholder: "hf_…",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "One key for hundreds of models. :free variants cost $0 — 50 req/day, or 1,000/day after a one-time $10 credit top-up.",
    tier: "key",
    needsKey: true,
    models: [
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "google/gemma-4-31b-it:free",
      "openai/gpt-oss-20b:free",
      "inclusionai/ling-3.0-flash:free",
      "poolside/laguna-s-2.1:free",
      "gryphe/mythomax-l2-13b",
      "sao10k/l3.3-euryale-70b",
      "openrouter/auto",
      "anthropic/claude-3.5-haiku",
      "meta-llama/llama-3.3-70b-instruct",
    ],
    keyPlaceholder: "sk-or-…",
  },
  {
    id: "ollama",
    name: "Local / Ollama",
    tagline: "Run fully offline against Ollama, LM Studio or any OpenAI-compatible server.",
    tier: "local",
    needsKey: false,
    needsBaseUrl: true,
    models: ["llama3.2", "qwen2.5:7b", "mistral"],
  },
  {
    id: "gradio",
    name: "HF Gradio Space",
    tagline: "Free: paste any HuggingFace Space URL that exposes an OpenAI-compatible endpoint (--openai-api). No key needed.",
    tier: "free",
    needsKey: false,
    needsBaseUrl: true,
    models: ["default"],
  },
  {
    id: "horde",
    name: "AI Horde",
    tagline: "100% free & unlimited — community-hosted GPUs with roleplay-tuned models. No key, no caps; expect a queue of seconds to minutes. Pick any model name from aihorde.net.",
    tier: "free",
    needsKey: false,
    models: HORDE_RPG_MODELS.map((m) => m.name),
  },
];

export interface HordeLiveEntry {
  name: string;
  running: boolean;
  workers: number;
  queued: number;
  eta: number | null; // seconds
}

export interface HordeStatusResult {
  ok: boolean;
  checkedAt?: number;
  selected: HordeLiveEntry | null;
  models: HordeLiveEntry[];
  code?: string;
  detail?: string;
}

/** Parse a raw GET /status/models payload into curated availability entries.
 *  Defensive: tolerates any field shape the network returns. */
export function parseHordeStatus(
  raw: unknown,
  model?: string,
): Omit<HordeStatusResult, "ok"> {
  const list = Array.isArray(raw) ? raw : [];
  const textEntries = list.filter((m) => {
    if (!m || typeof m !== "object") return false;
    const t = (m as { type?: string }).type;
    const name = (m as { name?: string }).name;
    return (t === undefined || t === "text" || t === "Text") && typeof name === "string";
  });
  const byName = new Map<string, { workers: number; queued: number; eta: number | null }>();
  for (const e of textEntries) {
    const r = e as {
      name: string;
      count?: number;
      queued?: number;
      jobs?: number;
      eta?: number;
    };
    byName.set(r.name, {
      workers: r.count ?? 0,
      queued: r.queued ?? r.jobs ?? 0,
      eta: typeof r.eta === "number" && r.eta > 0 ? r.eta : null,
    });
  }
  const entry = (name: string): HordeLiveEntry => {
    const s = byName.get(name);
    return {
      name,
      // A model only works while at least one worker is actively hosting it —
      // a listed entry with 0 workers means requests would queue forever.
      running: !!s && s.workers > 0,
      workers: s?.workers ?? 0,
      queued: s?.queued ?? 0,
      eta: s?.eta ?? null,
    };
  };
  const models = HORDE_RPG_MODELS.map((m) => entry(m.name));
  const selected = model && model.trim() ? entry(model.trim()) : null;
  return { selected, models };
}

/** Client-side availability check against the AI Horde network.
 *  The API is CORS-open for anonymous reads; the convex `gm.hordeStatus`
 *  action is the primary path (used by the settings UI), this is the
 *  browser fallback when the backend is unreachable. */
export async function hordeModelStatus(model?: string): Promise<HordeStatusResult> {
  try {
    const res = await fetch(`${HORDE_API}/status/models`, {
      headers: { "Client-Agent": "Oraculum-SoloVTT/1.0" },
    });
    if (!res.ok) {
      return {
        ok: false,
        code: `horde_status_${res.status}`,
        detail: `AI Horde status check failed (${res.status})`,
        selected: null,
        models: [],
      };
    }
    const raw = await res.json();
    return { ok: true, checkedAt: Date.now(), ...parseHordeStatus(raw, model) };
  } catch (err) {
    return {
      ok: false,
      code: "network_error",
      detail: err instanceof Error ? err.message : String(err),
      selected: null,
      models: [],
    };
  }
}

export function providerOf(id: GmSettings["provider"]): GmProviderDef {
  return GM_PROVIDERS.find((p) => p.id === id) ?? GM_PROVIDERS[0];
}

// ---------------------------------------------------------------------------
// Ollama — discover models actually installed on the user's own server,
// including custom fine-tuned models created with `ollama create …`.
// ---------------------------------------------------------------------------

export interface OllamaModelInfo {
  name: string;
  size: string;
}

export interface OllamaScanResult {
  ok: boolean;
  models?: OllamaModelInfo[];
  error?: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1024 / 1024)} MB`;
}

/** List the models on a running Ollama server via the native /api/tags
 *  endpoint. Unlike the OpenAI-compatible shim, this works for *any* model
 *  name — stock pulls (qwen3:8b) and locally fine-tuned ones alike. CORS is
 *  governed by the server's OLLAMA_ORIGINS env var; we surface that in the
 *  error message because it is the most common failure when the app is
 *  hosted on a different origin than the PC running Ollama. */
export async function fetchOllamaModels(
  baseUrl: string,
): Promise<OllamaScanResult> {
  const base =
    (baseUrl || "").replace(/\/+$/, "") || "http://localhost:11434";
  try {
    const res = await fetch(`${base}/api/tags`, { method: "GET" });
    if (!res.ok) {
      return {
        ok: false,
        error: `Ollama answered with ${res.status}. Check that the server is running and the Base URL is correct (${base}).`,
      };
    }
    const data = (await res.json()) as {
      models?: { name?: string; size?: number }[];
    };
    const models = (data.models ?? [])
      .map((m) => ({
        name: String(m.name ?? "").trim(),
        size: typeof m.size === "number" ? formatBytes(m.size) : "",
      }))
      .filter((m) => m.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { ok: true, models };
  } catch (err) {
    const blocked =
      err instanceof TypeError && err.message.includes("Failed to fetch");
    return {
      ok: false,
      error: blocked
        ? "Cannot reach Ollama. Either it is not running (start it with `ollama serve`) or the browser was blocked — when the app is hosted on a different origin than your PC, restart Ollama with OLLAMA_ORIGINS=* (see the box below)."
        : err instanceof Error
          ? err.message
          : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Smart context management
// ---------------------------------------------------------------------------

export const MAX_HISTORY_TOKENS = 3200;
export const MAX_LOREBOOK_TOKENS = 800;
export const MAX_RECENT_MESSAGES = 16;

// ---------------------------------------------------------------------------
// Narrator length presets — shared by every provider and the Convex action
// ---------------------------------------------------------------------------

export const NARRATOR_LENGTHS: {
  id: GmSettings["narratorLength"];
  label: string;
  hint: string;
}[] = [
  { id: "short", label: "Short · 2-3", hint: "Tight beats" },
  { id: "long", label: "Long · 8-10", hint: "Deep scenes" },
  { id: "epic", label: "Epic · 11-15", hint: "Novelistic" },
  { id: "dynamic", label: "Dynamic", hint: "Adapts to the moment" },
];

/** Token budget per length preset — keeps long replies from being cut short. */
export function maxTokensFor(length: GmSettings["narratorLength"]): number {
  switch (length) {
    case "short":
      return 500;
    case "long":
      return 1200;
    case "epic":
      return 1800;
    default:
      return 850;
  }
}

/** LENGTH instruction for in-game narration, per preset. */
export function narratorLengthRule(
  length: GmSettings["narratorLength"],
): string {
  switch (length) {
    case "short":
      return "LENGTH: Write a tight passage of 2-3 paragraphs — vivid but economical. Every sentence must earn its place; no padding, no recaps.";
    case "long":
      return "LENGTH: Write a full passage of 8-10 paragraphs — let the scene breathe and deepen: setting, senses, NPC reactions, interiority, consequences. Never pad with repetition or recap; every paragraph must add something new.";
    case "epic":
      return "LENGTH: Write a sweeping passage of 11-15 paragraphs — a novelistic, immersive scene. Build atmosphere and tension in layers: setting, sensory texture, NPCs, stakes, and the player's actions landing with weight. Never pad with repetition; every paragraph must advance or deepen the scene.";
    default:
      return "LENGTH: Write a passage of 3-6 paragraphs and dynamically adapt the length to what the scene deserves — go long and immersive (8+ paragraphs) for climactic, emotionally charged or pivotal moments, and stay lean and fast (2-3 paragraphs) for transitions, travel and minor beats. Match the pacing to the moment.";
  }
}

/** Opening-scene length instruction (separate from in-game replies). */
export function openingLengthRule(
  length: GmSettings["narratorLength"],
): string {
  switch (length) {
    case "short":
      return "Write the opening scene of this campaign as a tight passage of 2-3 vivid second-person paragraphs.";
    case "long":
      return "Write the opening scene of this campaign as a rich passage of 8-10 vivid second-person paragraphs that set the stage in full.";
    case "epic":
      return "Write the opening scene of this campaign as a sweeping, novelistic passage of 11-15 vivid second-person paragraphs that establish the world, the tone and the first thread in depth.";
    default:
      return "Write the opening scene of this campaign as a vivid second-person passage of 3-5 paragraphs, letting its length fit the tone of the campaign you're starting.";
  }
}

/** Rough token estimate (~4 chars per token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Drop oldest non-system messages until the window fits the token budget. */
export function trimMessages(
  messages: ChatMessage[],
  maxTokens = MAX_HISTORY_TOKENS,
): ChatMessage[] {
  const system = messages.filter((m) => m.role === "system");
  const rest = messages.filter((m) => m.role !== "system");
  let used = [...system, ...rest].reduce((a, m) => a + estimateTokens(m.content), 0);
  const out = [...rest];
  while (used > maxTokens && out.length > 0) {
    const popped = out.shift();
    if (popped) used -= estimateTokens(popped.content);
  }
  return [...system, ...out];
}

// ---------------------------------------------------------------------------
// Provider chat calls (client-side, non-streaming)
// ---------------------------------------------------------------------------

async function openAiCompatible(
  url: string,
  model: string,
  messages: ChatMessage[],
  apiKey?: string,
  temperature = 1,
  maxTokens = 850,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} — ${body.slice(0, 220)}`);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  if (!text) throw new Error("empty response from provider");
  return text;
}

async function geminiChat(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  temperature = 1,
  maxTokens = 850,
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} — ${body.slice(0, 220)}`);
  }
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) throw new Error("empty response from Gemini");
  return text;
}

/** Route a chat completion to the configured provider. */
export async function chatWithProvider(
  settings: GmSettings,
  messages: ChatMessage[],
): Promise<string> {
  const trimmed = trimMessages(messages);
  const maxTokens = maxTokensFor(settings.narratorLength);
  switch (settings.provider) {
    case "groq":
      return openAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        settings.model,
        trimmed,
        settings.apiKey,
        settings.temperature,
        maxTokens,
      );
    case "openrouter":
      return openAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        settings.model,
        trimmed,
        settings.apiKey,
        settings.temperature,
        maxTokens,
      );
    case "ollama":
      return openAiCompatible(
        `${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        settings.model,
        trimmed,
        undefined,
        settings.temperature,
        maxTokens,
      );
    case "gradio":
      return openAiCompatible(
        `${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        settings.model || "default",
        trimmed,
        undefined,
        settings.temperature,
        maxTokens,
      );
    case "huggingface":
      return huggingFaceChat(settings, trimmed);
    case "gemini":
      return geminiChat(settings.model, trimmed, settings.apiKey, settings.temperature, maxTokens);
    case "horde":
      return hordeRequest(settings, trimmed);
    case "builtin":
      throw new Error("builtin provider is handled by the Convex action");
  }
}

/** HuggingFace chat with automatic fallback to the unified router endpoint
 *  (router.huggingface.co), which also accepts :fastest / :cheapest suffixes. */
async function huggingFaceChat(
  settings: GmSettings,
  messages: ChatMessage[],
): Promise<string> {
  const direct = `https://api-inference.huggingface.co/models/${encodeURIComponent(settings.model)}/v1/chat/completions`;
  const maxTokens = maxTokensFor(settings.narratorLength);
  try {
    return await openAiCompatible(
      direct,
      settings.model,
      messages,
      settings.apiKey,
      settings.temperature,
      maxTokens,
    );
  } catch {
    return openAiCompatible(
      "https://router.huggingface.co/v1/chat/completions",
      settings.model,
      messages,
      settings.apiKey,
      settings.temperature,
      maxTokens,
    );
  }
}

async function streamHuggingFace(
  settings: GmSettings,
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
): Promise<string> {
  const direct = `https://api-inference.huggingface.co/models/${encodeURIComponent(settings.model)}/v1/chat/completions`;
  try {
    return await streamOpenAI(direct, settings, messages, onDelta);
  } catch {
    return streamOpenAI(
      "https://router.huggingface.co/v1/chat/completions",
      settings,
      messages,
      onDelta,
    );
  }
}

// ---------------------------------------------------------------------------
// AI Horde — 100% free, unlimited, community-hosted GPUs (queued).
// Async-job API: POST /api/v2/generate/text/async → poll status/{id}.
// No key required (works anonymously); optional x-api-key raises priority.
// ---------------------------------------------------------------------------

const HORDE_API = "https://aihorde.net/api/v2";
const HORDE_TIMEOUT_MS = 3 * 60 * 1000; // queues can be long — give up after 3 min
const HORDE_POLL_MS = 2000;

/** Serialize chat turns into a ChatML-style prompt the Horde models understand. */
function hordePrompt(messages: ChatMessage[]): string {
  const turns = messages.map((m) => {
    const role =
      m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user";
    return `<|im_start|>${role}\n${m.content}\n<|im_end|>`;
  });
  return [...turns, "<|im_start|>assistant\n"].join("\n");
}

async function hordeRequest(
  settings: GmSettings,
  messages: ChatMessage[],
  onDelta?: (chunk: string) => void,
): Promise<string> {
  // The v2 API requires an `apikey` header; anonymous users use the special
  // 0000000000 token. A free registered key at aihorde.net raises priority.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Agent": "Oraculum-SoloVTT/1.0",
  };
  headers.apikey = settings.apiKey || "0000000000";
  const submit = await fetch(`${HORDE_API}/generate/text/async`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: hordePrompt(trimMessages(messages)),
      params: {
        max_length: maxTokensFor(settings.narratorLength),
        temperature: settings.temperature,
        n: 1,
        top_p: 0.9,
        rep_pen: 1.08,
      },
      models: settings.model ? [settings.model] : [],
    }),
  });
  if (!submit.ok) {
    const body = await submit.json().catch(() => null);
    throw new Error(
      body?.message ?? `${submit.status} — AI Horde rejected the request`,
    );
  }
  const job = await submit.json();
  if (!job?.id) throw new Error("AI Horde did not return a job id");

  const deadline = Date.now() + HORDE_TIMEOUT_MS;
  let lastText = "";
  for (;;) {
    const statusRes = await fetch(`${HORDE_API}/generate/text/status/${job.id}`);
    if (!statusRes.ok) {
      const body = await statusRes.json().catch(() => null);
      throw new Error(
        body?.message ?? `${statusRes.status} — AI Horde status check failed`,
      );
    }
    const status = await statusRes.json();
    if (status?.message) throw new Error(String(status.message));
    const text: string = status?.generations?.[0]?.text ?? "";
    if (text) {
      const delta = text.slice(lastText.length);
      if (delta) onDelta?.(delta);
      lastText = text;
    }
    if (status?.finished) {
      if (!lastText) throw new Error("AI Horde returned an empty generation");
      return lastText;
    }
    if (Date.now() > deadline) {
      throw new Error(
        "AI Horde is still queued (the network is busy). Try a smaller model or try again later.",
      );
    }
    await new Promise((r) => setTimeout(r, HORDE_POLL_MS));
  }
}

// ---------------------------------------------------------------------------
// Streaming (SSE) — live token-by-token GM narration
// ---------------------------------------------------------------------------

async function readSSE(res: Response, onDelta: (chunk: string) => void): Promise<string> {
  if (!res.body) throw new Error("no response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const chunk: string =
          json?.choices?.[0]?.delta?.content ??
          json?.choices?.[0]?.message?.content ??
          json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
          "";
        if (chunk) {
          full += chunk;
          onDelta(chunk);
        }
      } catch {
        // partial JSON line — ignore
      }
    }
  }
  // Some endpoints return a plain JSON body instead of SSE.
  if (!full && buffer.trim()) {
    try {
      const json = JSON.parse(buffer.trim());
      const text: string = json?.choices?.[0]?.message?.content?.trim?.() ?? "";
      if (text) {
        full = text;
        onDelta(text);
      }
    } catch {
      // not JSON either
    }
  }
  return full;
}

async function streamOpenAI(
  url: string,
  settings: GmSettings,
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model || "default",
      temperature: settings.temperature,
      max_tokens: maxTokensFor(settings.narratorLength),
      stream: true,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} — ${body.slice(0, 220)}`);
  }
  return readSSE(res, onDelta);
}

async function streamGemini(
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  onDelta: (chunk: string) => void,
  temperature: number,
  maxTokens = 850,
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} — ${body.slice(0, 220)}`);
  }
  return readSSE(res, onDelta);
}

/** Stream a completion from the configured client-side provider, calling
 *  onDelta with each token as it arrives. Returns the full text. */
export async function streamChatWithProvider(
  settings: GmSettings,
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
): Promise<string> {
  const trimmed = trimMessages(messages);
  const maxTokens = maxTokensFor(settings.narratorLength);
  switch (settings.provider) {
    case "groq":
      return streamOpenAI("https://api.groq.com/openai/v1/chat/completions", settings, trimmed, onDelta);
    case "openrouter":
      return streamOpenAI("https://openrouter.ai/api/v1/chat/completions", settings, trimmed, onDelta);
    case "ollama":
      return streamOpenAI(`${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, settings, trimmed, onDelta);
    case "gradio":
      return streamOpenAI(`${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`, settings, trimmed, onDelta);
    case "huggingface":
      return streamHuggingFace(settings, trimmed, onDelta);
    case "gemini":
      return streamGemini(settings.model, trimmed, settings.apiKey, onDelta, settings.temperature, maxTokens);
    case "horde":
      return hordeRequest(settings, trimmed, onDelta);
    case "builtin":
      throw new Error("builtin provider is handled by the Convex action");
  }
}

// ---------------------------------------------------------------------------
// Session summarization — condense old history into a memory recap
// ---------------------------------------------------------------------------

const SUMMARY_TRIGGER = 30; // summarize once the narrative passes this many entries

export function shouldSummarize(
  narrativeCount: number,
  hasMemory: boolean,
): boolean {
  return narrativeCount > SUMMARY_TRIGGER && !hasMemory;
}

export async function summarizeConversation(
  settings: GmSettings,
  historyLines: string[],
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You condense tabletop RPG session history into a memory recap. Output 3-6 concise bullet points covering key events, NPCs, locations, discoveries and unresolved threads. Keep names and facts accurate. Output only the bullets.",
    },
    { role: "user", content: historyLines.join("\n") },
  ];
  return chatWithProvider(settings, messages);
}
