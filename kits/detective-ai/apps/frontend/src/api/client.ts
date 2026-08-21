// Central API client for DetectiveAI FastAPI backend.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface APIErrorDetail {
  code: string;
  message: string;
}

export class APIError extends Error {
  code: string;
  constructor(detail: APIErrorDetail) {
    super(detail.message);
    this.name = 'APIError';
    this.code = detail.code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (data && data.error) {
        throw new APIError(data.error);
      }
      throw new APIError({
        code: 'HTTP_ERROR',
        message: data?.detail || response.statusText || `Request failed with status ${response.status}`,
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError({
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'A network error occurred.',
    });
  }
}

// Interfaces matching Backend DTOs

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface CaseState {
  title: string;
  description: string;
}

export interface StageState {
  id: string;
  order: number;
  name: string;
  description: string;
  status: string;
}

export interface CurrentLocationState {
  id: string | null;
  name: string | null;
  description: string | null;
}

export interface AvailabilityFlag {
  available: boolean;
  reason: string | null;
}

export interface AvailableActionsState {
  can_inspect: boolean;
  can_advance: AvailabilityFlag;
  can_solve: AvailabilityFlag;
}

export interface AvailableLocationState {
  id: string;
  name: string;
  description: string;
  is_current: boolean;
  is_locked: boolean;
  lock_reason: string | null;
}

export interface AvailableSuspectState {
  id: string;
  name: string;
  public_description: string;
  relationship_to_victim: string;
  can_interrogate: boolean;
  already_interviewed: boolean;
}

export interface DiscoveredEvidenceState {
  id: string;
  name: string;
  type: string;
  description: string;
  location_id: string | null;
  location_name: string | null;
  examined: boolean;
}

export interface HistoryEventState {
  event_type: string;
  message: string;
  timestamp: string | null;
}

export interface ProgressionState {
  completed_stages: string[];
  remaining_requirements: string[];
  next_objective: string | null;
}

export interface PlayerInvestigationState {
  session_id: string;
  scenario_id: string;
  case: CaseState;
  stage: StageState;
  current_location: CurrentLocationState | null;
  score: number;
  session_status: string;
  available_actions: AvailableActionsState;
  available_locations: AvailableLocationState[];
  available_suspects: AvailableSuspectState[];
  discovered_evidence: DiscoveredEvidenceState[];
  investigation_history: HistoryEventState[];
  progression: ProgressionState;
}

export interface SessionCreatedResponse {
  session_id: string;
  scenario_id: string;
  case_title: string;
  status: string;
  score: number;
}

export interface InterrogationResponse {
  suspect_id: string;
  suspect_name: string;
  response: string;
  status: string;
}

export interface EvidenceDetail {
  evidence_id: string;
  name: string;
  description: string;
  evidence_type: string;
  location_id: string | null;
  location_name: string | null;
}

export interface AIAnalysisResponse {
  content: string | null;
  status: string;
  error: string | null;
}

export interface EvidenceExamineResponse {
  evidence: EvidenceDetail;
  analysis: AIAnalysisResponse;
}

export interface SolutionEvaluationDetail {
  culprit_identification: number;
  evidence_relevance: number;
  motive_reasoning: number;
  reasoning_quality: number;
  timeline: number;
  total_score: number;
  feedback: string;
}

export interface SolveResponse {
  status: string;
  score: number;
  evaluation: SolutionEvaluationDetail;
  feedback: string;
}

// API Endpoints Client Export

export const api = {
  // Scenarios
  listScenarios: (): Promise<ScenarioSummary[]> => 
    request<ScenarioSummary[]>('/api/v1/scenarios'),

  // Sessions
  createSession: (scenario: string): Promise<SessionCreatedResponse> => 
    request<SessionCreatedResponse>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),

  getSessionState: (sessionId: string): Promise<PlayerInvestigationState> => 
    request<PlayerInvestigationState>(`/api/v1/sessions/${sessionId}/state`),

  // Actions
  executeAction: (
    sessionId: string, 
    action: string, 
    targetId?: string
  ): Promise<any> => 
    request<any>(`/api/v1/sessions/${sessionId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action, target_id: targetId }),
    }),

  // Interrogation
  interrogateSuspect: (
    sessionId: string, 
    suspectId: string, 
    message: string
  ): Promise<InterrogationResponse> => 
    request<InterrogationResponse>(`/api/v1/sessions/${sessionId}/suspects/${suspectId}/interrogate`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Evidence
  examineEvidence: (
    sessionId: string, 
    evidenceId: string
  ): Promise<EvidenceExamineResponse> => 
    request<EvidenceExamineResponse>(`/api/v1/sessions/${sessionId}/evidence/${evidenceId}/examine`, {
      method: 'POST',
    }),

  // Solution
  solveCase: (
    sessionId: string,
    payload: {
      culprit_id: string;
      motive: string;
      evidence_ids: string[];
      reasoning: string;
      timeline: string;
    }
  ): Promise<SolveResponse> => 
    request<SolveResponse>(`/api/v1/sessions/${sessionId}/solve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
