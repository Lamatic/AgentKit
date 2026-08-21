"""Unit tests for EvidenceKnowledge, EvidenceKnowledgeBuilder, and EvidenceAgent."""

from unittest.mock import MagicMock

import pytest
from typer.testing import CliRunner

from app.core.exceptions import (
    EvidenceNotDiscoveredError,
    EvidenceNotFoundError,
    SessionAlreadyCompletedError,
)
from app.db.database import init_db
from app.lamatic.evidence_agent import EvidenceAgent
from app.lamatic.evidence_knowledge import (
    EvidenceKnowledge,
    EvidenceKnowledgeBuilder,
)
from app.lamatic.schemas import AgentResponse
from app.schemas.game_state import ActionType, GameActionDTO
from app.services.game_engine import GameEngine
from app.services.investigation_context import InvestigationContextBuilder
from app.services.session_service import SessionService
from cli.app import app
from cli.commands import examine_cmd, start_cmd

runner = CliRunner()


def test_build_evidence_knowledge_valid():
    """Verify EvidenceKnowledgeBuilder constructs complete player-safe knowledge."""
    builder = EvidenceKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "evidence_01")

    assert isinstance(knowledge, EvidenceKnowledge)
    assert knowledge.evidence_id == "evidence_01"
    assert knowledge.name == "Vial of Poison"
    assert "bitter almonds" in knowledge.description
    assert knowledge.evidence_type == "physical"
    assert knowledge.location_id == "location_01"
    assert knowledge.location_name == "Study Room"


def test_build_evidence_knowledge_unknown_evidence():
    """Verify requesting an unknown evidence ID raises EvidenceNotFoundError."""
    builder = EvidenceKnowledgeBuilder()
    with pytest.raises(EvidenceNotFoundError):
        builder.build_knowledge("test_case", "invalid_evidence_99")


def test_evidence_knowledge_ground_truth_isolation():
    """Verify EvidenceKnowledge strictly excludes protected ground truth."""
    builder = EvidenceKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "evidence_01")

    dumped = knowledge.model_dump()
    dumped_str = str(dumped)

    assert "is_culprit" not in dumped_str
    assert "culprit_id" not in dumped_str
    assert "motive" not in dumped_str
    assert "solution_summary" not in dumped_str
    assert "secret" not in dumped_str.lower()


def test_evidence_agent_ask(db_session):
    """Verify EvidenceAgent constructs prompt payload and invokes LamaticClient."""
    init_db()
    session_service = SessionService()
    ctx_builder = InvestigationContextBuilder(session_service=session_service)

    state = session_service.start_game("test_case", db=db_session)
    context = ctx_builder.build_context(state.session_id, db=db_session)

    builder = EvidenceKnowledgeBuilder()
    knowledge = builder.build_knowledge("test_case", "evidence_01")

    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content="Observation: Glass vial smells of bitter almonds.",
        status="success",
    )

    agent = EvidenceAgent(client=mock_client)
    res = agent.ask(knowledge=knowledge, context=context)

    assert "bitter almonds" in res.content
    mock_client.execute.assert_called_once()
    payload = mock_client.execute.call_args[1]["payload"]

    assert payload["evidence_id"] == "evidence_01"
    assert payload["evidence_name"] == "Vial of Poison"
    assert "investigation_context" in payload
    assert "culprit_id" not in str(payload)


def test_evidence_agent_flow_id_configuration(monkeypatch):
    """Verify EvidenceAgent fallback flow ID configuration logic."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "lamatic_evidence_flow_id", "flow_evidence_123")
    agent = EvidenceAgent()
    assert agent.flow_id == "flow_evidence_123"


def test_examine_cmd_undiscovered_evidence_rejected(db_session):
    """Verify GameEngine rejects examining undiscovered evidence before discovery."""
    init_db()
    session_service = SessionService()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # Evidence_01 is not discovered yet
    with pytest.raises(EvidenceNotDiscoveredError):
        examine_cmd(sid, "evidence_01", db=db_session)


def test_examine_cmd_completed_session_rejected(db_session):
    """Verify GameEngine rejects AI evidence examination on completed session."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()
    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )
    game_engine.execute_action(
        sid,
        GameActionDTO(action_type=ActionType.SUBMIT_SOLUTION, target_id="suspect_01"),
        db=db_session,
    )

    with pytest.raises(SessionAlreadyCompletedError):
        examine_cmd(sid, "evidence_01", db=db_session)


def test_cli_examine_command_success(monkeypatch, db_session):
    """Verify examine_cmd executes action and displays AI forensic analysis."""
    init_db()
    session_service = SessionService()
    game_engine = GameEngine()

    state = session_service.start_game("test_case", db=db_session)
    sid = state.session_id

    # Discover evidence via INSPECT
    game_engine.execute_action(
        sid, GameActionDTO(action_type=ActionType.INSPECT), db=db_session
    )

    def mock_ask(self, knowledge, message=None, context=None):
        return AgentResponse(
            content="Forensic interpretation shows trace almond scent.",
            status="success",
        )

    monkeypatch.setattr(EvidenceAgent, "ask", mock_ask)

    examine_cmd(sid, "evidence_01", db=db_session)

    # Verify GameEngine updated session evidence detail
    session_obj = session_service.get_session(sid, db=db_session)
    state_dto = session_service.to_game_state_dto(session_obj)
    assert "evidence_01" in state_dto.discovered_evidence_ids


def test_cli_examine_app_runner(monkeypatch):
    """Verify Typer CLI examine app command runner."""
    init_db()
    sid = start_cmd("test_case")

    # Perform inspect action to discover evidence_01
    from cli.commands import action_cmd

    action_cmd(sid, "inspect")

    def mock_ask(self, knowledge, message=None, context=None):
        return AgentResponse(
            content="AI Analysis: Glass vial contains chemical residue.",
            status="success",
        )

    monkeypatch.setattr(EvidenceAgent, "ask", mock_ask)

    result = runner.invoke(app, ["examine", sid, "evidence_01"])

    assert result.exit_code == 0
    assert "AI FORENSIC ANALYSIS" in result.output
    assert "Vial of Poison" in result.output
    assert "Glass vial contains chemical residue." in result.output
