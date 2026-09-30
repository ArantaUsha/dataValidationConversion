"""Value-level transformation steps. Each helper is small and independently testable."""
import re
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Tuple, Union

from .hierarchy_mapper import HierarchyMapper
from .rule_registry import RuleSet

NUMBER_PATTERN = re.compile(r"^-?\d+(\.\d+)?$")

Number = Union[int, float]
Value = Union[str, int, float, bool, None]


def normalize_axis(text: str, prefix: str) -> str:
    """'r_0010' -> '0010', 'c_0010' -> '0010'."""
    return text[len(prefix):] if text.startswith(prefix) else text


def normalize_number(text: str) -> Optional[Number]:
    """Integer-valued text becomes int, other numeric text becomes float, anything else is None."""
    if not NUMBER_PATTERN.match(text):
        return None
    try:
        number = Decimal(text)
    except InvalidOperation:
        return None
    return int(number) if number == number.to_integral_value() else float(number)


def normalize_boolean(text: str) -> Optional[bool]:
    return {"TRUE": True, "FALSE": False}.get(text)


def transform_value(
    raw: Optional[str], mapper: HierarchyMapper, ruleset: RuleSet
) -> Tuple[Value, List[dict], dict]:
    """Returns (value, steps, flags). steps explain each change for the trace; flags feed the run statistics."""
    flags = {"hierarchy_hit": False, "hierarchy_miss": None, "boolean": False, "numeric": False}
    steps: List[dict] = []
    if raw is None:
        return None, steps, flags

    value: Value = raw.strip()
    code = mapper.parse_code(value)
    if code:
        entry = mapper.lookup(*code)
        if entry:
            steps.append({"stage": "excel_mapping", "detail": "{} + {} -> {}".format(code[0], code[1], entry.structure),
                          "domain": code[0], "member": code[1], "structure": entry.structure, "date": entry.date})
            value = entry.structure
            flags["hierarchy_hit"] = True
        else:
            steps.append({"stage": "excel_mapping", "detail": "no mapping for {}; original code kept".format(value),
                          "domain": code[0], "member": code[1], "structure": None, "date": None})
            flags["hierarchy_miss"] = value

    if isinstance(value, str) and value in ruleset.value_map:
        mapped = ruleset.value_map[value]
        steps.append({"stage": "business_rule",
                      "detail": "{} rule: {} -> {}".format(ruleset.formulier_id, value, mapped)})
        value = mapped

    if isinstance(value, str):
        boolean = normalize_boolean(value)
        if boolean is not None:
            steps.append({"stage": "type_normalization", "detail": "{} -> {}".format(value, str(boolean).lower())})
            value, flags["boolean"] = boolean, True
        else:
            number = normalize_number(value)
            if number is not None:
                steps.append({"stage": "type_normalization", "detail": "{} -> {}".format(value, number)})
                value, flags["numeric"] = number, True
    return value, steps, flags
