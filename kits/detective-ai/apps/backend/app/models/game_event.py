"""GameEvent domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.game_session import GameSession


class GameEvent(Base):
    """Investigation event history entry for a GameSession."""

    __tablename__ = "game_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    result_data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    # Relationships
    session: Mapped["GameSession"] = relationship(
        "GameSession", back_populates="game_events"
    )


# --- Pydantic Schemas ---


class GameEventBase(BaseModel):
    """Base schema for GameEvent."""

    event_type: str
    target_type: str | None = None
    target_id: str | None = None
    result_data: dict[str, Any] | None = None


class GameEventCreate(GameEventBase):
    """Schema for creating GameEvent."""

    id: str | None = None
    session_id: str


class GameEventRead(GameEventBase):
    """Schema for reading GameEvent data."""

    id: str
    session_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
