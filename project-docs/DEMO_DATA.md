# Demo Data

Everything in `demo/` is **fictional**. Names, codes, values and report identifiers were invented for this project, and none of it comes from a client or a production system.

| File | Purpose |
|---|---|
| `DEMO_CB77.xml` | Main scenario: 10 posts covering every behaviour |
| `DEMO_MB0100.xml` | Second report: shows a report-specific value mapping and report code |
| `hierarchies_demo.xlsx` | Excel reference data (sheets `Hierarchies`, `Formulier_Mapping`, `Demo_Notes`) |
| `formulier_mapping.json` | FormulierID → report code |
| `report_rules.json` | Machine-readable, representative report rules |
| `rules.json` | Human-readable rule descriptions shown on the page |
| `expected_CB77.jsonl`, `expected_MB0100.jsonl` | Expected output; compared byte for byte in tests |
| `processing_snapshot.json` | Expected run statistics for `DEMO_CB77`; used as a regression fixture |

## Hierarchy workbook (`Hierarchies` sheet)

| Domain Code | Member Code | Structure | Date |
|---|---|---|---|
| FIN | X01 | Corporate Lending | 06/30/2024 |
| FIN | X02 | Retail Deposits | 06/30/2024 |
| FIN | X03 | Commercial Banking | 06/30/2024 |
| RISK | B01 | Credit Exposure | 06/30/2024 |
| RISK | B02 | Market Exposure | 06/30/2024 |
| OPS | C01 | Customer Operations | 06/30/2024 |
| OPS | C02 | Payment Operations | 06/30/2024 |
| FIN | X01 | Legacy Corporate Lending | 03/31/2024 |

The last row is deliberate: `FIN / X01` has two entries. The later date must win, so `EBA_FIN_X01` resolves to **Corporate Lending**, not the legacy label.

## `DEMO_CB77.xml`: scenarios

| Line | Source value | Row / Column | `rijnr` | Result | Demonstrates |
|---|---|---|---|---|---|
| 3 | `EBA_FIN_X01` | 0010 / 0010 | 1 | `"Corporate Lending"` | Hierarchy lookup; latest date wins |
| 4 | `1250000.50` | 0020 / 0010 | 1 | `1250000.5` | Numeric conversion |
| 5 | `FALSE` | 0030 / 0010 | 1 | `false` | Boolean conversion |
| 6 | `EBA_FIN_X02` | 0040 / 0010 | 1 | `"Retail Deposits"` | Hierarchy lookup |
| 7 | `EBA_FIN_X02` | 0040 / 0010 | 1 | *dropped* | Exact duplicate: warning, run continues |
| 8 | `EBA_FIN_X99` | 0050 / 0010 | 1 | `"EBA_FIN_X99"` | No mapping: original code kept, warning |
| 9 | `750000000000000000` | 0060 / 0010 | 1 | `750000000000000000` | Large integer stays exact |
| 10 | `EBA_RISK_B01` | 0070 / 0010 | 2 | `"Credit Exposure"` | Second `rijnr` group |
| 11 | `0.875` | 0070 / 0020 | 2 | `0.875` | Multiple columns in one group |
| 12 | `TRUE` | 0070 / 0030 | 2 | `true` | Boolean conversion |

### Expected run

```
DEMO_CB77.xml: 10 read, 9 emitted, 2 warning(s)
  line 7: Duplicate detected · Row 0040 · Column 0010 (first seen on line 6)
  line 8: No Excel mapping for EBA_FIN_X99; the original code was kept
```

| Statistic | Value |
|---|---|
| Records read / emitted | 10 / 9 |
| Duplicates | 1 |
| Hierarchy hits / misses | 3 / 1 |
| Booleans converted | 2 |
| Numeric values converted | 3 |
| `rijnr` groups | 2 (group 1: 6 cells, group 2: 3 cells) |

## `DEMO_MB0100.xml`: scenarios

| Source value | Result | Demonstrates |
|---|---|---|
| `EBA_FIN_X03` | `"Commercial Banking"` | Hierarchy lookup |
| `DEMO_REL_01` | `"mrel-demo-01"` | Report-specific value mapping (representative rule) |
| `FALSE` | `false` | Boolean conversion |
| `450000.75` | `450000.75` | Numeric conversion |

Every line carries `"report_code":"mrel-demo-01"`, from `formulier_mapping.json`.

## Try a change

1. Change `06/30/2024` on the `FIN / X01` legacy row to a date after 06/30/2024 and rerun `python -m processor.cli demo/DEMO_CB77.xml`: the first line now resolves to "Legacy Corporate Lending".
2. Add a second `EBA_FIN_X99` post at another row: the mapping-miss warning appears again and the code is kept.
3. Break the XML (remove a closing tag): the run stops with a located error and exit code 2.

Restore the demo files afterwards, because the tests compare against the expected outputs.
