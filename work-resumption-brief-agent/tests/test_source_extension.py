from src.components.source_extension.extension import extend_sources


def test_extend_sources():
    sources = [
        {
            "id": "1",
            "title": "First",
            "content": "A",
            "timestamp": "2026-08-23T10:00:00Z",
            "source_type": "commit",
        }
    ]

    result = extend_sources(sources)

    assert len(result) == 1
    assert result[0]["id"] == "1"
    assert result[0]["source_type"] == "commit"


def test_extend_sources_does_not_modify_original():
    sources = [
        {
            "id": "1",
            "title": "First",
            "content": "A",
            "timestamp": "2026-08-23T10:00:00Z",
            "source_type": "commit",
        }
    ]

    original = [item.copy() for item in sources]

    extend_sources(sources)

    assert sources == original


def test_extend_sources_preserves_source_type():
    """Verify source_type is preserved when extending."""
    sources = [
        {
            "id": "1",
            "source_type": "commit",
            "content": "Test content",
        }
    ]

    result = extend_sources(sources)

    assert len(result) == 1
    assert result[0]["id"] == "1"
    assert result[0]["source_type"] == "commit"