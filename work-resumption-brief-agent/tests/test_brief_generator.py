from src.components.brief_generator import generate_brief


def test_generate_brief_returns_string():
    actions = [
        {
            "action": "Task one",
            "impact": "HIGH",
            "urgency": "HIGH",
            "confidence": 0.9,
        },
        {
            "action": "Task two",
            "impact": "MEDIUM",
            "urgency": "LOW",
            "confidence": 0.7,
        },
    ]

    result = generate_brief(actions)

    assert isinstance(result, str)
    assert len(result) > 0


def test_generate_brief_contains_actions():
    actions = [
        {
            "action": "Task one",
            "impact": "HIGH",
            "urgency": "HIGH",
            "confidence": 0.9,
        },
        {
            "action": "Task two",
            "impact": "MEDIUM",
            "urgency": "LOW",
            "confidence": 0.7,
        },
    ]

    result = generate_brief(actions)

    assert "Task one" in result
    assert "Task two" in result


def test_generate_brief_handles_empty_actions():
    result = generate_brief([])

    assert isinstance(result, str)
    assert len(result) > 0