from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from src.components.parser import MultiSourceInputParser
from src.agent import WorkResumptionAgent


def make_test_event(
    content="Implement authentication",
    source_id="commit-1",
):
    return SimpleNamespace(
        content=content,
        timestamp=datetime.now(timezone.utc),
        source_id=source_id,
    )


def test_parser_malformed_source_does_not_crash():
    parser = MultiSourceInputParser()

    inputs = {
        "commits": [
            {
                "invalid": object(),
            }
        ]
    }

    try:
        result = parser.parse(inputs)
    except Exception as exc:
        pytest.fail(
            f"Parser crashed on malformed source: {exc}"
        )

    assert isinstance(result, list)


def test_parser_unknown_source_is_skipped():
    parser = MultiSourceInputParser()

    inputs = {
        "unknown_source_type": [
            {"content": "This source should be ignored"}
        ]
    }

    result = parser.parse(inputs)

    assert isinstance(result, list)
    assert len(result) == 0


def test_parser_valid_source_survives_bad_source():
    parser = MultiSourceInputParser()

    inputs = {
        "unknown_source_type": [
            {"content": "bad source"}
        ],
        "commits": [
            {
                "id": "commit-1",
                "message": "Implement Day 11 validation",
                "timestamp": datetime.now(timezone.utc),
            }
        ],
    }

    try:
        result = parser.parse(inputs)
    except Exception as exc:
        pytest.fail(
            f"Parser crashed because of one bad source: {exc}"
        )

    assert isinstance(result, list)


def test_agent_empty_input_returns_fallback():
    agent = WorkResumptionAgent()

    result = agent.process({})

    assert result.current_state == []
    assert result.conflicts == []
    assert result.blockers == []
    assert result.evidence == []
    assert result.actions == []
    assert result.recommended_first_action is None
    assert result.confidence_overall == 0.0
    assert result.timestamp.tzinfo is not None


def test_agent_no_events_returns_fallback():
    agent = WorkResumptionAgent()

    with patch.object(
        agent.parser,
        "parse",
        return_value=[],
    ):
        result = agent.process(
            {
                "commits": [
                    {"invalid": "input"}
                ]
            }
        )

    assert result.current_state == []
    assert result.conflicts == []
    assert result.blockers == []
    assert result.evidence == []
    assert result.actions == []
    assert result.recommended_first_action is None
    assert result.confidence_overall == 0.0


def test_entity_resolution_failure_is_handled():
    agent = WorkResumptionAgent()

    events = [
        make_test_event()
    ]

    with patch.object(
        agent.parser,
        "parse",
        return_value=events,
    ):
        with patch.object(
            agent.entity_resolver,
            "resolve_entities",
            side_effect=Exception(
                "entity resolution failed"
            ),
        ):
            try:
                result = agent.process(
                    {"commits": ["test"]}
                )
            except Exception as exc:
                pytest.fail(
                    f"Entity resolver failure crashed the agent: {exc}"
                )

    assert result is not None
    assert result.confidence_overall == 0.0


def test_conflict_detection_failure_is_handled():
    agent = WorkResumptionAgent()

    events = [
        make_test_event()
    ]

    entity_map = {
        "authentication": ["commit-1"]
    }

    with patch.object(
        agent.parser,
        "parse",
        return_value=events,
    ):
        with patch.object(
            agent.entity_resolver,
            "resolve_entities",
            return_value=entity_map,
        ):
            with patch.object(
                agent.conflict_detector,
                "detect_conflicts",
                side_effect=Exception(
                    "conflict detection failed"
                ),
            ):
                try:
                    result = agent.process(
                        {"commits": ["test"]}
                    )
                except Exception as exc:
                    pytest.fail(
                        f"Conflict detector failure crashed the agent: {exc}"
                    )

    assert result is not None


def test_evidence_collection_failure_does_not_kill_pipeline():
    agent = WorkResumptionAgent()

    events = [
        make_test_event()
    ]

    entity_map = {
        "authentication": ["commit-1"]
    }

    with patch.object(
        agent.parser,
        "parse",
        return_value=events,
    ):
        with patch.object(
            agent.entity_resolver,
            "resolve_entities",
            return_value=entity_map,
        ):
            with patch.object(
                agent.conflict_detector,
                "detect_conflicts",
                return_value=[],
            ):
                with patch.object(
                    agent.evidence_collector,
                    "collect_evidence",
                    side_effect=Exception(
                        "evidence collection failed"
                    ),
                ):
                    try:
                        result = agent.process(
                            {"commits": ["test"]}
                        )
                    except Exception as exc:
                        pytest.fail(
                            f"Evidence failure crashed the agent: {exc}"
                        )

    assert result is not None