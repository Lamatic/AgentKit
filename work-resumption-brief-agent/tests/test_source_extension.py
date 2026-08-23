from src.components.source_extension.extension import extend_sources


def test_extend_sources():
    sources = [
        {
            "id": "1",
            "title": "First",
            "content": "A",
            "timestamp": "2026-08-23T10:00:00Z",
        }
    ]

    result = extend_sources(sources)

    assert len(result) == 1
    assert result[0]["id"] == "1"
    assert "source_type" in result[0]


def test_extend_sources_does_not_modify_original():
    sources = [
        {
            "id": "1",
            "title": "First",
            "content": "A",
            "timestamp": "2026-08-23T10:00:00Z",
        }
    ]

    original = [item.copy() for item in sources]

    extend_sources(sources)

    assert sources == original