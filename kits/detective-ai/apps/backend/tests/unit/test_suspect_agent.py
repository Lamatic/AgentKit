"""Unit tests for SuspectKnowledge, SuspectAgent, and SuspectConversationManager."""

from unittest.mock import MagicMock

import pytest
from typer.testing import CliRunner

from app.core.exceptions import (
    SessionAlreadyCompletedError,
    SuspectNotAvailableError,
)
from app.db.database import init_db
from app.lamatic.schemas import AgentResponse
from app.lamatic.suspect_agent import SuspectAgent
from app.schemas.game_state import ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.session_service import SessionService
from app.services.suspect_conversation import SuspectConversationManager
from app.services.suspect_knowledge import (
    SuspectKnowledge,
    SuspectKnowledgeBuilder,
)
from cli.app import app
from cli.commands import interrogate_cmd

runner = CliRunner()


def test_build_suspect_knowledge_valid():
    """Verify SuspectKnowledgeBuilder constructs complete player-safe knowledge."""
    builder = SuspectKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "suspect_01")

    assert isinstance(knowledge, SuspectKnowledge)
    assert knowledge.suspect_id == "suspect_01"
    assert knowledge.name == "Alice Smith"
    assert knowledge.alibi == "Claims to have been at home."
    assert knowledge.relationship_to_victim == "Business partner"
    assert len(knowledge.known_evidence_names) == 1
    assert "Vial of Poison" in knowledge.known_evidence_names


def test_build_suspect_knowledge_unknown_suspect():
    """Verify requesting an unknown suspect raises SuspectNotAvailableError."""
    builder = SuspectKnowledgeBuilder()
    with pytest.raises(SuspectNotAvailableError):
        builder.build_knowledge("test_case", "invalid_suspect_99")


def test_suspect_knowledge_ground_truth_isolation():
    """Verify SuspectKnowledge strictly excludes protected ground truth."""
    builder = SuspectKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "suspect_01")

    dumped = knowledge.model_dump()
    dumped_str = str(dumped)

    assert "is_culprit" not in dumped_str
    assert "culprit_id" not in dumped_str
    assert "motive" not in dumped_str
    assert "solution_summary" not in dumped_str
    assert "secret" not in dumped_str.lower()


def test_suspect_agent_ask():
    """Verify SuspectAgent passes correct payload to LamaticClient."""
    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content="I was at home, I swear!",
        status="success",
    )

    builder = SuspectKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "suspect_01")

    agent = SuspectAgent(client=mock_client)
    res = agent.ask(
        knowledge=knowledge,
        message="Where were you at 9 PM?",
        conversation_history=[],
    )

    assert res.content == "I was at home, I swear!"
    mock_client.execute.assert_called_once()
    payload = mock_client.execute.call_args[1]["payload"]

    assert payload["message"] == "Where were you at 9 PM?"
    assert payload["suspect_id"] == "suspect_01"
    assert payload["suspect_name"] == "Alice Smith"
    assert "is_culprit" not in str(payload)


def test_suspect_conversation_history_persistence(db_session):
    """Verify dialogue turns persist in audit history and order correctly."""
    init_db()
    session_service = SessionService()
    builder = SuspectKnowledgeBuilder()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id
    knowledge = builder.build_knowledge("test_case", "suspect_01")

    mock_client = MagicMock()
    mock_client.execute.side_effect = [
        AgentResponse(content="I was at home.", status="success"),
        AgentResponse(content="No one saw me there.", status="success"),
    ]
    agent = SuspectAgent(client=mock_client)
    manager = SuspectConversationManager(agent=agent)

    # First turn
    res1 = manager.ask_suspect(sid, knowledge, "Where were you at 9 PM?", db=db_session)
    assert res1.content == "I was at home."

    # Second turn
    res2 = manager.ask_suspect(sid, knowledge, "Can anyone verify that?", db=db_session)
    assert res2.content == "No one saw me there."

    # Retrieve history
    history = manager.get_conversation_history(sid, "suspect_01", db=db_session)
    assert len(history) == 4
    assert history[0] == {"role": "user", "content": "Where were you at 9 PM?"}
    assert history[1] == {"role": "suspect", "content": "I was at home."}
    assert history[2] == {"role": "user", "content": "Can anyone verify that?"}
    assert history[3] == {"role": "suspect", "content": "No one saw me there."}


def test_independent_suspect_conversations(db_session):
    """Verify different suspects in same session have independent histories."""
    init_db()
    session_service = SessionService()
    builder = SuspectKnowledgeBuilder()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    knowledge1 = builder.build_knowledge("test_case", "suspect_01")
    knowledge2 = builder.build_knowledge("test_case", "suspect_02")

    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content="I know nothing.", status="success"
    )
    agent = SuspectAgent(client=mock_client)
    manager = SuspectConversationManager(agent=agent)

    manager.ask_suspect(sid, knowledge1, "Question for Alice", db=db_session)
    manager.ask_suspect(sid, knowledge2, "Question for Bob", db=db_session)

    history1 = manager.get_conversation_history(sid, "suspect_01", db=db_session)
    history2 = manager.get_conversation_history(sid, "suspect_02", db=db_session)

    assert len(history1) == 2
    assert history1[0]["content"] == "Question for Alice"
    assert len(history2) == 2
    assert history2[0]["content"] == "Question for Bob"


def test_interrogate_requires_valid_game_engine_session(db_session):
    """Verify interrogating a completed session is rejected by GameEngine."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # Complete session by submitting solution
    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"),
        db=db_session,
    )

    # Attempt interrogation on completed session
    with pytest.raises(SessionAlreadyCompletedError):
        interrogate_cmd(
            sid, "suspect_01", input_fn=lambda prompt: "quit", db=db_session
        )


def test_cli_interrogate_command(monkeypatch, db_session):
    """Verify CLI interrogate command validates with GameEngine and runs subshell."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    def mock_ask(self, knowledge, message, conversation_history=None):
        return AgentResponse(
            content="I was reading books at the library.", status="success"
        )

    monkeypatch.setattr(SuspectAgent, "ask", mock_ask)

    # Mock user input: question then quit
    inputs = iter(["Where were you at 9 PM?", "quit"])

    def mock_input(prompt=""):
        return next(inputs)

    interrogate_cmd(sid, "suspect_01", input_fn=mock_input, db=db_session)

    # Verify GameEngine recorded interview
    session_obj = session_service.get_session(sid, db=db_session)
    state_dto = session_service.to_game_state_dto(session_obj)
    assert "suspect_01" in state_dto.interviewed_suspect_ids


def test_cli_interrogate_app_runner(monkeypatch):
    """Verify Typer CLI interrogate app invocation."""
    init_db()
    from cli.commands import start_cmd

    sid = start_cmd("test_case")

    def mock_ask(self, knowledge, message, conversation_history=None):
        return AgentResponse(content="I have an alibi.", status="success")

    monkeypatch.setattr(SuspectAgent, "ask", mock_ask)

    result = runner.invoke(
        app,
        ["interrogate", sid, "suspect_01"],
        input="What were you doing?\nquit\n",
    )

    assert result.exit_code == 0
    assert "SUSPECT INTERROGATION SESSION" in result.output
    assert "Alice Smith" in result.output
    assert "I have an alibi." in result.output
