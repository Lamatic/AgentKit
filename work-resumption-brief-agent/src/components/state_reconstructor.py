from src.logger import setup_logger
from src.models import WorkState, Evidence, Conflict, StateCategory
from typing import List

logger = setup_logger("StateReconstructor")


class StateReconstructor:
    """Reconstruct work state from evidence."""

    def reconstruct_state(
        self,
        evidence_list: List[Evidence],
        conflicts: List[Conflict]
    ) -> List[WorkState]:
        """Combine evidence and conflicts into work states."""

        states = []

        entity_evidence = {}

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

            if avg_confidence > 80:
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
                last_update=None
            )

            states.append(work_state)

        logger.info(f"Reconstructed {len(states)} work states")

        return states

    def _extract_entities(self, conclusion: str) -> List[str]:
        """Extract entity names from conclusion."""

        words = conclusion.split()

        entities = [
            word
            for word in words
            if word and word[0].isupper()
        ]

        return list(set(entities[:2]))