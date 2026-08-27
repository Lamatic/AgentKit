import pytest

from src.components.blocker_identifier import BlockerIdentifier
from src.models import WorkState, StateCategory


@pytest.fixture
def identifier():
    return BlockerIdentifier()


def test_identifies_blocked_state(identifier):
    states = [
        WorkState(
            entity="Parser",
            state=StateCategory.BLOCKED,
            confidence=50.0,
            evidence=["c1"],
            last_update=None
        )
    ]

    blockers = identifier.identify_blockers(states)

    assert len(blockers) == 1
    assert blockers[0].affected_work == "Parser"
    assert blockers[0].blocker == "Parser is blocked"
    assert blockers[0].confidence == 0.85


def test_no_blockers_for_non_blocked_states(identifier):
    states = [
        WorkState(
            entity="Parser",
            state=StateCategory.COMPLETE,
            confidence=90.0,
            evidence=["c1"],
            last_update=None
        )
    ]

    blockers = identifier.identify_blockers(states)

    assert blockers == []


def test_high_impact_blocker(identifier):
    states = [
        WorkState(
            entity="Parser",
            state=StateCategory.BLOCKED,
            confidence=50.0,
            evidence=["c1"],
            last_update=None
        ),
        WorkState(
            entity="Review",
            state=StateCategory.IN_PROGRESS,
            confidence=70.0,
            evidence=["c2"],
            last_update=None
        ),
        WorkState(
            entity="Testing",
            state=StateCategory.PENDING,
            confidence=40.0,
            evidence=["c3"],
            last_update=None
        ),
        WorkState(
            entity="Deployment",
            state=StateCategory.PENDING,
            confidence=30.0,
            evidence=["c4"],
            last_update=None
        ),
        WorkState(
            entity="Validation",
            state=StateCategory.PENDING,
            confidence=40.0,
            evidence=["c5"],
            last_update=None
        )
    ]

    blockers = identifier.identify_blockers(states)

    assert len(blockers) == 1
    assert "HIGH IMPACT" in blockers[0].impact