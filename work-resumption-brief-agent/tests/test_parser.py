import pytest
from src.components.parser import MultiSourceInputParser
from src.models import SourceType


@pytest.fixture
def parser():
    return MultiSourceInputParser()


def test_parse_valid_commit(parser):
    commits = [{
        "timestamp": "2024-08-18T10:00:00Z",
        "message": "Implement resume parser",
        "hash": "abc123",
        "author": "alice"
    }]

    events = parser.parse({"commits": commits})

    assert len(events) == 1
    assert events[0].source_type == SourceType.COMMIT
    assert events[0].content == "Implement resume parser"


def test_parse_mixed_sources(parser):
    inputs = {
        "commits": [{
            "timestamp": "2024-08-18T10:00:00Z",
            "message": "Add feature",
            "hash": "abc"
        }],
        "pr_comments": [{
            "timestamp": "2024-08-18T11:00:00Z",
            "text": "LGTM",
            "pr_number": 42,
            "author": "bob"
        }],
        "meeting_notes": [{
            "timestamp": "2024-08-18T14:00:00Z",
            "text": "Meeting done"
        }]
    }

    events = parser.parse(inputs)

    assert len(events) == 3
    assert events[0].source_type == SourceType.COMMIT
    assert events[1].source_type == SourceType.PR_COMMENT
    assert events[2].source_type == SourceType.MEETING_NOTE


def test_missing_timestamp_raises_error(parser):
    with pytest.raises(ValueError):
        parser.parse({
            "commits": [{
                "message": "No timestamp"
            }]
        })


def test_empty_content_raises_error(parser):
    with pytest.raises(ValueError):
        parser.parse({
            "commits": [{
                "timestamp": "2024-08-18T10:00:00Z",
                "message": "",
                "hash": "abc"
            }]
        })


def test_entity_extraction(parser):
    entities = parser._extract_entities(
        "Resume Parser API is implemented"
    )

    assert "Resume" in entities
    assert "Parser" in entities
    assert "API" in entities