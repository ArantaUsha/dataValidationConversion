"""Rule sets. Generic rules are shared by every report; FormulierID rules are representative demo config."""
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Union

from .xml_parser import ProcessingError


@dataclass(frozen=True)
class RuleSet:
    formulier_id: Optional[str]
    report_code: Optional[str] = None
    value_map: Dict[str, str] = field(default_factory=dict)


def _load_json(path: Union[str, Path]) -> dict:
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ProcessingError("Rule file {} could not be read: {}".format(path, exc))


class RuleRegistry:
    def __init__(self, report_codes: Dict[str, str], report_rules: Dict[str, dict], descriptions: Optional[dict] = None):
        self._report_codes = report_codes
        self._report_rules = report_rules
        self.descriptions = descriptions or {}

    @classmethod
    def from_files(
        cls,
        formulier_mapping: Union[str, Path],
        report_rules: Optional[Union[str, Path]] = None,
        descriptions: Optional[Union[str, Path]] = None,
    ) -> "RuleRegistry":
        rules = {k: v for k, v in _load_json(report_rules).items() if not k.startswith("_")} if report_rules else {}
        return cls(_load_json(formulier_mapping), rules, _load_json(descriptions) if descriptions else None)

    def for_formulier(self, formulier_id: Optional[str]) -> RuleSet:
        rules = self._report_rules.get(formulier_id or "", {})
        return RuleSet(
            formulier_id=formulier_id,
            report_code=self._report_codes.get(formulier_id or ""),
            value_map=dict(rules.get("value_map", {})),
        )

    @property
    def generic_rules(self) -> List[str]:
        return list(self.descriptions.get("generic", []))
