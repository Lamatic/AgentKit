"""Location domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.evidence import Evidence
    from app.models.game_session import GameSession
    from app.models.timeline import TimelineEvent


class Location(Base):
    """Investigation location entity associated with a Case."""

    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_initial_unlocked: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    access_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
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
    case: Mapped["Case"] = relationship("Case", back_populates="locations")
    evidence_items: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="location"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent", back_populates="location"
    )
    game_sessions: Mapped[list["GameSession"]] = relationship(
        "GameSession", back_populates="current_location"
    )


# --- Pydantic Schemas ---


class LocationBase(BaseModel):
    """Base schema for Location."""

    name: str
    description: str
    is_initial_unlocked: bool = True
    access_metadata: dict[str, Any] | None = None


class LocationCreate(LocationBase):
    """Schema for creating a Location."""

    id: str | None = None
    case_id: str


class LocationRead(LocationBase):
    """Schema for reading Location data."""

    id: str
    case_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
