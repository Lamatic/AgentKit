"""Unit tests for Milestone 5A - Lamatic AgentKit Integration Spike."""

from unittest.mock import MagicMock

import httpx
from lamatic.types import LamaticResponse
from typer.testing import CliRunner

from app.core.config import settings
from app.lamatic.agent import DetectiveAgent
from app.lamatic.client import LamaticClient
from app.lamatic.exceptions import (
    LamaticConfigurationError,
    LamaticConnectionError,
    LamaticInvocationError,
)
from app.lamatic.schemas import AgentResponse
from cli.app import app

runner = CliRunner()


def test_lamatic_missing_credentials_raises_configuration_error(monkeypatch):
    """Verify missing credentials raise LamaticConfigurationError."""
    monkeypatch.setattr(settings, "lamatic_api_key", None)
    monkeypatch.setattr(settings, "lamatic_endpoint", None)
    monkeypatch.setattr(settings, "lamatic_project_id", None)
    client = LamaticClient(endpoint=None, project_id=None, api_key=None, flow_id=None)
    import pytest

    with pytest.raises(LamaticConfigurationError) as exc_info:
        client.execute(payload={"message": "hello"})

    assert "credentials are not configured" in str(exc_info.value)


def test_lamatic_missing_flow_id_raises_configuration_error(monkeypatch):
    """Verify missing flow_id raises LamaticConfigurationError."""
    monkeypatch.setattr(settings, "lamatic_flow_id", None)
    client = LamaticClient(
        endpoint="https://example.com/api/graphql",
        project_id="proj_123",
        api_key="key_123",
        flow_id=None,
    )
    import pytest

    with pytest.raises(LamaticConfigurationError) as exc_info:
        client.execute(payload={"message": "hello"})

    assert "flow_id is not configured" in str(exc_info.value)


def test_lamatic_client_successful_invocation():
    """Verify LamaticClient translates SDK success response into AgentResponse."""
    mock_sdk = MagicMock()
    mock_sdk.execute_flow.return_value = LamaticResponse(
        status="success",
        result={"response": "A good detective questions assumptions."},
        message=None,
        status_code=200,
    )

    client = LamaticClient(
        endpoint="https://example.com/api/graphql",
        project_id="proj_123",
        api_key="key_123",
        flow_id="flow_123",
        sdk_client=mock_sdk,
    )

    response = client.execute(payload={"message": "What makes a good detective?"})

    assert isinstance(response, AgentResponse)
    assert response.status == "success"
    assert response.content == "A good detective questions assumptions."
    mock_sdk.execute_flow.assert_called_once_with(
        flow_id="flow_123", payload={"message": "What makes a good detective?"}
    )


def test_lamatic_client_error_response_translation():
    """Verify SDK error response is translated into LamaticInvocationError."""
    mock_sdk = MagicMock()
    mock_sdk.execute_flow.return_value = LamaticResponse(
        status="error",
        result=None,
        message="Workflow execution failed in Lamatic cloud",
        status_code=500,
    )

    client = LamaticClient(
        endpoint="https://example.com/api/graphql",
        project_id="proj_123",
        api_key="key_123",
        flow_id="flow_123",
        sdk_client=mock_sdk,
    )
    import pytest

    with pytest.raises(LamaticInvocationError) as exc_info:
        client.execute(payload={"message": "hello"})

    assert "Workflow execution failed in Lamatic cloud" in str(exc_info.value)


def test_lamatic_client_connection_error_translation():
    """Verify httpx network errors are translated into LamaticConnectionError."""
    mock_sdk = MagicMock()
    mock_sdk.execute_flow.side_effect = httpx.ConnectError(
        "Failed to establish connection"
    )

    client = LamaticClient(
        endpoint="https://example.com/api/graphql",
        project_id="proj_123",
        api_key="key_123",
        flow_id="flow_123",
        sdk_client=mock_sdk,
    )
    import pytest

    with pytest.raises(LamaticConnectionError) as exc_info:
        client.execute(payload={"message": "hello"})

    assert "Unable to connect to Lamatic AgentKit service" in str(exc_info.value)


def test_detective_agent_ask():
    """Verify DetectiveAgent builds prompt payload and invokes client."""
    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content="Logic and patience are key.",
        status="success",
    )

    agent = DetectiveAgent(client=mock_client)
    res = agent.ask("What makes a good detective?")

    assert res.content == "Logic and patience are key."
    mock_client.execute.assert_called_once()
    called_payload = mock_client.execute.call_args[1]["payload"]
    assert called_payload["message"] == "What makes a good detective?"
    assert "detective assistant" in called_payload["system_instruction"]


def test_detective_agent_ask_with_investigation_context(db_session):
    """Verify DetectiveAgent accepts InvestigationContext and passes player payload."""
    from app.db.database import init_db
    from app.services.investigation_context import InvestigationContextBuilder
    from app.services.session_service import SessionService

    init_db()
    session_service = SessionService()
    builder = InvestigationContextBuilder(session_service=session_service)
    state = session_service.start_game("test_case", db=db_session)
    ctx = builder.build_context(state.session_id, db=db_session)

    mock_client = MagicMock()
    mock_client.execute.return_value = AgentResponse(
        content="Focus on examining the crime scene.",
        status="success",
    )

    agent = DetectiveAgent(client=mock_client)
    res = agent.ask("What should I do next?", context=ctx)

    assert res.content == "Focus on examining the crime scene."
    mock_client.execute.assert_called_once()
    called_payload = mock_client.execute.call_args[1]["payload"]
    assert "investigation_context" in called_payload
    inv_ctx = called_payload["investigation_context"]
    assert inv_ctx["session_id"] == state.session_id
    assert inv_ctx["scenario_id"] == "test_case"
    assert "culprit_id" not in str(inv_ctx)


def test_cli_ask_command_success(monkeypatch):
    """Verify CLI ask command executes successfully with mocked agent response."""

    def mock_ask(self, message: str, context=None):
        return AgentResponse(
            content="Observation and deduction are fundamental.",
            status="success",
        )

    monkeypatch.setattr(DetectiveAgent, "ask", mock_ask)

    result = runner.invoke(app, ["ask", "What makes a good detective?"])
    assert result.exit_code == 0
    assert "DETECTIVE AI" in result.output or "Detective AI" in result.output
    assert "Observation and deduction are fundamental." in result.output


def test_cli_ask_command_error_handling(monkeypatch):
    """Verify CLI ask command formats Lamatic errors cleanly without raw tracebacks."""

    def mock_ask_error(self, message: str, context=None):
        raise LamaticConfigurationError(
            "Lamatic credentials are not configured. Please set LAMATIC_API_KEY."
        )

    monkeypatch.setattr(DetectiveAgent, "ask", mock_ask_error)

    result = runner.invoke(app, ["ask", "hello"])
    assert result.exit_code == 1
    assert "[Lamatic Error]" in result.output
    assert "Lamatic credentials are not configured" in result.output


def test_lamatic_no_game_engine_or_ground_truth_exposure():
    """Verify DetectiveAgent has zero coupling to GameEngine or ground truth."""
    import inspect

    import app.lamatic.agent as agent_module

    source = inspect.getsource(agent_module)

    assert "GameEngine" not in source
    assert "GameSession" not in source
    assert "ScenarioDefinition" not in source
    assert "culprit" not in source.lower()
    assert "motive" not in source.lower()
    assert "solution" not in source.lower()
