from src.logger import setup_logger
from src.models import Conflict, NormalizedEvent
from typing import List, Dict

logger = setup_logger("ConflictDetector")


class ConflictDetector:
    """Detect and resolve contradictions between sources."""

    SYNONYMS = {
        "implemented": ["added", "done", "completed", "finished", "ready"],
        "not_implemented": ["incomplete", "pending", "not done", "todo"],
        "blocked": ["waiting", "stalled"],
        "not_blocked": ["unblocked", "moving", "progress"]
    }

    def detect_conflicts(
        self,
        events_by_entity: Dict[str, List[NormalizedEvent]]
    ) -> List[Conflict]:
        """Detect contradictions within the same entity."""
        conflicts = []

        for entity, events in events_by_entity.items():
            if len(events) < 2:
                continue

            claims = [
                (event, self._extract_state(event.content))
                for event in events
            ]

            for i, (event_a, claim_a) in enumerate(claims):
                for event_b, claim_b in claims[i + 1:]:
                    if not self._is_contradiction(claim_a, claim_b):
                        continue

                    if event_a.timestamp > event_b.timestamp:
                        newer, older = event_a, event_b
                    else:
                        newer, older = event_b, event_a

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
                        confidence=0.9
                    )

                    conflicts.append(conflict)

        logger.info(f"Detected {len(conflicts)} conflicts")
        return conflicts

    def _extract_state(self, text: str) -> str:
        """Extract the state claim from text."""
        text_lower = text.lower()

        # Check negative states FIRST so
        # "not implemented" is not classified as implemented.
        if any(
            phrase in text_lower
            for phrase in [
                "not implemented",
                "not done",
                "incomplete",
                "pending",
                "todo"
            ]
        ):
            return "not_implemented"

        if any(
            phrase in text_lower
            for phrase in [
                "implemented",
                "added",
                "done",
                "completed",
                "finished",
                "ready"
            ]
        ):
            return "implemented"

        if any(
            phrase in text_lower
            for phrase in [
                "blocked",
                "waiting",
                "stalled"
            ]
        ):
            return "blocked"

        if any(
            phrase in text_lower
            for phrase in [
                "unblocked",
                "moving",
                "progress"
            ]
        ):
            return "not_blocked"

        return "unknown"

    def _is_contradiction(self, state_a: str, state_b: str) -> bool:
        """Check whether two states contradict each other."""

        contradictions = {
            ("implemented", "not_implemented"),
            ("blocked", "not_blocked")
        }

        return (
            (state_a, state_b) in contradictions
            or (state_b, state_a) in contradictions
        )