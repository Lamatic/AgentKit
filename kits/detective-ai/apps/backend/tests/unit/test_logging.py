"""Unit tests for centralized logging infrastructure."""

import logging
import re
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.logging import (
    _DETECTIVE_AI_HANDLER_FLAG,
    DEFAULT_BACKUP_COUNT,
    DEFAULT_MAX_BYTES,
    configure_logging,
)


def test_configure_logging_creates_directory_and_file(tmp_path: Path):
    """Verify configure_logging creates the logs directory and log file."""
    log_dir = tmp_path / "custom_logs"
    log_file = log_dir / "test_detective.log"

    assert not log_dir.exists()
    assert not log_file.exists()

    configure_logging(log_level="DEBUG", log_file=log_file, console=False)

    test_logger = logging.getLogger("test_module_init")
    test_logger.info("Initialization test log message")

    assert log_dir.exists()
    assert log_file.exists()


def test_log_output_format_and_metadata(tmp_path: Path):
    """Verify log output contains timestamp, level, name, filename, lineno, message."""
    log_file = tmp_path / "format_test.log"
    configure_logging(log_level="INFO", log_file=log_file, console=False)

    test_logger = logging.getLogger("app.test.formatting")

    def sample_investigation_function():
        test_logger.info("Executing sample investigation action")

    sample_investigation_function()

    # Flush handlers
    for handler in logging.getLogger().handlers:
        handler.flush()

    content = log_file.read_text(encoding="utf-8")
    assert "Executing sample investigation action" in content

    # Format regex: timestamp | level | logger_name | filename:lineno | funcName
    pattern = re.compile(
        r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \| "
        r"INFO \| "
        r"app\.test\.formatting \| "
        r"test_logging\.py:(\d+) \| "
        r"sample_investigation_function \| "
        r"Executing sample investigation action$",
        re.MULTILINE,
    )
    match = pattern.search(content)
    assert match is not None, f"Log entry did not match expected format:\n{content}"

    # Verify line number is a positive integer
    lineno = int(match.group(1))
    assert lineno > 0


def test_configure_logging_idempotent_no_duplicate_handlers(tmp_path: Path):
    """Verify configure_logging does not duplicate handlers or messages."""
    log_file = tmp_path / "idempotent.log"

    # Call configure_logging 3 times
    configure_logging(log_level="INFO", log_file=log_file, console=False)
    configure_logging(log_level="INFO", log_file=log_file, console=False)
    configure_logging(log_level="INFO", log_file=log_file, console=False)

    root_logger = logging.getLogger()
    detective_handlers = [
        h for h in root_logger.handlers if getattr(h, _DETECTIVE_AI_HANDLER_FLAG, False)
    ]
    # Should only have 1 file handler (console=False)
    assert len(detective_handlers) == 1

    test_logger = logging.getLogger("app.idempotent.test")
    test_logger.info("Single emit test message")

    for h in root_logger.handlers:
        h.flush()

    content = log_file.read_text(encoding="utf-8")
    occurrences = content.count("Single emit test message")
    assert occurrences == 1, f"Message logged {occurrences} times instead of 1"


def test_rotating_file_handler_configuration(tmp_path: Path):
    """Verify rotating file handler attributes maxBytes and backupCount."""
    log_file = tmp_path / "rotating_test.log"
    configure_logging(log_level="INFO", log_file=log_file, console=False)

    root_logger = logging.getLogger()
    file_handlers = [
        h for h in root_logger.handlers if isinstance(h, RotatingFileHandler)
    ]
    assert len(file_handlers) >= 1

    handler = file_handlers[0]
    assert handler.maxBytes == DEFAULT_MAX_BYTES
    assert handler.backupCount == DEFAULT_BACKUP_COUNT
    assert handler.encoding == "utf-8"


def test_secrets_and_ground_truth_not_logged(tmp_path: Path):
    """Verify logging does not inadvertently expose secret API keys or ground truth."""
    log_file = tmp_path / "security_test.log"
    configure_logging(log_level="INFO", log_file=log_file, console=False)

    from unittest.mock import MagicMock

    from lamatic.types import LamaticResponse

    from app.lamatic.client import LamaticClient

    mock_sdk = MagicMock()
    mock_sdk.execute_flow.return_value = LamaticResponse(
        status="success",
        result={"response": "Safe test analysis"},
        message=None,
        status_code=200,
    )

    secret_key = "lt-super-secret-api-key-12345"
    client = LamaticClient(
        endpoint="https://example.com/api/graphql",
        project_id="test_proj",
        api_key=secret_key,
        flow_id="flow_test_123",
        sdk_client=mock_sdk,
    )

    client.execute(payload={"message": "Analyze clue"})

    for h in logging.getLogger().handlers:
        h.flush()

    content = log_file.read_text(encoding="utf-8")
    assert secret_key not in content
    assert "flow_test_123" in content
