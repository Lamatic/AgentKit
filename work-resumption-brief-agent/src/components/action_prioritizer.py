from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class PrioritizedAction:
    action: str
    priority: str
    score: float
    impact: str
    urgency: str
    reason: str
    source: Optional[str] = None
    blocking: str = "MEDIUM"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ActionPrioritizer:
    PRIORITY_SCORES = {
        "CRITICAL": 100,
        "HIGH": 80,
        "MEDIUM": 60,
        "LOW": 40,
    }

    BLOCKING_SCORES = {
        "CRITICAL": 100,
        "HIGH": 80,
        "MEDIUM": 60,
        "LOW": 40,
    }

    IMPACT_SCORES = {
        "CRITICAL": 100,
        "HIGH": 80,
        "MEDIUM": 60,
        "LOW": 40,
    }

    URGENCY_SCORES = {
        "CRITICAL": 100,
        "HIGH": 80,
        "MEDIUM": 60,
        "LOW": 40,
    }

    def prioritize(
        self,
        actions: List[Any],
    ) -> List[PrioritizedAction]:
        prioritized: List[
            Tuple[PrioritizedAction, int, bool]
        ] = []

        for item in actions:
            data = self._normalize(item)

            action = data.get("action")

            if not isinstance(action, str) or not action.strip():
                continue

            action = action.strip()

            blocking = self._level(
                data.get("blocking")
            )

            impact = self._level(
                data.get("impact")
            )

            urgency = self._level(
                data.get("urgency")
            )

            blocking_score = self.BLOCKING_SCORES[blocking]
            impact_score = self.IMPACT_SCORES[impact]
            urgency_score = self.URGENCY_SCORES[urgency]

            score = (
                (blocking_score * 0.50)
                + (impact_score * 0.30)
                + (urgency_score * 0.20)
            )

            score = min(100.0, score)

            explicit_priority = data.get("priority")

            if explicit_priority is not None:
                requested_priority = self._level(
                    explicit_priority
                )

                if blocking == "CRITICAL":
                    priority = "CRITICAL"
                else:
                    priority = requested_priority

                priority_rank = self.PRIORITY_SCORES[
                    requested_priority
                ]

                has_explicit_priority = True

            else:
                priority = self._priority_from_score(
                    score=score,
                    blocking=blocking,
                )

                priority_rank = self.PRIORITY_SCORES[
                    priority
                ]

                has_explicit_priority = False

            reason = self._build_reason(
                blocking=blocking,
                impact=impact,
                urgency=urgency,
            )

            prioritized.append(
                (
                    PrioritizedAction(
                        action=action,
                        priority=priority,
                        score=round(score, 2),
                        impact=impact,
                        urgency=urgency,
                        reason=reason,
                        source=data.get("source"),
                        blocking=blocking,
                    ),
                    priority_rank,
                    has_explicit_priority,
                )
            )

        prioritized.sort(
            key=lambda item: (
                self.BLOCKING_SCORES[item[0].blocking],
                item[1] if item[2] else 0,
                item[0].score,
            ),
            reverse=True,
        )

        return [
            item[0]
            for item in prioritized
        ]

    def rank_actions(
        self,
        actions: List[Any],
    ) -> List[PrioritizedAction]:
        return self.prioritize(actions)

    def prioritize_actions(
        self,
        actions: List[Any],
    ) -> List[PrioritizedAction]:
        return self.prioritize(actions)

    def _normalize(
        self,
        item: Any,
    ) -> Dict[str, Any]:
        if isinstance(item, dict):
            return item

        if hasattr(item, "to_dict"):
            value = item.to_dict()

            if isinstance(value, dict):
                return value

        if hasattr(item, "__dict__"):
            value = vars(item)

            if isinstance(value, dict):
                return value

        return {}

    def _level(
        self,
        value: Any,
    ) -> str:
        if value is None:
            return "MEDIUM"

        if isinstance(value, bool):
            return "CRITICAL" if value else "LOW"

        value = str(value).upper().strip()

        aliases = {
            "CRITICAL": "CRITICAL",
            "SEVERE": "CRITICAL",
            "HIGH": "HIGH",
            "IMPORTANT": "HIGH",
            "MEDIUM": "MEDIUM",
            "MODERATE": "MEDIUM",
            "LOW": "LOW",
            "MINOR": "LOW",
            "TRUE": "CRITICAL",
            "FALSE": "LOW",
            "BLOCKED": "CRITICAL",
            "BLOCKING": "CRITICAL",
            "NOT_BLOCKING": "LOW",
            "UNBLOCKED": "LOW",
        }

        return aliases.get(value, "MEDIUM")

    def _priority_from_score(
        self,
        score: float,
        blocking: str,
    ) -> str:
        if blocking == "CRITICAL":
            return "CRITICAL"

        if score >= 70:
            return "HIGH"

        if score >= 45:
            return "MEDIUM"

        return "LOW"

    def _build_reason(
        self,
        blocking: str,
        impact: str,
        urgency: str,
    ) -> str:
        return (
            f"{blocking} blocking, "
            f"{impact} impact, "
            f"{urgency} urgency"
        )


def prioritize_actions(
    actions: List[Any],
) -> List[Dict[str, Any]]:
    prioritizer = ActionPrioritizer()

    results = prioritizer.prioritize(actions)

    return [
        item.to_dict()
        for item in results
    ]