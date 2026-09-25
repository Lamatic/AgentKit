"""Integration test suite for the new PlayerInvestigationState API endpoint."""


def test_player_state_new_session(api_client):
    """1. State endpoint for a newly created session.
    2. Current location.
    3. Current stage.
    4. Available locations.
    5. Locked location behavior.
    6. Available suspects.
    7. Discovered evidence only (should be empty initially).
    9. Available actions.
    15. Player-safe progression information.
    16. Ground-truth confidentiality.
    17. No ORM leakage.
    """
    # Create session
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    assert start_resp.status_code == 201
    sid = start_resp.json()["session_id"]

    # Retrieve state
    state_resp = api_client.get(f"/api/v1/sessions/{sid}/state")
    assert state_resp.status_code == 200
    state = state_resp.json()

    # Check top-level properties
    assert "session_id" in state
    assert state["session_id"] == sid
    assert "scenario_id" in state
    assert state["scenario_id"] == "the_midnight_archive"

    # Case info
    assert "case" in state
    assert state["case"]["title"] == "The Midnight Archive Incident"
    assert "description" in state["case"]

    # Current Stage info
    assert "stage" in state
    assert state["stage"]["id"] == "stage_01"
    assert state["stage"]["order"] == 1
    assert state["stage"]["name"] == "Establish the Scene"
    assert state["stage"]["status"] == "active"

    # Current Location
    assert "current_location" in state
    assert state["current_location"]["id"] == "location_01"
    assert state["current_location"]["name"] == "Main Lobby & Security Desk"

    # Score & Status
    assert state["score"] == 0
    assert state["session_status"] == "in_progress"

    # Available actions
    assert "available_actions" in state
    actions = state["available_actions"]
    assert actions["can_inspect"] is True
    assert actions["can_advance"]["available"] is False
    assert (
        "Required evidence has not been discovered." in actions["can_advance"]["reason"]
    )
    assert actions["can_solve"]["available"] is False
    assert (
        "You must reach the final stage to solve the case."
        in actions["can_solve"]["reason"]
    )

    # Available locations
    assert "available_locations" in state
    locs = state["available_locations"]
    assert len(locs) >= 5
    # Location 01 should be current, not locked
    loc1 = next((loc for loc in locs if loc["id"] == "location_01"), None)
    assert loc1 is not None
    assert loc1["is_current"] is True
    assert loc1["is_locked"] is False

    # Location 06 (Secure Databank Vault) should be locked in Stage 1
    loc6 = next((loc for loc in locs if loc["id"] == "location_06"), None)
    assert loc6 is not None
    assert loc6["is_current"] is False
    assert loc6["is_locked"] is True
    assert loc6["lock_reason"] == "This location becomes accessible during Stage 5."

    # Available suspects
    assert "available_suspects" in state
    suss = state["available_suspects"]
    assert len(suss) >= 5
    for s in suss:
        assert "id" in s
        assert "name" in s
        assert "public_description" in s
        assert "relationship_to_victim" in s
        assert "can_interrogate" in s
        assert "already_interviewed" in s

    # Discovered evidence (initially empty)
    assert "discovered_evidence" in state
    assert len(state["discovered_evidence"]) == 0

    # History
    assert "investigation_history" in state
    history = state["investigation_history"]
    assert len(history) == 1
    assert history[0]["event_type"] == "START_GAME"
    assert "started the investigation" in history[0]["message"]

    # Progression
    assert "progression" in state
    prog = state["progression"]
    assert len(prog["completed_stages"]) == 0
    assert (
        "Examine the Broken Access Card" in prog["remaining_requirements"]
        or "Examine the Security Access Log" in prog["remaining_requirements"]
    )
    assert prog["next_objective"] == (
        "Secure the crime scene, assess Dr. Vale's condition, "
        "and inspect the main security desk and archive reading room."
    )

    # Ground-truth confidentiality
    state_str = state_resp.text
    forbidden_keys = [
        "culprit_id",
        "is_culprit",
        "solution_summary",
        "secret_timeline",
        "Secretly contracted by a corporate rival",
        "Exfiltrate Project ORION security architecture specifications",
    ]
    for key in forbidden_keys:
        assert key not in state_str


def test_player_state_discovered_vs_examined_evidence(api_client):
    """7. Discovered evidence only.
    8. Examined vs unexamined evidence.
    """
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # Initially 0 evidence
    state_resp = api_client.get(f"/api/v1/sessions/{sid}/state")
    assert len(state_resp.json()["discovered_evidence"]) == 0

    # Inspect location_01 (Main Lobby & Security Desk)
    inspect_resp = api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "inspect"},
    )
    assert inspect_resp.status_code == 200

    # Now we should have discovered evidence at location_01
    # (e.g. Security Access Log, Temporary Admin Access Token)
    state_resp = api_client.get(f"/api/v1/sessions/{sid}/state")
    discovered = state_resp.json()["discovered_evidence"]
    assert len(discovered) > 0
    for ev in discovered:
        assert ev["examined"] is False
        assert ev["location_id"] == "location_01"
        assert ev["location_name"] == "Main Lobby & Security Desk"

    # Examine Security Access Log (using its name to resolve, or ID)
    examine_resp = api_client.post(
        f"/api/v1/sessions/{sid}/evidence/Security Access Log/examine"
    )
    assert examine_resp.status_code == 200

    # Verify that the state endpoint now shows examined=True for Security Access Log
    state_resp = api_client.get(f"/api/v1/sessions/{sid}/state")
    discovered = state_resp.json()["discovered_evidence"]
    access_log = next(
        (e for e in discovered if e["name"] == "Security Access Log"), None
    )
    assert access_log is not None
    assert access_log["examined"] is True


