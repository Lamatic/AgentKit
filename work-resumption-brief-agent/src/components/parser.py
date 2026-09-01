from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from src.logger import setup_logger
from src.models import NormalizedEvent, SourceType


logger = setup_logger("Parser")


class MultiSourceInputParser:
    """Normalize supported source types into NormalizedEvent objects."""

    def parse(self, inputs: Dict[str, List[Any]]) -> List[NormalizedEvent]:
        if not isinstance(inputs, dict):
            logger.error("Parser received invalid input structure")
            raise ValueError("Parser input must be a dictionary")

        events: List[NormalizedEvent] = []

        source_parsers = {
            "commits": self._parse_commits,
            "pr_comments": self._parse_pr_comments,
            "issues": self._parse_issues,
            "todos": self._parse_todos,
            "meeting_notes": self._parse_meeting_notes,
        }

        for source_type, items in inputs.items():
            if source_type not in source_parsers:
                logger.warning(
                    "Unknown source type skipped: %s",
                    source_type,
                )
                continue

            if items is None:
                logger.warning(
                    "Source '%s' contains no items",
                    source_type,
                )
                continue

            if not isinstance(items, list):
                logger.error(
                    "Invalid structure for source '%s'; expected list",
                    source_type,
                )
                continue

            try:
                parsed_events = source_parsers[source_type](items)
                events.extend(parsed_events)
            except Exception as exc:
                logger.error(
                    "Failed to parse source '%s': %s",
                    source_type,
                    exc,
                )
                continue

        logger.info(
            "Parsed %d events from mixed sources",
            len(events),
        )

        return events

    def _parse_commits(
        self,
        commits: List[Dict[str, Any]],
    ) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []

        for commit in commits:
            try:
                if not isinstance(commit, dict):
                    raise ValueError("Commit must be a dictionary")

                timestamp = self._parse_timestamp(
                    commit.get("timestamp")
                )

                content = commit.get("message", "")

                if not isinstance(content, str) or not content.strip():
                    raise ValueError("Commit message cannot be empty")

                source_id = commit.get("hash")

                if not isinstance(source_id, str) or not source_id.strip():
                    raise ValueError("Commit hash cannot be empty")

                event = NormalizedEvent(
                    source_type=SourceType.COMMIT,
                    source_id=source_id,
                    timestamp=timestamp,
                    author=commit.get("author"),
                    content=content,
                    entity_candidates=self._extract_entities(content),
                    metadata={"hash": source_id},
                )

                events.append(event)

            except Exception as exc:
                logger.error(
                    "Failed to parse commit: %s",
                    exc,
                )
                continue

        return events

    def _parse_pr_comments(
        self,
        pr_comments: List[Dict[str, Any]],
    ) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []

        for comment in pr_comments:
            try:
                if not isinstance(comment, dict):
                    raise ValueError(
                        "PR comment must be a dictionary"
                    )

                timestamp = self._parse_timestamp(
                    comment.get("timestamp")
                )

                content = comment.get("text", "")

                if not isinstance(content, str) or not content.strip():
                    raise ValueError(
                        "PR comment cannot be empty"
                    )

                pr_number = comment.get("pr_number")

                if pr_number is None:
                    raise ValueError(
                        "PR number cannot be empty"
                    )

                event = NormalizedEvent(
                    source_type=SourceType.PR_COMMENT,
                    source_id=f"pr_{pr_number}",
                    timestamp=timestamp,
                    author=comment.get("author"),
                    content=content,
                    entity_candidates=self._extract_entities(content),
                    metadata={"pr_number": pr_number},
                )

                events.append(event)

            except Exception as exc:
                logger.error(
                    "Failed to parse PR comment: %s",
                    exc,
                )
                continue

        return events

    def _parse_issues(
        self,
        issues: List[Dict[str, Any]],
    ) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []

        for issue in issues:
            try:
                if not isinstance(issue, dict):
                    raise ValueError("Issue must be a dictionary")

                timestamp = self._parse_timestamp(
                    issue.get("timestamp")
                )

                title = issue.get("title", "")
                body = issue.get("body", "")

                if not isinstance(title, str):
                    title = ""

                if not isinstance(body, str):
                    body = ""

                content = f"{title} {body}".strip()

                if not content:
                    raise ValueError(
                        "Issue content cannot be empty"
                    )

                issue_number = issue.get("issue_number")

                if issue_number is None:
                    raise ValueError(
                        "Issue number cannot be empty"
                    )

                event = NormalizedEvent(
                    source_type=SourceType.GITHUB_ISSUE,
                    source_id=f"issue_{issue_number}",
                    timestamp=timestamp,
                    author=issue.get("author"),
                    content=content,
                    entity_candidates=self._extract_entities(content),
                    metadata={
                        "issue_number": issue_number,
                        "state": issue.get("state"),
                    },
                )

                events.append(event)

            except Exception as exc:
                logger.error(
                    "Failed to parse issue: %s",
                    exc,
                )
                continue

        return events

    def _parse_todos(
        self,
        todos: List[Dict[str, Any]],
    ) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []

        for todo in todos:
            try:
                if not isinstance(todo, dict):
                    raise ValueError("TODO must be a dictionary")

                timestamp = todo.get("timestamp")

                if timestamp:
                    parsed_timestamp = self._parse_timestamp(timestamp)
                else:
                    parsed_timestamp = datetime.now(timezone.utc)

                content = todo.get("text", "")

                if not isinstance(content, str) or not content.strip():
                    raise ValueError(
                        "TODO content cannot be empty"
                    )

                file_name = todo.get("file")
                line_number = todo.get("line")

                source_id = (
                    f"todo_{file_name}_{line_number}"
                )

                event = NormalizedEvent(
                    source_type=SourceType.TODO,
                    source_id=source_id,
                    timestamp=parsed_timestamp,
                    author=None,
                    content=content,
                    entity_candidates=self._extract_entities(content),
                    metadata={
                        "file": file_name,
                        "line": line_number,
                    },
                )

                events.append(event)

            except Exception as exc:
                logger.error(
                    "Failed to parse TODO: %s",
                    exc,
                )
                continue

        return events

    def _parse_meeting_notes(
        self,
        notes: List[Dict[str, Any]],
    ) -> List[NormalizedEvent]:
        events: List[NormalizedEvent] = []

        for note in notes:
            try:
                if not isinstance(note, dict):
                    raise ValueError(
                        "Meeting note must be a dictionary"
                    )

                timestamp = (
                    note.get("timestamp")
                    or note.get("date")
                )

                parsed_timestamp = self._parse_timestamp(
                    timestamp
                )

                content = note.get("text", "")

                if not isinstance(content, str) or not content.strip():
                    raise ValueError(
                        "Meeting note cannot be empty"
                    )

                source_id = (
                    f"meeting_{parsed_timestamp.isoformat()}"
                )

                event = NormalizedEvent(
                    source_type=SourceType.MEETING_NOTE,
                    source_id=source_id,
                    timestamp=parsed_timestamp,
                    author=None,
                    content=content,
                    entity_candidates=self._extract_entities(content),
                    metadata={
                        "participants": note.get(
                            "participants",
                            [],
                        )
                    },
                )

                events.append(event)

            except Exception as exc:
                logger.error(
                    "Failed to parse meeting note: %s",
                    exc,
                )
                continue

        return events

    def _parse_timestamp(
        self,
        timestamp: Optional[str],
    ) -> datetime:
        if not timestamp:
            raise ValueError(
                "Timestamp cannot be empty"
            )

        if not isinstance(timestamp, str):
            raise ValueError(
                "Timestamp must be a string"
            )

        try:
            parsed = datetime.fromisoformat(
                timestamp.replace("Z", "+00:00")
            )
        except (ValueError, AttributeError) as exc:
            raise ValueError(
                f"Invalid timestamp format: {timestamp}"
            ) from exc

        if (
            parsed.tzinfo is None
            or parsed.utcoffset() is None
        ):
            raise ValueError(
                "Timestamp must be timezone-aware"
            )

        return parsed.astimezone(timezone.utc)

    def _extract_entities(
        self,
        text: str,
    ) -> List[str]:
        if not isinstance(text, str):
            return []

        entities: List[str] = []

        for word in text.split():
            cleaned = word.strip(
                ".,!?;:()[]{}\"'"
            )

            if (
                cleaned
                and cleaned[0].isupper()
                and cleaned not in entities
            ):
                entities.append(cleaned)

        return entities[:5]


Parser = MultiSourceInputParser