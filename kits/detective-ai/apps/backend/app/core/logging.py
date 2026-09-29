"""Centralized application logging configuration for DetectiveAI."""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_FORMAT = (
    "%(asctime)s | %(levelname)s | %(name)s | "
    "%(filename)s:%(lineno)d | %(funcName)s | %(message)s"
)
DEFAULT_LOG_DIR = "logs"
DEFAULT_LOG_FILE = "logs/detective_ai.log"
DEFAULT_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
DEFAULT_BACKUP_COUNT = 5

_DETECTIVE_AI_HANDLER_FLAG = "_detective_ai_handler"


def configure_logging(
    log_level: str | int | None = None,
    log_file: str | Path | None = None,
    console: bool = True,
) -> None:
    """Configure centralized application-wide logging.

    - Creates dedicated logs/ directory automatically if missing.
    - Sets up a RotatingFileHandler with 10MB max size and 5 backups.
    - Uses standard %(filename)s:%(lineno)d metadata formatter.
    - Avoids duplicate handlers when called multiple times.
    - Safe to invoke at CLI or application startup.
    """
    # 1. Resolve log level
    if log_level is None:
        level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    elif isinstance(log_level, int):
        level_str = logging.getLevelName(log_level)
    else:
        level_str = str(log_level).upper()

    numeric_level = getattr(logging, level_str, logging.INFO)

    # 2. Resolve log file path and create parent directory
    resolved_file = Path(log_file or os.getenv("LOG_FILE", DEFAULT_LOG_FILE)).resolve()
    resolved_file.parent.mkdir(parents=True, exist_ok=True)

    # 3. Setup Formatter
    formatter = logging.Formatter(fmt=LOG_FORMAT)

    # 4. Create Rotating File Handler
    file_handler = RotatingFileHandler(
        filename=str(resolved_file),
        maxBytes=DEFAULT_MAX_BYTES,
        backupCount=DEFAULT_BACKUP_COUNT,
        encoding="utf-8",
    )
    file_handler.setLevel(numeric_level)
    file_handler.setFormatter(formatter)
    setattr(file_handler, _DETECTIVE_AI_HANDLER_FLAG, True)

    # 5. Create Console Stream Handler
    console_handler = None
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(numeric_level)
        console_handler.setFormatter(formatter)
        setattr(console_handler, _DETECTIVE_AI_HANDLER_FLAG, True)

    # 6. Apply to Root Logger without duplicating handlers
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Remove any existing handlers marked with our flag
    for handler in list(root_logger.handlers):
        if getattr(handler, _DETECTIVE_AI_HANDLER_FLAG, False):
            root_logger.removeHandler(handler)
            handler.close()

    root_logger.addHandler(file_handler)
    if console_handler:
        root_logger.addHandler(console_handler)

    # Mute noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
