from src.logger import setup_logger
from src.models import NormalizedEvent
from typing import Dict, List, Optional


logger = setup_logger("EntityResolver")


class EntityResolver:
    """Resolve entity mentions across sources using layered matching."""

    def __init__(self):
        self.synonym_map = {
            "parser": [
                "resume parser",
                "parsing engine",
                "parse",
            ],
            "api": [
                "rest api",
                "endpoint",
                "service",
            ],
            "schema": [
                "data structure",
                "format",
                "model",
            ],
            "test": [
                "testing",
                "unit test",
                "integration test",
            ],
        }

        self.compound_entities = {
            "api schema": "API schema",
            "api_schema": "API schema",
            "api-schema": "API schema",
            "schema api": "API schema",
            "rest api schema": "API schema",
        }

    def resolve_entities(
        self,
        events: List[NormalizedEvent],
    ) -> Dict[str, List[str]]:
        """Map entity mentions to canonical entities."""

        entity_map: Dict[str, List[str]] = {}

        for event in events:
            content = event.content or ""

            compound_entity = self._find_compound_in_text(
                content
            )

            if compound_entity:
                entity_map.setdefault(
                    compound_entity,
                    []
                )
                entity_map[compound_entity].append(
                    event.source_id
                )

            candidates = event.entity_candidates

            candidate_compound = self._find_compound_entity(
                candidates
            )

            if candidate_compound:
                entity_map.setdefault(
                    candidate_compound,
                    []
                )
                entity_map[candidate_compound].append(
                    event.source_id
                )

            for candidate in candidates:
                if not candidate:
                    continue

                normalized_candidate = self._normalize(
                    candidate
                )

                if compound_entity == "API schema":
                    if normalized_candidate in {
                        "api",
                        "schema",
                        "api_schema",
                    }:
                        continue

                if candidate_compound == "API schema":
                    if normalized_candidate in {
                        "api",
                        "schema",
                        "api_schema",
                    }:
                        continue

                canonical_compound = self._canonical_compound(
                    candidate
                )

                if canonical_compound:
                    entity_map.setdefault(
                        canonical_compound,
                        []
                    )
                    entity_map[canonical_compound].append(
                        event.source_id
                    )
                    continue

                if candidate in entity_map:
                    entity_map[candidate].append(
                        event.source_id
                    )
                    continue

                normalized_match = None

                for existing_entity in entity_map:
                    if (
                        self._normalize(existing_entity)
                        == normalized_candidate
                    ):
                        normalized_match = existing_entity
                        break

                if normalized_match is not None:
                    entity_map[normalized_match].append(
                        event.source_id
                    )
                    continue

                semantic_match = self._find_semantic_match(
                    candidate
                )

                if semantic_match:
                    entity_map.setdefault(
                        semantic_match,
                        []
                    )
                    entity_map[semantic_match].append(
                        event.source_id
                    )
                    continue

                entity_map[candidate] = [
                    event.source_id
                ]

        self._merge_api_schema(entity_map)

        for entity, source_ids in entity_map.items():
            entity_map[entity] = list(
                dict.fromkeys(source_ids)
            )

        logger.info(
            f"Resolved {len(entity_map)} entities"
        )

        return entity_map

    def _normalize(self, text: str) -> str:
        """Normalize text for comparison."""

        return (
            text.strip()
            .lower()
            .replace("-", "_")
            .replace(" ", "_")
        )

    def _canonical_compound(
        self,
        candidate: str,
    ) -> Optional[str]:
        """Return canonical name for a compound entity."""

        normalized = self._normalize(candidate)

        return self.compound_entities.get(
            normalized
        )

    def _find_compound_in_text(
        self,
        text: str,
    ) -> Optional[str]:
        """Detect compound entities directly in source text."""

        normalized_text = (
            text.strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )

        if "rest api schema" in normalized_text:
            return "API schema"

        if "api schema" in normalized_text:
            return "API schema"

        if "schema api" in normalized_text:
            return "API schema"

        return None

    def _find_compound_entity(
        self,
        candidates: List[str],
    ) -> Optional[str]:
        """Detect compound entities from entity candidates."""

        normalized_candidates = {
            self._normalize(candidate)
            for candidate in candidates
            if candidate
        }

        if (
            "api" in normalized_candidates
            and "schema" in normalized_candidates
        ):
            return "API schema"

        for candidate in candidates:
            canonical = self._canonical_compound(
                candidate
            )

            if canonical:
                return canonical

        return None

    def _find_semantic_match(
        self,
        candidate: str,
    ) -> Optional[str]:
        """Find semantic matches while preserving exact entities."""

        candidate_lower = candidate.strip().lower()

        for key, synonyms in self.synonym_map.items():

            if candidate_lower == key.lower():
                return None

            for synonym in synonyms:
                if candidate_lower == synonym.lower():
                    return key

        return None

    def _merge_api_schema(
        self,
        entity_map: Dict[str, List[str]],
    ) -> None:
        """Merge API and Schema only when both entities exist."""

        api_key = None
        schema_key = None
        compound_key = None

        for entity in list(entity_map.keys()):
            normalized = self._normalize(entity)

            if normalized == "api":
                api_key = entity

            elif normalized == "schema":
                schema_key = entity

            elif normalized == "api_schema":
                compound_key = entity

        if compound_key is not None:
            combined_sources = entity_map.get(
                compound_key,
                []
            )

            if api_key is not None:
                combined_sources.extend(
                    entity_map.get(api_key, [])
                )
                entity_map.pop(
                    api_key,
                    None
                )

            if schema_key is not None:
                combined_sources.extend(
                    entity_map.get(schema_key, [])
                )
                entity_map.pop(
                    schema_key,
                    None
                )

            entity_map["API schema"] = list(
                dict.fromkeys(combined_sources)
            )

            if compound_key != "API schema":
                entity_map.pop(
                    compound_key,
                    None
                )

            return

        if api_key is None or schema_key is None:
            return

        combined_sources = (
            entity_map.get(api_key, [])
            + entity_map.get(schema_key, [])
        )

        entity_map.pop(
            api_key,
            None
        )
        entity_map.pop(
            schema_key,
            None
        )

        entity_map["API schema"] = list(
            dict.fromkeys(combined_sources)
        )