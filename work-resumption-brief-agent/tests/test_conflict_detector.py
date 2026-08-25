import pytest
from datetime import datetime, timezone

from src.components.conflict_detector import ConflictDetector
from src.models import NormalizedEvent, SourceType


@pytest.fixture
def detector():
    return ConflictDetector()


def test_detect_contradiction(detector):
    """Test detecting a contradiction between older and newer claims."""
    events = {
        "parser": [
            NormalizedEvent(
                SourceType.PR_COMMENT,
                "p1",
                datetime(2024, 8, 18, 9, 0, tzinfo=timezone.utc),
                "bob",
                "Parser incomplete"
            ),
            NormalizedEvent(
                SourceType.COMMIT,
                "c1",
                datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc),
                "alice",
                "Parser implemented"
            )
        ]
    }

    conflicts = detector.detect_conflicts(events)

    assert len(conflicts) == 1
    assert "incomplete" in conflicts[0].claim_old.lower()
    assert "implemented" in conflicts[0].claim_new.lower()


def test_no_conflict_for_synonyms(detector):
    """Test that equivalent states do not create false conflicts."""
    events = {
        "parser": [
            NormalizedEvent(
                SourceType.COMMIT,
                "c1",
                datetime(2024, 8, 18, 9, 0, tzinfo=timezone.utc),
                None,
                "Parser added"
            ),
            NormalizedEvent(
                SourceType.COMMIT,
                "c2",
                datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc),
                None,
                "Parser implemented"
            )
        ]
    }

    conflicts = detector.detect_conflicts(events)

    assert len(conflicts) == 0


def test_newer_claim_is_authoritative(detector):
    """Test that the newer claim becomes the resolution."""
    events = {
        "api": [
            NormalizedEvent(
                SourceType.PR_COMMENT,
                "p1",
                datetime(2024, 8, 18, 9, 0, tzinfo=timezone.utc),
                "bob",
                "API pending"
            ),
            NormalizedEvent(
                SourceType.COMMIT,
                "c1",
                datetime(2024, 8, 18, 12, 0, tzinfo=timezone.utc),
                "alice",
                "API implemented"
            )
        ]
    }

    conflicts = detector.detect_conflicts(events)

    assert len(conflicts) == 1
    assert conflicts[0].timestamp_old.hour == 9
    assert conflicts[0].timestamp_new.hour == 12
    assert conflicts[0].confidence == 0.9


def test_no_conflict_with_single_event(detector):
    """A single event cannot contain a cross-source contradiction."""
    events = {
        "parser": [
            NormalizedEvent(
                SourceType.COMMIT,
                "c1",
                datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc),
                None,
                "Parser implemented"
            )
        ]
    }

    conflicts = detector.detect_conflicts(events)

    assert conflicts == []


def test_unknown_states_do_not_conflict(detector):
    """Unknown claims should not be treated as contradictions."""
    events = {
        "schema": [
            NormalizedEvent(
                SourceType.COMMIT,
                "c1",
                datetime(2024, 8, 18, 9, 0, tzinfo=timezone.utc),
                None,
                "Schema discussion"
            ),
            NormalizedEvent(
                SourceType.COMMIT,
                "c2",
                datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc),
                None,
                "Schema reviewed"
            )
        ]
    }

    conflicts = detector.detect_conflicts(events)

    assert conflicts == []