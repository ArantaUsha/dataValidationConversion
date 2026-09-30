"""Command line: python -m processor.cli demo/DEMO_CB77.xml [--out-dir out]"""
import argparse
import sys
from pathlib import Path

from .hierarchy_mapper import HierarchyMapper
from .pipeline import process_file
from .rule_registry import RuleRegistry
from .xml_parser import ProcessingError

ROOT = Path(__file__).resolve().parent.parent


def load_defaults():
    demo = ROOT / "demo"
    mapper = HierarchyMapper.from_excel(demo / "hierarchies_demo.xlsx")
    registry = RuleRegistry.from_files(demo / "formulier_mapping.json", demo / "report_rules.json", demo / "rules.json")
    return mapper, registry


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Transform reporting XML into JSONL (fictional demo data).")
    parser.add_argument("xml", nargs="+", help="XML file(s) to process")
    parser.add_argument("--out-dir", help="write <name>.jsonl here; otherwise print to stdout")
    args = parser.parse_args(argv)

    try:
        mapper, registry = load_defaults()
    except ProcessingError as exc:
        print("Error: {}".format(exc), file=sys.stderr)
        return 2

    status = 0
    for xml in args.xml:
        try:
            result = process_file(xml, mapper, registry)
        except ProcessingError as exc:
            print("Error: {}".format(exc), file=sys.stderr)
            status = 2
            continue
        if args.out_dir:
            out = Path(args.out_dir)
            out.mkdir(parents=True, exist_ok=True)
            (out / (Path(xml).stem + ".jsonl")).write_text(result.jsonl(), encoding="utf-8")
        else:
            sys.stdout.write(result.jsonl())
        s = result.stats
        print("{}: {} read, {} emitted, {} warning(s)".format(result.file, s["records_read"], s["records_emitted"], len(result.issues)), file=sys.stderr)
        for issue in result.issues:
            print("  line {}: {}".format(issue.line, issue.message), file=sys.stderr)
    return status


if __name__ == "__main__":
    sys.exit(main())
