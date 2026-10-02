from typing import Any, Dict


def normalize_source(source: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a source into a consistent structure."""

    return {
        "id": str(source.get("id", "")),
        "title": str(source.get("title", "")).strip(),
        "content": str(source.get("content", "")).strip(),
        "source_type": str(source.get("source_type", "unknown")).strip().lower(),
        "timestamp": source.get("timestamp"),
    }


def normalize_sources(sources: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """Normalize multiple sources."""

    return [normalize_source(source) for source in sources]