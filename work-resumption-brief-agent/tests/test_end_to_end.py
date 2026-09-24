import pytest

from src.agent import WorkResumptionAgent


@pytest.fixture
def agent():
    return WorkResumptionAgent()


def test_end_to_end_scenario_1_contradictions(agent):
    """Full pipeline with contradictory sources."""

    inputs = {
        "pr_comments": [
            {
                "timestamp": "2024-08-18T09:00:00Z",
                "text": "Resume parser incomplete",
                "pr_number": 42,
                "author": "bob",
            }
        ],
        "commits": [
            {
                "timestamp": "2024-08-18T10:00:00Z",
                "message": "Implement resume parser",
                "hash": "abc123",
                "author": "alice",
            }
        ],
        "meeting_notes": [
            {
                "timestamp": "2024-08-18T14:00:00Z",
                "text": "Resume parsing work is complete",
                "participants": ["alice", "bob"],
            }
        ],
    }

    brief = agent.process(inputs)

    assert brief is not None
    assert len(brief.current_state) > 0
    assert len(brief.conflicts) > 0
    assert brief.recommended_first_action is not None
    assert brief.confidence_overall > 0

    conflict = brief.conflicts[0]

    assert "incomplete" in conflict.claim_old.lower()
    assert "complete" in conflict.claim_new.lower()


def test_end_to_end_scenario_2_no_conflicts(agent):
    """Full pipeline with consistent sources."""

    inputs = {
        "commits": [
            {
                "timestamp": "2024-08-18T10:00:00Z",
                "message": "Resume parser added",
                "hash": "abc123",
                "author": "alice",
            },
            {
                "timestamp": "2024-08-18T11:00:00Z",
                "message": "Resume parser tests added",
                "hash": "def456",
                "author": "alice",
            },
        ]
    }

    brief = agent.process(inputs)

    assert brief is not None
    assert len(brief.conflicts) == 0
    assert len(brief.current_state) > 0


def test_end_to_end_insufficient_evidence(agent):
    """Full pipeline with minimal evidence."""

    inputs = {
        "todos": [
            {
                "text": "Add benchmarks",
                "file": "src/main.py",
                "line": 42,
                "timestamp": "2024-08-18T10:00:00Z",
            }
        ]
    }

    brief = agent.process(inputs)

    assert brief is not None
    assert brief.confidence_overall < 50


def test_pipeline_handles_empty_input(agent):
    """Test that empty input is handled gracefully."""

    inputs = {}

    brief = agent.process(inputs)

    assert brief is not None