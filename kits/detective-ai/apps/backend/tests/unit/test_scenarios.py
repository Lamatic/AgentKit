"""Unit tests for Milestone 2 - Scenario Definition, Loader, Validator, and Registry."""

import json
from pathlib import Path

import pytest
from sqlalchemy import select

from app.models.case import Case
from app.models.suspect import Suspect
from app.scenarios.exceptions import (
    ScenarioFormatError,
    ScenarioNotFoundError,
    ScenarioValidationError,
)
from app.scenarios.loader import ScenarioLoader
from app.scenarios.registry import ScenarioRegistry
from app.scenarios.schemas import ScenarioDefinition


def test_load_valid_fixture_scenario():
    """Verify that a valid fixture scenario loads and parses correctly."""
    loader = ScenarioLoader(base_dir="scenarios")
    scenario = loader.load("test_case")

    assert isinstance(scenario, ScenarioDefinition)
    assert scenario.scenario_id == "test_case"
    assert scenario.name == "The Test Case"
    assert scenario.version == "1.0.0"

    assert scenario.case.id == "case_test_01"
    assert scenario.victim is not None
    assert scenario.victim.name == "John Doe"

    assert len(scenario.suspects) == 2
    assert len(scenario.locations) == 1
    assert len(scenario.evidence) == 1
    assert len(scenario.timeline) == 1
    assert len(scenario.stages) == 2

    assert scenario.solution.culprit_id == "suspect_01"
    assert scenario.solution.required_evidence_ids == ["evidence_01"]


def test_load_midnight_archive_scenario():
    """Verify that the_midnight_archive scenario loads and validates correctly."""
    loader = ScenarioLoader(base_dir="scenarios")
    scenario = loader.load("the_midnight_archive")

    assert isinstance(scenario, ScenarioDefinition)
    assert scenario.scenario_id == "the_midnight_archive"
    assert scenario.name == "The Midnight Archive"
    assert scenario.version == "1.0.0"

    assert len(scenario.suspects) == 5
    assert len(scenario.locations) == 6
    assert len(scenario.evidence) == 8
    assert len(scenario.timeline) == 6
    assert len(scenario.stages) == 6

    assert scenario.solution.culprit_id == "suspect_05"
    assert scenario.solution.required_evidence_ids == [
        "evidence_02",
        "evidence_03",
        "evidence_05",
        "evidence_06",
        "evidence_08",
    ]

    # Verify ground-truth isolation
    player_view = scenario.to_player_view()
    assert not hasattr(player_view, "solution")
    assert not hasattr(player_view.suspects[0], "is_culprit")
    # Secret timeline events (2 out of 6) should be hidden from player view
    assert len(player_view.timeline) == 4


def test_ground_truth_separation():
    """Verify player-facing public view excludes solution and ground-truth fields."""
    loader = ScenarioLoader(base_dir="scenarios")
    scenario = loader.load("test_case")

    # Authoritative scenario has ground truth
    assert scenario.solution is not None
    assert scenario.suspects[0].is_culprit is True
    assert scenario.suspects[0].motive == "Financial gain"
    assert scenario.timeline[0].is_secret is True

    # Player-facing view excludes ground truth
    player_view = scenario.to_player_view()
    assert not hasattr(player_view, "solution")
    assert not hasattr(player_view.suspects[0], "is_culprit")
    assert not hasattr(player_view.suspects[0], "motive")
    # Secret timeline event omitted from public view
    assert len(player_view.timeline) == 0


def test_missing_scenario_raises_not_found():
    """Verify loading a nonexistent scenario raises ScenarioNotFoundError."""
    loader = ScenarioLoader(base_dir="scenarios")
    with pytest.raises(ScenarioNotFoundError) as exc_info:
        loader.load("non_existent_scenario_123")

    assert "non_existent_scenario_123" in str(exc_info.value)


def test_invalid_json_format(tmp_path: Path):
    """Verify malformed JSON produces ScenarioFormatError or ScenarioValidationError."""
    scenario_dir = tmp_path / "bad_json_case"
    scenario_dir.mkdir()
    (scenario_dir / "scenario.json").write_text(
        "{ malformed json ...", encoding="utf-8"
    )

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises((ScenarioFormatError, ScenarioValidationError)):
        loader.load("bad_json_case")


def test_duplicate_suspect_id_rejected(tmp_path: Path):
    """Verify scenario with duplicate suspect IDs is rejected."""
    scenario_dir = tmp_path / "dup_suspect"
    scenario_dir.mkdir()

    full_data = {
        "scenario_id": "dup_suspect",
        "name": "Dup Suspect",
        "description": "Desc",
        "version": "1.0.0",
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True},
            {"id": "s1", "name": "Bob", "description": "D", "is_culprit": False},
        ],
        "locations": [{"id": "loc1", "name": "L1", "description": "D"}],
        "evidence": [],
        "timeline": [],
        "solution": {"culprit_id": "s1", "solution_summary": "Alice did it"},
        "stages": [{"id": "st1", "name": "St1", "description": "D", "order": 1}],
    }
    (scenario_dir / "scenario.json").write_text(json.dumps(full_data), encoding="utf-8")

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("dup_suspect")

    assert "duplicate suspect ID" in str(exc_info.value)


