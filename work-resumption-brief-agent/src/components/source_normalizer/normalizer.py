from typing import Any, Dict


def _text(value, default=""):
    return default if value is None else str(value)


def normalize_source(source: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a source into a consistent structure."""

    return {
        "id": _text(source.get("id")),
        "title": _text(source.get("title")).strip(),
        "content": _text(source.get("content")).strip(),
        "source_type": (
            _text(source.get("source_type"), "unknown")
            .strip()
            .lower()
            or "unknown"
        ),
        "timestamp": source.get("timestamp"),
    }


def normalize_sources(
    sources: list[Dict[str, Any]],
) -> list[Dict[str, Any]]:
    """Normalize multiple sources."""

    return [normalize_source(source) for source in sources]
