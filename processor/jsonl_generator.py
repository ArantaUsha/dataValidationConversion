"""Deterministic JSONL: compact separators and a fixed key order (axis_row, axis_col, Value, report_code)."""
import json
from typing import Optional

from .transformer import Value


def to_line(axis_row: str, axis_col: str, value: Value, report_code: Optional[str] = None) -> str:
    record = {"axis_row": axis_row, "axis_col": axis_col, "Value": value}
    if report_code:
        record["report_code"] = report_code  # illustrative field, see docs
    return json.dumps(record, separators=(",", ":"), ensure_ascii=False)
