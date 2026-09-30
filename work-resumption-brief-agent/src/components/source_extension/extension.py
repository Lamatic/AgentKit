from typing import Any, Dict, List


def extend_sources(
    sources: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Extend source records without modifying the originals.

    Existing source_type values are preserved. If a source does not
    provide a source_type, it defaults to "unknown".
    """

    result: List[Dict[str, Any]] = []

    for source in sources:
        extended = source.copy()

        if "source_type" not in extended:
            extended["source_type"] = "unknown"

        result.append(extended)

    return result