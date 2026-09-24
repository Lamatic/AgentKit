from typing import Dict, List, Optional

from src.logger import setup_logger
from src.models import WorkState, Evidence, Conflict, StateCategory


logger = setup_logger("StateReconstructor")


class StateReconstructor:
    """Reconstruct work state from evidence."""

    def reconstruct_state(
        self,
        evidence_list: List[Evidence],
        conflicts: List[Conflict],
        entity_map: Optional[Dict[str, List[str]]] = None,
    ) -> List[WorkState]:
        """Combine evidence and conflicts into work states."""

        states = []
        entity_evidence = {}

        # When the agent provides the canonical entity map, preserve
        # those entity names instead of extracting names from conclusions.
        if entity_map:
            for entity, source_ids in entity_map.items():

                if not isinstance(source_ids, list):
                    logger.warning(
                        f"Invalid source ID collection for entity: {entity}"
                    )
                    continue

                entity_events = [
                    evidence
                    for evidence in evidence_list
                    if any(
                        source_id in evidence.sources
                        for source_id in source_ids
                    )
                ]

                if entity_events:
                    entity_evidence[entity] = entity_events

        # Preserve the original standalone behavior used by the
        # StateReconstructor unit tests.
        else:
            for evidence in evidence_list:
                for entity in self._extract_entities(evidence.conclusion):
                    if entity not in entity_evidence:
                        entity_evidence[entity] = []

                    entity_evidence[entity].append(evidence)

        for entity, evidence_set in entity_evidence.items():

            avg_confidence = (
                sum(e.confidence for e in evidence_set) / len(evidence_set)
                if evidence_set
                else 0
            )

            conclusions = [
                evidence.conclusion.lower()
                for evidence in evidence_set
            ]

            blocker_terms = (
                "blocked",
                "unresolved",
                "not finalized",
                "failing",
                "missing",
                "incomplete",
            )

            has_blocker_evidence = any(
                any(term in conclusion for term in blocker_terms)
                for conclusion in conclusions
            )

            if has_blocker_evidence:
                state_category = StateCategory.BLOCKED

            elif avg_confidence > 80:
                state_category = StateCategory.COMPLETE

            elif avg_confidence > 60:
                state_category = StateCategory.IN_PROGRESS

            elif any(c.entity == entity for c in conflicts):
                state_category = StateCategory.UNCERTAIN

            else:
                state_category = StateCategory.PENDING

            all_sources = []

            for evidence in evidence_set:
                all_sources.extend(evidence.sources)

            work_state = WorkState(
                entity=entity,
                state=state_category,
                confidence=avg_confidence,
                evidence=list(set(all_sources)),
                last_update=None,
            )

            states.append(work_state)

        logger.info(
            f"Reconstructed {len(states)} work states"
        )

        return states

    def _extract_entities(self, conclusion: str) -> List[str]:
        """Extract entity names from conclusion."""

        words = conclusion.split()

        # Preserve compound API schema entity names.
        if (
            len(words) >= 2
            and words[0].lower() == "api"
            and words[1].lower() == "schema"
        ):
            return ["API schema"]

        entities = []

        for word in words:
            cleaned = word.strip(".,!?;:()[]{}\"'")

            if cleaned and cleaned[0].isupper():
                entities.append(cleaned)

        return entities[:2]