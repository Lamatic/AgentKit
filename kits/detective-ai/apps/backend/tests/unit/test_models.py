"""Unit tests for domain models, relationships, and persistence behavior."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.evidence import Evidence
from app.models.game_event import GameEvent
from app.models.game_session import GameSession
from app.models.location import Location
from app.models.suspect import Suspect
from app.models.timeline import TimelineEvent
from app.models.victim import Victim


def test_create_case(db_session: Session):
    """Test creating and persisting a Case."""
    case = Case(
        title="The Manor House Murder",
        description="A mysterious murder at Blackwood Manor.",
        status="active",
        solution_summary="Butler did it in the study.",
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)

    assert case.id is not None
    assert case.title == "The Manor House Murder"
    assert case.status == "active"
    assert case.created_at is not None


def test_create_victim_relationship(db_session: Session):
    """Test creating a Victim associated with a Case."""
    case = Case(
        title="Case 001",
        description="Case description",
    )
    db_session.add(case)
    db_session.commit()

    victim = Victim(
        case_id=case.id,
        name="Lord Blackwood",
        description="Owner of Blackwood Manor",
    )
    db_session.add(victim)
    db_session.commit()
    db_session.refresh(case)

    assert case.victim is not None
    assert case.victim.name == "Lord Blackwood"
    assert case.victim.case_id == case.id


def test_create_suspect_relationship(db_session: Session):
    """Test creating Suspects associated with a Case."""
    case = Case(title="Case 002", description="Case description")
    db_session.add(case)
    db_session.commit()

    suspect1 = Suspect(
        case_id=case.id,
        name="Arthur Pendelton",
        description="The Butler",
        is_culprit=True,
        motive="Inheritance debt",
    )
    suspect2 = Suspect(
        case_id=case.id,
        name="Clara Oswald",
        description="The Niece",
        is_culprit=False,
    )
    db_session.add_all([suspect1, suspect2])
    db_session.commit()
    db_session.refresh(case)

    assert len(case.suspects) == 2
    suspect_names = {s.name for s in case.suspects}
    assert "Arthur Pendelton" in suspect_names
    assert "Clara Oswald" in suspect_names


def test_create_location_and_evidence_relationships(db_session: Session):
    """Test creating Location and Evidence associated with Case."""
    case = Case(title="Case 003", description="Case description")
    db_session.add(case)
    db_session.commit()

    location = Location(
        case_id=case.id,
        name="Study Room",
        description="Dark room with a mahogany desk.",
        is_initial_unlocked=True,
    )
    db_session.add(location)
    db_session.commit()

    evidence = Evidence(
        case_id=case.id,
        location_id=location.id,
        name="Torn Letter",
        description="A half-burned letter referencing debt.",
        evidence_type="document",
    )
    db_session.add(evidence)
    db_session.commit()
    db_session.refresh(location)
    db_session.refresh(case)

    assert len(case.locations) == 1
    assert len(case.evidence) == 1
    assert len(location.evidence_items) == 1
    assert location.evidence_items[0].name == "Torn Letter"


def test_timeline_events(db_session: Session):
    """Test canonical TimelineEvent creation and relationships."""
    case = Case(title="Case 004", description="Case description")
    db_session.add(case)
    db_session.commit()

    suspect = Suspect(case_id=case.id, name="Julian Frost", description="Guest")
    location = Location(case_id=case.id, name="Foyer", description="Grand foyer")
    db_session.add_all([suspect, location])
    db_session.commit()

    event = TimelineEvent(
        case_id=case.id,
        event_order=1,
        timestamp_str="09:00 PM",
        description="Julian entered the foyer.",
        suspect_id=suspect.id,
        location_id=location.id,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(case)

    assert len(case.timeline_events) == 1
    assert case.timeline_events[0].description == "Julian entered the foyer."
    assert case.timeline_events[0].suspect.name == "Julian Frost"


def test_game_session_and_game_event_creation(db_session: Session):
    """Test GameSession and GameEvent creation and tracking."""
    case = Case(title="Case 005", description="Case description")
    db_session.add(case)
    db_session.commit()

    location = Location(case_id=case.id, name="Library", description="Silent library")
    db_session.add(location)
    db_session.commit()

    session = GameSession(
        case_id=case.id,
        current_location_id=location.id,
        status="in_progress",
        score=100,
        state_metadata={"discovered_evidence": ["ev_1"]},
    )
    db_session.add(session)
    db_session.commit()

    game_event = GameEvent(
        session_id=session.id,
        event_type="search_location",
        target_type="location",
        target_id=location.id,
        result_data={"found_evidence": ["ev_1"]},
    )
    db_session.add(game_event)
    db_session.commit()
    db_session.refresh(session)

    assert len(session.game_events) == 1
    assert session.game_events[0].event_type == "search_location"
    assert session.game_events[0].result_data == {"found_evidence": ["ev_1"]}


def test_case_cascade_delete(db_session: Session):
    """Test deleting a Case cascades to dependent entities."""
    case = Case(title="Cascade Case", description="Will be deleted")
    db_session.add(case)
    db_session.commit()

    suspect = Suspect(case_id=case.id, name="S1", description="D1")
    session = GameSession(case_id=case.id)
    db_session.add_all([suspect, session])
    db_session.commit()

    # Delete case
    db_session.delete(case)
    db_session.commit()

    assert db_session.query(Suspect).filter_by(case_id=case.id).first() is None
    assert db_session.query(GameSession).filter_by(case_id=case.id).first() is None


def test_foreign_key_enforcement(db_session: Session):
    """Test foreign key constraint fails when linking non-existent parent."""
    suspect = Suspect(
        case_id="non-existent-case-id",
        name="Ghost Suspect",
        description="No case",
    )
    db_session.add(suspect)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
