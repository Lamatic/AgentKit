import pytest
from datetime import datetime, timezone

from src.models import (
    Action,
    Blocker,
    Conflict,
    Evidence,
    StateCategory,
    WorkState,
    WorkResumptionBrief,
)


def test_conflict_rejects_empty_entity():
    with pytest.raises(ValueError):
        Conflict(
            entity="",
            claim_old="Old claim",
            claim_new="New claim",
            timestamp_old=datetime.now(timezone.utc),
            timestamp_new=datetime.now(timezone.utc),
        )


def test_conflict_rejects_naive_timestamp():
    with pytest.raises(ValueError):
        Conflict(
            entity="Parser",
            claim_old="Old claim",
            claim_new="New claim",
            timestamp_old=datetime.now(),
            timestamp_new=datetime.now(timezone.utc),
        )


def test_evidence_rejects_empty_conclusion():
    with pytest.raises(ValueError):
        Evidence(conclusion="")


def test_work_state_rejects_naive_last_update():
    with pytest.raises(ValueError):
        WorkState(
            entity="Parser",
            state=StateCategory.IN_PROGRESS,
            confidence=80,
            last_update=datetime.now(),
        )


def test_action_rejects_empty_action():
    with pytest.raises(ValueError):
        Action(
            action="",
            score=50,
            reasoning="Needs to be completed",
        )


def test_action_rejects_empty_reasoning():
    with pytest.raises(ValueError):
        Action(
            action="Fix parser",
            score=50,
            reasoning="",
        )


def test_action_rejects_non_finite_score():
    with pytest.raises(ValueError):
        Action(
            action="Fix parser",
            score=float("nan"),
            reasoning="Parser needs correction",
        )


def test_brief_rejects_naive_timestamp():
    with pytest.raises(ValueError):
        WorkResumptionBrief(
            current_state=[],
            conflicts=[],
            blockers=[],
            evidence=[],
            actions=[],
            recommended_first_action=None,
            confidence_overall=50,
            timestamp=datetime.now(),
        )


def test_blocker_keeps_existing_zero_to_one_confidence_scale():
    blocker = Blocker(
        blocker="Missing dependency",
        affected_work="Parser",
        impact="Blocks execution",
        confidence=0.8,
    )

    assert blocker.confidence == 0.8