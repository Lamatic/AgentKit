"""TimelineEvent domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.evidence import Evidence
    from app.models.location import Location
    from app.models.suspect import Suspect


class TimelineEvent(Base):
    """Canonical ground truth timeline event entity for a Case."""

    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    event_order: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp_str: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    suspect_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("suspects.id", ondelete="SET NULL"), nullable=True
    )
    evidence_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True
    )
    details_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="timeline_events")
    location: Mapped["Location | None"] = relationship(
        "Location", back_populates="timeline_events"
    )
    suspect: Mapped["Suspect | None"] = relationship(
        "Suspect", back_populates="timeline_events"
    )
    evidence: Mapped["Evidence | None"] = relationship(
        "Evidence", back_populates="timeline_events"
    )


# --- Pydantic Schemas ---


class TimelineEventBase(BaseModel):
    """Base schema for TimelineEvent."""

    event_order: int
    description: str
    timestamp_str: str | None = None
    location_id: str | None = None
    suspect_id: str | None = None
    evidence_id: str | None = None
    details_json: dict[str, Any] | None = None


class TimelineEventCreate(TimelineEventBase):
    """Schema for creating TimelineEvent."""

    id: str | None = None
    case_id: str


class TimelineEventRead(TimelineEventBase):
    """Schema for reading TimelineEvent data."""

    id: str
    case_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
