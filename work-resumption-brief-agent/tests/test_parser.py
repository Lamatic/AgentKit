import pytest

from src.components.parser import MultiSourceInputParser
from src.models import SourceType


@pytest.fixture
def parser():
    return MultiSourceInputParser()


def test_parse_valid_commit(parser):
    commits = [
        {
            "timestamp": "2024-08-18T10:00:00Z",
            "message": "Implement resume parser",
            "hash": "abc123",
            "author": "alice",
        }
    ]

    events = parser.parse({"commits": commits})

    assert len(events) == 1
    assert events[0].source_type == SourceType.COMMIT
    assert events[0].content == "Implement resume parser"
    assert events[0].source_id == "abc123"


def test_parse_mixed_sources(parser):
    inputs = {
        "commits": [
            {
                "timestamp": "2024-08-18T10:00:00Z",
                "message": "Add feature",
                "hash": "abc",
            }
        ],
        "pr_comments": [
            {
                "timestamp": "2024-08-18T11:00:00Z",
                "text": "LGTM",
                "pr_number": 42,
                "author": "bob",
            }
        ],
        "meeting_notes": [
            {
                "timestamp": "2024-08-18T14:00:00Z",
                "text": "Meeting done",
            }
        ],
    }

    events = parser.parse(inputs)

    assert len(events) == 3
    assert events[0].source_type == SourceType.COMMIT
    assert events[1].source_type == SourceType.PR_COMMENT
    assert events[2].source_type == SourceType.MEETING_NOTE


def test_missing_timestamp_is_recovered(parser):
    events = parser.parse(
        {
            "commits": [
                {
                    "message": "No timestamp",
                    "hash": "abc",
                }
            ]
        }
    )

    assert events == []


def test_empty_content_is_recovered(parser):
    events = parser.parse(
        {
            "commits": [
                {
                    "timestamp": "2024-08-18T10:00:00Z",
                    "message": "",
                    "hash": "abc",
                }
            ]
        }
    )

    assert events == []


def test_unknown_source_is_skipped(parser):
    inputs = {
        "unknown_source": [
            {
                "timestamp": "2024-08-18T10:00:00Z",
                "message": "Unknown",
            }
        ]
    }

    events = parser.parse(inputs)

    assert events == []


def test_bad_source_does_not_kill_valid_source(parser):
    inputs = {
        "commits": [
            {
                "timestamp": "invalid timestamp",
                "message": "Broken commit",
                "hash": "bad",
            }
        ],
        "pr_comments": [
            {
                "timestamp": "2024-08-18T11:00:00Z",
                "text": "Valid comment",
                "pr_number": 42,
            }
        ],
    }

    events = parser.parse(inputs)

    assert len(events) == 1
    assert events[0].source_type == SourceType.PR_COMMENT
    assert events[0].content == "Valid comment"


def test_bad_item_does_not_kill_other_items(parser):
    commits = [
        {
            "timestamp": "invalid timestamp",
            "message": "Broken commit",
            "hash": "bad",
        },
        {
            "timestamp": "2024-08-18T10:00:00Z",
            "message": "Valid commit",
            "hash": "good",
        },
    ]

    events = parser.parse({"commits": commits})

    assert len(events) == 1
    assert events[0].source_id == "good"


def test_invalid_input_structure_raises(parser):
    with pytest.raises(ValueError):
        parser.parse([])


def test_entity_extraction(parser):
    entities = parser._extract_entities(
        "Resume Parser API is implemented"
    )

    assert "Resume" in entities
    assert "Parser" in entities
    assert "API" in entities