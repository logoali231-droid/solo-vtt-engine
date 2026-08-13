// ============================================================================
// Oraculum — merge training datasets into ONE Unsloth-ready file.
//
// Unsloth Studio accepts a single file upload, so when you want to train on
// the rules corpus PLUS your own narrative/session data, combine them first:
//
//   bun run scripts/merge-training.ts \
//     rules/alpaca-all.jsonl \
//     rules/narrative-sessions.jsonl \
//     -o rules/training-mixed.jsonl
//
// Accepts JSON arrays and JSONL files, in two row shapes:
//   Alpaca: { instruction, input?, output }
//   ChatML: { messages: [{ role, content }, ...] }  → converted to Alpaca:
//           instruction = last user turn, input = system prompt + earlier
//           context, output = last assistant turn (the GM narration).
//
// It dedupes (instruction + output), validates the strict Alpaca schema
// (3 string keys, no nesting — the exact shape Unsloth's default reader
// expects) and writes both .json and .jsonl of the combined corpus.
//
// Optional mix ratios for a target composition (e.g. 20% rules / 80%
// narrative), with deterministic stride sampling when a file must shrink:
//
//   bun run scripts/merge-training.ts \
//     rules/alpaca-all.jsonl rules/narrative-sessions.jsonl \
//     --ratios "rules/alpaca-all.jsonl:0.2,rules/narrative-sessions.jsonl:0.8"
// ============================================================================

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface AlpacaRow {
  instruction: string;
  input: string;
  output: string;
}

interface SourceFile {
  name: string;
  rows: AlpacaRow[];
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
  files: string[];
  out: string;
  ratios: Record<string, number> | null;
} {
  const files: string[] = [];
  let out = "rules/training-mixed.jsonl";
  let ratios: Record<string, number> | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-o" || arg === "--out") {
      out = argv[++i] ?? out;
    } else if (arg === "--ratios") {
      ratios = {};
      for (const part of (argv[++i] ?? "").split(",")) {
        const [f, w] = part.split(":");
        if (!f || !w || !Number.isFinite(Number(w)) || Number(w) <= 0) {
          console.error(`  ✗ bad ratio "${part}" — expected file:weight`);
          process.exit(1);
        }
        ratios[f.trim()] = Number(w);
      }
    } else if (arg.startsWith("-")) {
      console.error(`  ✗ unknown flag: ${arg}`);
      process.exit(1);
    } else {
      files.push(arg);
    }
  }
  if (files.length === 0) {
    console.error(
      "Usage: bun run scripts/merge-training.ts <file.json|file.jsonl>… [-o out.jsonl] [--ratios \"a.jsonl:0.2,b.jsonl:0.8\"]",
    );
    process.exit(1);
  }
  return { files, out, ratios };
}

// ---------------------------------------------------------------------------
// Reading + normalization
// ---------------------------------------------------------------------------

function readRows(path: string): Record<string, unknown>[] {
  const full = join(ROOT, path);
  const text = readFileSync(full, "utf8");
  if (path.endsWith(".jsonl")) {
    return text
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l, i) => {
        try {
          return JSON.parse(l);
        } catch (err) {
          console.error(`  ✗ ${path}:${i + 1} is not valid JSON — ${(err as Error).message}`);
          process.exit(1);
        }
      });
  }
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) {
    console.error(`  ✗ ${path}: expected a JSON array of training rows`);
    process.exit(1);
  }
  return data as Record<string, unknown>[];
}

/** Normalize any supported row shape to strict Alpaca. Returns null to skip. */
function toAlpaca(
  row: Record<string, unknown>,
  src: string,
  index: number,
): AlpacaRow | null {
  // ChatML / ShareGPT shape: { messages: [{ role, content }...] }
  if (Array.isArray(row.messages)) {
    const msgs = row.messages as { role?: string; content?: unknown }[];
    const sys = msgs
      .filter((m) => m.role === "system")
      .map((m) => String(m.content ?? "").trim())
      .filter(Boolean);
    const users = msgs
      .filter((m) => m.role === "user")
      .map((m) => String(m.content ?? "").trim())
      .filter(Boolean);
    const assistants = msgs
      .filter((m) => m.role === "assistant")
      .map((m) => String(m.content ?? "").trim())
      .filter(Boolean);
    const output = assistants[assistants.length - 1] ?? "";
    const instruction =
      users[users.length - 1] ?? "Continue the solo tabletop RPG adventure.";
    const input = [...sys, ...users.slice(0, -1)].join("\n\n");
    if (!output) {
      console.warn(`  ! ${src}:${index} skipped (no assistant message)`);
      return null;
    }
    return { instruction, input, output };
  }

  // Alpaca shape: { instruction, input?, output }
  if (typeof row.instruction === "string" && row.instruction.trim()) {
    const output =
      typeof row.output === "string"
        ? row.output
        : row.output == null
          ? ""
          : String(row.output);
    if (!output.trim()) {
      console.warn(`  ! ${src}:${index} skipped (empty output)`);
      return null;
    }
    return {
      instruction: row.instruction,
      input: typeof row.input === "string" ? row.input : "",
      output,
    };
  }

  console.warn(
    `  ! ${src}:${index} skipped — unrecognized shape (keys: ${Object.keys(row).join(", ")})`,
  );
  return null;
}

