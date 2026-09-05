from src.logger import setup_logger
from src.models import Blocker, WorkState
from typing import List


logger = setup_logger("BlockerIdentifier")


class BlockerIdentifier:
    """Identify work that is blocked and assess its downstream impact."""

    def identify_blockers(
        self,
        states: List[WorkState]
    ) -> List[Blocker]:
        """Find blocked work and determine its impact."""

        blockers = []

        for state in states:
            if state.state.value != "blocked":
                continue

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

        logger.info(
            f"Identified {len(blockers)} blockers"
        )

        return blockers

    def _assess_impact(
        self,
        entity: str,
        states: List[WorkState]
    ) -> str:
        """Assess how many incomplete tasks depend on the blocked entity."""

        canonical_entity = self._canonical_entity(entity)

        dependency_map = {
            "parser": {
                "review",
                "testing",
                "deployment",
                "validation",
            },
            "api": {
                "tests",
                "testing",
                "documentation",
                "deployment",
                "validation",
            },
            "api schema": {
                "tests",
                "testing",
                "documentation",
                "deployment",
                "validation",
            },
            "database": {
                "api",
                "testing",
                "deployment",
            },
            "authentication": {
                "api",
                "testing",
                "deployment",
            },
            "configuration": {
                "api",
                "testing",
                "deployment",
            },
        }

        dependent_entities = dependency_map.get(
            canonical_entity,
            set()
        )

        dependents = []

        for state in states:
            if state.state.value == "complete":
                continue

            candidate_entity = self._canonical_entity(
                state.entity
            )

            if candidate_entity in dependent_entities:
                dependents.append(state)

        if len(dependents) >= 2:
            return (
                f"Blocks {len(dependents)} downstream tasks "
                "(HIGH IMPACT)"
            )

        if len(dependents) == 1:
            return "Blocks 1 downstream task"

        return "No direct dependents identified"

    def _canonical_entity(self, entity: str) -> str:
        """Normalize entity names for dependency matching."""

        value = entity.strip().lower()

        aliases = {
            "api schema": "api schema",
            "api-schema": "api schema",
            "apischema": "api schema",
            "parser": "parser",
            "input parser": "parser",
            "inputparser": "parser",
            "review": "review",
            "code review": "review",
            "testing": "testing",
            "tests": "testing",
            "test": "testing",
            "deployment": "deployment",
            "deploy": "deployment",
            "validation": "validation",
            "database": "database",
            "db": "database",
            "authentication": "authentication",
            "auth": "authentication",
            "configuration": "configuration",
            "config": "configuration",
            "documentation": "documentation",
            "docs": "documentation",
            "api": "api",
        }

        return aliases.get(value, value)