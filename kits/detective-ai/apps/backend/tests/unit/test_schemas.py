"""Unit tests for Pydantic schemas and domain separation."""

import uuid
from datetime import UTC, datetime

from app.models.case import CaseCreate, CaseGroundTruthRead, CaseRead
from app.models.evidence import EvidenceCreate, EvidenceRead
from app.models.game_event import GameEventCreate, GameEventRead
from app.models.game_session import GameSessionCreate, GameSessionRead
from app.models.suspect import (
    SuspectCreate,
    SuspectGroundTruthRead,
    SuspectRead,
)


def test_case_schemas():
    """Verify player-facing CaseRead excludes ground truth solution details."""
    now = datetime.now(UTC)
    create_dto = CaseCreate(
        title="Test Case",
        description="Description",
        solution_summary="Culprit is X",
        ground_truth_data={"motive": "money"},
    )
    assert create_dto.solution_summary == "Culprit is X"

    # Simulate player-facing read schema
    player_view = CaseRead(
        id="case-1",
        title=create_dto.title,
        description=create_dto.description,
        status="active",
        created_at=now,
        updated_at=now,
    )
    assert not hasattr(player_view, "solution_summary")

    # Authoritative ground truth view
    backend_view = CaseGroundTruthRead(
        id="case-1",
        title=create_dto.title,
        description=create_dto.description,
        status="active",
        created_at=now,
        updated_at=now,
        solution_summary=create_dto.solution_summary,
        ground_truth_data=create_dto.ground_truth_data,
    )
    assert backend_view.solution_summary == "Culprit is X"


def test_suspect_schemas():
    """Verify player-facing SuspectRead excludes culprit status."""
    now = datetime.now(UTC)
    create_dto = SuspectCreate(
        case_id="case-1",
        name="John Doe",
        description="A suspect",
        is_culprit=True,
        motive="Jealousy",
    )

    player_view = SuspectRead(
        id="suspect-1",
        case_id=create_dto.case_id,
        name=create_dto.name,
        description=create_dto.description,
        profile_metadata=create_dto.profile_metadata,
        created_at=now,
        updated_at=now,
    )
    assert not hasattr(player_view, "is_culprit")

    backend_view = SuspectGroundTruthRead(
        id="suspect-1",
        case_id=create_dto.case_id,
        name=create_dto.name,
        description=create_dto.description,
        profile_metadata=create_dto.profile_metadata,
        created_at=now,
        updated_at=now,
        is_culprit=True,
        motive="Jealousy",
    )
    assert backend_view.is_culprit is True


def test_evidence_and_event_schemas():
    """Verify Evidence and GameEvent schema instantiation."""
    now = datetime.now(UTC)

    ev_create = EvidenceCreate(
        case_id="c1",
        name="Knife",
        description="Bloody knife",
        evidence_type="physical",
    )
    ev_read = EvidenceRead(
        id="e1",
        case_id=ev_create.case_id,
        name=ev_create.name,
        description=ev_create.description,
        evidence_type=ev_create.evidence_type,
        location_id=None,
        discovery_metadata=None,
        created_at=now,
        updated_at=now,
    )
    assert ev_read.name == "Knife"

    session_create = GameSessionCreate(case_id="c1")
    session_read = GameSessionRead(
        id=str(uuid.uuid4()),
        case_id=session_create.case_id,
        current_location_id=None,
        status="in_progress",
        score=0,
        state_metadata=None,
        created_at=now,
        updated_at=now,
    )
    assert session_read.status == "in_progress"

    event_create = GameEventCreate(session_id=session_read.id, event_type="talk")
    event_read = GameEventRead(
        id=str(uuid.uuid4()),
        session_id=event_create.session_id,
        event_type=event_create.event_type,
        target_type=None,
        target_id=None,
        timestamp=now,
        result_data=None,
    )
    assert event_read.event_type == "talk"
