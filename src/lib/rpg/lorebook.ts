// ============================================================================
// Oraculum — Lorebook.
// Per-campaign world-fact entries with smart keyword relevance scoring.
// Matched entries are always included; the rest fill the remaining token
// budget. The compiled block is injected into the GM context.
// ============================================================================

import type { LorebookEntry } from "./types";
import { estimateTokens, MAX_LOREBOOK_TOKENS } from "./gm/providers";

export function compileLorebook(
  entries: LorebookEntry[],
  recentTexts: string[],
  currentText: string,
  maxTokens = MAX_LOREBOOK_TOKENS,
): string {
  if (entries.length === 0) return "";
  const corpus = [...recentTexts, currentText]
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  const scored = entries.map((e) => {
    let hits = 0;
    for (const kw of e.keywords) {
      const k = kw.trim().toLowerCase();
      if (!k) continue;
      if (corpus.some((t) => t.includes(k))) hits += 1;
    }
    return { entry: e, hits };
  });

  const matched = scored.filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits);
  const rest = scored.filter((s) => s.hits === 0);

  const out: string[] = [];
  let budget = maxTokens;
  for (const s of [...matched, ...rest]) {
    const block = `• ${s.entry.name}: ${s.entry.description}`;
    const cost = estimateTokens(block);
    if (budget - cost < 0) continue;
    budget -= cost;
    out.push(block);
  }
  return out.join("\n");
}
