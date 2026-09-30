"""Read a reporting XML file: metadata from <rapportage> and every <post> element.

Uses expat directly so each post keeps its source line number (needed for duplicate warnings) and so
malformed XML fails with a clear, located error.
"""
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Union
from xml.parsers import expat


class ProcessingError(Exception):
    """The input could not be processed at all (missing file, malformed XML, no report root)."""


@dataclass(frozen=True)
class Post:
    line: int
    value: Optional[str]
    row: Optional[str]
    col: Optional[str]
    rijnr: Optional[str]
    cube: Optional[str]


@dataclass
class Report:
    meta: Dict[str, Optional[str]]
    posts: List[Post]


def _get(attrs: Dict[str, str], *names: str) -> Optional[str]:
    """Case-insensitive attribute lookup; the first matching spelling wins."""
    lowered = {k.lower(): v for k, v in attrs.items()}
    for name in names:
        if name.lower() in lowered:
            return lowered[name.lower()]
    return None


def parse_report(source: Union[str, Path, bytes]) -> Report:
    if isinstance(source, bytes):
        data, label = source, "<bytes>"
    else:
        path = Path(source)
        label = str(path)
        try:
            data = path.read_bytes()
        except OSError as exc:
            raise ProcessingError("File {} could not be read: {}".format(label, exc.strerror or exc))

    meta: Dict[str, Optional[str]] = {}
    posts: List[Post] = []
    parser = expat.ParserCreate()

    def start(name: str, attrs: Dict[str, str]) -> None:
        tag = name.lower()
        if tag == "rapportage" and not meta:
            meta.update(
                formulier_id=_get(attrs, "FormulierID", "FormulierId"),
                period=_get(attrs, "period"),
                versie=_get(attrs, "versie"),
                frequentie=_get(attrs, "frequentie"),
                registratienummer=_get(attrs, "registratienummer"),
                nihil=_get(attrs, "nihil"),
            )
        elif tag == "post":
            posts.append(
                Post(
                    line=parser.CurrentLineNumber,
                    value=_get(attrs, "value"),
                    row=_get(attrs, "rij", "row"),
                    col=_get(attrs, "kolom"),
                    rijnr=_get(attrs, "rijnr"),
                    cube=_get(attrs, "cube"),
                )
            )

    parser.StartElementHandler = start
    try:
        parser.Parse(data, True)
    except expat.ExpatError as exc:
        raise ProcessingError(
            "XML in {} could not be parsed (line {}): {}".format(label, exc.lineno, expat.ErrorString(exc.code))
        )
    if not meta:
        raise ProcessingError("No <rapportage> element found in {}.".format(label))
    return Report(meta=meta, posts=posts)
