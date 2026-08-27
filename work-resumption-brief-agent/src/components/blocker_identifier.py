from src.logger import setup_logger
from src.models import Blocker, WorkState
from typing import List

logger = setup_logger("BlockerIdentifier")


class BlockerIdentifier:
    """Identify what prevents progress."""

    def identify_blockers(self, states: List[WorkState]) -> List[Blocker]:
        """Find what prevents progress."""

        blockers = []

        for state in states:
            if state.state.value == "blocked":
                blocker_reason = f"{state.entity} is blocked"

                impact = self._assess_impact(
                    state.entity,
                    states
                )

                blocker = Blocker(
                    blocker=blocker_reason,
                    affected_work=state.entity,
                    impact=impact,
                    evidence=state.evidence,
                    confidence=0.85
                )

                blockers.append(blocker)

        logger.info(f"Identified {len(blockers)} blockers")

        return blockers

    def _assess_impact(
        self,
        entity: str,
        states: List[WorkState]
    ) -> str:
        """Assess how many things depend on this."""

        dependents = [
            state
            for state in states
            if state.entity > entity
            and state.state.value != "complete"
        ]

        if len(dependents) > 2:
            return (
                f"Blocks {len(dependents)} downstream tasks "
                "(HIGH IMPACT)"
            )

        elif len(dependents) > 0:
            return f"Blocks {len(dependents)} downstream task(s)"

        else:
            return "No direct dependents identified"