import re
from datetime import datetime
from typing import List, Optional

from src.logger import setup_logger
from src.models import (
    ConfidenceLevel,
    Evidence,
    Conflict,
    NormalizedEvent,
)

logger = setup_logger("EvidenceCollector")


class EvidenceCollector:
    """
    Collects and scores evidence supporting reconstructed conclusions.

    Evidence quality is evaluated using:
    - source support
    - recency
    - consistency
    """

    def collect_evidence(
        self,
        conclusion: str,
        events: List[NormalizedEvent],
        conflicts: List[Conflict],
        reference_time: Optional[datetime] = None,
    ) -> Optional[Evidence]:
        """Collect evidence supporting a conclusion."""

        if not conclusion or not events:
            return None

        supporting_events = [
            event
            for event in events
            if self._mentions_conclusion(
                event.content,
                conclusion,
            )
        ]

        if not supporting_events:
            return Evidence(
                conclusion=conclusion,
                sources=[],
                confidence=0.0,
                confidence_level=ConfidenceLevel.LOW,
                reasoning="No supporting evidence found",
            )

        sources = [
            event.source_id
            for event in supporting_events
        ]

        source_support = min(
            len(supporting_events) / 3.0,
            1.0,
        )

        effective_reference_time = (
            reference_time
            if reference_time is not None
            else getattr(
                self,
                "_reference_time",
                None,
            )
        )

        recency_score = self._calculate_recency(
            supporting_events,
            effective_reference_time,
        )

        consistency_score = self._calculate_consistency(
            conclusion,
            conflicts,
        )

        confidence = (
            source_support * 0.30
            + recency_score * 0.40
            + consistency_score * 0.30
        ) * 100

        confidence = round(confidence, 2)

        confidence_level = self._get_confidence_level(
            confidence
        )

        reasoning = self._build_reasoning(
            supporting_events=supporting_events,
            confidence=confidence,
            conflicts=conflicts,
            conclusion=conclusion,
        )

        return Evidence(
            conclusion=conclusion,
            sources=sources,
            confidence=confidence,
            confidence_level=confidence_level,
            reasoning=reasoning,
        )

    def _get_recency_score(
        self,
        timestamp: datetime,
        reference_time: Optional[datetime] = None,
    ) -> float:
        """Calculate recency score for a single timestamp."""

        if reference_time is None:
            reference_time = getattr(
                self,
                "_reference_time",
                None,
            )

        if reference_time is None:
            reference_time = datetime.now(
                timestamp.tzinfo
            )

        age_hours = (
            reference_time - timestamp
        ).total_seconds() / 3600

        if age_hours < 1:
            return 1.0

        if age_hours < 24:
            return 0.8

        if age_hours < 24 * 7:
            return 0.6

        if age_hours < 24 * 30:
            return 0.4

        return 0.2

    def _calculate_recency(
        self,
        events: List[NormalizedEvent],
        reference_time: Optional[datetime],
    ) -> float:
        """Calculate recency score for supporting evidence."""

        if not events:
            return 0.0

        latest_event = max(
            events,
            key=lambda event: event.timestamp,
        )

        return self._get_recency_score(
            latest_event.timestamp,
            reference_time,
        )

    def _calculate_consistency(
        self,
        conclusion: str,
        conflicts: List[Conflict],
    ) -> float:
        """Calculate consistency score based on detected conflicts."""

        if not conflicts:
            return 1.0

        conclusion_lower = conclusion.lower()

        for conflict in conflicts:
            entity = getattr(
                conflict,
                "entity",
                "",
            )

            if (
                entity
                and entity.lower() in conclusion_lower
            ):
                return 0.5

        return 1.0

    def _get_confidence_level(
        self,
        confidence: float,
    ) -> ConfidenceLevel:
        """Convert numeric confidence into a confidence level."""

        if confidence >= 80:
            return ConfidenceLevel.HIGH

        if confidence >= 50:
            return ConfidenceLevel.MEDIUM

        return ConfidenceLevel.LOW

    def _build_reasoning(
        self,
        supporting_events: List[NormalizedEvent],
        confidence: float,
        conflicts: List[Conflict],
        conclusion: str,
    ) -> str:
        """Build a human-readable explanation for the evidence score."""

        source_count = len(supporting_events)

        if conflicts:
            conclusion_lower = conclusion.lower()

            for conflict in conflicts:
                entity = getattr(
                    conflict,
                    "entity",
                    "",
                )

                if (
                    entity
                    and entity.lower() in conclusion_lower
                ):
                    return (
                        f"Supported by {source_count} source(s), "
                        f"but conflicting evidence exists for {entity}"
                    )

        return (
            f"Supported by {source_count} source(s) "
            f"with confidence {confidence:.1f}%"
        )

    def _mentions_conclusion(
        self,
        content: str,
        conclusion: str,
    ) -> bool:
        """Check whether content supports the conclusion."""

        if not content or not conclusion:
            return False

        content_lower = content.lower()
        keywords = conclusion.lower().split()

        if not keywords:
            return False

        entity_keywords = keywords[:2]

        if all(
            keyword in content_lower
            for keyword in entity_keywords
        ):
            return True

        if (
            len(keywords) > 2
            and keywords[1] not in content_lower
        ):
            supporting_keywords = keywords[1:]

            if supporting_keywords and all(
                keyword in content_lower
                for keyword in supporting_keywords
            ):
                return True

        variants = {
            "parser": {
                "parser",
                "parsing",
                "parse",
            },
            "parsing": {
                "parser",
                "parsing",
                "parse",
            },
            "parse": {
                "parser",
                "parsing",
                "parse",
            },
            "implement": {
                "implement",
                "implemented",
                "implementation",
            },
            "implemented": {
                "implement",
                "implemented",
                "implementation",
            },
            "implementation": {
                "implement",
                "implemented",
                "implementation",
            },
            "complete": {
                "complete",
                "completed",
                "completion",
            },
            "completed": {
                "complete",
                "completed",
                "completion",
            },
            "completion": {
                "complete",
                "completed",
                "completion",
            },
        }

        if len(entity_keywords) >= 2:
            first = entity_keywords[0]
            second = entity_keywords[1]

            first_variants = variants.get(
                first,
                {first},
            )

            second_variants = variants.get(
                second,
                {second},
            )

            if (
                any(
                    variant in content_lower
                    for variant in first_variants
                )
                and any(
                    variant in content_lower
                    for variant in second_variants
                )
            ):
                return True

        # Ignore short/function words in the fallback comparison.
        # These words are too generic to establish meaningful
        # evidence for a conclusion.
        stop_words = {
            "a",
            "an",
            "and",
            "are",
            "as",
            "at",
            "be",
            "by",
            "for",
            "from",
            "in",
            "is",
            "it",
            "of",
            "on",
            "or",
            "the",
            "to",
            "was",
            "were",
            "with",
        }

        meaningful_keywords = [
            keyword
            for keyword in keywords
            if keyword.strip()
            and keyword.strip().lower() not in stop_words
            and len(keyword.strip()) > 2
        ]

        if not meaningful_keywords:
            return False

        # Match meaningful keywords using word boundaries.
        # This prevents short words or phrases from matching
        # inside unrelated words.
        for keyword in meaningful_keywords:
            keyword_variants = variants.get(
                keyword,
                {keyword},
            )

            for variant in keyword_variants:
                normalized_variant = variant.strip().lower()

                if not normalized_variant:
                    continue

                pattern = (
                    r"\b"
                    + re.escape(normalized_variant)
                    + r"\b"
                )

                if re.search(
                    pattern,
                    content_lower,
                ):
                    break
                else:

                    return False

        return True