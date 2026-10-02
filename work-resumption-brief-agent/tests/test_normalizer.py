from src.components.source_normalizer.normalizer import normalize_source, normalize_sources


def test_normalize_source():
    source = {
        "id": 123,
        "title": "  Project Update  ",
        "content": "  Continue the project.  ",
        "source_type": " EMAIL ",
        "timestamp": "2026-08-23T10:00:00",
    }

    result = normalize_source(source)

    assert result["id"] == "123"
    assert result["title"] == "Project Update"
    assert result["content"] == "Continue the project."
    assert result["source_type"] == "email"
    assert result["timestamp"] == "2026-08-23T10:00:00"


def test_normalize_sources():
    sources = [
        {"id": "1", "title": "First", "content": "A"},
        {"id": "2", "title": "Second", "content": "B"},
    ]

    result = normalize_sources(sources)

    assert len(result) == 2
    assert result[0]["id"] == "1"
    assert result[1]["id"] == "2"