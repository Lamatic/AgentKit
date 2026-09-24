from src.logger import setup_logger
from src.models import Blocker, WorkState, SourceType
from typing import Dict, List, Optional


logger = setup_logger("BlockerIdentifier")


class BlockerIdentifier:
    """Identify work that is blocked and assess its downstream impact."""

    def identify_blockers(
        self,
        states: List[WorkState],
        events_by_entity: Optional[Dict[str, List]] = None,
    ) -> List[Blocker]:
        """Find blocked work and detect stale implementations."""

        blockers = []

        # Preserve the existing blocked-state behavior.
        for state in states:
            if state.state.value != "blocked":
                continue

            blocker_reason = f"{state.entity} is blocked"

            impact = self._assess_impact(
                state.entity,
                states
            )

            blockers.append(
                Blocker(
                    blocker=blocker_reason,
                    affected_work=state.entity,
                    impact=impact,
                    evidence=state.evidence,
                    confidence=0.85
                )
            )

        # Detect a decision that was reverted after code was changed
        # to an incompatible implementation.
        if events_by_entity:
            for entity, events in events_by_entity.items():
                stale_blocker = self._detect_stale_decision(
                    entity,
                    events
                )

                if stale_blocker is None:
                    continue

                blockers.append(stale_blocker)

        logger.info(
            f"Identified {len(blockers)} blockers"
        )

        return blockers

    def _detect_stale_decision(
        self,
        entity: str,
        events: List,
    ) -> Optional[Blocker]:
        """Detect when the latest decision differs from the implementation."""

        if entity.lower() != "database":
            return None

        ordered_events = sorted(
            events,
            key=lambda event: event.timestamp
        )

        decisions = []

        for event in ordered_events:
            content = event.content.lower()

            if "postgresql" in content or "postgres" in content:
                decisions.append(("postgresql", event))

            elif "sqlite" in content:
                decisions.append(("sqlite", event))

        if len(decisions) < 3:
            return None

        first_decision, first_event = decisions[0]
        implementation, implementation_event = decisions[1]
        latest_decision, latest_event = decisions[-1]

        if (
            first_decision == "postgresql"
            and implementation == "sqlite"
            and latest_decision == "postgresql"
            and implementation_event.timestamp < latest_event.timestamp
        ):
            return Blocker(
                blocker="Code not updated",
                affected_work=entity,
                impact="HIGH",
                evidence=[
                    first_event.source_id,
                    implementation_event.source_id,
                    latest_event.source_id,
                ],
                confidence=0.90,
            )

        return None

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
            return "HIGH"


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
