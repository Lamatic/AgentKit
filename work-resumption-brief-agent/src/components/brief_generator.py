from datetime import datetime, timezone
from typing import List

from src.logger import setup_logger
from src.models import WorkResumptionBrief, Action


logger = setup_logger("BriefGenerator")


class BriefGenerator:
    """Generate human-readable work resumption briefs."""

    def generate(self, state, blockers, actions, conflicts=None):
        """Generate a structured work resumption brief."""

        if not actions:
            logger.warning("No actions available for brief generation")
            return WorkResumptionBrief(
                current_state=state or [],
                conflicts=conflicts or [],
                blockers=blockers or [],
                evidence=[],
                actions=[],
                recommended_first_action=None,
                confidence_overall=0.0,
                timestamp=datetime.now(timezone.utc),
            )

        try:
            top_action = sorted(
                actions,
                key=lambda action: action.score,
                reverse=True,
            )[0]
            logger.info(
                f"Selected top action: {top_action.action}"
            )
        except (IndexError, AttributeError, TypeError) as error:
            logger.error(f"Error sorting actions: {error}")
            return WorkResumptionBrief(
                current_state=state or [],
                conflicts=conflicts or [],
                blockers=blockers or [],
                evidence=[],
                actions=actions or [],
                recommended_first_action=None,
                confidence_overall=0.0,
                timestamp=datetime.now(timezone.utc),
            )

        confidence = self._calculate_confidence(state)

        brief = WorkResumptionBrief(
            current_state=state or [],
            conflicts=conflicts or [],
            blockers=blockers or [],
            evidence=[],
            actions=actions or [],
            recommended_first_action=top_action,
            confidence_overall=confidence,
            timestamp=datetime.now(timezone.utc),
        )

        logger.info(
            f"Generated brief with confidence {confidence}"
        )
        return brief

    def _calculate_confidence(self, state: List) -> float:
        """Calculate overall confidence from state."""

        if not state:
            return 0.0

        total_confidence = sum(
            item.confidence
            for item in state
            if hasattr(item, "confidence")
        )

        return total_confidence / len(state)

    def generate_brief(self, actions):
        """Format prioritized actions as human-readable text."""

        if not actions:
            return "No prioritized actions available."

        lines = ["Work Resumption Brief", ""]

        for index, item in enumerate(actions, start=1):
            action = item.get("action", "Unknown action")
            impact = item.get("impact", "UNKNOWN")
            urgency = item.get("urgency", "UNKNOWN")
            confidence = item.get("confidence", 0)

            lines.append(
                f"{index}. {action} "
                f"(Impact: {impact}, Urgency: {urgency}, "
                f"Confidence: {confidence})"
            )

        return "\n".join(lines)


def generate_brief(actions):
    """Format prioritized actions as a human-readable brief."""
    return BriefGenerator().generate_brief(actions)