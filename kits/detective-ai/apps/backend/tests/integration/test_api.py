"""Comprehensive integration test suite for DetectiveAI FastAPI API layer."""

from unittest.mock import MagicMock

from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.exceptions import LamaticConnectionError
from app.lamatic.schemas import AgentResponse
from app.lamatic.suspect_agent import SuspectAgent


def test_health_check(api_client):
    """Verify GET /health returns 200 with status ok."""
    response = api_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_list_scenarios(api_client):
    """Verify GET /api/v1/scenarios returns player-safe summaries."""
    response = api_client.get("/api/v1/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    scenario_ids = [s["id"] for s in data]
    assert "the_midnight_archive" in scenario_ids
    assert "test_case" in scenario_ids
    for s in data:
        assert "id" in s
        assert "name" in s
        assert "description" in s
        assert "version" in s
        assert "solution" not in s
        assert "culprit_id" not in s


def test_get_scenario_by_id(api_client):
    """Verify GET /api/v1/scenarios/{id} returns player-safe scenario representation."""
    response = api_client.get("/api/v1/scenarios/the_midnight_archive")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "the_midnight_archive"
    assert "case" in data
    assert "locations" in data
    assert "suspects" in data
    assert "evidence" in data
    assert "stages" in data
    assert "solution" not in data


def test_get_scenario_unknown(api_client):
    """Verify GET /api/v1/scenarios/{unknown} returns 404 error envelope."""
    response = api_client.get("/api/v1/scenarios/unknown_scenario_999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "SCENARIO_NOT_FOUND"


def test_create_session_exact_id(api_client):
    """Verify POST /api/v1/sessions creates session with exact scenario ID."""
    response = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert data["scenario_id"] == "the_midnight_archive"
    assert data["status"] == "in_progress"
    assert data["score"] == 0
    assert data["stage"]["order"] == 1
    assert data["current_location"]["id"] == "location_01"


def test_create_session_display_name(api_client):
    """Verify POST /api/v1/sessions creates session with display name."""
    response = api_client.post(
        "/api/v1/sessions", json={"scenario": "The Midnight Archive"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["scenario_id"] == "the_midnight_archive"


def test_create_session_case_insensitive(api_client):
    """Verify POST /api/v1/sessions creates session with case-insensitive name."""
    response = api_client.post(
        "/api/v1/sessions", json={"scenario": "the midnight archive"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["scenario_id"] == "the_midnight_archive"


def test_create_session_unknown_scenario(api_client):
    """Verify POST /api/v1/sessions with nonexistent scenario returns 404."""
    response = api_client.post(
        "/api/v1/sessions", json={"scenario": "nonexistent_scenario"}
    )
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "SCENARIO_NOT_FOUND"


def test_get_session_state(api_client):
    """Verify GET /api/v1/sessions/{id} returns GameStateDTO."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.get(f"/api/v1/sessions/{sid}")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == sid
    assert data["scenario_id"] == "the_midnight_archive"
    assert data["current_location_id"] == "location_01"
    assert data["status"] == "in_progress"


def test_get_session_state_not_found(api_client):
    """Verify GET /api/v1/sessions/{unknown} returns 404."""
    response = api_client.get("/api/v1/sessions/nonexistent-session-id")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "SESSION_NOT_FOUND"


def test_get_investigation_context(api_client):
    """Verify GET /api/v1/sessions/{id}/context returns player-safe context."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.get(f"/api/v1/sessions/{sid}/context")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == sid
    assert data["case_title"] == "The Midnight Archive Incident"
    assert "available_locations" in data
    assert "available_suspects" in data
    assert "discovered_evidence" in data


def test_get_available_actions(api_client):
    """Verify GET /api/v1/sessions/{id}/available-actions returns player actions."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.get(f"/api/v1/sessions/{sid}/available-actions")
    assert response.status_code == 200
    data = response.json()
    assert "move" in data
    assert "inspect" in data
    assert data["inspect"] is True
    assert "interrogate" in data
    assert "examine" in data
    assert "advance" in data
    assert data["advance"]["available"] is False
    assert "solve" in data


def test_get_session_history(api_client):
    """Verify GET /api/v1/sessions/{id}/history returns chronological events."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.get(f"/api/v1/sessions/{sid}/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["event_type"] == "START_GAME"


def test_actions_inspect_and_move(api_client):
    """Verify inspecting a location and moving via actions endpoint."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # 1. Inspect
    inspect_resp = api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "inspect"},
    )
    assert inspect_resp.status_code == 200
    ins_data = inspect_resp.json()
    assert ins_data["success"] is True
    assert len(ins_data["newly_discovered_evidence"]) >= 1

    # 2. Move
    move_resp = api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "move", "target_id": "Archive Reading Room"},
    )
    assert move_resp.status_code == 200
    move_data = move_resp.json()
    assert move_data["success"] is True
    assert move_data["state"]["current_location_id"] == "location_02"


def test_actions_invalid_action(api_client):
    """Verify executing an unsupported action returns 400 INVALID_ACTION."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "unsupported_magic_action"},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "INVALID_ACTION"


def test_actions_stage_requirements_not_met(api_client):
    """Verify advancing without fulfilling requirements returns 409."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "advance"},
    )
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "STAGE_REQUIREMENTS_NOT_MET"


def test_interrogate_suspect(api_client, monkeypatch):
    """Verify POST /api/v1/sessions/{id}/suspects/{suspect_id}/interrogate."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    mock_ask = MagicMock(
        return_value=AgentResponse(
            content="I was on exterior patrol near the perimeter.",
            status="success",
        )
    )
    monkeypatch.setattr(SuspectAgent, "ask", mock_ask)

    response = api_client.post(
        f"/api/v1/sessions/{sid}/suspects/Marcus Reed/interrogate",
        json={"message": "Where were you at 23:47?"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["suspect_id"] == "suspect_02"
    assert data["suspect_name"] == "Marcus Reed"
    assert "exterior patrol" in data["response"]
    assert data["status"] == "success"


def test_examine_evidence_endpoint_success(api_client, monkeypatch):
    """Verify POST /api/v1/sessions/{id}/evidence/{evidence_id}/examine."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # Discover evidence at location_01
    api_client.post(f"/api/v1/sessions/{sid}/actions", json={"action": "inspect"})

    mock_ask = MagicMock(
        return_value=AgentResponse(
            content="The log indicates an unauthorized credential token override.",
            status="success",
        )
    )
    monkeypatch.setattr(EvidenceAgent, "ask", mock_ask)

    response = api_client.post(
        f"/api/v1/sessions/{sid}/evidence/Security Access Log/examine"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["evidence"]["name"] == "Security Access Log"
    assert data["action_result"]["success"] is True
    assert data["analysis"]["status"] == "success"
    assert "override" in data["analysis"]["content"]


def test_examine_evidence_undiscovered_rejected(api_client):
    """Verify examining undiscovered evidence returns 409."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    response = api_client.post(f"/api/v1/sessions/{sid}/evidence/evidence_08/examine")
    assert response.status_code == 409
    data = response.json()
    assert data["error"]["code"] == "EVIDENCE_NOT_DISCOVERED"


def test_examine_evidence_lamatic_fallback(api_client, monkeypatch):
    """Verify examine returns structured unavailable status when Lamatic fails."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    api_client.post(f"/api/v1/sessions/{sid}/actions", json={"action": "inspect"})

    def mock_raise(*args, **kwargs):
        raise LamaticConnectionError("Lamatic cloud unreachable")

    monkeypatch.setattr(EvidenceAgent, "ask", mock_raise)

    response = api_client.post(f"/api/v1/sessions/{sid}/evidence/evidence_02/examine")
    assert response.status_code == 200
    data = response.json()
    assert data["action_result"]["success"] is True
    assert data["analysis"]["status"] == "unavailable"
    assert "Lamatic cloud unreachable" in data["analysis"]["error"]


def test_solve_case_correct_culprit(api_client):
    """Verify POST /api/v1/sessions/{id}/solve with correct culprit."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    solve_payload = {
        "culprit_id": "Sofia Bennett",
        "motive": "Exfiltrate Project ORION security architecture for a competitor.",
        "evidence_ids": ["evidence_03", "evidence_04", "evidence_05"],
        "reasoning": "Sofia used admin tokens and erased CCTV footage.",
        "timeline": "At 23:47 Sofia accessed Terminal B3 and exfiltrated files.",
    }
    response = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "solved"
    assert data["score"] > 0
    assert data["evaluation"]["culprit_identification"] == 30
    assert "feedback" in data


def test_solve_case_incorrect_culprit(api_client):
    """Verify POST /api/v1/sessions/{id}/solve with incorrect culprit."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    solve_payload = {
        "culprit_id": "Elena Marlow",
        "motive": "Argument about funding.",
        "evidence_ids": ["evidence_01"],
        "reasoning": "Elena was present.",
        "timeline": "She arrived at night.",
    }
    response = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("failed", "in_progress")
    assert data["evaluation"]["culprit_identification"] == 0


def test_solve_case_invalid_suspect(api_client):
    """Verify POST /api/v1/sessions/{id}/solve with nonexistent suspect returns 400."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    solve_payload = {
        "culprit_id": "Ghost Suspect",
        "motive": "N/A",
        "evidence_ids": [],
        "reasoning": "None",
        "timeline": "None",
    }
    response = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "INVALID_SOLUTION"


def test_solve_case_completed_session_rejected(api_client):
    """Verify submitting solve to an already completed session returns 409."""
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    solve_payload = {
        "culprit_id": "Sofia Bennett",
        "motive": "Corporate espionage.",
        "evidence_ids": [],
        "reasoning": "Deduction.",
        "timeline": "Timeline.",
    }
    # First solve succeeds
    resp1 = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert resp1.status_code == 200

    # Second solve rejected
    resp2 = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert resp2.status_code == 409
    data2 = resp2.json()
    assert data2["error"]["code"] == "SESSION_ALREADY_COMPLETED"
