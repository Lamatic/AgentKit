"""Service for building the player-facing PlayerInvestigationState DTO."""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.schemas.session import (
    AvailabilityFlag,
    AvailableActionsState,
    AvailableLocationState,
    AvailableSuspectState,
    CaseState,
    CurrentLocationState,
    DiscoveredEvidenceState,
    HistoryEventState,
    PlayerInvestigationState,
    ProgressionState,
    StageState,
)
from app.models.game_event import GameEvent
from app.scenarios.loader import ScenarioLoader
from app.services.game_engine import GameEngine
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


class PlayerStateBuilder:
    """Builder for constructing PlayerInvestigationState DTOs."""

    def __init__(
        self,
        session_service: SessionService | None = None,
        loader: ScenarioLoader | None = None,
        game_engine: GameEngine | None = None,
    ) -> None:
        self.session_service = session_service or SessionService()
        self.loader = loader or ScenarioLoader()
        self.game_engine = game_engine or GameEngine(
            loader=self.loader, session_service=self.session_service
        )

    def build_state(self, session_id: str, db: Session) -> PlayerInvestigationState:
        """Construct a complete player-facing investigation state for the session."""
        session_obj = self.session_service.get_session(session_id, db=db)
        state_dto = self.session_service.to_game_state_dto(session_obj)
        scenario_def = self.loader.load(state_dto.scenario_id)

        # 1. Strip ground truth by using public view (to_player_view)
        public_scenario = scenario_def.to_player_view()

        # 2. Case state
        case_state = CaseState(
            title=public_scenario.case.title,
            description=public_scenario.case.description,
        )

        # 3. Stage state
        curr_stage = next(
            (s for s in public_scenario.stages if s.id == state_dto.current_stage_id),
            None,
        )
        if not curr_stage:
            curr_stage = sorted(public_scenario.stages, key=lambda s: s.order)[0]

        stage_state = StageState(
            id=curr_stage.id,
            order=curr_stage.order,
            name=curr_stage.name,
            description=curr_stage.description,
            status="active" if state_dto.status.value == "in_progress" else "completed",
        )

        # 4. Current location state
        cur_loc = next(
            (
                loc
                for loc in public_scenario.locations
                if loc.id == state_dto.current_location_id
            ),
            None,
        )
        current_location_state = (
            CurrentLocationState(
                id=cur_loc.id,
                name=cur_loc.name,
                description=cur_loc.description,
            )
            if cur_loc
            else None
        )

        # 5. History and Examined Evidence detection
        events = db.scalars(
            select(GameEvent)
            .where(GameEvent.session_id == session_id)
            .order_by(GameEvent.timestamp)
        ).all()

        # Track examined evidence from GameEvents
        examined_evidence_ids = {
            e.target_id
            for e in events
            if e.event_type == "EXAMINE_EVIDENCE" and e.target_id
        }

        # Generate chronological history events
        history_events = []
        sim_curr_location_id = None
        sim_discovered = set()

        for e in events:
            timestamp_str = (
                e.timestamp.strftime("%Y-%m-%d %H:%M:%S") if e.timestamp else None
            )

            if e.event_type == "START_GAME":
                sim_curr_location_id = (
                    e.result_data.get("initial_location") if e.result_data else None
                )
                message = (
                    f"You started the investigation in scenario "
                    f"'{public_scenario.name}'."
                )
                history_events.append(
                    HistoryEventState(
                        event_type="START_GAME",
                        message=message,
                        timestamp=timestamp_str,
                    )
                )
            elif e.event_type == "MOVE":
                sim_curr_location_id = e.target_id
                loc = next(
                    (
                        loc_obj
                        for loc_obj in public_scenario.locations
                        if loc_obj.id == sim_curr_location_id
                    ),
                    None,
                )
                loc_name = loc.name if loc else sim_curr_location_id
                message = f"You moved to {loc_name}."
                history_events.append(
                    HistoryEventState(
                        event_type="MOVE",
                        message=message,
                        timestamp=timestamp_str,
                    )
                )
            elif e.event_type == "INSPECT":
                loc = next(
                    (
                        loc_obj
                        for loc_obj in public_scenario.locations
                        if loc_obj.id == sim_curr_location_id
                    ),
                    None,
                )
                loc_name = loc.name if loc else "current location"
                message = f"You inspected the {loc_name}."
                history_events.append(
                    HistoryEventState(
                        event_type="INSPECT",
                        message=message,
                        timestamp=timestamp_str,
                    )
                )
                # Trigger discovery items that are visible to player
                for ev in public_scenario.evidence:
                    if (
                        ev.location_id == sim_curr_location_id
                        and ev.id in state_dto.discovered_evidence_ids
                        and ev.id not in sim_discovered
                    ):
                        sim_discovered.add(ev.id)
                        history_events.append(
                            HistoryEventState(
                                event_type="DISCOVERY",
                                message=f"You discovered {ev.name}.",
                                timestamp=timestamp_str,
                            )
                        )
            elif e.event_type == "INTERVIEW":
                sus = next(
                    (s for s in public_scenario.suspects if s.id == e.target_id), None
                )
                sus_name = sus.name if sus else e.target_id
                message = f"You interviewed {sus_name}."
                history_events.append(
                    HistoryEventState(
                        event_type="INTERVIEW",
                        message=message,
                        timestamp=timestamp_str,
                    )
                )
            elif e.event_type == "EXAMINE_EVIDENCE":
                ev = next(
                    (
                        ev_obj
                        for ev_obj in public_scenario.evidence
                        if ev_obj.id == e.target_id
                    ),
                    None,
                )
                ev_name = ev.name if ev else e.target_id
                message = f"You examined {ev_name}."
                history_events.append(
                    HistoryEventState(
                        event_type="EXAMINE",
                        message=message,
                        timestamp=timestamp_str,
                    )
                )
            elif e.event_type == "ADVANCE_STAGE":
                msg = e.result_data.get("message") if e.result_data else None
                if not msg:
                    msg = "Advanced investigation stage."
                history_events.append(
                    HistoryEventState(
                        event_type="ADVANCE",
                        message=msg,
                        timestamp=timestamp_str,
                    )
                )
            elif e.event_type == "SUBMIT_SOLUTION":
                msg = e.result_data.get("message") if e.result_data else None
                if not msg:
                    msg = "Submitted a case solution."
                history_events.append(
                    HistoryEventState(
                        event_type="SOLVE",
                        message=msg,
                        timestamp=timestamp_str,
                    )
                )

        # 6. Available locations list
        visited_ids = set(state_dto.visited_location_ids)
        available_locations_list = []
        for loc in public_scenario.locations:
            is_current = loc.id == state_dto.current_location_id

            # Authoritative check if accessible
            is_accessible = loc.is_initial_unlocked or loc.id in visited_ids
            if not is_accessible:
                for st in public_scenario.stages:
                    if st.order <= state_dto.current_stage_order:
                        reqs = st.requirements or {}
                        req_locs = reqs.get("required_location_ids") or reqs.get(
                            "location_ids", []
                        )
                        if loc.id in req_locs:
                            is_accessible = True
                            break

            is_locked = not is_accessible
            lock_reason = None
            if is_locked:
                stage_req = None
                for st in public_scenario.stages:
                    reqs = st.requirements or {}
                    req_locs = reqs.get("required_location_ids") or reqs.get(
                        "location_ids", []
                    )
                    if loc.id in req_locs:
                        stage_req = st
                        break
                lock_reason = (
                    f"This location becomes accessible during Stage {stage_req.order}."
                    if stage_req
                    else "This location is locked."
                )

            available_locations_list.append(
                AvailableLocationState(
                    id=loc.id,
                    name=loc.name,
                    description=loc.description,
                    is_current=is_current,
                    is_locked=is_locked,
                    lock_reason=lock_reason,
                )
            )

        # 7. Available suspects list
        relevant_suspect_ids = set(state_dto.interviewed_suspect_ids)
        has_any_suspect_reqs = False
        for st in public_scenario.stages:
            reqs = st.requirements or {}
            req_suss = reqs.get("required_suspect_ids") or reqs.get("suspect_ids", [])
            if req_suss:
                has_any_suspect_reqs = True
            if st.order <= state_dto.current_stage_order:
                for sus_id in req_suss:
                    relevant_suspect_ids.add(sus_id)

        available_suspects_list = []
        for s in public_scenario.suspects:
            already_interviewed = s.id in state_dto.interviewed_suspect_ids
            can_interrogate = (not has_any_suspect_reqs) or (
                s.id in relevant_suspect_ids
            )

            available_suspects_list.append(
                AvailableSuspectState(
                    id=s.id,
                    name=s.name,
                    public_description=s.description,
                    relationship_to_victim=s.relationship_to_victim or "",
                    can_interrogate=can_interrogate,
                    already_interviewed=already_interviewed,
                )
            )

        # 8. Discovered evidence list
        loc_map = {loc.id: loc.name for loc in public_scenario.locations}
        discovered_evidence_list = []
        for ev in public_scenario.evidence:
            if ev.id in state_dto.discovered_evidence_ids:
                examined = ev.id in examined_evidence_ids
                discovered_evidence_list.append(
                    DiscoveredEvidenceState(
                        id=ev.id,
                        name=ev.name,
                        type=ev.evidence_type,
                        description=ev.description,
                        location_id=ev.location_id,
                        location_name=loc_map.get(ev.location_id)
                        if ev.location_id
                        else None,
                        examined=examined,
                    )
                )

        # 9. Stage advancement readiness
        can_advance, next_stage_name = self.game_engine.check_stage_advancement_ready(
            session_id, db=db
        )

        # Calculate missing requirements for stage advancement reason & progression
        reqs = curr_stage.requirements or {}
        req_evs = reqs.get("required_evidence_ids") or reqs.get("evidence_ids", [])
        req_locs = reqs.get("required_location_ids") or reqs.get("location_ids", [])
        req_suss = reqs.get("required_suspect_ids") or reqs.get("suspect_ids", [])

        discovered_evs = set(state_dto.discovered_evidence_ids)
        visited_locs = set(state_dto.visited_location_ids)
        interviewed_suss = set(state_dto.interviewed_suspect_ids)

        missing_evs = [ev for ev in req_evs if ev not in discovered_evs]
        missing_locs = [loc for loc in req_locs if loc not in visited_locs]
        missing_suss = [sus for sus in req_suss if sus not in interviewed_suss]

        remaining_requirements = []
        for ev_id in missing_evs:
            ev = next((e for e in public_scenario.evidence if e.id == ev_id), None)
            if ev:
                remaining_requirements.append(f"Examine the {ev.name}")
        for sus_id in missing_suss:
            sus = next((s for s in public_scenario.suspects if s.id == sus_id), None)
            if sus:
                remaining_requirements.append(f"Interview {sus.name}")
        for loc_id in missing_locs:
            loc = next(
                (
                    loc_obj
                    for loc_obj in public_scenario.locations
                    if loc_obj.id == loc_id
                ),
                None,
            )
            if loc:
                remaining_requirements.append(f"Visit the {loc.name}")

        # 10. Available actions
        can_inspect = bool(
            state_dto.current_location_id and state_dto.status.value == "in_progress"
        )

        # Compose advance availability
        sorted_stages = sorted(public_scenario.stages, key=lambda s: s.order)
        is_final_stage = curr_stage.id == sorted_stages[-1].id

        advance_available = can_advance and state_dto.status.value == "in_progress"
        advance_reason = None
        if not advance_available:
            if state_dto.status.value != "in_progress":
                advance_reason = "The session has already been completed."
            elif is_final_stage:
                advance_reason = "You have already reached the final stage."
            elif missing_evs:
                advance_reason = "Required evidence has not been discovered."
            elif missing_suss:
                advance_reason = "Required suspects have not been interviewed."
            elif missing_locs:
                advance_reason = "Required locations have not been visited."
            else:
                advance_reason = "Stage requirements have not been met."

        advance_flag = AvailabilityFlag(
            available=advance_available,
            reason=advance_reason,
        )

        # Compose solve availability
        solve_available = is_final_stage and state_dto.status.value == "in_progress"
        solve_reason = None
        if not solve_available:
            if state_dto.status.value != "in_progress":
                solve_reason = "The session has already been completed."
            elif not is_final_stage:
                solve_reason = "You must reach the final stage to solve the case."

        solve_flag = AvailabilityFlag(
            available=solve_available,
            reason=solve_reason,
        )

        available_actions_state = AvailableActionsState(
            can_inspect=can_inspect,
            can_advance=advance_flag,
            can_solve=solve_flag,
        )

        # 11. Progression State
        next_objective = curr_stage.description if curr_stage else None

        progression_state = ProgressionState(
            completed_stages=state_dto.completed_stage_ids,
            remaining_requirements=remaining_requirements,
            next_objective=next_objective,
        )

        return PlayerInvestigationState(
            session_id=state_dto.session_id,
            scenario_id=state_dto.scenario_id,
            case=case_state,
            stage=stage_state,
            current_location=current_location_state,
            score=state_dto.score,
            session_status=state_dto.status.value,
            available_actions=available_actions_state,
            available_locations=available_locations_list,
            available_suspects=available_suspects_list,
            discovered_evidence=discovered_evidence_list,
            investigation_history=history_events,
            progression=progression_state,
        )
