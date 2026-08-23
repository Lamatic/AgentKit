from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict
from enum import Enum

class SourceType(Enum):
    COMMIT = "commit"
    PR_COMMENT = "pr_comment"
    GITHUB_ISSUE = "github_issue"
    TODO = "todo"
    MEETING_NOTE = "meeting_note"

class StateCategory(Enum):
    COMPLETE = "complete"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    PENDING = "pending"
    UNCERTAIN = "uncertain"

class ConfidenceLevel(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

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
        if not self.content.strip():
            raise ValueError("Content cannot be empty")
        if self.timestamp.tzinfo is None:
            raise ValueError("Timestamp must be timezone-aware")

@dataclass
class Conflict:
    """Represents a detected conflict between sources."""
    entity: str
    claim_old: str
    claim_new: str
    timestamp_old: datetime
    timestamp_new: datetime
    resolution: str
    confidence: float

    def __post_init__(self):
        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")

@dataclass
class Evidence:
    """Represents evidence for a conclusion."""
    conclusion: str
    sources: List[str]
    confidence: float
    confidence_level: ConfidenceLevel
    reasoning: str

    def __post_init__(self):
        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")

@dataclass
class WorkState:
    """Represents the state of work on an entity."""
    entity: str
    state: StateCategory
    confidence: float
    evidence: List[str]
    last_update: datetime
    blockers_preventing: List[str] = field(default_factory=list)

@dataclass
class Blocker:
    """Represents something blocking progress."""
    blocker: str
    affected_work: str
    impact: str
    evidence: List[str]
    confidence: float

@dataclass
class Action:
    """Represents a candidate action."""
    action: str
    score: float
    reasoning: str
    evidence: List[str]
    source: str

@dataclass
class WorkResumptionBrief:
    """Final output: the resumption brief."""
    current_state: List[WorkState]
    conflicts: List[Conflict]
    blockers: List[Blocker]
    evidence: List[Evidence]
    actions: List[Action]
    recommended_first_action: Optional[Action]
    confidence_overall: float
    timestamp: datetime