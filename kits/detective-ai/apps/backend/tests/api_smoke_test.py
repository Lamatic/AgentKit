"""Programmatic manual API smoke test for Milestone 8."""

import sys

from fastapi.testclient import TestClient

from app.main import app


def run_smoke_test():
    client = TestClient(app)

    print("\n--- 1. Create a new session for the_midnight_archive ---")
    resp = client.post("/api/v1/sessions", json={"scenario": "the_midnight_archive"})
    assert resp.status_code == 201, f"Failed to create session: {resp.text}"
    session_data = resp.json()
    session_id = session_data["session_id"]
    print(f"Session created with ID: {session_id}")

    print("\n--- 2. GET /state (Initial) ---")
    resp = client.get(f"/api/v1/sessions/{session_id}/state")
    assert resp.status_code == 200, f"Failed to get state: {resp.text}"
    state = resp.json()

    # 3. Verify Stage 1
    print(f"Current Stage: {state['stage']['id']} (Order: {state['stage']['order']})")
    assert state["stage"]["id"] == "stage_01", (
        f"Expected stage_01, got {state['stage']['id']}"
    )

    # 4. Verify location_06 is locked
    locs = state["available_locations"]
    loc_06 = next((loc for loc in locs if loc["id"] == "location_06"), None)
    assert loc_06 is not None, "location_06 not found in available_locations"
    print(
        f"Location 06 Locked: {loc_06['is_locked']} (Reason: {loc_06['lock_reason']})"
    )
    assert loc_06["is_locked"] is True, "Location 06 should be locked"
    assert loc_06["lock_reason"] == "This location becomes accessible during Stage 5."

    # Inspect actions before inspect
    actions = state["available_actions"]
    assert actions["can_inspect"] is True
    assert actions["can_advance"]["available"] is False
    adv_reason = actions["can_advance"]["reason"]
    print(
        f"Can Inspect: {actions['can_inspect']}, "
        f"Can Advance: {actions['can_advance']['available']} "
        f"(Reason: {adv_reason})"
    )

    # 5. Inspect current location (location_01)
    print("\n--- 5. Inspect current location ---")
    resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert resp.status_code == 200, f"Failed inspect: {resp.text}"
    print(f"Inspect response message: {resp.json()['message']}")

    # 6. Move to Archive Reading Room (location_02)
    print("\n--- 6. Move to Archive Reading Room ---")
    resp = client.post(
        f"/api/v1/sessions/{session_id}/actions",
        json={"action": "move", "target_id": "location_02"},
    )
    assert resp.status_code == 200, f"Failed move: {resp.text}"
    print(f"Moved to location: {resp.json()['state']['current_location_id']}")

    # 7. Inspect location_02
    print("\n--- 7. Inspect location_02 ---")
    resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "inspect"}
    )
    assert resp.status_code == 200, f"Failed inspect: {resp.text}"
    print(f"Inspect response message: {resp.json()['message']}")

    # Check if stage advancement is now ready
    resp = client.get(f"/api/v1/sessions/{session_id}/state")
    state = resp.json()
    print(f"Can Advance now: {state['available_actions']['can_advance']['available']}")
    assert state["available_actions"]["can_advance"]["available"] is True, (
        "Should be ready to advance now"
    )

    # 8. Advance Stage
    print("\n--- 8. Advance Stage ---")
    resp = client.post(
        f"/api/v1/sessions/{session_id}/actions", json={"action": "advance"}
    )
    assert resp.status_code == 200, f"Failed advance: {resp.text}"
    print(f"Advance response message: {resp.json()['message']}")

    # 9. GET /state again
    print("\n--- 9. GET /state (After Advance) ---")
    resp = client.get(f"/api/v1/sessions/{session_id}/state")
    assert resp.status_code == 200, f"Failed to get state after advance: {resp.text}"
    state = resp.json()

    # 10. Verify state changed correctly
    print(
        f"Current Stage after advance: {state['stage']['id']} "
        f"(Order: {state['stage']['order']})"
    )
    assert state["stage"]["id"] == "stage_02", (
        f"Expected stage_02, got {state['stage']['id']}"
    )

    # 11. Verify newly discovered evidence appears
    evs = state["discovered_evidence"]
    print("Discovered evidence items:")
    for ev in evs:
        print(f"  - [{ev['type'].upper()}] {ev['name']} (Examined: {ev['examined']})")
    # In Stage 2, Broken Access Card, Security Access Log, and
    # Temporary Admin Access Token should be in discovered evidence.
    assert len(evs) >= 3, "Expected at least 3 discovered evidence items"

    # 12. Verify unavailable actions remain unavailable where appropriate
    actions = state["available_actions"]
    adv_act = actions["can_advance"]
    sol_act = actions["can_solve"]
    print(
        f"Can Advance (Stage 2): {adv_act['available']} (Reason: {adv_act['reason']})"
    )
    print(f"Can Solve (Stage 2): {sol_act['available']} (Reason: {sol_act['reason']})")
    assert actions["can_advance"]["available"] is False, (
        "Advance should be locked in Stage 2"
    )
    assert actions["can_solve"]["available"] is False, (
        "Solve should be locked in Stage 2"
    )

    print("\n=============================================")
    print("      ALL API SMOKE TEST CHECKS PASSED!")
    print("=============================================\n")


if __name__ == "__main__":
    try:
        run_smoke_test()
    except AssertionError as err:
        print(f"\nTEST FAILED: {err}")
        sys.exit(1)
