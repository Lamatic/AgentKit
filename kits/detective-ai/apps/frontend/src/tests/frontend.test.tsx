import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../api/client';
import { LandingScreen } from '../components/LandingScreen';
import { GameDashboard } from '../components/GameDashboard';
import { InterrogationPanel } from '../components/InterrogationPanel';
import { SolveForm } from '../components/SolveForm';
import { EvidenceSection } from '../components/EvidenceSection';
import { MarkdownText } from '../components/MarkdownText';

// Mock the API client
vi.mock('../api/client', () => {
  return {
    api: {
      listScenarios: vi.fn(),
      createSession: vi.fn(),
      getSessionState: vi.fn(),
      executeAction: vi.fn(),
      interrogateSuspect: vi.fn(),
      examineEvidence: vi.fn(),
      solveCase: vi.fn(),
    },
  };
});

const mockScenarios = [
  {
    id: 'the_midnight_archive',
    name: 'The Midnight Archive Incident',
    description: 'A mock scenario for testing.',
    version: '1.0.0',
  },
];

const mockSessionState = {
  session_id: 'test-session-id-1234',
  scenario_id: 'the_midnight_archive',
  case: {
    title: 'The Midnight Archive Incident',
    description: 'Case description text.',
  },
  stage: {
    id: 'stage_01',
    order: 1,
    name: 'Establish the Scene',
    description: 'Stage 1 description text.',
    status: 'active',
  },
  current_location: {
    id: 'location_01',
    name: 'Main Lobby & Security Desk',
    description: 'Location 1 description text.',
  },
  score: 10,
  session_status: 'in_progress',
  available_actions: {
    can_inspect: true,
    can_advance: {
      available: false,
      reason: 'Required evidence has not been discovered.',
    },
    can_solve: {
      available: false,
      reason: 'You must reach the final stage to solve the case.',
    },
  },
  available_locations: [
    {
      id: 'location_01',
      name: 'Main Lobby & Security Desk',
      description: 'Lobby desc',
      is_current: true,
      is_locked: false,
      lock_reason: null,
    },
    {
      id: 'location_02',
      name: 'Archive Reading Room',
      description: 'Reading room desc',
      is_current: false,
      is_locked: false,
      lock_reason: null,
    },
    {
      id: 'location_06',
      name: 'Secure Databank Vault',
      description: 'Vault desc',
      is_current: false,
      is_locked: true,
      lock_reason: 'This location becomes accessible during Stage 5.',
    },
  ],
  available_suspects: [
    {
      id: 'suspect_01',
      name: 'Elena Marlow',
      public_description: 'Elena desc',
      relationship_to_victim: 'Colleague',
      can_interrogate: true,
      already_interviewed: false,
    },
  ],
  discovered_evidence: [
    {
      id: 'evidence_02',
      name: 'Security Access Log',
      type: 'digital',
      description: 'Log details',
      location_id: 'location_01',
      location_name: 'Main Lobby & Security Desk',
      examined: false,
    },
  ],
  investigation_history: [
    {
      event_type: 'START_GAME',
      message: 'Started game.',
      timestamp: '2026-08-18 21:00:00',
    },
  ],
  progression: {
    completed_stages: [],
    remaining_requirements: ['Examine the Broken Access Card'],
    next_objective: 'Secure the crime scene.',
  },
};

