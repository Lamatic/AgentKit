from datetime import datetime, timezone

from src.components.conflict_detector import ConflictDetector
from src.models import NormalizedEvent, SourceType


def test_detect_conflicts():
    detector = ConflictDetector()

    timestamp = datetime(
        2026,
        8,
        23,
        10,
        0,
        tzinfo=timezone.utc,
    )

    events = [
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="1",
            timestamp=timestamp,
            author=None,
            content="Project is implemented",
        ),
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="2",
            timestamp=timestamp,
            author=None,
            content="Project is not implemented",
        ),
    ]

    result = detector.detect_conflicts(
        {"project": events}
    )

    assert len(result) == 1
    assert result[0].entity == "project"
    assert result[0].claim_old == "Project is implemented"
    assert result[0].claim_new == "Project is not implemented"


def test_no_conflict_for_non_contradictory_events():
    detector = ConflictDetector()

    timestamp = datetime(
        2026,
        8,
        23,
        10,
        0,
        tzinfo=timezone.utc,
    )

    events = [
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="1",
            timestamp=timestamp,
            author=None,
            content="Project is implemented",
        ),
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="2",
            timestamp=timestamp,
            author=None,
            content="Project is ready",
        ),
    ]

    result = detector.detect_conflicts(
        {"project": events}
    )

    assert result == []


def test_detect_blocked_unblocked_conflict():
    detector = ConflictDetector()

    older_timestamp = datetime(
        2026,
        8,
        23,
        10,
        0,
        tzinfo=timezone.utc,
    )

    newer_timestamp = datetime(
        2026,
        8,
        23,
        11,
        0,
        tzinfo=timezone.utc,
    )

    events = [
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="1",
            timestamp=older_timestamp,
            author=None,
            content="Parser blocked",
        ),
        NormalizedEvent(
            source_type=SourceType.COMMIT,
            source_id="2",
            timestamp=newer_timestamp,
            author=None,
            content="Parser unblocked",
        ),
    ]

    result = detector.detect_conflicts(
        {"parser": events}
    )

    assert len(result) == 1
    assert result[0].entity == "parser"
    assert result[0].claim_old == "Parser blocked"
    assert result[0].claim_new == "Parser unblocked"