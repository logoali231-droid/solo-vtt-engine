# Oraculum — Master Rules JSON (AI Training Corpus)

Every rules module in the app is consolidated into **one self-contained master
JSON file per RPG system**. These files are plain JSON — no TypeScript, no
imports, no code — so they can be fed directly to AI training / fine-tuning
pipelines.

| File | System | Contents |
|------|--------|----------|
| `gurps.json` | GURPS | Attributes (ST/DX/IQ/HT), full skill list, advantages & disadvantages, armor/DR, 3d6 roll-under math, Life & Livelihood extension (jobs, wealth tiers, businesses, relationships, education, social life), fantasy expansion (6 magic colleges, spells, alchemy, smithing, travel, weather), cyber expansion (gear, ICE, netrunning, programs, corp ladder), shop tables, bestiary, conditions |
| `dnd5e.json` | D&D 5e (+TCoE) | Skills, races, subraces, TCoE Custom Lineage, backgrounds, feats, all classes incl. **Artificer** and TCoE subclasses, spell-slot tables, weapons, armor, spells, enchanting, encounter tables, bestiary, conditions |
| `pf2e.json` | Pathfinder 2e | Skills, ancestries, heritages, backgrounds, ancestry/general/skill feats, 12 Player Core classes, weapons, armor, gear, 4-tier proficiency, 4-degrees-of-success matrix, encounter tables, bestiary, conditions |

## Schema

Every file follows the same shape:

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
  "training_corpus": { … }        // D&D/PF2e only: golden rule & narration
                                  //   examples (instruction → output pairs)
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

## Notes

- **Data provenance**: races/classes/feats are the app's own curated
  implementations (original flavor text; rules follow the published systems).
- **`training_corpus`**: `dnd5e.json` and `pf2e.json` embed golden
  instruction → output examples used to ground AI narration in the exact dice
  math (the `dndTestCases` / `pf2eDataset` corpora).
- **Conditions** are shared across systems and carry per-system effects
  (e.g. `attackDisadvantage` for dnd5e, `pf2ePenalty`, `gurpsPenalty`).
