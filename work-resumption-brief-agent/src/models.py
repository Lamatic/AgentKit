from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
import math


class SourceType(str, Enum):
    """Supported input source types."""

    COMMIT = "commit"
    PR_COMMENT = "pr_comment"
    GITHUB_ISSUE = "github_issue"
    TODO = "todo"
    MEETING_NOTE = "meeting_note"


class StateCategory(str, Enum):
    """Categories describing the current work state."""

    COMPLETE = "complete"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    PENDING = "pending"
    UNCERTAIN = "uncertain"


class ConfidenceLevel(str, Enum):
    """Qualitative confidence levels."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class NormalizedEvent:
    """Represents a normalized event from any source."""

    source_type: SourceType
    source_id: str
    timestamp: datetime
    author: Optional[str]
    content: str
    entity_candidates: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    def __post_init__(self):
        """Validate event after initialization."""

        if not isinstance(self.content, str) or not self.content.strip():
            raise ValueError("Content cannot be empty")

        if not isinstance(self.timestamp, datetime):
            raise ValueError("Timestamp must be a datetime")

        if (
            self.timestamp.tzinfo is None
            or self.timestamp.utcoffset() is None
        ):
            raise ValueError("Timestamp must be timezone-aware")

        if not isinstance(self.source_id, str) or not self.source_id.strip():
            raise ValueError("Source ID cannot be empty")


@dataclass
class Conflict:
    """Represents a detected conflict between sources."""

    entity: str
    claim_old: str
    claim_new: str
    timestamp_old: datetime
    timestamp_new: datetime
    resolution: str = ""
    confidence: float = 0.0

    def __post_init__(self):
        """Validate conflict data."""

        if not isinstance(self.entity, str) or not self.entity.strip():
            raise ValueError("Entity cannot be empty")

        if not isinstance(self.claim_old, str) or not self.claim_old.strip():
            raise ValueError("Old claim cannot be empty")

        if not isinstance(self.claim_new, str) or not self.claim_new.strip():
            raise ValueError("New claim cannot be empty")

        if not isinstance(self.timestamp_old, datetime):
            raise ValueError("Old timestamp must be a datetime")

        if not isinstance(self.timestamp_new, datetime):
            raise ValueError("New timestamp must be a datetime")

        if (
            self.timestamp_old.tzinfo is None
            or self.timestamp_old.utcoffset() is None
        ):
            raise ValueError("Old timestamp must be timezone-aware")

        if (
            self.timestamp_new.tzinfo is None
            or self.timestamp_new.utcoffset() is None
        ):
            raise ValueError("New timestamp must be timezone-aware")

        if not isinstance(self.confidence, (int, float)):
            raise ValueError("Confidence must be a number")

        if not math.isfinite(float(self.confidence)):
            raise ValueError("Confidence must be finite")

        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")


@dataclass
class Evidence:
    """Represents evidence supporting a conclusion."""

    conclusion: str
    sources: List[str] = field(default_factory=list)
    confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.LOW
    reasoning: str = ""

    def __post_init__(self):
        """Validate evidence data."""

        if (
            not isinstance(self.conclusion, str)
            or not self.conclusion.strip()
        ):
            raise ValueError("Conclusion cannot be empty")

        if not isinstance(self.confidence, (int, float)):
            raise ValueError("Confidence must be a number")

        if not math.isfinite(float(self.confidence)):
            raise ValueError("Confidence must be finite")

        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")

        if not isinstance(self.confidence_level, ConfidenceLevel):
            raise ValueError(
                "Confidence level must be a ConfidenceLevel"
            )


@dataclass
class WorkState:
    """Represents the current state of a work item."""

    entity: str
    state: StateCategory
    confidence: float
    evidence: List[str] = field(default_factory=list)
    last_update: Optional[datetime] = None
    blockers_preventing: List[str] = field(default_factory=list)

    def __post_init__(self):
        """Validate work state data."""

        if not isinstance(self.entity, str) or not self.entity.strip():
            raise ValueError("Entity cannot be empty")

        if not isinstance(self.state, StateCategory):
            raise ValueError("State must be a StateCategory")

        if not isinstance(self.confidence, (int, float)):
            raise ValueError("Confidence must be a number")

        if not math.isfinite(float(self.confidence)):
            raise ValueError("Confidence must be finite")

        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")

        if self.last_update is not None:
            if not isinstance(self.last_update, datetime):
                raise ValueError("Last update must be a datetime")

            if (
                self.last_update.tzinfo is None
                or self.last_update.utcoffset() is None
            ):
                raise ValueError(
                    "Last update must be timezone-aware"
                )


@dataclass
class Blocker:
    """Represents a detected blocker."""

    blocker: str
    affected_work: str
    impact: str
    evidence: List[str] = field(default_factory=list)
    confidence: float = 0.0

    def __post_init__(self):
        """Validate blocker data."""

        if not isinstance(self.blocker, str) or not self.blocker.strip():
            raise ValueError("Blocker cannot be empty")

        if (
            not isinstance(self.affected_work, str)
            or not self.affected_work.strip()
        ):
            raise ValueError("Affected work cannot be empty")

        if not isinstance(self.impact, str) or not self.impact.strip():
            raise ValueError("Impact cannot be empty")

        if not isinstance(self.confidence, (int, float)):
            raise ValueError("Confidence must be a number")

        if not math.isfinite(float(self.confidence)):
            raise ValueError("Confidence must be finite")

        if not 0 <= self.confidence <= 1:
            raise ValueError("Confidence must be between 0 and 1")


@dataclass
class Action:
    """Represents a recommended action."""

    action: str
    score: float
    reasoning: str
    evidence: List[str] = field(default_factory=list)
    source: Optional[str] = None

    def __post_init__(self):
        """Validate recommended action data."""

        if not isinstance(self.action, str) or not self.action.strip():
            raise ValueError("Action cannot be empty")

        if (
            not isinstance(self.reasoning, str)
            or not self.reasoning.strip()
        ):
            raise ValueError("Reasoning cannot be empty")

        if not isinstance(self.score, (int, float)):
            raise ValueError("Score must be a number")

        if not math.isfinite(float(self.score)):
            raise ValueError("Score must be finite")


@dataclass
class WorkResumptionBrief:
    """Final work resumption brief produced by the agent."""

    current_state: List[WorkState]
    conflicts: List[Conflict]
    blockers: List[Blocker]
    evidence: List[Evidence]
    actions: List[Action]
    recommended_first_action: Optional[Action]
    confidence_overall: float
    timestamp: datetime

    def __post_init__(self):
        """Validate final work resumption brief."""

        if not isinstance(self.confidence_overall, (int, float)):
            raise ValueError(
                "Overall confidence must be a number"
            )

        if not math.isfinite(float(self.confidence_overall)):
            raise ValueError(
                "Overall confidence must be finite"
            )

        if not 0 <= self.confidence_overall <= 100:
            raise ValueError(
                "Overall confidence must be 0-100"
            )

        if not isinstance(self.timestamp, datetime):
            raise ValueError("Timestamp must be a datetime")

        if (
            self.timestamp.tzinfo is None
            or self.timestamp.utcoffset() is None
        ):
            raise ValueError(
                "Timestamp must be timezone-aware"
            )