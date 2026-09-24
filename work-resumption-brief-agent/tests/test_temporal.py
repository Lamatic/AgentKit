import pytest
from datetime import datetime, timezone
from src.components.temporal import TemporalOrderingEngine
from src.models import NormalizedEvent, SourceType


@pytest.fixture
def engine():
    return TemporalOrderingEngine()


@pytest.fixture
def sample_events():
    return [
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="commit_1",
            timestamp=datetime(2024, 8, 18, 10, 0, tzinfo=timezone.utc),
            author="alice",
            content="Commit 1"
        ),
        NormalizedEvent(
            source_type=SourceType.PR_COMMENT,
            source_id="pr_42",
            timestamp=datetime(2024, 8, 18, 11, 0, tzinfo=timezone.utc),
            author="bob",
            content="PR comment"
        ),
        NormalizedEvent(
            source_type=SourceType.MEETING_NOTE,
            source_id="meeting_1",
            timestamp=datetime(2024, 8, 18, 14, 0, tzinfo=timezone.utc),
            author=None,
            content="Meeting note"
        )
    ]


def test_order_chronological(engine, sample_events):
    """Test chronological ordering."""
    shuffled = [sample_events[2], sample_events[0], sample_events[1]]
    ordered = engine.order(shuffled)

    assert ordered[0].timestamp.hour == 10
    assert ordered[1].timestamp.hour == 11
    assert ordered[2].timestamp.hour == 14


def test_tie_breaking(engine):
    """Test deterministic tie-breaking on same timestamp."""
    same_time = datetime(2024, 8, 18, 12, 0, tzinfo=timezone.utc)

    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            same_time,
            None,
            "C1"
        ),
        NormalizedEvent(
            SourceType.PR_COMMENT,
            "p1",
            same_time,
            None,
            "P1"
        ),
        NormalizedEvent(
            SourceType.MEETING_NOTE,
            "m1",
            same_time,
            None,
            "M1"
        )
    ]

    ordered = engine.order(events)

    assert ordered[0].source_type == SourceType.MEETING_NOTE
    assert ordered[1].source_type == SourceType.PR_COMMENT
    assert ordered[2].source_type == SourceType.COMMIT


def test_empty_list(engine):
    """Test handling empty list."""
    result = engine.order([])
    assert result == []


def test_get_latest_event(engine, sample_events):
    """Test getting latest event."""
    latest = engine.get_latest_event(sample_events)

    assert latest.timestamp.hour == 14


def test_find_gaps(engine):
    """Test gap detection."""
    events = [
        NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            datetime(2024, 8, 18, tzinfo=timezone.utc),
            None,
            "C1"
        ),
        NormalizedEvent(
            SourceType.COMMIT,
            "c2",
            datetime(2024, 8, 20, tzinfo=timezone.utc),
            None,
            "C2"
        ),
    ]

    gaps = engine.find_gaps(events)

    assert len(gaps) == 1
    assert gaps[0]["duration_days"] == 2