from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from src.logger import setup_logger
from src.models import NormalizedEvent, SourceType

logger = setup_logger("Parser")


class MultiSourceInputParser:
    """Normalize all source types into NormalizedEvent."""

    def parse(self, inputs: Dict[str, List[Any]]) -> List[NormalizedEvent]:
        """Main entry point."""
        events = []

        if "commits" in inputs:
            events.extend(self._parse_commits(inputs["commits"]))

        if "pr_comments" in inputs:
            events.extend(self._parse_pr_comments(inputs["pr_comments"]))

        if "issues" in inputs:
            events.extend(self._parse_issues(inputs["issues"]))

        if "todos" in inputs:
            events.extend(self._parse_todos(inputs["todos"]))

        if "meeting_notes" in inputs:
            events.extend(self._parse_meeting_notes(inputs["meeting_notes"]))

        logger.info(f"Parsed {len(events)} events from mixed sources")
        return events

    def _parse_commits(self, commits: List[Dict]) -> List[NormalizedEvent]:
        events = []

        for commit in commits:
            ts = self._parse_timestamp(commit.get("timestamp"))
            content = commit.get("message", "")

            if not content.strip():
                raise ValueError("Commit message cannot be empty")

            event = NormalizedEvent(
                source_type=SourceType.COMMIT,
                source_id=commit.get("hash", "unknown"),
                timestamp=ts,
                author=commit.get("author"),
                content=content,
                entity_candidates=self._extract_entities(content),
                metadata={"hash": commit.get("hash")},
            )
            events.append(event)

        return events

    def _parse_pr_comments(
        self, pr_comments: List[Dict]
    ) -> List[NormalizedEvent]:
        events = []

        for comment in pr_comments:
            ts = self._parse_timestamp(comment.get("timestamp"))
            content = comment.get("text", "")

            if not content.strip():
                raise ValueError("PR comment cannot be empty")

            event = NormalizedEvent(
                source_type=SourceType.PR_COMMENT,
                source_id=f"pr_{comment.get('pr_number')}",
                timestamp=ts,
                author=comment.get("author"),
                content=content,
                entity_candidates=self._extract_entities(content),
                metadata={"pr_number": comment.get("pr_number")},
            )
            events.append(event)

        return events

    def _parse_issues(self, issues: List[Dict]) -> List[NormalizedEvent]:
        events = []

        for issue in issues:
            ts = self._parse_timestamp(issue.get("timestamp"))
            content = f"{issue.get('title', '')} {issue.get('body', '')}".strip()

            if not content:
                raise ValueError("Issue content cannot be empty")

            event = NormalizedEvent(
                source_type=SourceType.GITHUB_ISSUE,
                source_id=f"issue_{issue.get('issue_number')}",
                timestamp=ts,
                author=issue.get("author"),
                content=content,
                entity_candidates=self._extract_entities(content),
                metadata={
                    "issue_number": issue.get("issue_number"),
                    "state": issue.get("state"),
                },
            )
            events.append(event)

        return events

    def _parse_todos(self, todos: List[Dict]) -> List[NormalizedEvent]:
        events = []

        for todo in todos:
            if "timestamp" in todo:
                ts = self._parse_timestamp(todo.get("timestamp"))
            else:
                ts = datetime.now(timezone.utc)

            content = todo.get("text", "")

            if not content.strip():
                raise ValueError("TODO content cannot be empty")

            event = NormalizedEvent(
                source_type=SourceType.TODO,
                source_id=f"todo_{todo.get('file')}_{todo.get('line')}",
                timestamp=ts,
                author=None,
                content=content,
                entity_candidates=self._extract_entities(content),
                metadata={
                    "file": todo.get("file"),
                    "line": todo.get("line"),
                },
            )
            events.append(event)

        return events

    def _parse_meeting_notes(
        self, notes: List[Dict]
    ) -> List[NormalizedEvent]:
        events = []

        for note in notes:
            ts = self._parse_timestamp(
                note.get("timestamp") or note.get("date")
            )
            content = note.get("text", "")

            if not content.strip():
                raise ValueError("Meeting note cannot be empty")

            event = NormalizedEvent(
                source_type=SourceType.MEETING_NOTE,
                source_id=f"meeting_{ts.isoformat()}",
                timestamp=ts,
                author=None,
                content=content,
                entity_candidates=self._extract_entities(content),
                metadata={
                    "participants": note.get("participants", [])
                },
            )
            events.append(event)

        return events

    def _parse_timestamp(self, ts_str: Optional[str]) -> datetime:
        """Parse timestamp string to UTC datetime."""

        if not ts_str:
            raise ValueError("Timestamp cannot be empty")

        try:
            dt = datetime.fromisoformat(
                ts_str.replace("Z", "+00:00")
            )

            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)

            return dt.astimezone(timezone.utc)

        except (ValueError, AttributeError):
            raise ValueError(
                f"Invalid timestamp format: {ts_str}"
            )

    def _extract_entities(self, text: str) -> List[str]:
        """Extract likely entity names from text."""

        words = text.split()
        entities = []

        for word in words:
            cleaned = word.strip(".,!?;:()[]{}\"'")

            if cleaned and cleaned[0].isupper():
                if cleaned not in entities:
                    entities.append(cleaned)

        return entities[:5]