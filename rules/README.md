# Oraculum — Master Rules JSON (AI Training Corpus)

Every rules module in the app is consolidated into **one self-contained master
JSON file per RPG system**. These files are plain JSON — no TypeScript, no
imports, no code — so they can be fed directly to AI training / fine-tuning
pipelines.

## Files

### Master rule databases (reference / RAG)

| File | System | Contents |
|------|--------|----------|
| `gurps.json` | GURPS | Attributes (ST/DX/IQ/HT), full skill list, advantages & disadvantages, armor/DR, 3d6 roll-under math, Life & Livelihood extension (jobs, wealth tiers, businesses, relationships, education, social life), fantasy expansion (6 magic colleges, spells, alchemy, smithing, travel, weather), cyber expansion (gear, ICE, netrunning, programs, corp ladder), shop tables, bestiary, conditions |
| `dnd5e.json` | D&D 5e (+TCoE) | Skills, races, subraces, TCoE Custom Lineage, backgrounds, feats, all classes incl. **Artificer** and TCoE subclasses, spell-slot tables, weapons, armor, spells, enchanting, encounter tables, bestiary, conditions |
| `pf2e.json` | Pathfinder 2e | Skills, ancestries, heritages, backgrounds, ancestry/general/skill feats, 12 Player Core classes, weapons, armor, gear, 4-tier proficiency, 4-degrees-of-success matrix, encounter tables, bestiary, conditions |

### Alpaca training corpora (for Unsloth Studio / SFT trainers) — ✅ use these

| File | Contents |
|------|----------|
| `alpaca-dnd5e.json` | D&D 5e rules Q&A, every data entry (races, classes, TCoE subclasses, spells, monsters, …), and the golden dice → narration examples |
| `alpaca-gurps.json` | GURPS rules Q&A and every data entry (skills, advantages, jobs, spells, gear, …) |
| `alpaca-pf2e.json` | PF2e rules Q&A and every data entry (ancestries, feats, classes, monsters, …) |
| `alpaca-all.json` | All three systems merged into one file (deduplicated) |
| `alpaca-*.jsonl` | Same rows as the matching `.json`, one JSON object per line |

## Training with Unsloth Studio (or any Alpaca-format trainer)

**Upload the `alpaca-*.json` / `alpaca-all.json` files — NOT the master
files.** Unsloth Studio's default reader expects the traditional Alpaca
schema: only plain-text string columns named `instruction`, `input` and
`output`. The master files are a rules *database* (nested objects, numbers,
booleans) and their old nested `training_corpus` made the schema detector fail
with errors like:

```
Column(/training_corpus/[]/output/deslocamento) changed from object to number in row 0
```

Every row in the alpaca corpora is exactly:

```json
{ "instruction": "…", "input": "…", "output": "…" }
```

- `instruction`, `input` and `output` are **plain strings** in every single row.
- No nested objects, no numbers, no booleans — identical keys in every row.
- `input` is empty for most rows (the prompts are self-contained).

The master files also embed a `training_corpus` key in this same flat Alpaca
shape, so even they can no longer break a schema-inference parser.

If your trainer prefers newline-delimited JSON, upload the matching
`alpaca-*.jsonl` file instead.

### Combining datasets (rules + your narrative/session data)

Unsloth Studio accepts **one** file upload. When you want to train on the
rules corpus **plus** your own narrative data (e.g. exported play sessions),
merge them into a single file first with `scripts/merge-training.ts`:

```bash
bun run scripts/merge-training.ts \
  rules/alpaca-all.jsonl \
  rules/narrative-sessions.jsonl \
  -o rules/training-mixed.jsonl
```

It accepts JSON arrays and JSONL files in two shapes — Alpaca
(`instruction`/`input`/`output`) and ChatML (`messages: [{role, content}]`,
converted automatically: player move → `instruction`, system prompt + prior
context → `input`, GM narration → `output`). Rows are deduplicated, validated
against the strict Alpaca schema, and written out as both `.jsonl` and `.json`.