/** Strict schema check — identical to what Unsloth Studio's Alpaca reader does. */
function validate(rows: AlpacaRow[], label: string): void {
  for (const [i, r] of rows.entries()) {
    const keys = Object.keys(r).sort().join(",");
    if (keys !== "input,instruction,output") {
      console.error(`  ✗ ${label} row ${i}: invalid keys [${keys}] — expected input,instruction,output`);
      process.exit(1);
    }
    if (
      typeof r.instruction !== "string" ||
      !r.instruction.trim() ||
      typeof r.input !== "string" ||
      typeof r.output !== "string" ||
      !r.output.trim()
    ) {
      console.error(`  ✗ ${label} row ${i}: non-string or empty field — ${JSON.stringify(r).slice(0, 140)}`);
      process.exit(1);
    }
  }
}

/** Deterministic stride sampling when a file must shrink to meet a ratio. */
function sampleTo(rows: AlpacaRow[], target: number): AlpacaRow[] {
  if (rows.length <= target) return rows;
  const stride = rows.length / target;
  const out: AlpacaRow[] = [];
  for (let k = 0; k < target; k++) out.push(rows[Math.floor(k * stride)]);
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { files, out, ratios } = parseArgs(process.argv.slice(2));

console.log("Merging training datasets → rules/");
const sources: SourceFile[] = [];
for (const file of files) {
  const raw = readRows(file);
  const rows: AlpacaRow[] = [];
  raw.forEach((r, i) => {
    const a = toAlpaca(r, file, i);
    if (a) rows.push(a);
  });
  validate(rows, file);
  sources.push({ name: file, rows });
  console.log(`  ✓ ${file} → ${rows.length} rows`);
}

// Dedupe across ALL sources by instruction+output (rules QA rows that also
// appear in the narrative export are only kept once).
const seen = new Set<string>();
const deduped = sources.flatMap((s) => s.rows).filter((r) => {
  const key = `${r.instruction}\u0000${r.output}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
const dropped = sources.reduce((a, s) => a + s.rows.length, 0) - deduped.length;
if (dropped > 0) console.log(`  ✓ deduped ${dropped} duplicate row(s)`);

// Optional ratio rebalancing (e.g. 20% rules / 80% narrative).
let rows = deduped;
if (ratios) {
  let total = 0;
  for (const s of sources) {
    const w = ratios[s.name] ?? 1;
    total = Math.max(total, Math.ceil(s.rows.length / w));
  }
  const picked: AlpacaRow[] = [];
  for (const s of sources) {
    const w = ratios[s.name] ?? 1;
    const target = Math.min(s.rows.length, Math.round(w * total));
    picked.push(...sampleTo(s.rows, target));
    console.log(
      `  ✓ ratio ${s.name} → ${target} of ${s.rows.length} (${Math.round((target / Math.max(1, total)) * 100)}%)`,
    );
  }
  const seen2 = new Set<string>();
  rows = picked.filter((r) => {
    const key = `${r.instruction}\u0000${r.output}`;
    if (seen2.has(key)) return false;
    seen2.add(key);
    return true;
  });
}

validate(rows, "merged corpus");

const base = out.endsWith(".jsonl")
  ? out.slice(0, -".jsonl".length)
  : out.endsWith(".json")
    ? out.slice(0, -".json".length)
    : out;
mkdirSync(dirname(join(ROOT, base)), { recursive: true });
writeFileSync(
  join(ROOT, `${base}.jsonl`),
  rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
  "utf8",
);
writeFileSync(join(ROOT, `${base}.json`), JSON.stringify(rows, null, 2), "utf8");

console.log(`  ✓ ${base}.jsonl + ${base}.json (${rows.length} rows total)`);
console.log("Sample row:");
console.log(`    ${JSON.stringify(rows[0]).slice(0, 160)}…`);
console.log("Done. Upload the single output file to Unsloth Studio.");
