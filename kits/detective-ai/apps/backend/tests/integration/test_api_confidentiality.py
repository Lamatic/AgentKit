"""Security and confidentiality integration tests for DetectiveAI API endpoints."""

from unittest.mock import MagicMock

from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.schemas import AgentResponse
from app.lamatic.suspect_agent import SuspectAgent

GROUND_TRUTH_SECRETS = [
    "is_culprit",
    "culprit_id",
    "solution_summary",
    "secret_timeline",
    "Secretly contracted by a corporate rival",
    "Exfiltrate Project ORION security architecture specifications",
]


def test_api_confidentiality_across_all_endpoints(api_client, monkeypatch):
    """Verify zero ground truth leak across all player-facing API endpoints."""
    # 1. GET /api/v1/scenarios
    scenarios_resp = api_client.get("/api/v1/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios_str = scenarios_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in scenarios_str

    # 2. GET /api/v1/scenarios/{id}
    scen_resp = api_client.get("/api/v1/scenarios/the_midnight_archive")
    assert scen_resp.status_code == 200
    scen_str = scen_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in scen_str

    # 3. POST /api/v1/sessions
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    assert start_resp.status_code == 201
    sid = start_resp.json()["session_id"]
    start_str = start_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in start_str

    # 4. GET /api/v1/sessions/{id}
    state_resp = api_client.get(f"/api/v1/sessions/{sid}")
    assert state_resp.status_code == 200
    state_str = state_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in state_str

    # 4.5. GET /api/v1/sessions/{id}/state (new endpoint)
    p_state_resp = api_client.get(f"/api/v1/sessions/{sid}/state")
    assert p_state_resp.status_code == 200
    p_state_str = p_state_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in p_state_str

    # 5. GET /api/v1/sessions/{id}/context
    ctx_resp = api_client.get(f"/api/v1/sessions/{sid}/context")
    assert ctx_resp.status_code == 200
    ctx_str = ctx_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in ctx_str

    # 6. GET /api/v1/sessions/{id}/available-actions
    actions_resp = api_client.get(f"/api/v1/sessions/{sid}/available-actions")
    assert actions_resp.status_code == 200
    actions_str = actions_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in actions_str

    # 7. POST /api/v1/sessions/{id}/actions (inspect)
    act_resp = api_client.post(
        f"/api/v1/sessions/{sid}/actions", json={"action": "inspect"}
    )
    assert act_resp.status_code == 200
    act_str = act_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in act_str

    # 8. POST /api/v1/sessions/{id}/suspects/{suspect_id}/interrogate
    monkeypatch.setattr(
        SuspectAgent,
        "ask",
        MagicMock(
            return_value=AgentResponse(
                content="I don't know anything about missing files.",
                status="success",
            )
        ),
    )
    interrogate_resp = api_client.post(
        f"/api/v1/sessions/{sid}/suspects/Marcus Reed/interrogate",
        json={"message": "What did you do?"},
    )
    assert interrogate_resp.status_code == 200
    interrogate_str = interrogate_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in interrogate_str

    # 9. POST /api/v1/sessions/{id}/evidence/{evidence_id}/examine
    monkeypatch.setattr(
        EvidenceAgent,
        "ask",
        MagicMock(
            return_value=AgentResponse(
                content="Forensic examination indicates digital override.",
                status="success",
            )
        ),
    )
    examine_resp = api_client.post(
        f"/api/v1/sessions/{sid}/evidence/Security Access Log/examine"
    )
    assert examine_resp.status_code == 200
    examine_str = examine_resp.text
    for secret in GROUND_TRUTH_SECRETS:
        assert secret not in examine_str

    # 10. POST /api/v1/sessions/{id}/solve
    solve_payload = {
        "culprit_id": "Marcus Reed",
        "motive": "Access issues",
        "evidence_ids": ["evidence_02"],
        "reasoning": "He logged into the terminal.",
        "timeline": "Midnight.",
    }
    solve_resp = api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)
    assert solve_resp.status_code == 200
    solve_str = solve_resp.text
    # Verify evaluation returned without leaking the true culprit or solution summary
    assert "evaluation" in solve_str
    assert "feedback" in solve_str
    assert "solution_summary" not in solve_str
    assert "Sofia Bennett" not in solve_str
    assert "Secretly contracted" not in solve_str
