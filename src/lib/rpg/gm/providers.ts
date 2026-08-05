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

export const GM_PROVIDERS: GmProviderDef[] = [
  {
    id: "builtin",
    name: "Oraculum Built-in",
    tagline: "OpenAI model via the platform backend — zero client config.",
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
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
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
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
    keyPlaceholder: "hf_…",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "One key for hundreds of models. :free variants cost $0.",
    tier: "key",
    needsKey: true,
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "meta-llama/llama-3.1-8b-instruct:free",
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
];

export function providerOf(id: GmSettings["provider"]): GmProviderDef {
  return GM_PROVIDERS.find((p) => p.id === id) ?? GM_PROVIDERS[0];
}

// ---------------------------------------------------------------------------
// Smart context management
// ---------------------------------------------------------------------------

export const MAX_HISTORY_TOKENS = 3200;
export const MAX_LOREBOOK_TOKENS = 800;
export const MAX_RECENT_MESSAGES = 16;

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
      max_tokens: 650,
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
        generationConfig: { temperature, maxOutputTokens: 650 },
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
  switch (settings.provider) {
    case "groq":
      return openAiCompatible(
        "https://api.groq.com/openai/v1/chat/completions",
        settings.model,
        trimmed,
        settings.apiKey,
        settings.temperature,
      );
    case "openrouter":
      return openAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        settings.model,
        trimmed,
        settings.apiKey,
        settings.temperature,
      );
    case "ollama":
      return openAiCompatible(
        `${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        settings.model,
        trimmed,
        undefined,
        settings.temperature,
      );
    case "gradio":
      return openAiCompatible(
        `${settings.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        settings.model || "default",
        trimmed,
        undefined,
        settings.temperature,
      );
    case "huggingface":
      return huggingFaceChat(settings, trimmed);
    case "gemini":
      return geminiChat(settings.model, trimmed, settings.apiKey, settings.temperature);
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
  try {
    return await openAiCompatible(
      direct,
      settings.model,
      messages,
      settings.apiKey,
      settings.temperature,
    );
  } catch {
    return openAiCompatible(
      "https://router.huggingface.co/v1/chat/completions",
      settings.model,
      messages,
      settings.apiKey,
      settings.temperature,
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
      max_tokens: 650,
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
        generationConfig: { temperature, maxOutputTokens: 650 },
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
      return streamGemini(settings.model, trimmed, settings.apiKey, onDelta, settings.temperature);
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
