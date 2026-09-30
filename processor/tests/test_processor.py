import json
from pathlib import Path

import pandas as pd
import pytest

from processor.cli import load_defaults
from processor.hierarchy_mapper import HierarchyMapper
from processor.jsonl_generator import to_line
from processor.pipeline import process_file
from processor.rule_registry import RuleRegistry
from processor.transformer import normalize_axis, normalize_boolean, normalize_number, transform_value
from processor.xml_parser import ProcessingError, parse_report

DEMO = Path(__file__).resolve().parents[2] / "demo"


@pytest.fixture(scope="module")
def defaults():
    return load_defaults()


def run(name, defaults):
    mapper, registry = defaults
    return process_file(DEMO / name, mapper, registry)


# 1-2. parsing ---------------------------------------------------------------------------------
def test_metadata_and_posts_are_read():
    report = parse_report(DEMO / "DEMO_CB77.xml")
    assert report.meta["formulier_id"] == "DEMO_CB77"
    assert report.meta["period"] == "2024-06-30"
    assert len(report.posts) == 10
    first = report.posts[0]
    assert (first.value, first.row, first.col, first.rijnr, first.cube) == ("EBA_FIN_X01", "r_0010", "c_0010", "1", "c01")


def test_attribute_spelling_variants_are_accepted():
    xml = b'<rapportage formulierid="X" period="2024-01-31"><Post value="1" row="r_1" kolom="c_1"/></rapportage>'
    report = parse_report(xml)
    assert report.meta["formulier_id"] == "X" and report.meta["period"] == "2024-01-31"
    assert report.posts[0].row == "r_1"


def test_post_line_numbers_are_kept():
    assert [p.line for p in parse_report(DEMO / "DEMO_CB77.xml").posts][:3] == [3, 4, 5]


# 3. hierarchy ---------------------------------------------------------------------------------
def test_latest_dated_hierarchy_entry_wins(defaults):
    mapper, _ = defaults
    entry = mapper.lookup("FIN", "X01")
    assert entry.structure == "Corporate Lending"  # not the 03/31/2024 "Legacy Corporate Lending" row
    assert entry.date == "2024-06-30"


def test_latest_wins_regardless_of_row_order():
    frame = pd.DataFrame(
        [["A", "1", "new", "06/30/2024"], ["A", "1", "old", "01/31/2023"]],
        columns=["Domain Code", "Member Code", "Structure", "Date"],
    )
    assert HierarchyMapper.from_dataframe(frame).lookup("A", "1").structure == "new"


def test_hierarchy_lookup_is_case_sensitive(defaults):
    mapper, _ = defaults
    assert mapper.lookup("FIN", "x01") is None


def test_missing_hierarchy_column_is_a_clear_error():
    with pytest.raises(ProcessingError, match="Structure"):
        HierarchyMapper.from_dataframe(pd.DataFrame({"Domain Code": [], "Member Code": [], "Date": []}))


# 4. mapping miss ------------------------------------------------------------------------------
def test_missing_mapping_keeps_code_and_warns(defaults):
    result = run("DEMO_CB77.xml", defaults)
    assert '"Value":"EBA_FIN_X99"' in result.lines[4]
    miss = [i for i in result.issues if i.type == "mapping-miss"]
    assert len(miss) == 1 and "EBA_FIN_X99" in miss[0].message
    assert result.stats["hierarchy_misses"] == 1


# 5-6. type normalisation ----------------------------------------------------------------------
def test_numeric_normalisation():
    assert normalize_number("1250000.50") == 1250000.5
    assert normalize_number("42.00") == 42 and isinstance(normalize_number("42.00"), int)
    assert normalize_number("750000000000000000") == 750000000000000000
    assert normalize_number("-0") == 0
    assert normalize_number("1e5") is None and normalize_number("apple") is None


def test_boolean_normalisation():
    assert normalize_boolean("TRUE") is True and normalize_boolean("FALSE") is False
    assert normalize_boolean("true") is None


def test_axis_normalisation():
    assert normalize_axis("r_0010", "r_") == "0010" and normalize_axis("0010", "r_") == "0010"


# 7. duplicates --------------------------------------------------------------------------------
def test_exact_duplicate_is_flagged_and_processing_continues(defaults):
    result = run("DEMO_CB77.xml", defaults)
    dup = [i for i in result.issues if i.type == "duplicate"]
    assert len(dup) == 1
    assert (dup[0].row, dup[0].col, dup[0].line) == ("0040", "0010", 7)
    assert "Row 0040 · Column 0010" in dup[0].message
    assert result.stats["records_read"] == 10 and result.stats["records_emitted"] == 9  # first kept, repeat dropped


