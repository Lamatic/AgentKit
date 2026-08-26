import pytest
from datetime import datetime, timezone
from src.components.state_reconstructor import StateReconstructor
from src.models import Evidence, Conflict, ConfidenceLevel, StateCategory


@pytest.fixture
def reconstructor():
    return StateReconstructor()


def test_complete_state_high_confidence(reconstructor):
    evidence = [
        Evidence(
            "Parser",
            ["c1", "p1"],
            85.0,
            ConfidenceLevel.HIGH,
            "Multiple recent sources"
        )
    ]

    states = reconstructor.reconstruct_state(evidence, [])

    assert states[0].state == StateCategory.COMPLETE


def test_in_progress_medium_confidence(reconstructor):
    evidence = [
        Evidence(
            "Parser",
            ["c1"],
            70.0,
            ConfidenceLevel.MEDIUM,
            "Recent activity"
        )
    ]

    states = reconstructor.reconstruct_state(evidence, [])

    assert states[0].state == StateCategory.IN_PROGRESS


def test_uncertain_with_conflicts(reconstructor):
    evidence = [
        Evidence(
            "Parser",
            ["c1"],
            50.0,
            ConfidenceLevel.MEDIUM,
            "Conflicting info"
        )
    ]

    conflict = Conflict(
        "Parser",
        "not done",
        "done",
        datetime.now(timezone.utc),
        datetime.now(timezone.utc),
        "Resolved",
        90.0
    )

    states = reconstructor.reconstruct_state(evidence, [conflict])

    assert states[0].state == StateCategory.UNCERTAIN