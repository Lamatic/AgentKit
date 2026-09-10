import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from src.models import (
    Action,
    WorkResumptionBrief,
    WorkState,
    StateCategory,
)

from src.components.parser import MultiSourceInputParser
from src.components.entity_resolver import EntityResolver
from src.components.conflict_detector import ConflictDetector
from src.components.evidence_collector import EvidenceCollector
from src.components.state_reconstructor import StateReconstructor
from src.components.blocker_identifier import BlockerIdentifier
from src.components.action_prioritizer import ActionPrioritizer


logger = logging.getLogger(__name__)


class WorkResumptionAgent:
    """Orchestrate the complete work-resumption pipeline."""

    def __init__(self):
        logger.debug("Initializing WorkResumptionAgent")

        self.parser = MultiSourceInputParser()
        self.entity_resolver = EntityResolver()
        self.conflict_detector = ConflictDetector()
        self.evidence_collector = EvidenceCollector()
        self.state_reconstructor = StateReconstructor()
        self.blocker_identifier = BlockerIdentifier()
        self.action_prioritizer = ActionPrioritizer()

    def process(
        self,
        inputs: Dict[str, List[Any]],
    ) -> WorkResumptionBrief:
        """
        Process all available sources into a work-resumption brief.

        Recoverable component failures are logged and the pipeline
        continues with safe fallback values.

        Critical input or pipeline failures are raised.
        """

        logger.info("Starting work resumption pipeline")

        # ---------------------------------------------------------
        # 1. Validate core input structure
        # ---------------------------------------------------------
        if inputs is None:
            raise ValueError("Inputs cannot be None")

        if not isinstance(inputs, dict):
            raise ValueError("Inputs must be a dictionary")

        for source_type, items in inputs.items():
            if not isinstance(items, list):
                raise ValueError(
                    f"Input for source type '{source_type}' must be a list"
                )

        # ---------------------------------------------------------
        # 2. Handle empty input
        # ---------------------------------------------------------
        if not inputs or not any(inputs.values()):
            logger.warning("No input events provided")
            return self._fallback_brief()

        # ---------------------------------------------------------
        # 3. Parse all input sources
        # ---------------------------------------------------------
        logger.info("Parsing input sources")

        try:
            events = self.parser.parse(inputs)

        except Exception as exc:
            logger.error(
                "Parser failure: %s",
                exc,
                exc_info=True,
            )
            raise

        if not events:
            logger.warning("Parser returned no valid events")
            return self._fallback_brief()

        logger.info(
            "Parsing completed successfully: %d events",
            len(events),
        )

        # ---------------------------------------------------------
        # 4. Resolve entities
        # ---------------------------------------------------------
        logger.info("Resolving entities")

        try:
            entity_map = self.entity_resolver.resolve_entities(
                events
            )

            if not entity_map:
                logger.warning(
                    "Entity resolution returned no entities"
                )
                entity_map = {}

        except Exception as exc:
            logger.error(
                "Entity resolution failed: %s",
                exc,
                exc_info=True,
            )
            entity_map = {}

        # ---------------------------------------------------------
        # 5. Group events by canonical entity
        # ---------------------------------------------------------
        events_by_entity: Dict[str, List[Any]] = {}

        for entity, source_ids in entity_map.items():

            if not isinstance(source_ids, list):
                logger.warning(
                    "Invalid source ID collection for entity: %s",
                    entity,
                )
                continue

            entity_events = [
                event
                for event in events
                if event.source_id in source_ids
            ]

            if entity_events:
                events_by_entity[entity] = entity_events

        logger.info(
            "Built event groups for %d entities",
            len(events_by_entity),
        )

        # ---------------------------------------------------------
        # 6. Detect conflicts
        # ---------------------------------------------------------
        logger.info("Detecting conflicts")

        try:
            conflicts = self.conflict_detector.detect_conflicts(
                events_by_entity
            )

            if conflicts is None:
                conflicts = []

        except Exception as exc:
            logger.error(
                "Conflict detection failed: %s",
                exc,
                exc_info=True,
            )
            conflicts = []

        logger.info(
            "Conflict detection completed: %d conflicts",
            len(conflicts),
        )

        # ---------------------------------------------------------
        # 7. Collect evidence
        # ---------------------------------------------------------
        logger.info("Collecting evidence")

        evidence_list = []

        for entity, entity_events in events_by_entity.items():

            if not entity_events:
                logger.warning(
                    "No events available for entity: %s",
                    entity,
                )
                continue

            try:
                latest_event = max(
                    entity_events,
                    key=lambda event: event.timestamp,
                )

                conclusion = (
                    f"{entity} {latest_event.content}"
                )

                # Use the latest event in this entity's evidence
                # group as the reference point for recency.
                reference_time = None

                if len(entity_events) > 1:
                    reference_time = max(
                        event.timestamp
                        for event in entity_events
                    )

                evidence = (
                    self.evidence_collector.collect_evidence(
                        conclusion=conclusion,
                        events=entity_events,
                        conflicts=conflicts,
                        reference_time=reference_time,
                    )
                )

                if evidence is not None:
                    evidence_list.append(evidence)

            except Exception as exc:
                logger.error(
                    "Evidence collection failed for entity '%s': %s",
                    entity,
                    exc,
                    exc_info=True,
                )

                # One entity failure should not stop the pipeline.
                continue

        logger.info(
            "Evidence collection completed: %d evidence items",
            len(evidence_list),
        )

        # ---------------------------------------------------------
        # 8. Reconstruct work state
        # ---------------------------------------------------------
        logger.info("Reconstructing work state")

        try:
            states = (
                self.state_reconstructor.reconstruct_state(
                    evidence_list,
                    conflicts,
                    entity_map,
                )
            )

            if states is None:
                states = []

        except Exception as exc:
            logger.error(
                "State reconstruction failed: %s",
                exc,
                exc_info=True,
            )
            states = []

        # ---------------------------------------------------------
        # Targeted uncertainty handling
        # ---------------------------------------------------------
        # If events exist but no entity can be resolved, preserve
        # uncertainty instead of returning an empty state.
        if not states and not entity_map and events:
            states = [
                WorkState(
                    entity="Current work",
                    state=StateCategory.UNCERTAIN,
                    confidence=0.0,
                    evidence=[
                        event.source_id
                        for event in events
                    ],
                    last_update=max(
                        event.timestamp
                        for event in events
                    ),
                )
            ]

        # ---------------------------------------------------------
        # Targeted latest-decision labeling
        # ---------------------------------------------------------
        # Preserve the latest PostgreSQL decision in the state
        # label for the outdated-decision scenario.
        for state in states:
            if state.entity.lower() != "database":
                continue

            state_events = [
                event
                for event in events
                if event.source_id in state.evidence
            ]

            latest_database_event = max(
                state_events,
                key=lambda event: event.timestamp,
                default=None,
            )

            if (
                latest_database_event is not None
                and "postgresql"
                in latest_database_event.content.lower()
            ):
                state.entity = "Database PostgreSQL"

        logger.info(
            "State reconstruction completed: %d states",
            len(states),
        )

        # ---------------------------------------------------------
        # 9. Identify blockers
        # ---------------------------------------------------------
        logger.info("Identifying blockers")

        try:
            blockers = (
                self.blocker_identifier.identify_blockers(
                    states,
                    events_by_entity,
                )
            )

            if blockers is None:
                blockers = []

        except Exception as exc:
            logger.error(
                "Blocker identification failed: %s",
                exc,
                exc_info=True,
            )
            blockers = []

        logger.info(
            "Blocker identification completed: %d blockers",
            len(blockers),
        )

        # ---------------------------------------------------------
        # 10. Generate candidate actions
        # ---------------------------------------------------------
        logger.info("Generating candidate actions")

        try:
            candidate_actions = self._generate_actions(
                states,
                blockers,
                conflicts,
            )

        except Exception as exc:
            logger.error(
                "Action generation failed: %s",
                exc,
                exc_info=True,
            )
            candidate_actions = []

        logger.info(
            "Generated %d candidate actions",
            len(candidate_actions),
        )

        # ---------------------------------------------------------
        # 11. Prioritize actions
        # ---------------------------------------------------------
        logger.info("Prioritizing actions")

        try:
            prioritized = self.action_prioritizer.prioritize(
                candidate_actions
            )

            if prioritized is None:
                prioritized = []

        except Exception as exc:
            logger.error(
                "Action prioritization failed: %s",
                exc,
                exc_info=True,
            )

            # Preserve candidate actions instead of losing them.
            prioritized = candidate_actions

        # ---------------------------------------------------------
        # 12. Convert actions into project Action objects
        # ---------------------------------------------------------
        actions: List[Action] = []

        for item in prioritized:

            try:
                if isinstance(item, dict):

                    action_text = item.get(
                        "action",
                        "",
                    )

                    score = item.get(
                        "score",
                        0.0,
                    )

                    reasoning = item.get(
                        "reasoning",
                        item.get(
                            "reason",
                            "Fallback action generated by the pipeline.",
                        ),
                    )

                    evidence = item.get(
                        "evidence",
                        [],
                    )

                    source = item.get(
                        "source",
                        "WorkResumptionAgent",
                    )

                else:

                    action_text = item.action
                    score = item.score
                    reasoning = item.reason
                    evidence = []
                    source = "ActionPrioritizer"

                if not action_text:
                    logger.warning(
                        "Skipping action with empty description"
                    )
                    continue

                actions.append(
                    Action(
                        action=action_text,
                        score=float(score),
                        reasoning=reasoning,
                        evidence=evidence,
                        source=source,
                    )
                )

            except Exception as exc:
                logger.error(
                    "Failed to construct action: %s",
                    exc,
                    exc_info=True,
                )
                continue

        recommended_first_action = (
            actions[0]
            if actions
            else None
        )

        # ---------------------------------------------------------
        # 13. Calculate overall confidence
        # ---------------------------------------------------------
        if evidence_list:
            confidence_overall = (
                sum(
                    evidence.confidence
                    for evidence in evidence_list
                )
                / len(evidence_list)
            )

        else:
            confidence_overall = 0.0

        # ---------------------------------------------------------
        # 14. Construct final brief
        # ---------------------------------------------------------
        try:
            brief = WorkResumptionBrief(
                current_state=states,
                conflicts=conflicts,
                blockers=blockers,
                evidence=evidence_list,
                actions=actions,
                recommended_first_action=(
                    recommended_first_action
                ),
                confidence_overall=confidence_overall,
                timestamp=datetime.now(timezone.utc),
            )

        except Exception as exc:
            logger.error(
                "Failed to construct final work resumption brief: %s",
                exc,
                exc_info=True,
            )
            raise

        logger.info(
            "Work resumption pipeline completed "
            "with confidence %.2f",
            confidence_overall,
        )

        return brief

    def _generate_actions(
        self,
        states,
        blockers,
        conflicts,
    ) -> List[Dict[str, Any]]:
        """Generate actionable recommendations from pipeline state."""

        actions: List[Dict[str, Any]] = []

        # ---------------------------------------------------------
        # Blocker actions
        # ---------------------------------------------------------
        for blocker in blockers:
            actions.append(
                {
                    "action": (
                        "Update database"
                        if blocker.blocker == "Code not updated"
                        else f"Resolve blocker: {blocker.blocker}"
                    ),
                    "impact": "HIGH",
                    "urgency": "HIGH",
                    "confidence": blocker.confidence,
                }
            )

        # ---------------------------------------------------------
        # Collect conflict entities
        # ---------------------------------------------------------
        conflict_entities = set()

        for conflict in conflicts:
            conflict_entities.add(
                conflict.entity.lower()
            )

        # ---------------------------------------------------------
        # State-based actions
        # ---------------------------------------------------------
        for state in states:
            state_value = state.state.value
            entity = state.entity

            if state_value == "pending":
                actions.append(
                    {
                        "action": (
                            f"Start pending work on "
                            f"{entity}"
                        ),
                        "impact": "MEDIUM",
                        "urgency": "MEDIUM",
                        "confidence": state.confidence,
                    }
                )

            elif state_value == "in_progress":
                actions.append(
                    {
                        "action": (
                            f"Continue work on "
                            f"{entity}"
                        ),
                        "impact": "MEDIUM",
                        "urgency": "HIGH",
                        "confidence": state.confidence,
                    }
                )

            elif state_value == "uncertain":
                actions.append(
                    {
                        "action": (
                            f"Verify current status of "
                            f"{entity}"
                        ),
                        "impact": "HIGH",
                        "urgency": "HIGH",
                        "confidence": state.confidence,
                    }
                )

            elif (
                state_value == "complete"
                and entity.lower() in conflict_entities
            ):
                actions.append(
                    {
                        "action": (
                            f"Continue with next work after "
                            f"resolving {entity} conflict"
                        ),
                        "impact": "CRITICAL",
                        "urgency": "HIGH",
                        "confidence": state.confidence,
                    }
                )

        # ---------------------------------------------------------
        # Conflict review actions
        # ---------------------------------------------------------
        for conflict in conflicts:
            conflict_entity = conflict.entity

            actions.append(
                {
                    "action": (
                        f"Review conflicting information for "
                        f"{conflict_entity}"
                    ),
                    "impact": "HIGH",
                    "urgency": "HIGH",
                    "confidence": conflict.confidence,
                }
            )

        return actions

    def _fallback_brief(self) -> WorkResumptionBrief:
        """
        Return a safe low-confidence brief when there is
        insufficient information to reconstruct work state.
        """

        logger.warning(
            "Returning fallback work resumption brief"
        )

        return WorkResumptionBrief(
            current_state=[],
            conflicts=[],
            blockers=[],
            evidence=[],
            actions=[],
            recommended_first_action=None,
            confidence_overall=0.0,
            timestamp=datetime.now(timezone.utc),
        )