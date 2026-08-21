"""Human-readable formatting utilities for CLI output."""

import re
from typing import Any

from rich.console import Console
from rich.markdown import Markdown

from app.models.game_event import GameEvent
from app.schemas.game_state import ActionResultDTO, GameStateDTO
from app.services.investigation_context import InvestigationContext

_console = Console()


def format_location_tag(location_name: str | None) -> str:
    """Format location name as a recognizable player-facing tag."""
    name = location_name or "Unknown Location"
    return f"[LOCATION: {name}]"


def tag_locations_in_text(text: str, locations: list[dict[str, Any]]) -> str:
    """Wrap location names in [LOCATION: <name>] tags."""
    if not text or not locations:
        return text

    # Sort locations by name length descending to avoid partial matches
    sorted_locs = sorted(
        locations, key=lambda x: len(x.get("name") or ""), reverse=True
    )

    result = text
    for loc in sorted_locs:
        name = loc.get("name")
        if not name:
            continue
        # Use negative lookbehind and lookahead to avoid double tagging
        pattern = r"(?<!\[LOCATION: )" + re.escape(name) + r"(?!\])"
        result = re.sub(pattern, f"[LOCATION: {name}]", result)
    return result


def format_scenarios_list(scenarios: list[dict[str, Any]]) -> str:
    """Format available scenarios list for terminal display."""
    if not scenarios:
        return "No scenarios found."

    lines = [
        "Available Scenarios:",
        "",
        f"{'ID':<22} {'Version':<10} {'Name':<35}",
        "-" * 70,
    ]
    for s in scenarios:
        sid = s.get("id", "")
        ver = s.get("version", "")
        name = s.get("name", "")
        lines.append(f"{sid:<22} {ver:<10} {name:<35}")

    return "\n".join(lines)


def format_game_state(state: GameStateDTO) -> str:
    """Format player-facing GameStateDTO for terminal display."""
    disc_ev = (
        ", ".join(state.discovered_evidence_ids)
        if state.discovered_evidence_ids
        else "None"
    )
    inter_sus = (
        ", ".join(state.interviewed_suspect_ids)
        if state.interviewed_suspect_ids
        else "None"
    )
    visit_loc = (
        ", ".join(state.visited_location_ids) if state.visited_location_ids else "None"
    )
    comp_stg = (
        ", ".join(state.completed_stage_ids) if state.completed_stage_ids else "None"
    )

    stage_str = f"Stage {state.current_stage_order} ({state.current_stage_id})"
    lines = [
        "=" * 70,
        "                         INVESTIGATION GAME STATE",
        "=" * 70,
        f"Session ID          : {state.session_id}",
        f"Scenario ID         : {state.scenario_id}",
        f"Case ID             : {state.case_id}",
        f"Status              : {state.status.value.upper()}",
        f"Current Stage       : {stage_str}",
        f"Current Location    : {state.current_location_id or 'None'}",
        f"Score               : {state.score}",
        "-" * 70,
        f"Discovered Evidence : {disc_ev}",
        f"Interviewed Suspects: {inter_sus}",
        f"Visited Locations   : {visit_loc}",
        f"Completed Stages    : {comp_stg}",
        "=" * 70,
    ]
    return "\n".join(lines)


def format_action_result(result: ActionResultDTO) -> str:
    """Format ActionResultDTO after executing an action."""
    status_str = "SUCCESS" if result.success else "FAILED"

    # Try to load scenario locations to tag them in player-facing messages
    locations = []
    try:
        from app.scenarios.registry import ScenarioRegistry

        registry = ScenarioRegistry()
        scenario_def = registry.get_scenario(result.state.scenario_id)
        locations = [{"name": loc.name} for loc in scenario_def.locations]
    except Exception:
        pass

    message_tagged = tag_locations_in_text(result.message, locations)

    lines = [
        "-" * 70,
        f"Action              : {result.action.value.upper()}",
        f"Status              : {status_str}",
        f"Message             : {message_tagged}",
        f"Updated Score       : {result.state.score}",
    ]

    if result.newly_discovered_evidence:
        lines.append(
            f"New Evidence        : {', '.join(result.newly_discovered_evidence)}"
        )

    if result.already_known_evidence:
        lines.append(
            f"Already Known       : {', '.join(result.already_known_evidence)}"
        )

    if result.evidence_detail:
        ed = result.evidence_detail
        loc_display = (
            format_location_tag(ed.get("location_name"))
            if ed.get("location_name")
            else ed.get("location_id") or "N/A"
        )
        desc_tagged = tag_locations_in_text(ed.get("description") or "", locations)
        lines.extend(
            [
                "--- Evidence Details ---",
                f"  Name        : {ed.get('name')} ({ed.get('evidence_id', '')})",
                f"  Location    : {loc_display}",
                f"  Type        : {ed.get('evidence_type')}",
                f"  Description : {desc_tagged}",
            ]
        )

    if result.interview_result:
        ir = result.interview_result
        name_tagged = tag_locations_in_text(ir.get("name") or "", locations)
        alibi_tagged = tag_locations_in_text(ir.get("alibi") or "", locations)
        desc_tagged = tag_locations_in_text(ir.get("description") or "", locations)
        rel_tagged = tag_locations_in_text(
            ir.get("relationship_to_victim") or "", locations
        )
        lines.extend(
            [
                "--- Suspect Interview ---",
                f"  Name        : {name_tagged} ({ir.get('suspect_id', '')})",
                f"  Relationship: {rel_tagged or 'N/A'}",
                f"  Alibi       : {alibi_tagged or 'N/A'}",
                f"  Description : {desc_tagged}",
            ]
        )

    if result.stage_unlocked:
        lines.append(f"Unlocked Stage      : {result.stage_unlocked}")

    if result.solution_correct is not None:
        outcome = "CORRECT" if result.solution_correct else "INCORRECT"
        lines.append(f"Solution Result     : {outcome}")

    lines.append("-" * 70)
    return "\n".join(lines)


