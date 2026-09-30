"""Excel hierarchy reference data: EBA_<Domain>_<Member> -> Structure, latest dated entry wins."""
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple, Union

import pandas as pd

from .xml_parser import ProcessingError

EBA_PATTERN = re.compile(r"^EBA_([A-Za-z0-9]+)_(\w+)$")
REQUIRED_COLUMNS = ["Domain Code", "Member Code", "Structure", "Date"]


@dataclass(frozen=True)
class HierarchyEntry:
    domain: str
    member: str
    structure: str
    date: str  # ISO date, for display and determinism


class HierarchyMapper:
    def __init__(self, entries: Dict[Tuple[str, str], HierarchyEntry]):
        self._entries = entries

    @classmethod
    def from_excel(cls, path: Union[str, Path], sheet: str = "Hierarchies") -> "HierarchyMapper":
        try:
            frame = pd.read_excel(path, sheet_name=sheet, dtype=str)
        except (OSError, ValueError) as exc:
            raise ProcessingError("Hierarchy workbook {} could not be read: {}".format(path, exc))
        return cls.from_dataframe(frame)

    @classmethod
    def from_dataframe(cls, frame: pd.DataFrame) -> "HierarchyMapper":
        missing = [c for c in REQUIRED_COLUMNS if c not in frame.columns]
        if missing:
            raise ProcessingError("Hierarchy sheet is missing column(s): {}".format(", ".join(missing)))
        frame = frame.copy()
        try:
            frame["Date"] = pd.to_datetime(frame["Date"], format="%m/%d/%Y")
        except ValueError:
            frame["Date"] = pd.to_datetime(frame["Date"])
        # Sort by date (stable) then keep the last row per key: the latest dated entry wins.
        latest = frame.sort_values("Date", kind="stable").groupby(["Domain Code", "Member Code"], as_index=False).last()
        entries = {
            (r["Domain Code"], r["Member Code"]): HierarchyEntry(
                r["Domain Code"], r["Member Code"], r["Structure"], r["Date"].strftime("%Y-%m-%d")
            )
            for _, r in latest.iterrows()
        }
        return cls(entries)

    @staticmethod
    def parse_code(value: str) -> Optional[Tuple[str, str]]:
        match = EBA_PATTERN.match(value)
        return (match.group(1), match.group(2)) if match else None

    def lookup(self, domain: str, member: str) -> Optional[HierarchyEntry]:
        """Exact, case-sensitive lookup."""
        return self._entries.get((domain, member))

    def __len__(self) -> int:
        return len(self._entries)
