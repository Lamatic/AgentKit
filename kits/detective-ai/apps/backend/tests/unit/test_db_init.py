"""Unit tests for database initialization and table creation."""

from sqlalchemy import create_engine, inspect

import app.models  # noqa: F401
from app.db.base import Base
from app.db.database import init_db


def test_init_db_creates_all_tables():
    """Verify init_db creates all expected domain tables in a target engine."""
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    init_db(target_engine=engine)

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    expected_tables = {
        "cases",
        "victims",
        "suspects",
        "locations",
        "evidence",
        "timeline_events",
        "game_sessions",
        "game_events",
    }

    for table in expected_tables:
        assert table in table_names, f"Table '{table}' was not created."


def test_declarative_base_metadata():
    """Verify Declarative Base metadata contains all registered models."""
    registered_tables = set(Base.metadata.tables.keys())
    expected_tables = {
        "cases",
        "victims",
        "suspects",
        "locations",
        "evidence",
        "timeline_events",
        "game_sessions",
        "game_events",
    }

    assert expected_tables.issubset(registered_tables)