def test_invalid_location_reference_rejected(tmp_path: Path):
    """Verify evidence referencing an unknown location is rejected."""
    scenario_dir = tmp_path / "bad_loc_ref"
    scenario_dir.mkdir()

    full_data = {
        "scenario_id": "bad_loc_ref",
        "name": "Bad Loc Ref",
        "description": "Desc",
        "version": "1.0.0",
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True}
        ],
        "locations": [{"id": "loc1", "name": "L1", "description": "D"}],
        "evidence": [
            {
                "id": "e1",
                "name": "Knife",
                "description": "Bloody knife",
                "location_id": "warehouse_99",
            }
        ],
        "timeline": [],
        "solution": {"culprit_id": "s1", "solution_summary": "Alice did it"},
        "stages": [{"id": "st1", "name": "St1", "description": "D", "order": 1}],
    }
    (scenario_dir / "scenario.json").write_text(json.dumps(full_data), encoding="utf-8")

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("bad_loc_ref")

    assert "references unknown location 'warehouse_99'" in str(exc_info.value)


def test_invalid_culprit_reference_rejected(tmp_path: Path):
    """Verify invalid solution culprit reference is rejected."""
    scenario_dir = tmp_path / "bad_culprit"
    scenario_dir.mkdir()

    # Case 1: Nonexistent suspect
    full_data_1 = {
        "scenario_id": "bad_culprit",
        "name": "Bad Culprit",
        "description": "Desc",
        "version": "1.0.0",
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True}
        ],
        "locations": [{"id": "loc1", "name": "L1", "description": "D"}],
        "evidence": [],
        "timeline": [],
        "solution": {
            "culprit_id": "non_existent_suspect",
            "solution_summary": "Summary",
        },
        "stages": [{"id": "st1", "name": "St1", "description": "D", "order": 1}],
    }
    (scenario_dir / "scenario.json").write_text(
        json.dumps(full_data_1), encoding="utf-8"
    )

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("bad_culprit")
    assert "references unknown suspect" in str(exc_info.value)

    # Case 2: Suspect has is_culprit=False
    full_data_2 = dict(full_data_1)
    full_data_2["suspects"] = [
        {"id": "s1", "name": "Alice", "description": "D", "is_culprit": False}
    ]
    full_data_2["solution"] = {"culprit_id": "s1", "solution_summary": "Summary"}
    (scenario_dir / "scenario.json").write_text(
        json.dumps(full_data_2), encoding="utf-8"
    )

    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("bad_culprit")
    assert "whose is_culprit flag is False" in str(exc_info.value)


def test_invalid_stage_reference_rejected(tmp_path: Path):
    """Verify stage requirement referencing nonexistent evidence is rejected."""
    scenario_dir = tmp_path / "bad_stage"
    scenario_dir.mkdir()

    full_data = {
        "scenario_id": "bad_stage",
        "name": "Bad Stage",
        "description": "Desc",
        "version": "1.0.0",
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True}
        ],
        "locations": [{"id": "loc1", "name": "L1", "description": "D"}],
        "evidence": [],
        "timeline": [],
        "solution": {"culprit_id": "s1", "solution_summary": "Summary"},
        "stages": [
            {
                "id": "st1",
                "name": "St1",
                "description": "D",
                "order": 1,
                "requirements": {"required_evidence_ids": ["ghost_evidence"]},
            }
        ],
    }
    (scenario_dir / "scenario.json").write_text(json.dumps(full_data), encoding="utf-8")

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("bad_stage")

    assert "references unknown evidence 'ghost_evidence'" in str(exc_info.value)


def test_invalid_version_rejected(tmp_path: Path):
    """Verify invalid scenario version formats are rejected."""
    scenario_dir = tmp_path / "bad_version"
    scenario_dir.mkdir()

    full_data = {
        "scenario_id": "bad_version",
        "name": "Bad Version",
        "description": "Desc",
        "version": "v1.0",  # Not valid semver X.Y.Z
        "case": {"id": "c1", "title": "C1", "description": "D"},
        "suspects": [
            {"id": "s1", "name": "Alice", "description": "D", "is_culprit": True}
        ],
        "locations": [{"id": "loc1", "name": "L1", "description": "D"}],
        "evidence": [],
        "timeline": [],
        "solution": {"culprit_id": "s1", "solution_summary": "Summary"},
        "stages": [{"id": "st1", "name": "St1", "description": "D", "order": 1}],
    }
    (scenario_dir / "scenario.json").write_text(json.dumps(full_data), encoding="utf-8")

    loader = ScenarioLoader(base_dir=tmp_path)
    with pytest.raises(ScenarioValidationError) as exc_info:
        loader.load("bad_version")

    assert "invalid scenario version" in str(exc_info.value)


def test_scenario_registry_discovery():
    """Verify ScenarioRegistry discovers valid scenarios in scenarios/ folder."""
    registry = ScenarioRegistry(base_dir="scenarios")
    scenario_list = registry.list_scenarios()

    assert len(scenario_list) >= 1
    test_case_meta = next((s for s in scenario_list if s["id"] == "test_case"), None)
    assert test_case_meta is not None
    assert test_case_meta["name"] == "The Test Case"
    assert test_case_meta["version"] == "1.0.0"

    scenario_def = registry.get_scenario("test_case")
    assert scenario_def.scenario_id == "test_case"


def test_loading_scenario_does_not_mutate_database(db_session):
    """Verify that loading a scenario does not touch or mutate the database."""
    # Count records before loading scenario
    cases_before = len(db_session.scalars(select(Case)).all())
    suspects_before = len(db_session.scalars(select(Suspect)).all())

    loader = ScenarioLoader(base_dir="scenarios")
    scenario = loader.load("test_case")
    assert scenario.scenario_id == "test_case"

    # Count records after loading scenario
    cases_after = len(db_session.scalars(select(Case)).all())
    suspects_after = len(db_session.scalars(select(Suspect)).all())

    assert cases_before == cases_after
    assert suspects_before == suspects_after
