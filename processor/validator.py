"""Data-quality checks. Findings are collected; they never stop the run."""
from dataclasses import asdict, dataclass
from typing import Dict, Optional, Tuple

from .xml_parser import Post


@dataclass(frozen=True)
class Issue:
    type: str  # duplicate | mapping-miss | missing-position
    severity: str  # warning
    line: int
    row: Optional[str]
    col: Optional[str]
    message: str

    def to_dict(self) -> dict:
        return asdict(self)


class DuplicateDetector:
    """An exact duplicate is the same value + same row + same column (the definition in the specs)."""

    def __init__(self) -> None:
        self._seen: Dict[Tuple[Optional[str], str, str], int] = {}

    def check(self, post: Post, row: str, col: str) -> Optional[Issue]:
        key = (post.value, row, col)
        first = self._seen.get(key)
        if first is None:
            self._seen[key] = post.line
            return None
        return Issue("duplicate", "warning", post.line, row, col,
                     "Duplicate detected · Row {} · Column {} (first seen on line {})".format(row, col, first))


def mapping_miss(post: Post, row: str, col: str, code: str) -> Issue:
    return Issue("mapping-miss", "warning", post.line, row, col,
                 "No Excel mapping for {}; the original code was kept".format(code))


def missing_position(post: Post) -> Issue:
    missing = "row (rij)" if not post.row else "column (kolom)"
    return Issue("missing-position", "warning", post.line, post.row, post.col,
                 "Record skipped: missing {}".format(missing))
