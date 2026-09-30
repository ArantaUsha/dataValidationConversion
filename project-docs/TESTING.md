# Testing

## How to run

```bash
npm run test:py                 # Python processor (needs the .venv from the README)
cd frontend && npm test         # landing page and the signature interaction
npm test                        # workbench (repository root)
```

## Results

Last run on the current code:

| Suite | Tool | Tests | Result |
|---|---|---|---|
| Python processor | pytest | 28 | 28 passed |
| Landing page | Vitest + Testing Library (jsdom) | 13 | 13 passed |
| Workbench | Node test runner | 13 | 13 passed |
| **Total** | | **54** | **54 passed** |

## What the processor tests prove

| Behaviour | Test |
|---|---|
| Metadata and posts are read, with line numbers | `test_metadata_and_posts_are_read`, `test_post_line_numbers_are_kept` |
| Attribute spelling variants are accepted | `test_attribute_spelling_variants_are_accepted` |
| Latest-dated hierarchy entry wins (including regardless of row order) | `test_latest_dated_hierarchy_entry_wins`, `test_latest_wins_regardless_of_row_order` |
| Lookup is case-sensitive | `test_hierarchy_lookup_is_case_sensitive` |
| A missing workbook column gives a clear error | `test_missing_hierarchy_column_is_a_clear_error` |
| Missing mapping keeps the code and warns | `test_missing_mapping_keeps_code_and_warns` |
| Numeric, boolean and axis normalisation | `test_numeric_normalisation`, `test_boolean_normalisation`, `test_axis_normalisation` |
| Exact duplicates are flagged, the run continues, the first is kept | `test_exact_duplicate_is_flagged_and_processing_continues` |
| Same cell with a different value is not an exact duplicate | `test_same_cell_with_a_different_value_is_not_an_exact_duplicate` |
| `rijnr` is grouping only and not in the output | `test_rijnr_is_preserved_as_grouping_information_only`, `test_rijnr_forms_logical_groups_of_emitted_cells`, `test_grouping_does_not_change_output_or_order`, `test_posts_without_rijnr_are_not_grouped` |
| Report rules apply only to their FormulierID | `test_formulier_rule_maps_value_and_report_code`, `test_generic_transformation_alone_does_not_apply_report_rules` |
| Malformed XML, a missing file and a missing root are clear errors | `test_malformed_xml_raises_a_clear_error`, `test_missing_file_and_missing_root_are_errors` |
| A post without a position is skipped with a warning | `test_post_without_position_is_skipped_with_a_warning` |
| Output equals the expected files **byte for byte** | `test_output_matches_expected_file_byte_for_byte` (both demo files) |
| Output is deterministic | `test_output_is_deterministic`, `test_jsonl_line_shape` |
| Run statistics match the supplied snapshot | `test_run_statistics_match_the_supplied_snapshot` |
| **The page's snapshot is exactly what the processor produces** | `test_checked_in_frontend_snapshot_is_up_to_date` |

The last test is the guard that keeps the landing page honest. If you change the processor or the demo data and forget to regenerate the snapshot, it fails with the command to run: `python -m processor.generate_snapshot`.

## What the landing-page tests prove

- The page is one continuous scroll in the approved section order, with no tabs, no navigation and no upload
- Before vs After sits directly after the hero
- The recreation label appears once
- The pipeline stage is called "Quality checks", with report validation left to the Reporting stage
- The Problem section does not repeat the 20–25 days figure
- There is exactly one button
- The interaction is understandable before clicking; running it reveals all four stages from the snapshot; it works from the keyboard and can be replayed
- The duplicate and mapping-miss examples show their exact row and column
- The Excel rows, report grid and processing summary come from processor output, and the summary numbers are asserted against the raw snapshot
- No new sections or controls have been added

## Performance

A generated file of **65,000 posts** (in the 60K–70K range of the original problem) was processed with the Python processor on Python 3.9.6, Apple M4:

| Posts read | Lines emitted | Findings | `rijnr` groups | Time |
|---|---|---|---|---|
| 65,000 | 65,000 | 9,285 mapping misses | 40 | 0.65 s |

This is one measurement on one machine, given as an indication of scale only. It is not a benchmark, and it does not measure the original 20–25 day to one-day outcome. The workbench also parses a 65,000-post file in its own test.

## Manual checks

- Layout inspected at 1280, 820 and 390 px; the phone layout stacks without horizontal overflow
- Visible focus states; the interaction works with Enter and Space

## Not covered

- An automated accessibility or contrast audit
- A real-browser end-to-end test (the interaction test runs in jsdom)
- Very large inputs beyond 65,000 posts
- Automated continuous integration; the three commands above are run by hand
