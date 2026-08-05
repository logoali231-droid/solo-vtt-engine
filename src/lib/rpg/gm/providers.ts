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
    tagline: "Blazing-fast open models. Free tier available.",
    tier: "free",
    needsKey: true,
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
    keyPlaceholder: "gsk_…",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Free-tier API key, generous limits, strong storytelling.",
    tier: "free",
    needsKey: true,
    models: ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
    keyPlaceholder: "AIza…",
  },
  {
    id: "huggingface",
    name: "HuggingFace",
    tagline: "Inference API with a free monthly quota using your HF token.",
    tier: "free",
    needsKey: true,
    models: [
      "meta-llama/Llama-3.3-70B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
    ],
    keyPlaceholder: "hf_…",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "One key for hundreds of models (Claude, GPT, Llama…).",
    tier: "key",
    needsKey: true,
    models: ["openrouter/auto", "anthropic/claude-3.5-haiku", "meta-llama/llama-3.3-70b-instruct"],
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
    case "huggingface":
      return openAiCompatible(
        `https://api-inference.huggingface.co/models/${encodeURIComponent(settings.model)}/v1/chat/completions`,
        settings.model,
        trimmed,
        settings.apiKey,
        settings.temperature,
      );
    case "gemini":
      return geminiChat(settings.model, trimmed, settings.apiKey, settings.temperature);
    case "builtin":
      throw new Error("builtin provider is handled by the Convex action");
  }
}
