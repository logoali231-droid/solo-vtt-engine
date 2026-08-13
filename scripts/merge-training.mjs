// ============================================================================
// Oraculum — merge training datasets into ONE Unsloth-ready file.
//
// Plain-JavaScript version (runs with `node`, no bun / npm / types needed).
// Drop merge-training.mjs, alpaca-all.jsonl and your narrative file into the
// same folder, then:
//
//   node merge-training.mjs alpaca-all.jsonl narrative-sessions.jsonl -o training-mixed.jsonl
//
// Accepts JSON arrays and JSONL files, in two row shapes:
//   Alpaca: { instruction, input?, output }
//   ChatML: { messages: [{ role, content }, ...] }  → converted to Alpaca:
//           instruction = last user turn, input = system prompt + earlier
//           context, output = last assistant turn (the GM narration).
//
// Dedupes (instruction + output), validates the strict Alpaca schema and
// writes both .json and .jsonl of the combined corpus.
//
// Optional mix ratios (deterministic stride sampling when a file must shrink):
//   node merge-training.mjs alpaca-all.jsonl narrative-sessions.jsonl \
//     --ratios "alpaca-all.jsonl:0.2,narrative-sessions.jsonl:0.8"
// ============================================================================

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");

/** Find a data file in the repo layout (one folder above the script) OR next
 *  to the script itself (a plain Downloads folder). Works no matter where. */
function resolveInput(p) {
  const candidates = [join(ROOT, p), join(SCRIPT_DIR, p)];
  for (const c of candidates) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      // try next candidate
    }
  }
  return candidates[0];
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const files = [];
  let out = "training-mixed.jsonl";
  let ratios = null;
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
      "Usage: node merge-training.mjs <file.json|file.jsonl>… [-o out.jsonl] [--ratios \"a.jsonl:0.2,b.jsonl:0.8\"]",
    );
    process.exit(1);
  }
  return { files, out, ratios };
}

// ---------------------------------------------------------------------------
// Reading + normalization
// ---------------------------------------------------------------------------

function readRows(path) {
  const full = resolveInput(path);
  const text = readFileSync(full, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  // JSONL content — also when the extension is .json but every line is one
  // JSON object (a very common export shape).
  const looksJsonl =
    lines.length > 1 &&
    lines.every((l) => {
      const t = l.trim();
      return t.startsWith("{") || t.startsWith("[");
    });
  if (path.endsWith(".jsonl") || looksJsonl) {
    return lines.map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (err) {
        console.error(`  ✗ ${path}:${i + 1} is not valid JSON — ${err.message}`);
        process.exit(1);
      }
    });
  }

  const data = JSON.parse(text);
  // Unwrap common wrapper keys, e.g. { "data": [...] }, { "conversations": [...] }.
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) return value;
    }
  }
  if (!Array.isArray(data)) {
    console.error(`  ✗ ${path}: expected a JSON array of training rows`);
    process.exit(1);
  }
  return data;
}

/** Normalize any supported row shape to strict Alpaca. Returns null to skip. */
function toAlpaca(row, src, index) {
  // ChatML / ShareGPT shape: { messages: [{ role, content }...] }
  if (Array.isArray(row.messages)) {
    const msgs = row.messages;
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
function validate(rows, label) {
  for (const [i, r] of rows.entries()) {
    const keys = Object.keys(r).sort().join(",");
    if (keys !== "input,instruction,output") {
      console.error(
        `  ✗ ${label} row ${i}: invalid keys [${keys}] — expected input,instruction,output`,
      );
      process.exit(1);
    }
    if (
      typeof r.instruction !== "string" ||
      !r.instruction.trim() ||
      typeof r.input !== "string" ||
      typeof r.output !== "string" ||
      !r.output.trim()
    ) {
      console.error(
        `  ✗ ${label} row ${i}: non-string or empty field — ${JSON.stringify(r).slice(0, 140)}`,
      );
      process.exit(1);
    }
  }
}

/** Deterministic stride sampling when a file must shrink to meet a ratio. */
function sampleTo(rows, target) {
  if (rows.length <= target) return rows;
  const stride = rows.length / target;
  const out = [];
  for (let k = 0; k < target; k++) out.push(rows[Math.floor(k * stride)]);
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { files, out, ratios } = parseArgs(process.argv.slice(2));

// Write output next to wherever the data actually lives.
const outDir = dirname(resolveInput(files[0]));

console.log("Merging training datasets…");
const sources = [];
for (const file of files) {
  const raw = readRows(file);
  const rows = [];
  raw.forEach((r, i) => {
    const a = toAlpaca(r, file, i);
    if (a) rows.push(a);
  });
  validate(rows, file);
  sources.push({ name: file, rows });
  console.log(`  ✓ ${file} → ${rows.length} rows`);
}

// Dedupe across ALL sources by instruction+output.
const seen = new Set();
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
  const picked = [];
  for (const s of sources) {
    const w = ratios[s.name] ?? 1;
    const target = Math.min(s.rows.length, Math.round(w * total));
    picked.push(...sampleTo(s.rows, target));
    console.log(
      `  ✓ ratio ${s.name} → ${target} of ${s.rows.length} (${Math.round((target / Math.max(1, total)) * 100)}%)`,
    );
  }
  const seen2 = new Set();
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
// A path with a folder (repo convention: rules/training-mixed) resolves from
// the project root; a bare filename lands next to the data (Downloads folder).
const outPath = out.includes("/") || out.includes("\\")
  ? join(ROOT, base)
  : join(outDir, base);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  `${outPath}.jsonl`,
  rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
  "utf8",
);
writeFileSync(`${outPath}.json`, JSON.stringify(rows, null, 2), "utf8");

console.log(`  ✓ ${base}.jsonl + ${base}.json (${rows.length} rows total)`);
console.log(`Sample row: ${JSON.stringify(rows[0]).slice(0, 160)}…`);
console.log("Done. Upload the single output file to Unsloth Studio.");
