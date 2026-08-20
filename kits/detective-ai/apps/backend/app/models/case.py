"""Case domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.evidence import Evidence
    from app.models.game_session import GameSession
    from app.models.location import Location
    from app.models.suspect import Suspect
    from app.models.timeline import TimelineEvent
    from app.models.victim import Victim


class Case(Base):
    """Authoritative ground truth Case entity."""

    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    solution_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ground_truth_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
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
    victim: Mapped["Victim | None"] = relationship(
        "Victim", back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    suspects: Mapped[list["Suspect"]] = relationship(
        "Suspect", back_populates="case", cascade="all, delete-orphan"
    )
    locations: Mapped[list["Location"]] = relationship(
        "Location", back_populates="case", cascade="all, delete-orphan"
    )
    evidence: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="case", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent", back_populates="case", cascade="all, delete-orphan"
    )
    game_sessions: Mapped[list["GameSession"]] = relationship(
        "GameSession", back_populates="case", cascade="all, delete-orphan"
    )


# --- Pydantic Schemas ---


class CaseBase(BaseModel):
    """Base schema for Case."""

    title: str
    description: str
    status: str = "active"


class CaseCreate(CaseBase):
    """Schema for creating a Case."""

    id: str | None = None
    solution_summary: str | None = None
    ground_truth_data: dict[str, Any] | None = None


class CaseUpdate(BaseModel):
    """Schema for updating a Case."""

    title: str | None = None
    description: str | None = None
    status: str | None = None
    solution_summary: str | None = None
    ground_truth_data: dict[str, Any] | None = None


class CaseRead(CaseBase):
    """Player-facing Case schema (omits solution and ground truth details)."""

    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseGroundTruthRead(CaseRead):
    """Authoritative backend Case schema (includes solution and ground truth)."""

    solution_summary: str | None = None
    ground_truth_data: dict[str, Any] | None = None
