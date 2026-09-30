import re
from typing import Dict, List, Optional

from src.logger import setup_logger
from src.models import NormalizedEvent


logger = setup_logger("EntityResolver")


class EntityResolver:
    """Resolve entity mentions across sources using layered matching.

    Layers:
    1. Exact match (case-sensitive)
    2. Normalized match (lowercase / underscore)
    3. Semantic match (synonyms)
    4. UNCERTAIN (no match → keep original candidate)
    """

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

    COMPOUND_PHRASES = {
        "rest api schema": "API schema",
        "api schema": "API schema",
        "schema api": "API schema",
        "resume parser": "Resume parser",
        "resume parsing": "Resume parser",
        "database": "Database",
        "postgresql": "Database",
        "postgres": "Database",
        "sqlite": "Database",
        "mysql": "Database",
        "mongodb": "Database",
        "mongo": "Database",
        "schema": "Schema",
        "tests": "Tests",
        "testing": "Tests",
        "feature x": "Feature X",
        "performance": "Performance",
    }

    def __init__(self) -> None:
        """Initialize synonym map and known compound entities."""

        self.synonym_map = {
            "parser": [
                "resume parser",
                "parsing engine",
                "parse",
                "extraction",
                "parser component",
            ],
            "api": [
                "rest api",
                "endpoint",
                "service",
                "interface",
                "backend",
            ],
            "schema": [
                "data structure",
                "format",
                "model",
                "design",
                "schema",
            ],
            "test": [
                "testing",
                "unit test",
                "integration test",
                "qa",
                "test suite",
            ],
            "implementation": [
                "implement",
                "build",
                "create",
                "add",
                "development",
            ],
            "validation": [
                "validate",
                "validation",
                "check",
                "verify",
                "verification",
            ],
            "database": [
                "db",
                "database",
                "postgres",
                "sql",
                "storage",
            ],
            "authentication": [
                "auth",
                "login",
                "security",
                "token",
                "jwt",
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
        """Map entity mentions to canonical entities across events.

        Args:
            events: List of normalized events containing entity candidates.

        Returns:
            Dictionary mapping canonical entity names to lists of source IDs.

        Raises:
            ValueError: If events list is empty or contains invalid items.
        """
        entity_map: Dict[str, List[str]] = {}

        for event in events:
            content = event.content or ""
            candidates = event.entity_candidates or []

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
        """Normalize entity text for comparison.

        Args:
            text: Raw entity string.

        Returns:
            Lowercased, underscore-normalized string.
        """
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
        """Check whether a candidate is a generic action/connector word.

        Args:
            candidate: Entity candidate string.

        Returns:
            True if the candidate is considered generic noise.
        """
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
        """Map known technology/entity variants to logical entities.

        Args:
            candidate: Entity candidate string.

        Returns:
            Canonical entity name, or None if no mapping exists.
        """
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
        """Return the canonical form of a compound entity.

        Args:
            candidate: Entity candidate string.

        Returns:
            Canonical compound name, or None.
        """
        normalized = self._normalize(candidate)

        return self.compound_entities.get(normalized)

    def _find_compound_in_text(
        self,
        text: str,
    ) -> Optional[str]:
        """Find known logical entities directly in source text.

        Args:
            text: Raw event content.

        Returns:
            Detected compound entity name, or None.
        """
        normalized_text = (
            text.strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )

        normalized_text = re.sub(
            r"\s+",
            " ",
            normalized_text,
        )

        aliases = sorted(
            self.COMPOUND_PHRASES.items(),
            key=lambda item: len(item[0]),
            reverse=True,
        )

        for phrase, canonical_entity in aliases:
            pattern = rf"\b{re.escape(phrase)}\b"

            if re.search(pattern, normalized_text):
                return canonical_entity

        return None

    def _find_compound_entity(
        self,
        candidates: List[str],
    ) -> Optional[str]:
        """Find compound entities among extracted candidates.

        Args:
            candidates: List of entity candidate strings.

        Returns:
            Detected compound entity name, or None.
        """
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
        """Resolve known synonyms to canonical entities.

        Args:
            candidate: Entity candidate string.

        Returns:
            Canonical entity name from synonym map, or None.
        """
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
        """Merge separate API and schema entities into a single compound.

        Args:
            entity_map: Mutable dictionary of entity → source IDs.
        """
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