To control the mix (e.g. 20% rules / 80% narrative), pass `--ratios`:

```bash
bun run scripts/merge-training.ts \
  rules/alpaca-all.jsonl rules/narrative-sessions.jsonl \
  --ratios "rules/alpaca-all.jsonl:0.2,rules/narrative-sessions.jsonl:0.8" \
  -o rules/training-mixed.jsonl
```

Upload the single output file (`rules/training-mixed.jsonl`) to Unsloth
Studio. The narrative rows carry the system prompt in `input`, so the model
learns to obey the in-game GM instructions (length presets, second person,
rule-faithful narration) as well as the rules themselves.

## Master file schema

Every master file follows the same shape:

```jsonc
{
  "schema": "oraculum-rules-master",
  "schema_version": 1,
  "system": "gurps",              // "gurps" | "dnd5e" | "pf2e"
  "system_name": "GURPS",         // human-readable name
  "generated_at": "ISO-8601",     // when the file was built
  "description": "…",             // one-paragraph overview
  "core_mechanics": { … },        // plain-language rule summary (dice math,
                                  //   DCs, progression, conditions, economies)
  "formulas": { … },              // exact engine math as source text
                                  //   (e.g. "d20_roll", "skill_level")
  "rules_text": "…",              // full rules-corpus prompt text fed to the
                                  //   in-game AI GM
  "data": { … },                  // every data table (see table below)
  "training_corpus": [ … ]        // flat Alpaca rows — every row is
                                  //   { instruction, input, output } with
                                  //   plain-string values only
}
```

### `data` keys by system

- **gurps.json**: `skills`, `extension_skills`, `armors`, `advantages`,
  `disadvantages`, `attribute_upgrade_cost`, `wealth_tiers`, `jobs`,
  `businesses`, `relationship_stages`, `cyberware`, `hack_targets`,
  `holdings`, `universities`, `degrees`, `social_circles`, `social_events`,
  `noble_titles`, `court_positions`, `netdecks`, `programs`, `corp_ladder`,
  `standard_income`, `cyber_gear`, `ice`, `netruns`, `magic_colleges`,
  `spells`, `reagents`, `alchemy_recipes`, `forge_recipes`, `terrains`,
  `weather`, `shop_quality_labels`, `shop_weapons`, `shop_armors`,
  `shop_gear`, `conditions`, `encounter_difficulties`, `enemies`
- **dnd5e.json**: `skills`, `races`, `subraces`, `backgrounds`, `feats`,
  `full_caster_slots`, `half_caster_slots`, `pact_slots`, `weapons`,
  `armors`, `classes`, `spells`, `known_spells_by_class`, `conditions`,
  `enchant_rarity_labels`, `enchant_tiers`, `enchant_properties`,
  `encounter_difficulties`, `enemies`
- **pf2e.json**: `skills`, `ancestries`, `heritages`, `backgrounds`,
  `feats`, `classes`, `armors`, `weapons`, `gear`, `conditions`,
  `encounter_difficulties`, `enemies`

## Regenerating

The files are generated from the live TypeScript rule modules under
`src/lib/rpg/data/`. After you edit any rule data, regenerate with:

```bash
bun run scripts/build-rules-json.ts
```

This rewrites all master files, all `alpaca-*.json` files, the combined
`alpaca-all.json`, and the `.jsonl` variants.

## Notes

- **Data provenance**: races/classes/feats are the app's own curated
  implementations (original flavor text; rules follow the published systems).
- **`training_corpus`**: every master file embeds golden instruction → output
  examples in flat Alpaca shape (D&D/PF2e include the `dndTestCases` /
  `pf2eDataset` corpora, flattened to plain text).
- **Conditions** are shared across systems and carry per-system effects
  (e.g. `attackDisadvantage` for dnd5e, `pf2ePenalty`, `gurpsPenalty`).
