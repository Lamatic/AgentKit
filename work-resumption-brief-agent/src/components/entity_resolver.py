from src.logger import setup_logger
from src.models import NormalizedEvent
from typing import Dict, List, Optional


logger = setup_logger("EntityResolver")


class EntityResolver:
    """Resolve entity mentions across sources using layered matching."""

    GENERIC_CANDIDATES = {
        "use",
        "using",
        "switch",
        "switching",
        "going",
        "back",
        "start",
        "starting",
        "improve",
        "improving",
        "fix",
        "fixing",
        "blocks",
        "block",
        "add",
        "adding",
        "work",
        "in",
        "on",
        "to",
        "the",
        "a",
        "an",
        "decision",
    }

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
        """Resolve entities across normalized events."""

        entity_map = {}

        for event in events:
            content = event.content or ""
            candidates = event.entity_candidates or []

            # Recover a meaningful work entity when the parser
            # extracted only a generic action word.
            #
            # Example:
            #   "Add benchmarks" -> parser extracts ["Add"]
            #   "benchmarks" is the actual work entity.
            if (
                len(candidates) == 1
                and self._is_generic_candidate(candidates[0])
            ):
                words = content.split()

                if len(words) >= 2:
                    fallback_entity = words[1].strip(
                        ".,!?;:()[]{}\"'"
                    )

                    if fallback_entity:
                        candidates = [fallback_entity]

            candidate_compound = self._find_compound_entity(candidates)
            text_compound = self._find_compound_in_text(content)

            compound_entity = None

            if candidate_compound:
                compound_entity = candidate_compound

            elif text_compound:
                normalized_candidates = {
                    self._normalize(candidate)
                    for candidate in candidates
                    if candidate
                }

                if text_compound == "Resume parser":
                    if "resume_parser" not in normalized_candidates:
                        compound_entity = text_compound
                else:
                    compound_entity = text_compound

            if compound_entity:
                entity_map.setdefault(compound_entity, [])
                entity_map[compound_entity].append(
                    event.source_id
                )

            for candidate in candidates:
                if not candidate:
                    continue

                if self._is_generic_candidate(candidate):
                    continue

                if compound_entity == "Resume parser":
                    if self._normalize(candidate) in {
                        "resume",
                        "parser",
                        "implement",
                    }:
                        continue

                normalized_candidate = self._normalize(candidate)

                if compound_entity == "API schema":
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

                canonical_entity = self._canonical_entity(
                    candidate
                )

                if canonical_entity:
                    entity_map.setdefault(
                        canonical_entity,
                        []
                    )
                    entity_map[canonical_entity].append(
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
        """Normalize entity text for comparison."""

        return (
            text.strip()
            .lower()
            .replace("-", "_")
            .replace(" ", "_")
        )

    def _is_generic_candidate(
        self,
        candidate: str,
    ) -> bool:
        """Check whether a candidate is a generic action/connector word."""

        normalized = (
            candidate.strip()
            .lower()
            .replace("-", " ")
            .replace("_", " ")
        )

        return normalized in self.GENERIC_CANDIDATES

    def _canonical_entity(
        self,
        candidate: str,
    ) -> Optional[str]:
        """Map known technology/entity variants to logical entities."""

        normalized = (
            candidate.strip()
            .lower()
            .replace("-", " ")
            .replace("_", " ")
        )

        database_entities = {
            "database",
            "postgresql",
            "postgres",
            "sqlite",
            "mysql",
            "mongodb",
            "mongo",
        }

        if normalized in database_entities:
            return "Database"

        return None

    def _canonical_compound(
        self,
        candidate: str,
    ) -> Optional[str]:
        """Return the canonical form of a compound entity."""

        normalized = self._normalize(candidate)

        return self.compound_entities.get(normalized)

    def _find_compound_in_text(
        self,
        text: str,
    ) -> Optional[str]:
        """Find known logical entities directly in source text."""

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

        if "resume parser" in normalized_text:
            return "Resume parser"

        if "resume parsing" in normalized_text:
            return "Resume parser"

        if "database" in normalized_text:
            return "Database"

        if "postgresql" in normalized_text:
            return "Database"

        if "postgres" in normalized_text:
            return "Database"

        if "sqlite" in normalized_text:
            return "Database"

        if "mysql" in normalized_text:
            return "Database"

        if "mongodb" in normalized_text:
            return "Database"

        if "mongo" in normalized_text:
            return "Database"

        if "schema" in normalized_text:
            return "Schema"

        if "tests" in normalized_text:
            return "Tests"

        if "testing" in normalized_text:
            return "Tests"

        if "feature x" in normalized_text:
            return "Feature X"

        if "performance" in normalized_text:
            return "Performance"

        return None

    def _find_compound_entity(
        self,
        candidates: List[str],
    ) -> Optional[str]:
        """Find compound entities among extracted candidates."""

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
        """Resolve known synonyms to canonical entities."""

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
        """Merge separate API and schema entities."""

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
                [],
            )

            if api_key is not None:
                combined_sources.extend(
                    entity_map.get(api_key, [])
                )
                entity_map.pop(api_key, None)

            if schema_key is not None:
                combined_sources.extend(
                    entity_map.get(schema_key, [])
                )
                entity_map.pop(schema_key, None)

            entity_map["API schema"] = list(
                dict.fromkeys(combined_sources)
            )

            if compound_key != "API schema":
                entity_map.pop(compound_key, None)

            return

        if api_key is None or schema_key is None:
            return

        combined_sources = (
            entity_map.get(api_key, [])
            + entity_map.get(schema_key, [])
        )

        entity_map.pop(api_key, None)
        entity_map.pop(schema_key, None)

        entity_map["API schema"] = list(
            dict.fromkeys(combined_sources)
        )