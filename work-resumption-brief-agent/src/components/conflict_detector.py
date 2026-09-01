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
        """Detect contradictions within the same entity."""

        conflicts: List[Conflict] = []

        for entity, events in events_by_entity.items():
            if not events:
                continue

            claims = [
                (event, self._extract_state(event.content))
                for event in events
            ]

            for i, (event_a, claim_a) in enumerate(claims):
                if claim_a == "unknown":
                    continue

                for event_b, claim_b in claims[i + 1:]:
                    if claim_b == "unknown":
                        continue

                    if not self._is_contradiction(claim_a, claim_b):
                        continue

                    if event_a.timestamp > event_b.timestamp:
                        newer = event_a
                        older = event_b
                    else:
                        newer = event_b
                        older = event_a

                    conflict = Conflict(
                        entity=entity,
                        claim_old=older.content,
                        claim_new=newer.content,
                        timestamp_old=older.timestamp,
                        timestamp_new=newer.timestamp,
                        resolution=(
                            f"Newer claim ({newer.timestamp}) "
                            "overrides older claim "
                            f"({older.timestamp})"
                        ),
                        confidence=0.9,
                    )

                    conflicts.append(conflict)

        logger.info(f"Detected {len(conflicts)} conflicts")

        return conflicts

    def _extract_state(self, text: str) -> str:
        """Extract the state claim from text."""

        text_lower = text.lower()

        # Check negative states first.
        # This prevents "not implemented" from being
        # incorrectly classified as "implemented".
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