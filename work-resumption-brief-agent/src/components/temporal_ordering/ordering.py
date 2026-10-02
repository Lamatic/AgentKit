from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from src.logger import setup_logger


logger = setup_logger("TemporalOrdering")


def _parse_timestamp(source: Dict[str, Any]) -> Optional[datetime]:
    """Parse a source timestamp into a timezone-aware UTC datetime."""

    timestamp = source.get("timestamp")

    if not isinstance(timestamp, str) or not timestamp.strip():
        return None

    try:
        parsed = datetime.fromisoformat(
            timestamp.strip().replace("Z", "+00:00")
        )
    except ValueError:
        return None

    if parsed.tzinfo is None or parsed.utcoffset() is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def order_sources(
    sources: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Order sources chronologically and detect time gaps."""

    if not sources:
        return []

    parsed_sources = [
        (source, _parse_timestamp(source))
        for source in sources
    ]

    ordered_pairs = sorted(
        parsed_sources,
        key=lambda item: (
            item[1] is None,
            item[1] if item[1] is not None else datetime.max.replace(
                tzinfo=timezone.utc
            ),
        ),
    )

    ordered = [
        source
        for source, _ in ordered_pairs
    ]

    # Detect time gaps only between sources with valid timestamps.
    gaps = []

    valid_ordered = [
        (source, timestamp)
        for source, timestamp in ordered_pairs
        if timestamp is not None
    ]

    for i in range(len(valid_ordered) - 1):
        current_time = valid_ordered[i][1]
        next_time = valid_ordered[i + 1][1]

        time_diff = next_time - current_time

        if time_diff.days > 7:
            gaps.append({
                "start": current_time,
                "end": next_time,
                "gap_days": time_diff.days,
            })

    if gaps:
        logger.warning(
            f"Found {len(gaps)} time gaps in sources"
        )

        for gap in gaps:
            logger.debug(
                f"Gap: {gap['start']} to {gap['end']} "
                f"({gap['gap_days']} days)"
            )

    return ordered