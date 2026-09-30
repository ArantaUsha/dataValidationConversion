# Processing Rules

Exactly what the Python processor does. Each rule is marked:

- **Recalled**: behaviour remembered from the original work
- **Representative**: invented to demonstrate the same pattern
- **Added**: introduced for this recreation

## Input

### XML

```xml
<rapportage registratienummer="DEMO-104" nihil="false" period="2024-06-30"
            FormulierID="DEMO_CB77" versie="1" frequentie="M">
    <post value="EBA_FIN_X01" cube="c01" rij="r_0010" kolom="c_0010" rijnr="1"/>
    ...
</rapportage>
```

| Element / attribute | Meaning |
|---|---|
| `rapportage` | Report root. Metadata is read from here. |
| `FormulierID` | Identifies the report; selects report-specific rules and the report code |
| `post` | One reporting record |
| `value` | The source value (text) |
| `rij` / `kolom` | Row and column, prefixed `r_` and `c_` |
| `rijnr` | Group number (see below) |
| `cube` | Read but not used |

Attribute names are matched **case-insensitively**, and `row` is accepted as a spelling of `rij`.

### Reference data

`demo/hierarchies_demo.xlsx`, sheet `Hierarchies`, columns **Domain Code**, **Member Code**, **Structure**, **Date** (`MM/DD/YYYY`). The other sheets are informational.

### Configuration

| File | Purpose |
|---|---|
| `demo/formulier_mapping.json` | FormulierID → report code |
| `demo/report_rules.json` | FormulierID → value mappings (representative) |
| `demo/rules.json` | Human-readable rule descriptions, shown on the page; not executed |

## Rules

| # | Rule | Behaviour | Status |
|---|---|---|---|
| 1 | Generic transformation | Applies to every file; report-specific rules are layered on top | Recalled |
| 2 | Metadata | Reads FormulierID, period, version, frequency and registration number from `rapportage` | Recalled |
| 3 | Row / column normalisation | `r_0010` → `0010`, `c_0010` → `0010` | Recalled |
| 4 | Hierarchy lookup | `EBA_<Domain>_<Member>` is resolved to its Structure through the workbook | Recalled |
| 5 | Latest entry wins | With several rows for one Domain and Member, the latest date is used; on equal dates the later row wins | Recalled |
| 6 | Missing mapping | The original code is kept and a `mapping-miss` warning is raised | Recalled |
| 7 | Case-sensitive lookup | `X01` and `x01` are different members | Recalled |
| 8 | Numeric conversion | Numeric text becomes a number (see table below) | Recalled |
| 9 | Boolean conversion | `TRUE` and `FALSE` become JSON booleans, for every report | Representative |
| 10 | Report value mapping | Configured FormulierIDs can map specific values (e.g. `DEMO_REL_01` → `mrel-demo-01`) | Representative |
| 11 | Report code | The FormulierID's code is written as `report_code` on each line | Representative |
| 12 | Duplicate detection | Same value, row and column as an earlier post | Recalled (definition); Representative (handling) |
| 13 | Duplicate handling | First occurrence kept, repeat dropped, warning raised, run continues | Representative |
| 14 | `rijnr` grouping | Posts sharing a `rijnr` form a logical group. Grouping only: no calculation, and it is not written to the output | Recalled |
| 15 | Missing position | A post without row or column is skipped with a warning | Added |
| 16 | Malformed XML | Processing stops with a located error and no output | Recalled |

### Order of operations for a value

1. Trim whitespace
2. Hierarchy lookup (if the value looks like `EBA_<Domain>_<Member>`)
3. Report value mapping (if the FormulierID has one)
4. Boolean conversion, otherwise numeric conversion, otherwise leave as text

### Numeric and boolean conversion

| Source text | Output | Note |
|---|---|---|
| `1250000.50` | `1250000.5` | Decimal, emitted as a float |
| `42.00` | `42` | Integer-valued, emitted as an integer |
| `750000000000000000` | `750000000000000000` | Large integers stay exact |
| `00123` | `123` | Leading zeros are dropped, because numbers are emitted as values |
| `-0` | `0` | |
| `1e5`, `12abc`, `apple` | unchanged text | Only plain decimal numbers convert |
| `TRUE` / `FALSE` | `true` / `false` | Upper case only |
| `true`, `False` | unchanged text | |

## Output contract

One line per emitted record:

```json
{"axis_row":"0010","axis_col":"0010","Value":"Corporate Lending","report_code":"cb77-report"}
```

- Keys always appear in the order `axis_row`, `axis_col`, `Value`, `report_code`.
- Compact separators (no spaces) and no trailing whitespace; each line ends with `\n`.
- `report_code` appears only when the FormulierID has a code. It is an **illustrative** field, not a confirmed part of any production schema.
- `rijnr` is **never** written.
- The same input always produces byte-identical output.
- Output order follows source order.

## Findings

Findings never stop the run.

| Type | Raised when | Message |
|---|---|---|
| `duplicate` | A post repeats an earlier post's value, row and column | `Duplicate detected · Row 0040 · Column 0010 (first seen on line 6)` |
| `mapping-miss` | An `EBA_` code has no hierarchy entry | `No Excel mapping for EBA_FIN_X99; the original code was kept` |
| `missing-position` | A post lacks row or column | `Record skipped: missing row (rij)` |

Every finding carries the source line, and the row and column where the post has them.

Errors stop processing and produce no output:

| Situation | Message pattern | CLI exit code |
|---|---|---|
| Malformed XML | `XML in <file> could not be parsed (line N): <reason>` | 2 |
| File cannot be read | `File <file> could not be read: <reason>` | 2 |
| No `<rapportage>` root | `No <rapportage> element found in <file>.` | 2 |
| Hierarchy sheet missing a column | `Hierarchy sheet is missing column(s): ...` | 2 |

A run with warnings still exits 0.

## About `rijnr`

The processor treats `rijnr` as **grouping information**. Posts sharing a number belong to one logical group, and the processor records each group's emitted cells (`ProcessResult.groups`). It never changes a value, order, or output line.

For the demo file `DEMO_CB77`: group 1 has 6 cells and group 2 has 3. The original handling of every `rijnr` combination is not fully remembered, so no further behaviour is implied.

## Processor versus workbench

The workbench (`workbench/`) mirrors the processor in JavaScript for interactive use. Known differences:

| Behaviour | Processor | Workbench |
|---|---|---|
| Duplicate key | value + row + column | value + row + column + `rijnr` |
| Duplicates | Repeat dropped | Kept by default, with a "drop repeats" option |
| Boolean conversion | All reports, upper case | Per FormulierID rule, either case |
| Report code | From `formulier_mapping.json` | From its editable rules JSON |
| Output spacing | Compact | Spaces after `:` and `,` |
| `rijnr` in output | Never | Optional grouped mode (`{rijnr, cells[]}`) |
| Extra notices | `missing-position` | Also `conflict` (same cell, different value), `leading-zero`, `unmapped` |

The processor is authoritative.
