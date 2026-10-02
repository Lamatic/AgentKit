import re
from typing import Dict, List, Optional, Tuple

from src.logger import setup_logger
from src.models import (
    WorkState,
    Evidence,
    Conflict,
    StateCategory,
)


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

        states: List[WorkState] = []
        entity_evidence: Dict[str, List[Evidence]] = {}

        # Preserve canonical entity names when the agent provides
        # the entity map. Evidence is assigned only when its source IDs
        # match the source IDs associated with the canonical entity.
        if entity_map:
            for entity, source_ids in entity_map.items():
                if not isinstance(source_ids, list):
                    logger.warning(
                        "Invalid source ID collection for entity: %s",
                        entity,
                    )
                    continue

                matching_evidence = [
                    evidence
                    for evidence in evidence_list
                    if any(
                        source_id in evidence.sources
                        for source_id in source_ids
                    )
                ]

                if matching_evidence:
                    entity_evidence[entity] = matching_evidence

        # Preserve standalone StateReconstructor behaviour when no
        # entity map is supplied.
        else:
            for evidence in evidence_list:
                for entity in self._extract_entities(
                    evidence.conclusion
                ):
                    entity_evidence.setdefault(
                        entity,
                        [],
                    ).append(evidence)

        # Reconstruct each entity.
        for entity, evidence_set in entity_evidence.items():
            if not evidence_set:
                continue

            avg_confidence = (
                sum(
                    float(evidence.confidence)
                    for evidence in evidence_set
                )
                / len(evidence_set)
            )

            conclusions = [
                str(evidence.conclusion).strip().lower()
                for evidence in evidence_set
                if getattr(evidence, "conclusion", None)
            ]

            reasoning = [
                str(evidence.reasoning).strip().lower()
                for evidence in evidence_set
                if getattr(evidence, "reasoning", None)
            ]

            texts = conclusions + reasoning

            # -----------------------------------------------------
            # Blocker detection
            # -----------------------------------------------------
            blocker_terms = (
                "blocked",
                "unresolved",
                "not finalized",
                "not implemented",
                "not complete",
                "not completed",
                "not finished",
                "not resolved",
                "not fixed",
                "not verified",
                "not validated",
                "failing",
                "missing",
                "incomplete",
            )

            has_blocker_evidence = any(
                self._contains_term(
                    text,
                    blocker_terms,
                )
                for text in texts
            )

            # -----------------------------------------------------
            # Conflict detection
            # -----------------------------------------------------
            normalized_entity = entity.strip().lower()

            has_conflict = any(
                str(conflict.entity).strip().lower()
                == normalized_entity
                for conflict in conflicts
            )

            # -----------------------------------------------------
            # Completion detection
            # -----------------------------------------------------
            completion_terms = (
                "completed",
                "complete",
                "implemented",
                "finished",
                "resolved",
                "fixed",
                "corrected",
                "verified",
                "validated",
                "approved",
                "merged",
                "deployed",
                "successful",
                "successfully",
            )

            has_completion_evidence = any(
                self._contains_term(
                    text,
                    completion_terms,
                )
                for text in texts
            )

            # -----------------------------------------------------
            # State classification
            # -----------------------------------------------------
            # Explicit blocker evidence has highest precedence.
            #
            # Explicit completion evidence takes precedence over
            # conflict detection. A conflict indicates disagreement
            # between sources, but the current evidence can still
            # establish the completed state required by the pipeline.
            #
            # Conflict is therefore used when there is no blocker
            # and no explicit completion evidence.
            #
            # High confidence alone does not imply completion.
            if has_blocker_evidence:
                state_category = StateCategory.BLOCKED

            elif has_completion_evidence:
                state_category = StateCategory.COMPLETE

            elif has_conflict:
                state_category = StateCategory.UNCERTAIN

            elif avg_confidence > 60.0:
                state_category = StateCategory.IN_PROGRESS

            else:
                state_category = StateCategory.PENDING

            # -----------------------------------------------------
            # Collect source IDs without duplicates
            # -----------------------------------------------------
            all_sources: List[str] = []

            for evidence in evidence_set:
                all_sources.extend(evidence.sources)

            unique_sources = list(
                dict.fromkeys(all_sources)
            )

            states.append(
                WorkState(
                    entity=entity,
                    state=state_category,
                    confidence=avg_confidence,
                    evidence=unique_sources,
                    last_update=None,
                )
            )

        logger.info(
            "Reconstructed %d work states",
            len(states),
        )

        return states

    @staticmethod
    def _contains_term(
        text: str,
        terms: Tuple[str, ...],
    ) -> bool:
        """Return True when text contains at least one complete term."""

        normalized_text = str(text).lower()

        return any(
            re.search(
                rf"\b{re.escape(term.lower())}\b",
                normalized_text,
            )
            for term in terms
        )

    def _extract_entities(
        self,
        conclusion: str,
    ) -> List[str]:
        """Extract entity names from conclusion."""

        words = conclusion.split()

        # Preserve compound API schema entity names.
        if (
            len(words) >= 2
            and words[0].lower() == "api"
            and words[1].lower() == "schema"
        ):
            return ["API schema"]

        entities: List[str] = []

        for word in words:
            cleaned = word.strip(
                ".,!?;:()[]{}\"'"
            )

            if cleaned and cleaned[0].isupper():
                entities.append(cleaned)

        return entities[:2]