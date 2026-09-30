# Project Overview

## What this is

A **portfolio recreation** of a data-preparation utility built for a banking reporting team. Large XML reporting files are converted into report-ready JSONL, using Excel reference data, business rules and data-quality checks.

It is **not** the original application, and it uses **no client data**. Every value in this repository is fictional, and the business rules are representative, not the original client rules.

## The business problem (recalled)

Financial reports (monthly, quarterly and annual) were prepared from raw XML files before a downstream reporting platform could process them.

| Aspect | What was recalled |
|---|---|
| Size of a file | Roughly 60,000–70,000 `<post>` records |
| Number of reports | About 25 distinct datasets, each identified by its own FormulierID |
| Reporting cycles | Monthly, quarterly and annual |
| Who was affected | Business, operations and reporting teams who had to prepare and correct the data |
| Why it was hard | Coded values needed interpreting through Excel reference data, some reports needed extra rules, and errors meant re-preparing the whole file |

## The approach

```
Raw XML → Parse & extract → Transform → Quality checks → JSONL output → Reporting
                                ↑
                     Excel reference data + business rules
```

1. **Parse & extract**: read the report metadata and every `<post>` record.
2. **Transform**: resolve coded values through the Excel hierarchy, normalise numbers and booleans, and apply report-specific rules on top of a shared generic transformation.
3. **Quality checks**: flag exact duplicates and missing mappings without stopping the run.
4. **JSONL output**: one deterministic record per report cell.
5. **Reporting**: the downstream platform maps each row and column to a report position and performs its own validation. This repository stops at the JSONL.

When source data was wrong, the issue was traced to a row and column, the business user corrected the XML, and the **entire file** was processed again.

## Outcome (project-reported)

Preparing one report went from roughly **20–25 days** of manual work to about **one day per file**, when the source data was correct and no rework was needed.

These figures are remembered project outcomes. They are not a benchmark study, and this repository does not measure them.

## What the recreation demonstrates

| Capability | Where to see it |
|---|---|
| Understanding a business problem | The landing page story (`frontend/`) |
| Working with large structured data | The processor handles 65,000 posts in under a second (see [TESTING.md](TESTING.md)) |
| Excel and reference data | `demo/hierarchies_demo.xlsx` and `processor/hierarchy_mapper.py` |
| Reusable transformation logic | Generic rules separated from per-report rules (`processor/rule_registry.py`) |
| Data quality and reprocessing | `processor/validator.py` and the warnings shown on the page |
| Delivery discipline | Byte-exact golden-file tests and a generated-snapshot drift guard |

## Recalled, representative, or added

| Kind | Meaning | Examples |
|---|---|---|
| **Recalled** | Behaviour remembered from the original work | Generic-plus-report-specific transformation, latest-dated hierarchy entry, original code kept when no mapping exists, duplicates flagged without stopping, full-file reprocessing |
| **Representative** | Invented to demonstrate the same pattern | All data values, the demo FormulierIDs, the `report_code` field, the `DEMO_REL_01` value mapping |
| **Added for the demo** | Not part of what was recalled | The landing page, the snapshot mechanism, the missing-position warning, the interactive workbench |

The full rule-by-rule status is in [PROCESSING_RULES.md](PROCESSING_RULES.md).

## Where to go next

- [ARCHITECTURE.md](ARCHITECTURE.md): how the pieces fit together
- [PROCESSING_RULES.md](PROCESSING_RULES.md): exactly what the transformation does
- [DEMO_DATA.md](DEMO_DATA.md): the fictional data and expected results
- [TESTING.md](TESTING.md): what is tested and how to run it
- [DECISIONS_AND_LIMITATIONS.md](DECISIONS_AND_LIMITATIONS.md): decisions made, known limits, open questions
