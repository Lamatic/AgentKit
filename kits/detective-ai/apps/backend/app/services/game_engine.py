"""Authoritative deterministic Game Engine for DetectiveAI."""

import logging

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.core.exceptions import (
    EvidenceNotDiscoveredError,
    InvalidActionError,
    InvalidLocationError,
    InvalidSolutionError,
    LocationLockedError,
    SessionAlreadyCompletedError,
    StageRequirementsNotMetError,
    SuspectNotAvailableError,
)
from app.models.game_event import GameEvent
from app.models.game_session import GameSession
from app.scenarios.loader import ScenarioLoader
from app.scenarios.schemas import ScenarioDefinition
from app.schemas.game_state import (
    ActionResultDTO,
    ActionType,
    GameActionDTO,
    SessionStatus,
)
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


class GameEngine:
    """Authoritative state machine and rule execution engine for investigations."""

    def __init__(
        self,
        loader: ScenarioLoader | None = None,
        session_service: SessionService | None = None,
    ) -> None:
        self.loader = loader or ScenarioLoader()
        self.session_service = session_service or SessionService(loader=self.loader)

    def execute_action(
        self,
        session_id: str,
        action: GameActionDTO,
        db: Session,
    ) -> ActionResultDTO:
        """Central execution entrypoint for all investigation game actions.

        1. Loads session and verifies status.
        2. Loads relevant scenario definition.
        3. Validates and executes action rules deterministically.
        4. Mutates state and records append-only GameEvent audit log.
        5. Returns structured ActionResultDTO.
        """
        session = self.session_service.get_session(session_id, db)

        # Enforce state transition rule: completed sessions reject actions
        if session.status in (
            SessionStatus.SOLVED.value,
            SessionStatus.FAILED.value,
        ):
            logger.warning(
                "Session %s is already %s, rejecting action %s",
                session_id,
                session.status,
                action.action_type.value,
            )
            raise SessionAlreadyCompletedError(
                f"Session '{session_id}' is already {session.status.upper()} "
                "and cannot accept further investigation actions."
            )

        meta = session.state_metadata or {}
        scenario_id = meta.get("scenario_id")
        if not scenario_id:
            logger.error(
                "Session metadata missing scenario_id for session_id=%s", session_id
            )
            raise InvalidActionError("Session metadata missing scenario_id.")

        logger.info(
            "Executing action %s for session_id=%s scenario_id=%s "
            "target=%s current_stage=%s current_location=%s",
            action.action_type.value.upper(),
            session_id,
            scenario_id,
            action.target_id,
            meta.get("current_stage_id"),
            session.current_location_id,
        )

        scenario = self.loader.load(scenario_id)

        # Dispatch action handlers
        if action.action_type == ActionType.MOVE:
            result = self._handle_move(session, scenario, action)
        elif action.action_type == ActionType.INSPECT:
            result = self._handle_inspect(session, scenario, action)
        elif action.action_type == ActionType.INTERVIEW:
            result = self._handle_interview(session, scenario, action)
        elif action.action_type == ActionType.EXAMINE_EVIDENCE:
            result = self._handle_examine_evidence(session, scenario, action)
        elif action.action_type == ActionType.ADVANCE_STAGE:
            result = self._handle_advance_stage(session, scenario, action)
        elif action.action_type == ActionType.SUBMIT_SOLUTION:
            result = self._handle_submit_solution(session, scenario, action)
        else:
            raise InvalidActionError(f"Unsupported action type '{action.action_type}'")

        # Record append-only GameEvent audit log
        event = GameEvent(
            session_id=session.id,
            event_type=action.action_type.value.upper(),
            target_type=self._get_target_type(action.action_type),
            target_id=action.target_id,
            result_data={
                "success": result.success,
                "message": result.message,
                "score": session.score,
            },
        )
        db.add(event)

        # Save session changes and commit transaction
        session.state_metadata = dict(meta)
        flag_modified(session, "state_metadata")
        db.add(session)
        db.commit()
        db.refresh(session)

        # Update state DTO in result
        result.state = self.session_service.to_game_state_dto(session)
        logger.info(
            "Action %s completed successfully for session_id=%s score=%d",
            action.action_type.value.upper(),
            session_id,
            session.score,
        )
        return result

    def resolve_location_id(
        self, scenario: ScenarioDefinition, identifier: str | None
    ) -> str:
        """Resolve location ID from exact ID, exact name, or case-insensitive name."""
        if not identifier or not identifier.strip():
            logger.warning("MOVE action failed: missing target_id")
            raise InvalidLocationError("MOVE action requires target_id (location ID).")

        clean = identifier.strip()
        # 1. Exact ID
        for loc in scenario.locations:
            if loc.id == clean:
                return loc.id
        # 2. Exact Name
        name_matches = [loc for loc in scenario.locations if loc.name == clean]
        if len(name_matches) == 1:
            return name_matches[0].id
        # 3. Case-insensitive ID
        ci_id = [loc for loc in scenario.locations if loc.id.lower() == clean.lower()]
        if len(ci_id) == 1:
            return ci_id[0].id
        # 4. Case-insensitive Name
        ci_name = [
            loc for loc in scenario.locations if loc.name.lower() == clean.lower()
        ]
        if len(ci_name) == 1:
            return ci_name[0].id

        logger.warning(
            "MOVE action failed: location %s does not exist in scenario %s",
            identifier,
            scenario.scenario_id,
        )
        raise InvalidLocationError(
            f"Location '{identifier}' does not exist in scenario "
            f"'{scenario.scenario_id}'."
        )

    def check_stage_advancement_ready(
        self, session_id: str, db: Session
    ) -> tuple[bool, str | None]:
        """Check whether the active session satisfies stage advancement requirements.

        Returns:
            (True, next_stage_name) if ready to advance.
            (False, None) if in progress (missing requirements).
        """
        session = self.session_service.get_session(session_id, db=db)
        meta = session.state_metadata or {}
        scenario_id = meta.get("scenario_id") or session.case_id
        scenario = self.loader.load(scenario_id)

        curr_stage_id = meta.get("current_stage_id")
        curr_stage = next(
            (st for st in scenario.stages if st.id == curr_stage_id), None
        )
        if not curr_stage:
            curr_stage = sorted(scenario.stages, key=lambda s: s.order)[0]

        reqs = curr_stage.requirements or {}
        req_evs = reqs.get("required_evidence_ids") or reqs.get("evidence_ids", [])
        req_locs = reqs.get("required_location_ids") or reqs.get("location_ids", [])
        req_suss = reqs.get("required_suspect_ids") or reqs.get("suspect_ids", [])

        discovered_evs = set(meta.get("discovered_evidence_ids", []))
        visited_locs = set(meta.get("visited_location_ids", []))
        interviewed_suss = set(meta.get("interviewed_suspect_ids", []))

        is_ready = not (
            any(ev not in discovered_evs for ev in req_evs)
            or any(loc not in visited_locs for loc in req_locs)
            or any(sus not in interviewed_suss for sus in req_suss)
        )

        if not is_ready:
            return False, None

        sorted_stages = sorted(scenario.stages, key=lambda s: s.order)
        curr_idx = next(
            (i for i, s in enumerate(sorted_stages) if s.id == curr_stage.id), 0
        )
        next_stage = (
            sorted_stages[curr_idx + 1] if curr_idx + 1 < len(sorted_stages) else None
        )
        next_stage_str = (
            f"Stage {next_stage.order} - {next_stage.name} ({next_stage.id})"
            if next_stage
            else None
        )
        return True, next_stage_str

    def _handle_move(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        target_id = self.resolve_location_id(scenario, action.target_id)
        location = next(
            (loc for loc in scenario.locations if loc.id == target_id), None
        )
        if not location:
            logger.warning(
                "MOVE action failed: location %s does not exist in scenario %s "
                "for session_id=%s",
                target_id,
                scenario.scenario_id,
                session.id,
            )
            raise InvalidLocationError(
                f"Location '{target_id}' does not exist in scenario "
                f"'{scenario.scenario_id}'."
            )

        meta = session.state_metadata or {}
        visited = set(meta.get("visited_location_ids", []))

        # Check accessibility rule
        # Accessible if initially unlocked, already visited, or required by the
        # active/past stages
        is_accessible = location.is_initial_unlocked or target_id in visited
        if not is_accessible:
            curr_stage_id = meta.get("current_stage_id")
            curr_stage = next(
                (st for st in scenario.stages if st.id == curr_stage_id), None
            )
            curr_stage_order = curr_stage.order if curr_stage else 1
            for st in scenario.stages:
                if st.order <= curr_stage_order:
                    reqs = st.requirements or {}
                    req_locs = reqs.get("required_location_ids") or reqs.get(
                        "location_ids", []
                    )
                    if target_id in req_locs:
                        is_accessible = True
                        break

        if not is_accessible:
            # Find the stage in the scenario that first requires this location
            stage_req = None
            for st in scenario.stages:
                reqs = st.requirements or {}
                req_locs = reqs.get("required_location_ids") or reqs.get(
                    "location_ids", []
                )
                if target_id in req_locs:
                    stage_req = st
                    break

            lock_reason = (
                f"This location becomes accessible during Stage {stage_req.order}."
                if stage_req
                else "This location is locked."
            )

            logger.warning(
                "Location %s (%s) is locked for session_id=%s",
                location.name,
                target_id,
                session.id,
            )
            exc = LocationLockedError(
                f"Location '{location.name}' ({target_id}) is locked."
            )
            exc.lock_reason = lock_reason
            raise exc

        prev_loc_id = session.current_location_id
        session.current_location_id = target_id
        if target_id not in visited:
            visited.add(target_id)
            meta["visited_location_ids"] = sorted(visited)

        logger.info(
            "Player moved from %s to %s (%s) for session_id=%s",
            prev_loc_id,
            location.name,
            target_id,
            session.id,
        )

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=True,
            action=ActionType.MOVE,
            message=f"Moved to location '{location.name}'.",
            state=state_dto,
        )

    def _handle_inspect(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        current_loc_id = session.current_location_id
        if action.target_id and action.target_id != current_loc_id:
            logger.warning(
                "INSPECT action failed: cannot inspect %s while at %s "
                "for session_id=%s",
                action.target_id,
                current_loc_id,
                session.id,
            )
            raise InvalidLocationError(
                f"Cannot inspect location '{action.target_id}' while at "
                f"location '{current_loc_id}'."
            )

        meta = session.state_metadata or {}
        discovered_set = set(meta.get("discovered_evidence_ids", []))

        # Find evidence items located at the current location
        location_evidence = [
            ev for ev in scenario.evidence if ev.location_id == current_loc_id
        ]

        newly_discovered: list[str] = []
        already_known: list[str] = []

        for ev in location_evidence:
            if ev.id not in discovered_set:
                newly_discovered.append(ev.id)
                discovered_set.add(ev.id)
                session.score += 10  # Score reward for new evidence discovery
            else:
                already_known.append(ev.id)

        meta["discovered_evidence_ids"] = sorted(discovered_set)

        logger.info(
            "Inspected location %s for session_id=%s "
            "newly_discovered=%s already_known=%s",
            current_loc_id,
            session.id,
            newly_discovered,
            already_known,
        )

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=True,
            action=ActionType.INSPECT,
            message=(
                f"Inspected current location. Discovered {len(newly_discovered)} "
                f"new evidence item(s)."
            ),
            state=state_dto,
            newly_discovered_evidence=newly_discovered,
            already_known_evidence=already_known,
        )

    def _handle_interview(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        if not action.target_id:
            logger.warning(
                "INTERVIEW action failed: missing target_id for session_id=%s",
                session.id,
            )
            raise SuspectNotAvailableError(
                "INTERVIEW action requires target_id (suspect ID)."
            )

        from app.services.suspect_knowledge import SuspectKnowledgeBuilder

        target_id = SuspectKnowledgeBuilder(self.loader).resolve_suspect_id(
            scenario.scenario_id, action.target_id
        )

        suspect = next((s for s in scenario.suspects if s.id == target_id), None)
        if not suspect:
            logger.warning(
                "INTERVIEW action failed: suspect %s not available in scenario %s "
                "for session_id=%s",
                target_id,
                scenario.scenario_id,
                session.id,
            )
            raise SuspectNotAvailableError(
                f"Suspect '{target_id}' is not available in scenario "
                f"'{scenario.scenario_id}'."
            )

        meta = session.state_metadata or {}
        interviewed_set = set(meta.get("interviewed_suspect_ids", []))

        if target_id not in interviewed_set:
            interviewed_set.add(target_id)
            meta["interviewed_suspect_ids"] = sorted(interviewed_set)
            session.score += 10  # Score reward for interviewing suspect

        logger.info(
            "Interviewed suspect %s (%s) for session_id=%s",
            suspect.name,
            target_id,
            session.id,
        )

        # Public interview summary (strictly omits is_culprit / motive)
        public_interview = {
            "suspect_id": suspect.id,
            "name": suspect.name,
            "description": suspect.description,
            "alibi": suspect.alibi,
            "relationship_to_victim": suspect.relationship_to_victim,
            "profile_metadata": suspect.profile_metadata,
        }

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=True,
            action=ActionType.INTERVIEW,
            message=f"Interviewed suspect '{suspect.name}'.",
            state=state_dto,
            interview_result=public_interview,
        )

    def _handle_examine_evidence(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        if not action.target_id:
            logger.warning(
                "EXAMINE_EVIDENCE action failed: missing target_id for session_id=%s",
                session.id,
            )
            raise EvidenceNotDiscoveredError(
                "EXAMINE_EVIDENCE action requires target_id (evidence ID)."
            )

        from app.lamatic.evidence_knowledge import EvidenceKnowledgeBuilder

        target_id = EvidenceKnowledgeBuilder(self.loader).resolve_evidence_id(
            scenario.scenario_id, action.target_id
        )

        meta = session.state_metadata or {}
        discovered_set = set(meta.get("discovered_evidence_ids", []))

        if target_id not in discovered_set:
            logger.warning(
                "Cannot examine evidence %s for session_id=%s: not discovered yet",
                target_id,
                session.id,
            )
            raise EvidenceNotDiscoveredError(
                f"Cannot examine evidence '{target_id}': "
                "it has not been discovered yet."
            )

        evidence = next((ev for ev in scenario.evidence if ev.id == target_id), None)
        if not evidence:
            logger.warning(
                "Evidence %s does not exist in scenario for session_id=%s",
                target_id,
                session.id,
            )
            raise EvidenceNotDiscoveredError(
                f"Evidence '{target_id}' does not exist in scenario."
            )

        logger.info(
            "Examined evidence %s (%s) for session_id=%s",
            evidence.name,
            target_id,
            session.id,
        )

        found_loc = (
            next(
                (loc for loc in scenario.locations if loc.id == evidence.location_id),
                None,
            )
            if evidence.location_id
            else None
        )

        public_evidence = {
            "evidence_id": evidence.id,
            "name": evidence.name,
            "description": evidence.description,
            "evidence_type": evidence.evidence_type,
            "location_id": evidence.location_id,
            "location_name": found_loc.name if found_loc else None,
            "discovery_metadata": evidence.discovery_metadata,
        }

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=True,
            action=ActionType.EXAMINE_EVIDENCE,
            message=f"Examined evidence '{evidence.name}'.",
            state=state_dto,
            evidence_detail=public_evidence,
        )

    def _handle_advance_stage(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        meta = session.state_metadata or {}
        curr_stage_id = meta.get("current_stage_id")

        curr_stage = next(
            (st for st in scenario.stages if st.id == curr_stage_id), None
        )
        if not curr_stage:
            curr_stage = sorted(scenario.stages, key=lambda s: s.order)[0]

        # Evaluate current stage requirements against session discovery state
        reqs = curr_stage.requirements or {}
        req_evs = reqs.get("required_evidence_ids") or reqs.get("evidence_ids", [])
        req_locs = reqs.get("required_location_ids") or reqs.get("location_ids", [])
        req_suss = reqs.get("required_suspect_ids") or reqs.get("suspect_ids", [])

        discovered_evs = set(meta.get("discovered_evidence_ids", []))
        visited_locs = set(meta.get("visited_location_ids", []))
        interviewed_suss = set(meta.get("interviewed_suspect_ids", []))

        missing_evs = [ev for ev in req_evs if ev not in discovered_evs]
        missing_locs = [loc for loc in req_locs if loc not in visited_locs]
        missing_suss = [sus for sus in req_suss if sus not in interviewed_suss]

        if missing_evs or missing_locs or missing_suss:
            logger.warning(
                "Stage advancement requirements not met for session_id=%s "
                "stage=%s missing_evs=%s missing_locs=%s missing_suss=%s",
                session.id,
                curr_stage.id,
                missing_evs,
                missing_locs,
                missing_suss,
            )
            raise StageRequirementsNotMetError(
                f"Cannot advance from stage '{curr_stage.name}': requirements "
                f"not satisfied. Missing evidence: {missing_evs}, missing "
                f"locations: {missing_locs}, missing suspects: {missing_suss}"
            )

        # Find next stage
        sorted_stages = sorted(scenario.stages, key=lambda s: s.order)
        next_stage = next(
            (st for st in sorted_stages if st.order > curr_stage.order), None
        )

        completed = set(meta.get("completed_stage_ids", []))
        completed.add(curr_stage.id)
        meta["completed_stage_ids"] = sorted(completed)

        if not next_stage:
            logger.info(
                "Session %s completed final stage %s (%d)",
                session.id,
                curr_stage.id,
                curr_stage.order,
            )
            state_dto = self.session_service.to_game_state_dto(session)
            return ActionResultDTO(
                success=True,
                action=ActionType.ADVANCE_STAGE,
                message="Completed current stage. Already at final stage.",
                state=state_dto,
            )

        meta["current_stage_id"] = next_stage.id
        meta["current_stage_order"] = next_stage.order

        logger.info(
            "Session %s advanced from stage %s (order %d) to stage %s (order %d: '%s')",
            session.id,
            curr_stage.id,
            curr_stage.order,
            next_stage.id,
            next_stage.order,
            next_stage.name,
        )

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=True,
            action=ActionType.ADVANCE_STAGE,
            message=(
                f"Advanced investigation to stage {next_stage.order}: "
                f"'{next_stage.name}'."
            ),
            state=state_dto,
            stage_unlocked=next_stage.id,
        )

    def _handle_submit_solution(
        self,
        session: GameSession,
        scenario: ScenarioDefinition,
        action: GameActionDTO,
    ) -> ActionResultDTO:
        proposed_culprit_id = action.target_id
        if not proposed_culprit_id:
            logger.warning(
                "SUBMIT_SOLUTION action failed: missing target_id for session_id=%s",
                session.id,
            )
            raise InvalidSolutionError(
                "SUBMIT_SOLUTION action requires target_id "
                "(proposed culprit suspect ID)."
            )

        suspect = next(
            (s for s in scenario.suspects if s.id == proposed_culprit_id), None
        )
        if not suspect:
            logger.warning(
                "SUBMIT_SOLUTION action failed: suspect %s does not exist in scenario "
                "for session_id=%s",
                proposed_culprit_id,
                session.id,
            )
            raise InvalidSolutionError(
                f"Suspect '{proposed_culprit_id}' does not exist in scenario."
            )

        # Authoritative ground-truth evaluation ONLY inside backend
        is_correct = proposed_culprit_id == scenario.solution.culprit_id

        if is_correct:
            session.status = SessionStatus.SOLVED.value
            session.score += 50  # Score reward for solving case
            message = "Solution accepted! Case solved successfully."
            logger.info(
                "Solution accepted for session_id=%s proposed_culprit=%s "
                "status=%s new_score=%d",
                session.id,
                proposed_culprit_id,
                session.status,
                session.score,
            )
        else:
            # Remains IN_PROGRESS on incorrect submission
            message = "Solution incorrect. Investigation remains in progress."
            logger.info(
                "Solution incorrect for session_id=%s proposed_culprit=%s status=%s",
                session.id,
                proposed_culprit_id,
                session.status,
            )

        state_dto = self.session_service.to_game_state_dto(session)
        return ActionResultDTO(
            success=is_correct,
            action=ActionType.SUBMIT_SOLUTION,
            message=message,
            state=state_dto,
            solution_correct=is_correct,
        )

    @staticmethod
    def _get_target_type(action_type: ActionType) -> str:
        mapping = {
            ActionType.MOVE: "location",
            ActionType.INSPECT: "location",
            ActionType.INTERVIEW: "suspect",
            ActionType.EXAMINE_EVIDENCE: "evidence",
            ActionType.ADVANCE_STAGE: "stage",
            ActionType.SUBMIT_SOLUTION: "solution",
        }
        return mapping.get(action_type, "unknown")