def format_investigation_status(
    context: InvestigationContext, show_actions: bool = True
) -> str:
    """Format compact, informative player-visible investigation status."""
    stage_name = f"Stage {context.current_stage_order} - {context.current_stage_name}"
    loc_display = (
        f"{context.current_location_name or 'None'} "
        f"({context.current_location_id or 'None'})"
    )
    total_locs = len(context.available_locations) + len(context.locked_locations)

    lines = [
        "=" * 70,
        "                         INVESTIGATION STATUS",
        "=" * 70,
        f"Case       : {context.case_title}",
        f"Stage      : {stage_name}",
        f"Location   : {loc_display}",
        f"Score      : {context.score}",
        f"Status     : {context.session_status}",
        "",
        f"Evidence discovered : {len(context.discovered_evidence)} item(s)",
        f"Suspects interviewed: {len(context.interviewed_suspects)} / "
        f"{len(context.available_suspects)}",
        f"Locations visited   : {len(context.visited_locations)} / {total_locs}",
    ]

    if show_actions:
        lines.extend(
            [
                "-" * 70,
                "AVAILABLE ACTIONS",
                "-" * 70,
            ]
        )

        # Movement options
        lines.append("[MOVE]")
        other_avail = [
            loc
            for loc in context.available_locations
            if loc["id"] != context.current_location_id
        ]
        if other_avail:
            for loc in other_avail:
                lines.append(f"  - {loc['name']} ({loc['id']})")
        else:
            lines.append("  - (No other unlocked locations)")

        if context.locked_locations:
            for loc in context.locked_locations:
                lines.append(f"  - [LOCKED] {loc['name']} ({loc['id']})")

        # Inspect
        current_loc_name = context.current_location_name or "current area"
        lines.append("\n[INSPECT]")
        lines.append(f"  - inspect  -> Search current location ({current_loc_name})")

        # Interrogate options
        lines.append("\n[INTERROGATE]")
        if context.available_suspects:
            for s in context.available_suspects:
                is_interviewed = any(
                    i["id"] == s["id"] for i in context.interviewed_suspects
                )
                tag = " (Interviewed)" if is_interviewed else ""
                lines.append(f"  - {s['name']} ({s['id']}){tag}")
        else:
            lines.append("  - (No suspects available at this stage)")

        # Examine options
        lines.append("\n[EXAMINE]")
        if context.discovered_evidence:
            for ev in context.discovered_evidence:
                loc_tag = (
                    format_location_tag(ev.get("location_name"))
                    if ev.get("location_name")
                    else ""
                )
                lines.append(f"  - {ev['name']} ({ev['id']}) {loc_tag}")
        else:
            lines.append("  - No evidence discovered yet.")
            lines.append("  - Inspect relevant locations to discover evidence.")

        # Advance status
        lines.append("\n[ADVANCE]")
        if context.can_advance:
            lines.append("  - [READY] Advance to the next investigation stage.")
        else:
            lines.append("  - [LOCKED] Stage requirements not yet satisfied.")

        # Solve
        lines.append("\n[SOLVE]")
        if context.is_final_stage:
            lines.append(
                "  - [READY] Final stage reached. "
                "Submit your final case solution theory."
            )
            lines.append("    Command: solve")
        else:
            lines.append(
                "  - [IN PROGRESS] Investigation incomplete. "
                "Submit final solution once ready."
            )

    lines.append("=" * 70)
    return "\n".join(lines)


