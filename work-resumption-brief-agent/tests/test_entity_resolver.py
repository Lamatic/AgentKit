import pytest
from datetime import datetime, timezone

from src.components.entity_resolver import EntityResolver
from src.models import NormalizedEvent, SourceType


@pytest.fixture
def resolver():
    return EntityResolver()


def test_exact_match(resolver):
    timestamp = datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            timestamp,
            None,
            "Parser implemented",
            entity_candidates=["Parser"]
        ),
        NormalizedEvent(
            SourceType.PR_COMMENT,
            "p1",
            timestamp,
            None,
            "Parser looks good",
            entity_candidates=["Parser"]
        )
    ]

    result = resolver.resolve_entities(events)

    assert "Parser" in result
    assert result["Parser"] == ["c1", "p1"]


def test_normalized_match(resolver):
    timestamp = datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            timestamp,
            None,
            "Resume Parser work",
            entity_candidates=["resume-parser"]
        ),
        NormalizedEvent(
            SourceType.COMMIT,
            "c2",
            timestamp,
            None,
            "Resume Parser updated",
            entity_candidates=["resume parser"]
        )
    ]

    result = resolver.resolve_entities(events)

    assert len(result) == 1
    assert result["resume-parser"] == ["c1", "c2"]


def test_semantic_match(resolver):
    timestamp = datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            timestamp,
            None,
            "Parsing engine implemented",
            entity_candidates=["parsing engine"]
        ),
        NormalizedEvent(
            SourceType.PR_COMMENT,
            "p1",
            timestamp,
            None,
            "Parser looks good",
            entity_candidates=["parser"]
        )
    ]

    result = resolver.resolve_entities(events)

    assert "parser" in result
    assert result["parser"] == ["c1", "p1"]


def test_new_entity(resolver):
    timestamp = datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            timestamp,
            None,
            "Database work",
            entity_candidates=["Database"]
        )
    ]

    result = resolver.resolve_entities(events)

    assert result == {"Database": ["c1"]}


def test_multiple_entities(resolver):
    timestamp = datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            timestamp,
            None,
            "Parser and API implemented",
            entity_candidates=["parser", "api"]
        ),
        NormalizedEvent(
            SourceType.PR_COMMENT,
            "p1",
            timestamp,
            None,
            "Endpoint looks good",
            entity_candidates=["endpoint"]
        )
    ]

    result = resolver.resolve_entities(events)

    assert "parser" in result
    assert "api" in result
    assert result["parser"] == ["c1"]
    assert result["api"] == ["c1", "p1"]