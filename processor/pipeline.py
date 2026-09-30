"""Ties the modules together: parse -> transform -> validate -> JSONL."""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Union

from . import validator
from .hierarchy_mapper import HierarchyMapper
from .jsonl_generator import to_line
from .rule_registry import RuleRegistry
from .transformer import normalize_axis, transform_value
from .xml_parser import parse_report


@dataclass
class ProcessResult:
    file: str
    meta: Dict[str, str]
    lines: List[str] = field(default_factory=list)
    issues: List[validator.Issue] = field(default_factory=list)
    records: List[dict] = field(default_factory=list)  # per-post trace, used for the story/snapshot
    # rijnr -> emitted cells [axis_row, axis_col]: posts sharing a rijnr form one logical group. Grouping only;
    # no value is ever calculated from it.
    groups: Dict[str, List[List[str]]] = field(default_factory=dict)
    stats: Dict[str, object] = field(default_factory=dict)

    def jsonl(self) -> str:
        return "".join(line + "\n" for line in self.lines)


def process_file(xml_path: Union[str, Path], mapper: HierarchyMapper, registry: RuleRegistry) -> ProcessResult:
    """Raises ProcessingError for malformed/unreadable input; everything else is reported as issues."""
    report = parse_report(xml_path)
    ruleset = registry.for_formulier(report.meta.get("formulier_id"))
    result = ProcessResult(file=Path(xml_path).name, meta=report.meta)
    duplicates = validator.DuplicateDetector()
    counts = {"hierarchy_hits": 0, "hierarchy_misses": 0, "booleans_converted": 0, "numeric_values_converted": 0}
    groups: List[str] = []

    for post in report.posts:
        if not post.row or not post.col:
            result.issues.append(validator.missing_position(post))
            continue
        row, col = normalize_axis(post.row, "r_"), normalize_axis(post.col, "c_")
        source = {"line": post.line, "value": post.value, "rij": post.row, "kolom": post.col, "rijnr": post.rijnr}

        if post.rijnr is not None and post.rijnr not in groups:
            groups.append(post.rijnr)  # rijnr is kept purely as grouping information

        duplicate = duplicates.check(post, row, col)
        if duplicate:
            # Continue processing: report the repeat, keep the first occurrence only.
            result.issues.append(duplicate)
            result.records.append({"source": source, "steps": [], "output": None, "dropped": "duplicate"})
            continue

        value, steps, flags = transform_value(post.value, mapper, ruleset)
        counts["hierarchy_hits"] += flags["hierarchy_hit"]
        counts["booleans_converted"] += flags["boolean"]
        counts["numeric_values_converted"] += flags["numeric"]
        if flags["hierarchy_miss"]:
            counts["hierarchy_misses"] += 1
            result.issues.append(validator.mapping_miss(post, row, col, flags["hierarchy_miss"]))

        line = to_line(row, col, value, ruleset.report_code)
        if post.rijnr is not None:
            result.groups.setdefault(post.rijnr, []).append([row, col])
        result.lines.append(line)
        result.records.append({"source": source, "steps": steps, "output": line, "dropped": None})

    result.issues.sort(key=lambda i: i.line)
    duplicate_count = sum(1 for i in result.issues if i.type == "duplicate")
    result.stats = {
        "file": result.file,
        "formulier_id": report.meta.get("formulier_id"),
        "records_read": len(report.posts),
        "records_emitted": len(result.lines),
        "duplicates": duplicate_count,
        **counts,
        "group_ids_seen": groups,
        "group_sizes": {rijnr: len(cells) for rijnr, cells in result.groups.items()},
        "status": "demo-success-with-warning" if result.issues else "demo-success",
    }
    return result
