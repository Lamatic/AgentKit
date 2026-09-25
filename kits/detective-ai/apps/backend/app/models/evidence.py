"""Evidence domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.location import Location
    from app.models.timeline import TimelineEvent


class Evidence(Base):
    """Evidence entity associated with a Case and optional Location."""

    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    location_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_type: Mapped[str] = mapped_column(
        String(50), default="physical", nullable=False
    )
    discovery_metadata: Mapped[dict[str, Any] | None] = mapped_column(
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
    case: Mapped["Case"] = relationship("Case", back_populates="evidence")
    location: Mapped["Location | None"] = relationship(
        "Location", back_populates="evidence_items"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent", back_populates="evidence"
    )


# --- Pydantic Schemas ---


class EvidenceBase(BaseModel):
    """Base schema for Evidence."""

    name: str
    description: str
    evidence_type: str = "physical"
    location_id: str | None = None
    discovery_metadata: dict[str, Any] | None = None


class EvidenceCreate(EvidenceBase):
    """Schema for creating Evidence."""

    id: str | None = None
    case_id: str


class EvidenceRead(EvidenceBase):
    """Schema for reading Evidence data."""

    id: str
    case_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