def test_same_cell_with_a_different_value_is_not_an_exact_duplicate(defaults, tmp_path):
    mapper, registry = defaults
    xml = b'<rapportage FormulierID="X"><post value="1" rij="r_1" kolom="c_1"/><post value="2" rij="r_1" kolom="c_1"/></rapportage>'
    path = tmp_path / "same_cell.xml"
    path.write_bytes(xml)
    assert not [i for i in process_file(path, mapper, registry).issues if i.type == "duplicate"]


# 8. rijnr -------------------------------------------------------------------------------------
def test_rijnr_is_preserved_as_grouping_information_only(defaults):
    result = run("DEMO_CB77.xml", defaults)
    assert result.stats["group_ids_seen"] == ["1", "2"]
    assert all("rijnr" not in line for line in result.lines)  # grouping info, not output data


# 9. formulier-specific rules ------------------------------------------------------------------
def test_formulier_rule_maps_value_and_report_code(defaults):
    result = run("DEMO_MB0100.xml", defaults)
    assert result.lines[1] == '{"axis_row":"0020","axis_col":"0010","Value":"mrel-demo-01","report_code":"mrel-demo-01"}'


def test_generic_transformation_alone_does_not_apply_report_rules(defaults):
    mapper, registry = defaults
    value, _, _ = transform_value("DEMO_REL_01", mapper, registry.for_formulier("DEMO_CB77"))
    assert value == "DEMO_REL_01"


# 10. malformed / missing input ----------------------------------------------------------------
def test_malformed_xml_raises_a_clear_error():
    with pytest.raises(ProcessingError, match=r"line \d+"):
        parse_report(b"<rapportage><post value='1'></rapportage>")


def test_missing_file_and_missing_root_are_errors():
    with pytest.raises(ProcessingError, match="could not be read"):
        parse_report(DEMO / "nope.xml")
    with pytest.raises(ProcessingError, match="rapportage"):
        parse_report(b"<other/>")


def test_post_without_position_is_skipped_with_a_warning(defaults, tmp_path):
    mapper, registry = defaults
    path = tmp_path / "no_row.xml"
    path.write_bytes(b'<rapportage FormulierID="X"><post value="1" kolom="c_1"/></rapportage>')
    result = process_file(path, mapper, registry)
    assert result.lines == [] and result.issues[0].type == "missing-position"


# 11. golden files + determinism ---------------------------------------------------------------
@pytest.mark.parametrize("name", ["CB77", "MB0100"])
def test_output_matches_expected_file_byte_for_byte(name, defaults):
    expected = (DEMO / "expected_{}.jsonl".format(name)).read_bytes()
    assert run("DEMO_{}.xml".format(name), defaults).jsonl().encode("utf-8") == expected


def test_output_is_deterministic(defaults):
    assert run("DEMO_CB77.xml", defaults).jsonl() == run("DEMO_CB77.xml", defaults).jsonl()


def test_jsonl_line_shape():
    assert to_line("0010", "0010", "x") == '{"axis_row":"0010","axis_col":"0010","Value":"x"}'


# 12. supplied snapshot regression -------------------------------------------------------------
def test_run_statistics_match_the_supplied_snapshot(defaults):
    supplied = json.loads((DEMO / "processing_snapshot.json").read_text())
    stats = run("DEMO_CB77.xml", defaults).stats
    for key, expected in supplied.items():
        actual = stats[key if key != "file" else "file"]
        assert actual == expected, key


# 13. the frontend snapshot must be exactly what the processor produces ----------------------------
def test_checked_in_frontend_snapshot_is_up_to_date():
    from processor.generate_snapshot import OUT, build_snapshot

    generated = json.dumps(build_snapshot(), indent=2, ensure_ascii=False) + "\n"
    assert OUT.read_text(encoding="utf-8") == generated, "run: python -m processor.generate_snapshot"


# 14. rijnr as a grouping mechanism ------------------------------------------------------------------
def test_rijnr_forms_logical_groups_of_emitted_cells(defaults):
    result = run("DEMO_CB77.xml", defaults)
    assert {k: len(v) for k, v in result.groups.items()} == {"1": 6, "2": 3}
    assert result.stats["group_sizes"] == {"1": 6, "2": 3}
    assert result.groups["2"] == [["0070", "0010"], ["0070", "0020"], ["0070", "0030"]]
    assert sum(len(v) for v in result.groups.values()) == result.stats["records_emitted"]  # dropped repeat not grouped


def test_grouping_does_not_change_output_or_order(defaults):
    result = run("DEMO_CB77.xml", defaults)
    expected = (DEMO / "expected_CB77.jsonl").read_text().splitlines()
    assert result.lines == expected


def test_posts_without_rijnr_are_not_grouped(defaults, tmp_path):
    mapper, registry = defaults
    path = tmp_path / "no_group.xml"
    path.write_bytes(b'<rapportage FormulierID="X"><post value="1" rij="r_1" kolom="c_1"/></rapportage>')
    result = process_file(path, mapper, registry)
    assert result.groups == {} and len(result.lines) == 1
