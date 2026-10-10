import pytest
from datetime import datetime, timezone, timedelta

from src.components.evidence_collector import EvidenceCollector
from src.models import NormalizedEvent, SourceType, ConfidenceLevel


@pytest.fixture
def collector():
    return EvidenceCollector()


def make_event(source_id, content, hours_ago=0):
    timestamp = datetime.now(timezone.utc) - timedelta(hours=hours_ago)

    return NormalizedEvent(
        SourceType.COMMIT,
        source_id,
        timestamp,
        "alice",
        content,
    )


def test_no_evidence(collector):
    events = [
        make_event("c1", "Parser implemented")
    ]

    evidence = collector.collect_evidence(
        "API completed",
        events,
        [],
    )

    assert evidence.confidence == 0.0
    assert evidence.sources == []


def test_single_supporting_source(collector):
    events = [
        make_event("c1", "Parser implemented")
    ]

    evidence = collector.collect_evidence(
        "Parser implemented",
        events,
        [],
    )

    assert evidence.sources == ["c1"]
    assert evidence.confidence > 0
    assert evidence.confidence_level is not None


def test_multiple_supporting_sources(collector):
    events = [
        make_event("c1", "Parser implemented", 1),
        make_event("c2", "Parser implemented", 2),
        make_event("c3", "Parser implemented", 3),
    ]

    evidence = collector.collect_evidence(
        "Parser implemented",
        events,
        [],
    )

    assert len(evidence.sources) == 3
    assert evidence.confidence > 0


def test_recency_scoring(collector):
    """Test recency scoring through the production evidence pipeline."""

    reference_time = datetime(
        2024,
        8,
        18,
        12,
        0,
        tzinfo=timezone.utc,
    )

    recency_cases = [
        (
            timedelta(minutes=30),
            80.0,
            ConfidenceLevel.HIGH,
        ),
        (
            timedelta(hours=12),
            72.0,
            ConfidenceLevel.MEDIUM,
        ),
        (
            timedelta(days=3),
            64.0,
            ConfidenceLevel.MEDIUM,
        ),
        (
            timedelta(days=15),
            56.0,
            ConfidenceLevel.MEDIUM,
        ),
        (
            timedelta(days=45),
            48.0,
            ConfidenceLevel.LOW,
        ),
    ]

    for age, expected_confidence, expected_level in recency_cases:
        event = NormalizedEvent(
            SourceType.COMMIT,
            "c1",
            reference_time - age,
            None,
            "Resume parser implemented",
        )

        evidence = collector.collect_evidence(
            "Resume parser",
            [event],
            [],
            reference_time=reference_time,
        )

        assert evidence is not None
        assert evidence.sources == ["c1"]
        assert evidence.confidence == expected_confidence
        assert evidence.confidence_level == expected_level