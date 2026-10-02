from typing import List

from src.logger import setup_logger
from src.models import NormalizedEvent, SourceType


logger = setup_logger("Temporal")


class TemporalOrderingEngine:
    """Order events chronologically with deterministic tie-breaking."""

    SOURCE_PRIORITY = {
        SourceType.MEETING_NOTE: 1,
        SourceType.GITHUB_ISSUE: 2,
        SourceType.PR_COMMENT: 3,
        SourceType.COMMIT: 4,
        SourceType.TODO: 5,
    }

    def order(
        self,
        events: List[NormalizedEvent],
    ) -> List[NormalizedEvent]:
        """Sort events chronologically."""

        if not events:
            logger.warning("Empty events list received")
            return []

        try:
            ordered = sorted(
                events,
                key=lambda event: (
                    event.timestamp,
                    self.SOURCE_PRIORITY.get(
                        event.source_type,
                        99,
                    ),
                    event.source_id,
                ),
            )

            logger.info(
                f"Ordered {len(ordered)} events chronologically"
            )

            return ordered

        except AttributeError as error:
            logger.error(
                f"Invalid event structure: {error}"
            )
            raise ValueError(
                f"Event missing required field: {error}"
            ) from error

    def get_latest_event(
        self,
        events: List[NormalizedEvent],
    ) -> NormalizedEvent:
        """Get the most recent event."""

        if not events:
            raise ValueError(
                "Cannot get latest from empty events"
            )

        ordered = self.order(events)

        return ordered[-1]

    def find_gaps(
        self,
        events: List[NormalizedEvent],
    ) -> List[dict]:
        """Identify time periods with no data."""

        if len(events) < 2:
            return []

        ordered = self.order(events)
        gaps = []

        for index in range(len(ordered) - 1):
            gap_duration = (
                ordered[index + 1].timestamp
                - ordered[index].timestamp
            )

            if gap_duration.days > 1:
                gaps.append(
                    {
                        "start": ordered[index].timestamp,
                        "end": ordered[index + 1].timestamp,
                        "duration_days": gap_duration.days,
                    }
                )

        logger.info(
            f"Found {len(gaps)} time gaps"
        )

        return gaps