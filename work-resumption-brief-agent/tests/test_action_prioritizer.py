from src.components.action_prioritizer import prioritize_actions


def test_prioritize_high_priority_action():
    actions = [
        {
            "action": "Update project documentation",
            "priority": "low",
            "urgency": "low",
            "impact": "low",
            "source": "1",
        },
        {
            "action": "Fix production database issue",
            "priority": "high",
            "urgency": "high",
            "impact": "high",
            "source": "2",
        },
    ]

    result = prioritize_actions(actions)

    assert result[0]["action"] == "Fix production database issue"
    assert result[0]["priority"] == "HIGH"


def test_competing_actions_are_prioritized():
    actions = [
        {
            "action": "Prepare documentation",
            "priority": "low",
            "urgency": "low",
            "impact": "medium",
            "source": "1",
        },
        {
            "action": "Resolve blocked deployment",
            "priority": "high",
            "urgency": "high",
            "impact": "high",
            "source": "2",
        },
        {
            "action": "Review optional feature",
            "priority": "medium",
            "urgency": "low",
            "impact": "low",
            "source": "3",
        },
    ]

    result = prioritize_actions(actions)

    assert result[0]["action"] == "Resolve blocked deployment"
    assert result[1]["action"] == "Review optional feature"
    assert result[2]["action"] == "Prepare documentation"


def test_prioritization_preserves_action_information():
    actions = [
        {
            "action": "Resolve deployment issue",
            "priority": "high",
            "urgency": "high",
            "impact": "high",
            "source": "source-1",
        }
    ]

    result = prioritize_actions(actions)

    assert len(result) == 1
    assert result[0]["action"] == "Resolve deployment issue"
    assert result[0]["source"] == "source-1"
    assert result[0]["priority"] == "HIGH"


def test_empty_actions():
    result = prioritize_actions([])

    assert result == []


def test_low_priority_action_is_not_above_high_priority_action():
    actions = [
        {
            "action": "Low priority task",
            "priority": "low",
            "urgency": "low",
            "impact": "low",
            "source": "1",
        },
        {
            "action": "Critical task",
            "priority": "high",
            "urgency": "high",
            "impact": "high",
            "source": "2",
        },
    ]

    result = prioritize_actions(actions)

    assert result[0]["action"] == "Critical task"
    assert result[-1]["action"] == "Low priority task"