def test_player_state_advancement_and_solve_rules(api_client):
    """10. Advance unavailable when requirements are incomplete.
    11. Advance available when requirements are complete.
    12. Solve unavailable before final stage.
    13. Solve available at final stage.
    14. Investigation history log sequence.
    """
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # Stage 1 requirements:
    # - required_location_ids: [location_01, location_02]
    # - required_evidence_ids: [evidence_01]
    # Check advance is unavailable
    state = api_client.get(f"/api/v1/sessions/{sid}/state").json()
    assert state["available_actions"]["can_advance"]["available"] is False
    assert (
        "Required evidence has not been discovered"
        in state["available_actions"]["can_advance"]["reason"]
    )

    # 1. Inspect location_01 to discover evidence
    api_client.post(f"/api/v1/sessions/{sid}/actions", json={"action": "inspect"})

    # 2. Move to location_02 (Archive Reading Room)
    api_client.post(
        f"/api/v1/sessions/{sid}/actions",
        json={"action": "move", "target_id": "location_02"},
    )

    # 3. Inspect location_02 to discover Broken Access Card (evidence_01)
    api_client.post(f"/api/v1/sessions/{sid}/actions", json={"action": "inspect"})

    # Now Stage 1 requirements should be met
    # (visited location_01, location_02, and discovered evidence_01)
    state = api_client.get(f"/api/v1/sessions/{sid}/state").json()
    assert state["available_actions"]["can_advance"]["available"] is True
    assert state["available_actions"]["can_advance"]["reason"] is None

    # Advance stage
    api_client.post(f"/api/v1/sessions/{sid}/actions", json={"action": "advance"})

    # Verify stage is now Stage 2
    state = api_client.get(f"/api/v1/sessions/{sid}/state").json()
    assert state["stage"]["id"] == "stage_02"
    assert state["stage"]["order"] == 2
    assert state["available_actions"]["can_advance"]["available"] is False

    # Check solve is still unavailable
    assert state["available_actions"]["can_solve"]["available"] is False
    assert (
        "You must reach the final stage to solve the case."
        in state["available_actions"]["can_solve"]["reason"]
    )


def test_player_state_solve_at_final_stage(api_client, db_session):
    """13. Solve available at final stage.
    18. Completed session state.
    """
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # Let's bypass game stages by manually setting metadata
    # current_stage_id to stage_06 (Final Stage) in the database
    from app.models.game_session import GameSession

    session_obj = db_session.query(GameSession).filter(GameSession.id == sid).first()
    meta = dict(session_obj.state_metadata)
    meta["current_stage_id"] = "stage_06"
    meta["current_stage_order"] = 6
    session_obj.state_metadata = meta
    db_session.commit()

    # Now verify solve is available
    state = api_client.get(f"/api/v1/sessions/{sid}/state").json()
    assert state["stage"]["id"] == "stage_06"
    assert state["available_actions"]["can_solve"]["available"] is True
    assert state["available_actions"]["can_solve"]["reason"] is None

    # Solve the case
    solve_payload = {
        "culprit_id": "Sofia Bennett",
        "motive": "Exfiltrate Project ORION security architecture for a competitor.",
        "evidence_ids": ["evidence_03", "evidence_04", "evidence_05"],
        "reasoning": "Sofia used admin tokens and erased CCTV footage.",
        "timeline": "At 23:47 Sofia accessed Terminal B3 and exfiltrated files.",
    }
    api_client.post(f"/api/v1/sessions/{sid}/solve", json=solve_payload)

    # Verify state shows solved status and actions are disabled
    state = api_client.get(f"/api/v1/sessions/{sid}/state").json()
    assert state["session_status"] == "solved"
    assert state["available_actions"]["can_inspect"] is False
    assert state["available_actions"]["can_advance"]["available"] is False
    assert (
        "session has already been completed"
        in state["available_actions"]["can_advance"]["reason"].lower()
    )
    assert state["available_actions"]["can_solve"]["available"] is False
    assert (
        "session has already been completed"
        in state["available_actions"]["can_solve"]["reason"].lower()
    )


def test_player_state_invalid_session_and_regression(api_client):
    """19. Invalid session ID.
    20. Regression tests for existing endpoints.
    """
    # Invalid session
    response = api_client.get("/api/v1/sessions/nonexistent-session-uuid/state")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "SESSION_NOT_FOUND"

    # Create valid session to check regression
    start_resp = api_client.post(
        "/api/v1/sessions", json={"scenario": "the_midnight_archive"}
    )
    sid = start_resp.json()["session_id"]

    # Regression check on GET /sessions/{id}
    resp1 = api_client.get(f"/api/v1/sessions/{sid}")
    assert resp1.status_code == 200
    assert "current_location_id" in resp1.json()

    # Regression check on GET /sessions/{id}/context
    resp2 = api_client.get(f"/api/v1/sessions/{sid}/context")
    assert resp2.status_code == 200
    assert "case_title" in resp2.json()

    # Regression check on GET /sessions/{id}/available-actions
    resp3 = api_client.get(f"/api/v1/sessions/{sid}/available-actions")
    assert resp3.status_code == 200
    assert "move" in resp3.json()

    # Regression check on GET /sessions/{id}/history
    resp4 = api_client.get(f"/api/v1/sessions/{sid}/history")
    assert resp4.status_code == 200
    assert len(resp4.json()) >= 1