describe('DetectiveAI Frontend Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Scenario list rendering & loading states
  test('renders scenario list correctly after loading', async () => {
    vi.mocked(api.listScenarios).mockResolvedValue(mockScenarios);
    
    render(
      <MemoryRouter>
        <LandingScreen />
      </MemoryRouter>
    );

    expect(screen.getByText('LOADING SCENARIOS...')).toBeDefined();
    
    await waitFor(() => {
      expect(screen.getByText('The Midnight Archive Incident')).toBeDefined();
      expect(screen.getByText('v1.0.0')).toBeDefined();
    });
  });

  // 2. Start scenario
  test('clicking start button triggers session creation', async () => {
    vi.mocked(api.listScenarios).mockResolvedValue(mockScenarios);
    vi.mocked(api.createSession).mockResolvedValue({
      session_id: 'new-session-id',
      scenario_id: 'the_midnight_archive',
      case_title: 'The Midnight Archive',
      status: 'in_progress',
      score: 0,
    });

    render(
      <MemoryRouter>
        <LandingScreen />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Start Investigation'));
    const startBtn = screen.getByText('Start Investigation');
    fireEvent.click(startBtn);

    expect((startBtn as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => {
      expect(api.createSession).toHaveBeenCalledWith('the_midnight_archive');
    });
  });

  // 3. Dashboard loading, 4. Current location rendering, 5. Locked location rendering
  test('loads dashboard and renders current, unlocked, and locked locations', async () => {
    vi.mocked(api.getSessionState).mockResolvedValue(mockSessionState);

    render(
      <MemoryRouter initialEntries={['/game/test-session-id-1234']}>
        <Routes>
          <Route path="/game/:sessionId" element={<GameDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading
    expect(screen.getByText('LOADING CASE FILE STATE...')).toBeDefined();

    await waitFor(() => {
      // Title & Score
      expect(screen.getByText('The Midnight Archive Incident')).toBeDefined();
      expect(screen.getByText(/10\s*pts/)).toBeDefined();

      // Current location header (using getAllByText since it appears in sidebar and panel)
      expect(screen.getAllByText('Main Lobby & Security Desk')[0]).toBeDefined();
      
      // Locked location shows label and reason
      expect(screen.getByText('Secure Databank Vault')).toBeDefined();
      expect(screen.getByText('This location becomes accessible during Stage 5.')).toBeDefined();
    });
  });

  // 6. Movement action
  test('clicking unlocked location triggers movement action', async () => {
    vi.mocked(api.getSessionState).mockResolvedValue(mockSessionState);
    vi.mocked(api.executeAction).mockResolvedValue({ status: 'success' });

    render(
      <MemoryRouter initialEntries={['/game/test-session-id-1234']}>
        <Routes>
          <Route path="/game/:sessionId" element={<GameDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Archive Reading Room'));
    const readingRoom = screen.getByText('Archive Reading Room');
    fireEvent.click(readingRoom);

    await waitFor(() => {
      expect(api.executeAction).toHaveBeenCalledWith('test-session-id-1234', 'move', 'location_02');
    });
  });

  // 7. Inspect action
  test('clicking inspect triggers inspect action', async () => {
    vi.mocked(api.getSessionState).mockResolvedValue(mockSessionState);
    vi.mocked(api.executeAction).mockResolvedValue({ status: 'success' });

    render(
      <MemoryRouter initialEntries={['/game/test-session-id-1234']}>
        <Routes>
          <Route path="/game/:sessionId" element={<GameDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Inspect Location'));
    const inspectBtn = screen.getByText('Inspect Location');
    fireEvent.click(inspectBtn);

    await waitFor(() => {
      expect(api.executeAction).toHaveBeenCalledWith('test-session-id-1234', 'inspect');
    });
  });

  // 8. Evidence rendering & 9. Evidence examination
  test('renders evidence and handles examination interaction', async () => {
    vi.mocked(api.examineEvidence).mockResolvedValue({
      evidence: {
        evidence_id: 'evidence_02',
        name: 'Security Access Log',
        description: 'Log details',
        evidence_type: 'digital',
        location_id: 'location_01',
        location_name: 'Main Lobby',
      },
      analysis: {
        content: '**Analysis**\n- Detected suspicious login.',
        status: 'completed',
        error: null,
      },
    });

    const updateMock = vi.fn();

    render(
      <EvidenceSection
        sessionId="test-session-id"
        evidenceList={mockSessionState.discovered_evidence}
        onStateUpdate={updateMock}
      />
    );

    expect(screen.getByText('Security Access Log')).toBeDefined();
    const examineBtn = screen.getByText('Examine');
    fireEvent.click(examineBtn);

    expect(screen.getByText('ANALYZING EVIDENCE ARTIFACT IN LABORATORY...')).toBeDefined();

    await waitFor(() => {
      expect(api.examineEvidence).toHaveBeenCalledWith('test-session-id', 'evidence_02');
      expect(screen.getByText('Detected suspicious login.')).toBeDefined();
      expect(updateMock).toHaveBeenCalled();
    });
  });

  // 10. Suspect rendering, 11. Interrogation
  test('renders suspect and supports interrogation flow', async () => {
    vi.mocked(api.interrogateSuspect).mockResolvedValue({
      suspect_id: 'suspect_01',
      suspect_name: 'Elena Marlow',
      response: 'I was in the lab.',
      status: 'success',
    });

    const updateMock = vi.fn();

    render(
      <InterrogationPanel
        sessionId="test-session-id"
        suspect={mockSessionState.available_suspects[0]}
        onClose={vi.fn()}
        onStateUpdate={updateMock}
      />
    );

    expect(screen.getAllByText('Elena Marlow')[0]).toBeDefined();
    expect(screen.getByText('Colleague')).toBeDefined();

    const input = screen.getByPlaceholderText('Type your question for the suspect...');
    const askBtn = screen.getByText('ASK');

    fireEvent.change(input, { target: { value: 'Where were you?' } });
    fireEvent.click(askBtn);

    expect(await screen.findByText('Elena Marlow is considering your question...')).toBeDefined();

    await waitFor(() => {
      expect(api.interrogateSuspect).toHaveBeenCalledWith('test-session-id', 'suspect_01', 'Where were you?');
      expect(screen.getByText('I was in the lab.')).toBeDefined();
      expect(updateMock).toHaveBeenCalled();
    });
  });

  // 12. Stage progression, 13. Advance button
  test('renders stage progression requirements and handles advance triggers', async () => {
    // Modify mock state to allow advance
    const readyState = {
      ...mockSessionState,
      available_actions: {
        ...mockSessionState.available_actions,
        can_advance: { available: true, reason: null },
      },
    };

    vi.mocked(api.getSessionState).mockResolvedValue(readyState);
    vi.mocked(api.executeAction).mockResolvedValue({ status: 'success' });

    render(
      <MemoryRouter initialEntries={['/game/test-session-id-1234']}>
        <Routes>
          <Route path="/game/:sessionId" element={<GameDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Advance to Next Stage'));
    expect(screen.getByText('Secure the crime scene.')).toBeDefined();
    expect(screen.getByText('Examine the Broken Access Card')).toBeDefined();

    const advanceBtn = screen.getByText('Advance to Next Stage');
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(api.executeAction).toHaveBeenCalledWith('test-session-id-1234', 'advance');
    });
  });

  // 14. Solution form & 15. Solution submission
  test('supports solution form entry and submission rendering', async () => {
    vi.mocked(api.solveCase).mockResolvedValue({
      status: 'solved',
      score: 90,
      evaluation: {
        culprit_identification: 30,
        evidence_relevance: 18,
        motive_reasoning: 12,
        reasoning_quality: 15,
        timeline: 15,
        total_score: 90,
        feedback: 'Good job!',
      },
      feedback: 'Good job!',
    });

    const solvedMock = vi.fn();

    render(
      <SolveForm
        sessionId="test-session-id"
        suspects={mockSessionState.available_suspects}
        evidence={mockSessionState.discovered_evidence}
        onClose={vi.fn()}
        onSolved={solvedMock}
      />
    );

    // Form fields exist
    expect(screen.getByText('Select Accused Culprit *')).toBeDefined();
    
    // Choose Sofia Bennett/Elena
    const suspectSelect = screen.getByRole('combobox');
    fireEvent.change(suspectSelect, { target: { value: 'Elena Marlow' } });

    // Fill textual theories
    const textareas = screen.getAllByRole('textbox');
    // textareas: 0: motive, 1: reasoning, 2: timeline
    fireEvent.change(textareas[0], { target: { value: 'Financial motive.' } });
    fireEvent.change(textareas[1], { target: { value: 'Logic link.' } });
    fireEvent.change(textareas[2], { target: { value: 'Timeline info.' } });

    // Click submit
    const submitBtn = screen.getByText('Submit Final Solution');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.solveCase).toHaveBeenCalledWith('test-session-id', {
        culprit_id: 'Elena Marlow',
        motive: 'Financial motive.',
        evidence_ids: [],
        reasoning: 'Logic link.',
        timeline: 'Timeline info.',
      });
      expect(screen.getByText('STATUS: CASE SOLVED SUCCESSFULLY')).toBeDefined();
      expect(screen.getByText('Culprit Identification:')).toBeDefined();
      expect(screen.getByText('30 / 30')).toBeDefined();
      expect(screen.getByText('TOTAL EVALUATION SCORE:')).toBeDefined();
      expect(screen.getByText('90 / 100')).toBeDefined();
      expect(solvedMock).toHaveBeenCalled();
    });
  });

  // 16. API error handling
  test('handles API errors elegantly and renders notifications', async () => {
    vi.mocked(api.listScenarios).mockRejectedValue(new Error('NETWORK_TIMEOUT_REJECT'));

    render(
      <MemoryRouter>
        <LandingScreen />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NETWORK_TIMEOUT_REJECT')).toBeDefined();
    });
  });

  // 17. Safe Markdown rendering
  test('renders markdown elements correctly and safely', () => {
    const text = '### Analysis\n- Bullet 1\n**Bold Text**';
    render(<MarkdownText text={text} />);
    expect(screen.getByText('Analysis').tagName).toBe('H4');
    expect(screen.getByText('Bullet 1').tagName).toBe('LI');
    expect(screen.getByText('Bold Text').tagName).toBe('STRONG');
  });

  // 18. Ground-truth confidentiality validation
  test('ensures that no ground truth or culprits leaks inside component codes', () => {
    const fileSource = LandingScreen.toString() + GameDashboard.toString() + SolveForm.toString();
    expect(fileSource).not.toContain('culprit_id: "sofia_bennett"');
    expect(fileSource).not.toContain('is_culprit');
    expect(fileSource).not.toContain('secret_timeline');
    expect(fileSource).not.toContain('solution_summary');
  });
});
