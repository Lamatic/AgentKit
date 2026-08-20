"""Milestone 7.5 - E2E API Gameplay Validation and Integration Test.

This test implements the complete investigation walkthrough for 'the_midnight_archive'
using the FastAPI TestClient, exercising the full game session lifecycle.
"""

from unittest.mock import MagicMock

import pytest

from app.core.config import settings
from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.schemas import AgentResponse
from app.lamatic.solution_evaluator import SolutionEvaluator
from app.lamatic.suspect_agent import SuspectAgent
from app.schemas.solution_evaluation import SolutionEvaluation

# Flag to verify if Lamatic credentials are present for the live test
HAS_LAMATIC_CREDENTIALS = (
    bool(settings.lamatic_endpoint)
    and bool(settings.lamatic_project_id)
    and bool(settings.lamatic_api_key)
    and "your-project" not in (settings.lamatic_endpoint or "")
    and "your-flow-id" not in (settings.lamatic_suspect_flow_id or "")
    and "your-flow-id" not in (settings.lamatic_evidence_flow_id or "")
    and "your-flow-id" not in (settings.lamatic_solution_flow_id or "")
    and settings.lamatic_api_key != "lt-f5fadeef-placeholder"
)


def test_e2e_gameplay_deterministic(api_client, monkeypatch):
    """Perform a full E2E gameplay walkthrough using deterministic mocks for Lamatic."""
    # Mock SuspectAgent ask
    mock_suspect_ask = MagicMock(
        side_effect=lambda knowledge, message, conversation_history=None: AgentResponse(
            content=f"Mock response from {knowledge.name} to: '{message}'",
            status="success",
        )
    )
    monkeypatch.setattr(SuspectAgent, "ask", mock_suspect_ask)

    # Mock EvidenceAgent ask
    mock_evidence_ask = MagicMock(
        side_effect=lambda knowledge, message=None, context=None: AgentResponse(
            content=f"Mock forensic analysis for {knowledge.name}.",
            status="success",
        )
    )
    monkeypatch.setattr(EvidenceAgent, "ask", mock_evidence_ask)

    # Mock SolutionEvaluator evaluate
    def _mock_eval(
        submission, player_scenario, objective_culprit_correct, context=None
    ):
        return SolutionEvaluation(
            culprit_correct=objective_culprit_correct,
            evidence_score=20 if objective_culprit_correct else 5,
            motive_score=15 if objective_culprit_correct else 0,
            reasoning_score=20 if objective_culprit_correct else 5,
            timeline_score=15 if objective_culprit_correct else 0,
            overall_score=100 if objective_culprit_correct else 10,
            strengths=["Excellent culprit identification and evidence alignment."],
            weaknesses=[],
            contradictions=[],
            feedback="Masterful case theory resolution.",
        )

    mock_evaluate = MagicMock(side_effect=_mock_eval)
    monkeypatch.setattr(SolutionEvaluator, "evaluate", mock_evaluate)

    # Run E2E walkthrough
    _run_walkthrough(api_client, monkeypatch=monkeypatch)


@pytest.mark.skipif(
    not HAS_LAMATIC_CREDENTIALS,
    reason="Lamatic integration test skipped: Credentials are not configured in .env.",
)
def test_e2e_gameplay_live(api_client):
    """Perform a full E2E gameplay walkthrough using live Lamatic endpoints."""
    # Run E2E walkthrough with no mocking of Lamatic
    _run_walkthrough(api_client, monkeypatch=None)


