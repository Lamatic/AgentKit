from src.logger import setup_logger
from src.models import Evidence, NormalizedEvent, ConfidenceLevel, Conflict
from src.config import (
    CONFIDENCE_WEIGHTS,
    RECENCY_SCORES,
    CONFIDENCE_THRESHOLDS,
)
from typing import List
from datetime import datetime, timezone

logger = setup_logger("EvidenceCollector")


class EvidenceCollector:
    """Collect evidence and calculate confidence."""

    def collect_evidence(
        self,
        conclusion: str,
        events: List[NormalizedEvent],
        conflicts: List[Conflict],
    ) -> Evidence:
        """For each conclusion, find supporting evidence."""

        supporting_sources = []

        for event in events:
            if self._mentions_conclusion(event.content, conclusion):
                supporting_sources.append(event)

        if not supporting_sources:
            return Evidence(
                conclusion=conclusion,
                sources=[],
                confidence=0.0,
                confidence_level=ConfidenceLevel.LOW,
                reasoning="No supporting evidence found",
            )

        source_support = min(len(supporting_sources) / 3, 1.0)

        latest = max(supporting_sources, key=lambda e: e.timestamp)
        recency_score = self._get_recency_score(latest.timestamp)

        consistency_score = self._get_consistency_score(
            conclusion,
            conflicts,
        )

        confidence = 100 * (
            CONFIDENCE_WEIGHTS["source_support"] * source_support
            + CONFIDENCE_WEIGHTS["recency"] * recency_score
            + CONFIDENCE_WEIGHTS["consistency"] * consistency_score
        )

        confidence_level = self._get_confidence_level(confidence)

        source_ids = [event.source_id for event in supporting_sources]

        return Evidence(
            conclusion=conclusion,
            sources=source_ids,
            confidence=confidence,
            confidence_level=confidence_level,
            reasoning=(
                f"{len(supporting_sources)} sources, "
                f"recency={recency_score:.2f}, "
                f"consistency={consistency_score:.2f}"
            ),
        )

    def _get_recency_score(self, timestamp: datetime) -> float:
        """Score based on how recent the event is."""

        now = datetime.now(timezone.utc)

        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        age = now - timestamp

        if age.total_seconds() < 3600:
            return 1.0
        elif age.days < 1:
            return 0.8
        elif age.days < 7:
            return 0.6
        elif age.days < 30:
            return 0.4
        else:
            return 0.2

    def _get_consistency_score(
        self,
        conclusion: str,
        conflicts: List[Conflict],
    ) -> float:
        """Check if conclusion has unresolved conflicts."""

        for conflict in conflicts:
            if conflict.entity.lower() in conclusion.lower():
                return 0.8

        return 1.0

    def _get_confidence_level(
        self,
        confidence: float,
    ) -> ConfidenceLevel:
        """Map confidence score to level."""

        if confidence >= CONFIDENCE_THRESHOLDS["HIGH"][0]:
            return ConfidenceLevel.HIGH

        elif confidence >= CONFIDENCE_THRESHOLDS["MEDIUM"][0]:
            return ConfidenceLevel.MEDIUM

        return ConfidenceLevel.LOW

    def _mentions_conclusion(
        self,
        content: str,
        conclusion: str,
    ) -> bool:
        """Check if content mentions conclusion keywords."""

        keywords = conclusion.lower().split()

        return all(
            keyword in content.lower()
            for keyword in keywords[:2]
        )