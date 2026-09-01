from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional


@dataclass
class PrioritizedAction:
    action: str
    priority: str
    score: float
    impact: str
    urgency: str
    reason: str
    source: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ActionPrioritizer:
    PRIORITY_SCORES = {
        "CRITICAL": 100,
        "HIGH": 80,
        "MEDIUM": 60,
        "LOW": 40,
    }

    IMPACT_SCORES = {
        "CRITICAL": 40,
        "HIGH": 30,
        "MEDIUM": 20,
        "LOW": 10,
    }

    URGENCY_SCORES = {
        "CRITICAL": 30,
        "HIGH": 25,
        "MEDIUM": 15,
        "LOW": 5,
    }

    def prioritize(self, actions: List[Any]) -> List[PrioritizedAction]:
        prioritized = []

        for item in actions:
            data = self._normalize(item)

            action = data["action"]

            impact = self._level(data.get("impact"))
            urgency = self._level(data.get("urgency"))

            explicit_priority = data.get("priority")

            impact_score = self.IMPACT_SCORES[impact]
            urgency_score = self.URGENCY_SCORES[urgency]

            confidence = self._confidence(data.get("confidence"))

            base_score = (
                impact_score
                + urgency_score
                + (confidence * 30)
            )

            if explicit_priority is not None:
                priority = self._level(explicit_priority)

                priority_score = self.PRIORITY_SCORES[priority]

                score = min(
                    100.0,
                    (priority_score * 0.6)
                    + (base_score * 0.4),
                )
            else:
                score = min(100.0, base_score)

                if impact == "CRITICAL" or urgency == "CRITICAL":
                    priority = "CRITICAL"
                elif score >= 70:
                    priority = "HIGH"
                elif score >= 45:
                    priority = "MEDIUM"
                else:
                    priority = "LOW"

            reason = self._build_reason(
                impact=impact,
                urgency=urgency,
                confidence=confidence,
            )

            prioritized.append(
                PrioritizedAction(
                    action=action,
                    priority=priority,
                    score=round(score, 2),
                    impact=impact,
                    urgency=urgency,
                    reason=reason,
                    source=data.get("source"),
                )
            )

        prioritized.sort(
            key=lambda item: (
                self.PRIORITY_SCORES[item.priority],
                item.score,
            ),
            reverse=True,
        )

        return prioritized

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

    def _normalize(self, item: Any) -> Dict[str, Any]:
        if isinstance(item, dict):
            return item

        if hasattr(item, "to_dict"):
            value = item.to_dict()

            if isinstance(value, dict):
                return value

        if hasattr(item, "__dict__"):
            return vars(item)

        return {
            "action": str(item),
            "impact": "MEDIUM",
            "urgency": "MEDIUM",
            "confidence": 0.5,
        }

    def _level(self, value: Any) -> str:
        if value is None:
            return "MEDIUM"

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
        }

        return aliases.get(value, "MEDIUM")

    def _confidence(self, value: Any) -> float:
        try:
            confidence = float(value)
        except (TypeError, ValueError):
            return 0.5

        if confidence > 1:
            confidence = confidence / 100

        return max(0.0, min(1.0, confidence))

    def _build_reason(
        self,
        impact: str,
        urgency: str,
        confidence: float,
    ) -> str:
        return (
            f"{impact} impact, {urgency} urgency, "
            f"{round(confidence * 100)}% confidence"
        )


def prioritize_actions(
    actions: List[Any],
) -> List[Dict[str, Any]]:
    prioritizer = ActionPrioritizer()
    results = prioritizer.prioritize(actions)

    return [item.to_dict() for item in results]