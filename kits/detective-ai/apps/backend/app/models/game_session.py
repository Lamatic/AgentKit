"""GameSession domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.game_event import GameEvent
    from app.models.location import Location


class GameSession(Base):
    """Player investigation game session entity."""

    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    current_location_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="in_progress", nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    state_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="game_sessions")
    current_location: Mapped["Location | None"] = relationship(
        "Location", back_populates="game_sessions"
    )
    game_events: Mapped[list["GameEvent"]] = relationship(
        "GameEvent", back_populates="session", cascade="all, delete-orphan"
    )


# --- Pydantic Schemas ---


class GameSessionBase(BaseModel):
    """Base schema for GameSession."""

    current_location_id: str | None = None
    status: str = "in_progress"
    score: int = 0
    state_metadata: dict[str, Any] | None = None


class GameSessionCreate(GameSessionBase):
    """Schema for creating GameSession."""

    id: str | None = None
    case_id: str


class GameSessionUpdate(BaseModel):
    """Schema for updating GameSession."""

    current_location_id: str | None = None
    status: str | None = None
    score: int | None = None
    state_metadata: dict[str, Any] | None = None


class GameSessionRead(GameSessionBase):
    """Schema for reading GameSession data."""

    id: str
    case_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
