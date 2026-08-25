from src.logger import setup_logger
from src.models import NormalizedEvent
from typing import Dict, List

logger = setup_logger("EntityResolver")


class EntityResolver:
    """Resolve entity mentions across sources using 4-layer strategy."""

    def __init__(self):
        self.synonym_map = {
            "parser": ["resume parser", "parsing engine", "parse"],
            "api": ["rest api", "endpoint", "service"],
            "schema": ["data structure", "format", "model"],
            "test": ["testing", "unit test", "integration test"]
        }

    def resolve_entities(
        self, events: List[NormalizedEvent]
    ) -> Dict[str, List[str]]:
        """Map entity mentions to canonical entities."""
        entity_map = {}

        for event in events:
            for candidate in event.entity_candidates:

                # Layer 1: Exact match
                if candidate in entity_map:
                    entity_map[candidate].append(event.source_id)
                    continue

                # Layer 2: Normalized match
                normalized_candidate = self._normalize(candidate)
                found = False

                for existing_entity in entity_map:
                    if self._normalize(existing_entity) == normalized_candidate:
                        entity_map[existing_entity].append(event.source_id)
                        found = True
                        break

                if found:
                    continue

                # Layer 3: Semantic match
                semantic_match = self._find_semantic_match(candidate)

                if semantic_match:
                    if semantic_match not in entity_map:
                        entity_map[semantic_match] = []

                    entity_map[semantic_match].append(event.source_id)
                    continue

                # Layer 4: New entity
                entity_map[candidate] = [event.source_id]

        logger.info(f"Resolved {len(entity_map)} entities")
        return entity_map

    def _normalize(self, text: str) -> str:
        """Normalize text for comparison."""
        return text.lower().replace("-", "_").replace(" ", "_")

    def _find_semantic_match(self, candidate: str) -> str:
        """Find semantic match in synonym map."""
        candidate_lower = candidate.lower()

        for key, synonyms in self.synonym_map.items():
            if candidate_lower in [s.lower() for s in synonyms]:
                return key

        return None