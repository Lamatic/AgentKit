"""Suspect domain entity ORM model and Pydantic schemas."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, ConfigDict
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.timeline import TimelineEvent


class Suspect(Base):
    """Suspect entity associated with a Case."""

    __tablename__ = "suspects"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_culprit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    motive: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
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
    case: Mapped["Case"] = relationship("Case", back_populates="suspects")
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        "TimelineEvent", back_populates="suspect"
    )


# --- Pydantic Schemas ---


class SuspectBase(BaseModel):
    """Base schema for Suspect."""

    name: str
    description: str
    profile_metadata: dict[str, Any] | None = None


class SuspectCreate(SuspectBase):
    """Schema for creating a Suspect."""

    id: str | None = None
    case_id: str
    is_culprit: bool = False
    motive: str | None = None


class SuspectRead(SuspectBase):
    """Player-facing schema for reading Suspect data (hides culprit status)."""

    id: str
    case_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SuspectGroundTruthRead(SuspectRead):
    """Authoritative backend schema for Suspect ground truth."""

    is_culprit: bool
    motive: str | None = None