def format_solve_briefing(context: InvestigationContext) -> str:
    """Format complete player-visible investigation briefing before case submission."""
    cur_loc_tag = format_location_tag(context.current_location_name)
    locations = context.available_locations + context.locked_locations

    lines = [
        "=" * 70,
        "                    FINAL CASE RESOLUTION BRIEFING",
        "=" * 70,
        f"Case               : {context.case_title}",
        f"Current Location   : {cur_loc_tag} ({context.current_location_id})",
        f"Investigation Score: {context.score} pts",
        "",
        "-" * 70,
        "DISCOVERED EVIDENCE",
        "-" * 70,
    ]

    if context.discovered_evidence:
        for ev in context.discovered_evidence:
            loc_str = format_location_tag(ev.get("location_name"))
            desc_tagged = tag_locations_in_text(ev.get("description") or "", locations)
            lines.extend(
                [
                    f"  - {ev['name']} ({ev['id']})",
                    f"    Location   : {loc_str}",
                    f"    Type       : {ev.get('evidence_type', 'N/A')}",
                    f"    Description: {desc_tagged}",
                    "",
                ]
            )
    else:
        lines.append("  (No evidence discovered)\n")

    lines.extend(
        [
            "-" * 70,
            "INTERVIEWED SUSPECTS",
            "-" * 70,
        ]
    )

    if context.interviewed_suspects:
        for s in context.interviewed_suspects:
            alibi_tagged = tag_locations_in_text(s.get("alibi") or "", locations)
            desc_tagged = tag_locations_in_text(s.get("description") or "", locations)
            lines.extend(
                [
                    f"  - {s['name']} ({s['id']})",
                    f"    Relationship : {s.get('relationship_to_victim') or 'N/A'}",
                    f"    Stated Alibi : {alibi_tagged or 'N/A'}",
                    f"    Description  : {desc_tagged}",
                    "",
                ]
            )
    else:
        lines.append("  (No suspects interviewed yet)\n")

    lines.extend(
        [
            "-" * 70,
            "VISITED LOCATIONS",
            "-" * 70,
        ]
    )

    if context.visited_locations:
        loc_map = {loc["id"]: loc["name"] for loc in context.available_locations}
        for loc_id in context.visited_locations:
            loc_name = loc_map.get(loc_id, loc_id)
            lines.append(f"  - {loc_name} ({loc_id})")
        lines.append("")
    else:
        lines.append("  (No locations visited)\n")

    lines.extend(
        [
            "-" * 70,
            "INVESTIGATION HISTORY SUMMARY",
            "-" * 70,
        ]
    )

    if context.investigation_history:
        for idx, h in enumerate(context.investigation_history, 1):
            ts = h.get("timestamp") or ""
            ev_type = h.get("event_type") or ""
            target = h.get("target_id") or ""
            lines.append(f"  {idx:>2}. [{ts}] {ev_type:<18} {target}")
        lines.append("")
    else:
        lines.append("  (No history recorded)\n")

    lines.extend(
        [
            "-" * 70,
            "CASE SOLUTION SUBMISSION",
            "-" * 70,
            "Enter your conclusions and evidence to submit your case for evaluation.\n",
        ]
    )

    return "\n".join(lines)


def render_ai_response(
    title: str, content: str, meta: dict[str, str] | None = None
) -> None:
    """Render AI responses with clean headers, metadata, and Rich Markdown."""
    print("\n" + "=" * 70)
    print(f"{title.center(70)}")
    print("=" * 70)
    if meta:
        for k, v in meta.items():
            print(f"{k:<14}: {v}")
        print("-" * 70)

    # Force a clean markdown strip and wrap
    cleaned_content = content.strip()
    _console.print(Markdown(cleaned_content))
    print("=" * 70 + "\n")


def format_history(events: list[GameEvent]) -> str:
    """Format chronological GameEvent audit history."""
    if not events:
        return "No history recorded for this session."

    header = (
        f"{'#':<4} {'Timestamp':<20} {'Action':<16} "
        f"{'Target Type':<12} {'Target ID':<12}"
    )
    lines = [
        "=" * 70,
        "                       INVESTIGATION AUDIT HISTORY",
        "=" * 70,
        header,
        "-" * 70,
    ]
    for idx, e in enumerate(events, 1):
        ts = e.timestamp.strftime("%Y-%m-%d %H:%M:%S") if e.timestamp else ""
        act = e.event_type or ""
        ttype = e.target_type or "-"
        tid = e.target_id or "-"
        lines.append(f"{idx:<4} {ts:<20} {act:<16} {ttype:<12} {tid:<12}")

    lines.append("=" * 70)
    return "\n".join(lines)


def format_error(error_message: str) -> str:
    """Format domain errors for friendly terminal presentation."""
    return f"[Error] {error_message}"
