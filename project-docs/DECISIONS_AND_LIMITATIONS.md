# Decisions and Limitations

## Decisions

| Decision | Reason | Status |
|---|---|---|
| The Python processor is the source of truth | The original was Python; the demo should be a real, testable implementation | Adopted |
| The page reads a generated snapshot instead of calling an API | Static hosting, nothing to fail at run time, and a test guards against drift | Adopted |
| React + Vite for the landing page | Component tests for the one interaction; static build | Adopted |
| One continuous scroll with a single interaction | Visitors should understand the story without operating anything | Adopted |
| Before vs After directly after the hero | The outcome is the strongest hook and should not need scrolling to find | Adopted |
| The downstream platform is described, never named | Keeps the story about the approach; the page says "downstream reporting platform" | Adopted |
| Pipeline stage named "Quality checks" | Reserves validation for the downstream reporting stage, which does its own | Adopted |
| Compact JSON with a fixed key order | Enables byte-for-byte comparison with expected files | Adopted |
| Exact duplicates: keep the first, drop repeats, warn | Matches the expected demo output. What the original did with repeats is not confirmed | Representative |
| `TRUE` / `FALSE` converted for every report, upper case only | The supplied demo data expects it for a report with no specific rules | Representative |
| Hierarchy lookup is case-sensitive | Matches the recalled behaviour | Recalled |
| Numbers are emitted as values, so leading zeros are dropped | Matches the recalled behaviour; the workbench warns when it happens | Recalled |
| `rijnr` is grouping information only | Matches the recalled behaviour; no calculation is invented | Recalled |
| `report_code` is written on each line | Illustrates the report-code mapping; the real location in the original output is unverified | Representative |
| Duplicate key is value + row + column | The definition in the project documentation | Adopted |
| The workbench is kept as a secondary tool | It is useful for trying your own files, but is not part of the story | Adopted |
| Client-related documents are kept out of the repository | The private project documents are git-ignored; this folder is the public documentation | Adopted |

## Known limitations

- **Two implementations.** The workbench mirrors the processor in JavaScript, so the two can drift. The differences that exist today are listed in [PROCESSING_RULES.md](PROCESSING_RULES.md). Nothing enforces that they stay aligned.
- **`rijnr` in duplicate checks.** The processor follows the documented definition (value, row, column). If a real file repeats the same row and column across `rijnr` groups, those would be flagged as duplicates. The demo data does not contain such a case.
- **Fixed sheet name.** The hierarchy sheet must be called `Hierarchies`. The `Formulier_Mapping` sheet in the workbook is not read; the JSON file is the source.
- **Prose rules are not executed.** `demo/rules.json` is displayed on the page. Executable rules live in `report_rules.json`.
- **No downstream integration.** The report grid on the page is a simplified illustration, not a reproduction of any reporting product.
- **One demo report has a value mapping.** Other FormulierIDs in the mapping file have a report code but no demo XML.
- **Testing gaps.** No automated accessibility audit, no real-browser end-to-end test, and no continuous integration (see [TESTING.md](TESTING.md)).
- **The page link.** The repository link on the landing page is configured in `frontend/src/content/pageContent.js` and should be checked before the page is published.

## Open questions

Details of the original solution that are not remembered with confidence. None of these is invented in the demo.

1. The exact production JSONL schema. A report-code field, and where it sat in each record, is not verified.
2. The full meaning of `rijnr` and how every combination of grouped rows was handled.
3. How a FormulierID selected its rule set in the original implementation.
4. The complete set of report-specific rules for the roughly 25 reports.
5. Whether a duplicate meant more than an identical value, row and column, and whether repeats were dropped or kept.
6. What additional checks, if any, ran before the file reached the reporting platform.
7. The exact manual process before automation. The 20–25 day figure is remembered, not measured.

## Possible next steps

None of these is committed to.

- Continuous integration running the three test suites on every push
- Publish the static site (`frontend/dist`) from the repository
- An automated accessibility check and a real-browser end-to-end test
- A demo FormulierID with a different rule shape, to show the pattern is reusable
- A shared test corpus so the workbench and the processor are checked against the same expected outputs
- An optional upload flow on the landing page, added as a deliberate enhancement