def _run_walkthrough(client, monkeypatch=None):
    """Walkthrough of the gameplay investigation lifecycle."""
    all_responses = []

    # ============================================================
    # 1. CREATE SESSION
    # ============================================================
    create_resp = client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    assert create_resp.status_code == 201
    create_json = create_resp.json()
    all_responses.append(create_json)

    session_id = create_json["session_id"]
    assert session_id
    assert create_json["scenario_id"] == "the_midnight_archive"
    assert create_json["status"] == "in_progress"
    assert create_json["stage"]["id"] == "stage_01"
    assert create_json["current_location"]["id"] == "location_01"
    assert create_json["score"] == 0

    # Ensure ground-truth secrets are not leaked on start
    for secret in ["culprit_id", "is_culprit", "solution_summary", "secret_timeline"]:
        assert secret not in create_json
        assert secret not in create_resp.text

    # ============================================================
    # 2. INITIAL AVAILABLE ACTIONS
    # ============================================================
    actions_resp = client.get(f"/api/v1/sessions/{session_id}/available-actions")
    assert actions_resp.status_code == 200
    actions_json = actions_resp.json()
    all_responses.append(actions_json)

    # Inspect is available initially, and the player can move to other locations
    assert actions_json["inspect"] is True
    move_ids = {loc["id"] for loc in actions_json["move"]}
    assert "location_02" in move_ids
    assert "location_01" not in move_ids  # cannot move to current location

    # Check that stage advancement and solution submission are not available initially
    assert actions_json["advance"]["available"] is False
    assert actions_json["solve"]["available"] is False

    # Check that future-stage content is not leaked in the initial available actions
    assert not actions_json["interrogate"]
    assert not actions_json["examine"]
    for suspect in ["Marcus Reed", "Nina Shah", "Sofia Bennett"]:
        assert suspect not in actions_resp.text
    for evidence in ["Security Access Log", "ORION Security Architecture Document"]:
        assert evidence not in actions_resp.text

    # ============================================================
    # 3. INVALID ACTION VALIDATION
    # ============================================================
    # A. Examine evidence that has not been discovered yet
    ex_undisc_resp = client.post(
        f"/api/v1/sessions/{session_id}/evidence/evidence_08/examine"
    )
    assert ex_undisc_resp.status_code == 409
    assert ex_undisc_resp.json()["error"]["code"] == "EVIDENCE_NOT_DISCOVERED"

    # B. Advance stage before requirements are met
    adv_invalid_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert adv_invalid_resp.status_code == 409
    assert adv_invalid_resp.json()["error"]["code"] == "STAGE_REQUIREMENTS_NOT_MET"

    # C. Move to locked/unavailable location
    # location_06 is initially locked in locations.json, so this must be rejected
    move_locked_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_06"},
    )
    assert move_locked_resp.status_code == 409
    assert move_locked_resp.json()["error"]["code"] == "LOCATION_LOCKED"
    assert (
        move_locked_resp.json()["error"]["lock_reason"]
        == "This location becomes accessible during Stage 5."
    )

    # D. Move to invalid location ID
    move_invalid_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "nonexistent_location_abc"},
    )
    assert move_invalid_resp.status_code == 400
    assert move_invalid_resp.json()["error"]["code"] == "INVALID_LOCATION"

    # Verify none of these mutated session state
    state_resp = client.get(f"/api/v1/sessions/{session_id}")
    assert state_resp.status_code == 200
    state_json = state_resp.json()
    assert state_json["current_location_id"] == "location_01"
    assert state_json["current_stage_id"] == "stage_01"
    assert state_json["score"] == 0

    # ============================================================
    # 4. STAGE 1 — ESTABLISH THE SCENE
    # ============================================================
    # 1. Inspect location_01
    inspect_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert inspect_resp.status_code == 200
    inspect_json = inspect_resp.json()
    all_responses.append(inspect_json)
    assert "evidence_02" in inspect_json["newly_discovered_evidence"]
    assert "evidence_06" in inspect_json["newly_discovered_evidence"]

    # 2. Move to location_02
    move_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_02"},
    )
    assert move_resp.status_code == 200
    move_json = move_resp.json()
    all_responses.append(move_json)
    assert move_json["state"]["current_location_id"] == "location_02"

    # 3. Inspect location_02
    inspect2_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert inspect2_resp.status_code == 200
    inspect2_json = inspect2_resp.json()
    all_responses.append(inspect2_json)
    assert "evidence_01" in inspect2_json["newly_discovered_evidence"]

    # Verify session status is still stage_01 but requirements are met
    session_resp = client.get(f"/api/v1/sessions/{session_id}")
    session_json = session_resp.json()
    all_responses.append(session_json)
    assert set(session_json["visited_location_ids"]) == {"location_01", "location_02"}
    assert set(session_json["discovered_evidence_ids"]) == {
        "evidence_01",
        "evidence_02",
        "evidence_06",
    }
    assert session_json["score"] == 30

    # 4. Advance Stage
    advance_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert advance_resp.status_code == 200
    advance_json = advance_resp.json()
    all_responses.append(advance_json)
    assert advance_json["state"]["current_stage_id"] == "stage_02"

    # ============================================================
    # 5. STAGE 2 — ARCHIVE ACCESS
    # ============================================================
    # Check available actions in Stage 2
    actions2_resp = client.get(f"/api/v1/sessions/{session_id}/available-actions")
    assert actions2_resp.status_code == 200
    actions2_json = actions2_resp.json()
    all_responses.append(actions2_json)

    examine_ids = {ev["id"] for ev in actions2_json["examine"]}
    assert "evidence_02" in examine_ids
    assert "evidence_06" in examine_ids
    interrogate_ids = {s["id"] for s in actions2_json["interrogate"]}
    assert "suspect_02" in interrogate_ids
    assert "suspect_03" in interrogate_ids

    # Ask suspect_02 several questions
    q1 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_02/interrogate",
        json={"message": "Where were you at 23:47?"},
    )
    assert q1.status_code == 200
    all_responses.append(q1.json())

    q2 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_02/interrogate",
        json={"message": "Why was your admin token used?"},
    )
    assert q2.status_code == 200
    all_responses.append(q2.json())

    q3 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_02/interrogate",
        json={"message": "Can anyone verify your alibi?"},
    )
    assert q3.status_code == 200
    all_responses.append(q3.json())

    # Ask suspect_03 (Nina Shah)
    q3_1 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_03/interrogate",
        json={"message": "Where were you at 23:47?"},
    )
    assert q3_1.status_code == 200
    all_responses.append(q3_1.json())

    # Verify conversation history isolation by inspecting the history log
    hist_resp = client.get(f"/api/v1/sessions/{session_id}/history")
    assert hist_resp.status_code == 200
    hist_json = hist_resp.json()
    all_responses.append(hist_json)

    dialogue_events = [e for e in hist_json if e["event_type"] == "INTERVIEW_DIALOGUE"]
    s2_dialogue = [e for e in dialogue_events if e["target_id"] == "suspect_02"]
    s3_dialogue = [e for e in dialogue_events if e["target_id"] == "suspect_03"]
    assert len(s2_dialogue) == 3
    assert len(s3_dialogue) == 1

    # Advance stage to stage_03
    advance2_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert advance2_resp.status_code == 200
    assert advance2_resp.json()["state"]["current_stage_id"] == "stage_03"

    # ============================================================
    # 6. EVIDENCE AGENT VALIDATION
    # ============================================================
    # Examine discovered evidence items
    for ev_id in ["evidence_01", "evidence_02", "evidence_06"]:
        ex_resp = client.post(f"/api/v1/sessions/{session_id}/evidence/{ev_id}/examine")
        assert ex_resp.status_code == 200
        ex_json = ex_resp.json()
        all_responses.append(ex_json)
        assert ex_json["evidence"]["evidence_id"] == ev_id
        assert ex_json["analysis"]["status"] == "success"

        # Verify confidentiality: observations only, no ground-truth leak
        for secret in [
            "is_culprit",
            "culprit_id",
            "solution_summary",
            "secret_timeline",
        ]:
            assert secret not in ex_resp.text

    # Undiscovered evidence (evidence_08) still cannot be examined
    ex_undisc2_resp = client.post(
        f"/api/v1/sessions/{session_id}/evidence/evidence_08/examine"
    )
    assert ex_undisc2_resp.status_code == 409

    # ============================================================
    # 7. STAGE 3 — SECURITY SYSTEMS
    # ============================================================
    # Move to location_03 (Server Control Lab)
    move3_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_03"},
    )
    assert move3_resp.status_code == 200

    # Inspect location_03
    inspect3_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert inspect3_resp.status_code == 200
    inspect3_json = inspect3_resp.json()
    all_responses.append(inspect3_json)
    assert "evidence_03" in inspect3_json["newly_discovered_evidence"]
    assert "evidence_04" in inspect3_json["newly_discovered_evidence"]

    # Examine evidence_03 and evidence_04
    for ev_id in ["evidence_03", "evidence_04"]:
        ex_resp = client.post(f"/api/v1/sessions/{session_id}/evidence/{ev_id}/examine")
        assert ex_resp.status_code == 200

    # Advance stage to Stage 4
    advance3_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert advance3_resp.status_code == 200
    assert advance3_resp.json()["state"]["current_stage_id"] == "stage_04"

    # Verify actions reflect the current state (no future-stage leak)
    actions3_resp = client.get(f"/api/v1/sessions/{session_id}/available-actions")
    assert actions3_resp.status_code == 200
    actions3_json = actions3_resp.json()
    all_responses.append(actions3_json)
    s_ids = {s["id"] for s in actions3_json["interrogate"]}
    assert "suspect_01" in s_ids
    assert "suspect_04" in s_ids
    assert "suspect_05" in s_ids

    # ============================================================
    # 8. STAGE 4 — SUSPECT INVESTIGATION
    # ============================================================
    # Move to location_04 (Systems Engineering Hub)
    move4_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_04"},
    )
    assert move4_resp.status_code == 200

    # Inspect location_04
    inspect4_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert inspect4_resp.status_code == 200
    inspect4_json = inspect4_resp.json()
    all_responses.append(inspect4_json)
    assert "evidence_05" in inspect4_json["newly_discovered_evidence"]

    # Interview suspect_01, suspect_04, suspect_05
    client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_01/interrogate",
        json={"message": "Where were you?"},
    )
    client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_04/interrogate",
        json={"message": "Where were you?"},
    )

    # Interrogate Sofia Bennett (suspect_05) with multiple questions
    bennett_q1 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_05/interrogate",
        json={"message": "What is your role here?"},
    )
    assert bennett_q1.status_code == 200
    all_responses.append(bennett_q1.json())

    bennett_q2 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_05/interrogate",
        json={"message": "Where were you between 23:45 and 23:55?"},
    )
    assert bennett_q2.status_code == 200
    all_responses.append(bennett_q2.json())

    # Verify she acts as character and does not leak
    # is_culprit, culprit_id, hidden motive, etc.
    for text in [bennett_q1.text, bennett_q2.text]:
        for secret in [
            "is_culprit",
            "culprit_id",
            "solution_summary",
            "secret_timeline",
        ]:
            assert secret not in text

    # Advance stage to Stage 5
    advance4_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert advance4_resp.status_code == 200
    assert advance4_resp.json()["state"]["current_stage_id"] == "stage_05"

    # ============================================================
    # 9. STAGE 5 — TIMELINE RECONSTRUCTION
    # ============================================================
    # Move to location_06 (Secure Databank Vault)
    move5_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_06"},
    )
    assert move5_resp.status_code == 200

    # Inspect location_06
    inspect5_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert inspect5_resp.status_code == 200
    inspect5_json = inspect5_resp.json()
    all_responses.append(inspect5_json)
    assert "evidence_08" in inspect5_json["newly_discovered_evidence"]

    # Advance stage to Stage 6
    advance5_resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert advance5_resp.status_code == 200
    assert advance5_resp.json()["state"]["current_stage_id"] == "stage_06"

    # ============================================================
    # 10. SOLUTION BRIEFING
    # ============================================================
    final_session_resp = client.get(f"/api/v1/sessions/{session_id}")
    final_context_resp = client.get(f"/api/v1/sessions/{session_id}/context")
    final_actions_resp = client.get(f"/api/v1/sessions/{session_id}/available-actions")

    assert final_session_resp.status_code == 200
    assert final_context_resp.status_code == 200
    assert final_actions_resp.status_code == 200

    final_state = final_session_resp.json()
    final_context = final_context_resp.json()
    final_actions = final_actions_resp.json()

    all_responses.extend([final_state, final_context, final_actions])

    # Final actions should allow solution submission
    assert final_actions["solve"]["available"] is True

    # Final player-facing context should contain all progress info
    assert final_context["discovered_evidence"]
    assert final_context["interviewed_suspects"]
    assert final_context["visited_locations"]
    assert final_context["public_suspects"]
    assert final_context["investigation_history"]
    assert final_context["current_stage_id"] == "stage_06"
    assert (
        final_context["score"] == 120
    )  # 7 evidence items discovered + 5 suspects interviewed

    # Final player-facing context must not leak backend-only secrets
    for secret in ["culprit_id", "is_culprit", "solution_summary", "secret_timeline"]:
        assert secret not in final_context_resp.text
        assert secret not in final_session_resp.text

    # ============================================================
    # 11. SOLUTION EVALUATION
    # ============================================================
    solve_payload = {
        "culprit_id": "suspect_05",  # Sofia Bennett
        "motive": (
            "Financial compensation from a corporate rival to exfiltrate "
            "Project ORION security specifications."
        ),
        "evidence_ids": [
            "evidence_02",
            "evidence_03",
            "evidence_05",
            "evidence_06",
            "evidence_08",
        ],
        "reasoning": (
            "Sofia remotely manipulated system logs, disabled CCTV, and "
            "accessed the databank using Marcus's reflashed admin token."
        ),
        "timeline": (
            "Between 23:45 and 23:55 she suppressed video feeds, "
            "exfiltrated files at 23:48, and knocked out Dr. Vale."
        ),
    }

    solve_resp = client.post(f"/api/v1/sessions/{session_id}/solve", json=solve_payload)
    assert solve_resp.status_code == 200
    solve_json = solve_resp.json()
    all_responses.append(solve_json)

    assert solve_json["status"] == "solved"
    assert solve_json["score"] > 120
    assert solve_json["evaluation"]["culprit_identification"] == 30
    assert solve_json["feedback"]

    # Verify that solution response does not leak secret ground truths
    for secret in ["solution_summary", "secret_timeline"]:
        assert secret not in solve_resp.text

    # ============================================================
    # 12. POST-SOLUTION PROTECTION
    # ============================================================
    # Attempting any action now should fail with SESSION_ALREADY_COMPLETED
    p1 = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_01"},
    )
    assert p1.status_code == 409
    assert p1.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    p2 = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert p2.status_code == 409
    assert p2.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    p3 = client.post(
        f"/api/v1/sessions/{session_id}/suspects/suspect_02/interrogate",
        json={"message": "hello"},
    )
    assert p3.status_code == 409
    assert p3.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    p4 = client.post(f"/api/v1/sessions/{session_id}/evidence/evidence_01/examine")
    assert p4.status_code == 409
    assert p4.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    p5 = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert p5.status_code == 409
    assert p5.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    p6 = client.post(f"/api/v1/sessions/{session_id}/solve", json=solve_payload)
    assert p6.status_code == 409
    assert p6.json()["error"]["code"] == "SESSION_ALREADY_COMPLETED"

    # ============================================================
    # 13. FINAL HISTORY VALIDATION
    # ============================================================
    final_hist_resp = client.get(f"/api/v1/sessions/{session_id}/history")
    assert final_hist_resp.status_code == 200
    final_hist_json = final_hist_resp.json()
    all_responses.append(final_hist_json)

    # Verify events
    for event in final_hist_json:
        assert event["session_id"] == session_id
        assert event["event_type"]
        assert "target_type" in event
        assert "target_id" in event
        assert event["timestamp"]
        assert "result_data" in event

        # Ensure audit history does not leak hidden fields
        for secret in ["is_culprit", "solution_summary", "secret_timeline"]:
            assert secret not in str(event["result_data"])

    # ============================================================
    # 14. CONFIDENTIALITY SWEEP
    # ============================================================
    def sweep_recursive(data):
        if isinstance(data, dict):
            for k, v in data.items():
                assert k != "is_secret", f"Found sensitive key '{k}' in response data"
                assert k != "hidden_evidence", (
                    f"Found sensitive key '{k}' in response data"
                )
                if k == "is_culprit":
                    assert v is not True, "Found is_culprit = True in response data"
                sweep_recursive(v)
        elif isinstance(data, list):
            for item in data:
                sweep_recursive(item)
        elif isinstance(data, str):
            # Verify no secret timeline leaks
            assert "secret_timeline" not in data
            assert "is_secret" not in data

    for resp in all_responses:
        sweep_recursive(resp)
