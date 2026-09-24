from src.components.api_response.response import build_response


def test_build_response():
    data = {
        "content": "Continue the project.",
        "sources": [
            {
                "id": "1",
                "title": "First",
                "content": "A",
                "timestamp": "2026-08-23T10:00:00Z",
            }
        ],
    }

    result = build_response(data)

    assert result["status"] == "success"
    assert result["content"] == "Continue the project."
    assert result["sources"] == data["sources"]


def test_build_response_with_empty_sources():
    data = {
        "content": "No new updates.",
        "sources": [],
    }

    result = build_response(data)

    assert result["status"] == "success"
    assert result["content"] == "No new updates."
    assert result["sources"] == []