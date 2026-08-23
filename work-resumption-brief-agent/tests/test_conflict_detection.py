from src.components.conflict_detection.detector import detect_conflicts


def test_detect_conflicts():
    sources = [
        {
            "id": "1",
            "timestamp": "2026-08-23T10:00:00Z",
            "content": "Project is on track",
        },
        {
            "id": "2",
            "timestamp": "2026-08-23T10:00:00Z",
            "content": "Project is delayed",
        },
    ]

    result = detect_conflicts(sources)

    assert len(result) == 1
    assert result[0]["timestamp"] == "2026-08-23T10:00:00Z"
    assert result[0]["sources"] == ["1", "2"]


def test_no_conflict_for_different_timestamps():
    sources = [
        {
            "id": "1",
            "timestamp": "2026-08-23T10:00:00Z",
            "content": "Project is on track",
        },
        {
            "id": "2",
            "timestamp": "2026-08-23T11:00:00Z",
            "content": "Project is delayed",
        },
    ]

    result = detect_conflicts(sources)

    assert result == []