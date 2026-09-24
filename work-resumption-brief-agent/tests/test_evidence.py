import pytest
from datetime import datetime, timezone, timedelta

from src.components.evidence_collector import EvidenceCollector
from src.models import NormalizedEvent, SourceType


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
        content
    )


def test_no_evidence(collector):
    events = [
        make_event("c1", "Parser implemented")
    ]

    evidence = collector.collect_evidence(
        "API completed",
        events,
        []
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
        []
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
        []
    )

    assert len(evidence.sources) == 3
    assert evidence.confidence > 0


def test_recency_scoring(collector):
    now = datetime.now(timezone.utc)

    assert collector._get_recency_score(
        now - timedelta(minutes=30)
    ) == 1.0

    assert collector._get_recency_score(
        now - timedelta(hours=12)
    ) == 0.8

    assert collector._get_recency_score(
        now - timedelta(days=3)
    ) == 0.6

    assert collector._get_recency_score(
        now - timedelta(days=15)
    ) == 0.4

    assert collector._get_recency_score(
        now - timedelta(days=45)
    ) == 0.2