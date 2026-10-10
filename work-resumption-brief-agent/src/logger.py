import logging
import sys
import os
from src.config import LOGGING_CONFIG


def _resolve_level() -> int:
    """Read LOG_LEVEL from the environment, falling back to config on bad values."""
    raw = os.getenv("LOG_LEVEL", LOGGING_CONFIG["level"])
    level = logging.getLevelName(str(raw).strip().upper())
    if isinstance(level, int):
        return level
    return logging.getLevelName(LOGGING_CONFIG["level"].upper())


def setup_logger(component_name: str) -> logging.Logger:
    """Setup logger for a component. Respects the LOG_LEVEL environment variable."""
    logger = logging.getLogger(component_name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            f"[{component_name}] %(levelname)s: %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False

    logger.setLevel(_resolve_level())
    return logger