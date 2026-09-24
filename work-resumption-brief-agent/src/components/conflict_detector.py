from typing import Dict, List

from src.logger import setup_logger
from src.models import Conflict, NormalizedEvent


logger = setup_logger("ConflictDetector")


class ConflictDetector:
    """Detect and resolve contradictions between sources."""

    SYNONYMS = {
        "implemented": [
            "implemented",
            "implement",
            "added",
            "done",
            "completed",
            "complete",
            "finished",
            "ready",
        ],
        "not_implemented": [
            "not implemented",
            "not done",
            "incomplete",
            "pending",
            "todo",
        ],
        "blocked": [
            "blocked",
            "waiting",
            "stalled",
        ],
        "not_blocked": [
            "unblocked",
            "moving",
            "progress",
        ],
    }

    def detect_conflicts(
        self,
        events_by_entity: Dict[str, List[NormalizedEvent]],
    ) -> List[Conflict]:
        """Detect contradictions and resolve them using temporal ordering."""

        conflicts: List[Conflict] = []

        for entity, events in events_by_entity.items():
            if not events:
                continue

            ordered_events = sorted(
                events,
                key=lambda event: event.timestamp
            )

            claims = [
                (
                    event,
                    self._extract_state(event.content)
                )
                for event in ordered_events
            ]

            for index, (older_event, older_state) in enumerate(claims):
                if older_state == "unknown":
                    continue

                contradictory_events = []

                for newer_event, newer_state in claims[index + 1:]:
                    if newer_state == "unknown":
                        continue

                    if self._is_contradiction(
                        older_state,
                        newer_state,
                    ):
                        contradictory_events.append(
                            newer_event
                        )

                if not contradictory_events:
                    continue

                latest_event = max(
                    contradictory_events,
                    key=lambda event: event.timestamp
                )

                conflict = Conflict(
                    entity=entity,
                    claim_old=older_event.content,
                    claim_new=latest_event.content,
                    timestamp_old=older_event.timestamp,
                    timestamp_new=latest_event.timestamp,
                    resolution=(
                        f"Newer claim ({latest_event.timestamp}) "
                        "overrides older claim "
                        f"({older_event.timestamp})"
                    ),
                    confidence=0.9,
                )

                conflicts.append(conflict)

                break

        logger.info(
            f"Detected {len(conflicts)} conflicts"
        )

        return conflicts

    def _extract_state(
        self,
        text: str,
    ) -> str:
        """Extract the state claim from text."""

        text_lower = text.lower()

        # Check negative states first so phrases such as
        # "not implemented" are not classified as implemented.
        if any(
            phrase in text_lower
            for phrase in self.SYNONYMS["not_implemented"]
        ):
            return "not_implemented"

        if any(
            phrase in text_lower
            for phrase in self.SYNONYMS["blocked"]
        ):
            return "blocked"

        if any(
            phrase in text_lower
            for phrase in self.SYNONYMS["not_blocked"]
        ):
            return "not_blocked"

        if any(
            phrase in text_lower
            for phrase in self.SYNONYMS["implemented"]
        ):
            return "implemented"

        return "unknown"

    def _is_contradiction(
        self,
        state_a: str,
        state_b: str,
    ) -> bool:
        """Check whether two states contradict each other."""

        contradictions = {
            ("implemented", "not_implemented"),
            ("blocked", "not_blocked"),
        }

        return (
            (state_a, state_b) in contradictions
            or (state_b, state_a) in contradictions
        )