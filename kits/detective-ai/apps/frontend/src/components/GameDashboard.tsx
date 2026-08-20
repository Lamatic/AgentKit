import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { PlayerInvestigationState, AvailableSuspectState } from '../api/client';
import { EvidenceSection } from './EvidenceSection';
import { InterrogationPanel } from './InterrogationPanel';
import { SolveForm } from './SolveForm';

export const GameDashboard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<PlayerInvestigationState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [activeInterrogatingSuspect, setActiveInterrogatingSuspect] = useState<AvailableSuspectState | null>(null);
  const [showSolveModal, setShowSolveModal] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // Mobile Tabs
  const [activeTab, setActiveTab] = useState<'investigate' | 'evidence' | 'suspects' | 'history'>('investigate');

  const fetchState = async (showLocalLoader = false) => {
    if (!sessionId) return;
    if (showLocalLoader) setLoading(true);
    try {
      const data = await api.getSessionState(sessionId);
      setState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sync game state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState(true);
  }, [sessionId]);

  const handleMove = async (locationId: string) => {
    if (!sessionId || actionLoading) return;
    setActionLoading('Moving...');
    setError(null);
    try {
      await api.executeAction(sessionId, 'move', locationId);
      await fetchState();
    } catch (err: any) {
      setError(err.message || 'Failed to move to location.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInspect = async () => {
    if (!sessionId || actionLoading) return;
    setActionLoading('Searching current location...');
    setError(null);
    try {
      await api.executeAction(sessionId, 'inspect');
      await fetchState();
    } catch (err: any) {
      setError(err.message || 'Inspection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvance = async () => {
    if (!sessionId || actionLoading) return;
    setActionLoading('Advancing stage...');
    setError(null);
    try {
      await api.executeAction(sessionId, 'advance');
      await fetchState();
    } catch (err: any) {
      setError(err.message || 'Failed to advance stage.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-center full-screen container bg-charcoal text-light font-typewriter">
        <div className="terminal-card text-center">
          <div className="spinner mb-2" />
          <p>LOADING CASE FILE STATE...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex-center full-screen container bg-charcoal text-light font-typewriter">
        <div className="terminal-card text-center max-w-sm border-red-500">
          <h2 className="text-red-500 font-bold mb-3 uppercase">Sync Error</h2>
          <p className="text-sm mb-4">The request session context could not be resolved from the server database.</p>
          <button className="btn btn-accent uppercase" onClick={() => navigate('/')}>Return to Case Files</button>
        </div>
      </div>
    );
  }

  const isSolved = state.session_status === 'solved';
  const isFailed = state.session_status === 'failed';
  const isFinished = isSolved || isFailed;

  return (
    <div className="flex flex-col min-h-screen bg-charcoal text-light font-typewriter p-3 md:p-4 max-h-screen overflow-hidden">
      {/* Background action loader */}
      {actionLoading && (
        <div className="action-loading-overlay">
          <div className="spinner mb-2" />
          <p className="uppercase text-xs tracking-wider">{actionLoading}</p>
        </div>
      )}

      {/* Case Header */}
      <header className="border p-3 mb-3 bg-black-opacity flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-accent text-xs border border-accent px-2 py-0.5 rounded font-bold uppercase">CLASSIFIED CASE</span>
            <span className="text-muted text-xs">ID: {state.session_id.slice(0, 8)}...</span>
          </div>
          <h1 className="text-accent-bright text-lg md:text-xl font-bold uppercase tracking-wide">{state.case.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-6 border-left-md">
          <div className="flex flex-col text-xs uppercase">
            <span className="text-muted">Investigation Stage</span>
            <strong className="text-sm text-light">{state.stage.name} (Stage {state.stage.order})</strong>
          </div>
          <div className="flex flex-col text-xs uppercase">
            <span className="text-muted">Score Reward</span>
            <strong className="text-sm text-accent">{state.score} pts</strong>
          </div>
          <div className="flex flex-col text-xs uppercase">
            <span className="text-muted">Session Status</span>
            <strong className={`text-sm uppercase ${isSolved ? 'text-accent' : isFailed ? 'text-red-500' : 'text-yellow-600'}`}>
              {state.session_status.replace('_', ' ')}
            </strong>
          </div>
        </div>
      </header>

      {/* Global alert banner for errors */}
      {error && (
        <div className="error-banner mb-3 text-xs flex justify-between items-center">
          <div><strong>SYSTEM PROTOCOL WARNING:</strong> {error}</div>
          <button className="text-sm font-bold text-red-700 ml-3" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Mobile Tab Buttons */}
      <div className="flex md:hidden border-bottom pb-2 mb-3 overflow-x-auto gap-2">
        <button
          className={`tab-btn uppercase text-xs px-3 py-1.5 border ${activeTab === 'investigate' ? 'bg-accent text-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('investigate')}
        >
          Investigation
        </button>
        <button
          className={`tab-btn uppercase text-xs px-3 py-1.5 border ${activeTab === 'evidence' ? 'bg-accent text-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence ({state.discovered_evidence.length})
        </button>
        <button
          className={`tab-btn uppercase text-xs px-3 py-1.5 border ${activeTab === 'suspects' ? 'bg-accent text-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('suspects')}
        >
          Suspects ({state.available_suspects.length})
        </button>
        <button
          className={`tab-btn uppercase text-xs px-3 py-1.5 border ${activeTab === 'history' ? 'bg-accent text-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('history')}
        >
          Log History
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden">
        {/* LEFT COLUMN: Locations (Desktop always visible, Mobile tab-dependent) */}
        <aside className={`md:col-span-3 border p-3 flex flex-col max-h-[70vh] md:max-h-none overflow-y-auto bg-black-opacity ${activeTab === 'investigate' ? 'block' : 'hidden md:block'}`}>
          <h3 className="section-title border-bottom pb-2 mb-3 uppercase text-accent font-bold">Locations Directory</h3>
          <div className="space-y-2 flex-grow">
            {state.available_locations.map((loc) => {
              const current = loc.is_current;
              const locked = loc.is_locked;

              return (
                <div
                  key={loc.id}
                  className={`p-2 border text-xs leading-relaxed select-none transition-all ${
                    current 
                      ? 'border-accent bg-accent text-charcoal font-bold' 
                      : locked 
                        ? 'border-dashed border-red-500-opacity opacity-50 cursor-not-allowed' 
                        : 'border-muted hover:border-accent cursor-pointer'
                  }`}
                  onClick={() => !current && !locked && handleMove(loc.id)}
                  title={locked && loc.lock_reason ? loc.lock_reason : undefined}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="uppercase">{loc.name}</span>
                    {current && <span className="text-[10px] uppercase font-bold tracking-wider">[CURRENT]</span>}
                    {locked && <span className="text-[10px] text-red-500 uppercase font-bold">[LOCKED]</span>}
                  </div>
                  {locked && loc.lock_reason && (
                    <div className="text-[10px] mt-1 border-top pt-1 border-dashed text-red-400">
                      {loc.lock_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Exit to Menu */}
          <div className="border-top pt-3 mt-3">
            <button className="btn btn-muted w-full text-xs uppercase" onClick={() => navigate('/')}>
              Exit Case Archive
            </button>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Current Area + Stage Objectives */}
        <main className={`md:col-span-6 flex flex-col gap-3 overflow-y-auto ${activeTab === 'investigate' ? 'block' : 'hidden md:block'}`}>
          {/* Current Location Workspace */}
          <section className="border p-3 bg-black-opacity">
            <h3 className="section-title border-bottom pb-2 mb-3 uppercase text-accent font-bold">Active Sector</h3>
            {state.current_location ? (
              <div className="space-y-3">
                <h2 className="text-accent-bright font-bold uppercase text-base">{state.current_location.name}</h2>
                <p className="text-xs text-muted leading-relaxed">{state.current_location.description}</p>
                
                {!isFinished && (
                  <div className="border-top pt-3 flex gap-2">
                    <button
                      className="btn btn-accent uppercase text-xs px-4 py-2"
                      disabled={!state.available_actions.can_inspect || !!actionLoading}
                      onClick={handleInspect}
                    >
                      {actionLoading === 'Searching current location...' ? 'Searching...' : 'Inspect Location'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted text-xs p-3 border border-dashed text-center">
                Transit State. Move to an unlocked location directory.
              </p>
            )}
          </section>

          {/* Progression Panel */}
          <section className="border p-3 bg-black-opacity flex-grow">
            <h3 className="section-title border-bottom pb-2 mb-3 uppercase text-accent font-bold">Investigation Progression</h3>
            
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <h4 className="font-bold uppercase mb-1">Current Directive: {state.stage.name}</h4>
                <p className="text-muted text-[11px] leading-relaxed">{state.stage.description}</p>
              </div>

              {state.progression.next_objective && (
                <div>
                  <strong className="text-[10px] uppercase text-accent block mb-1">Next Objective:</strong>
                  <p className="text-muted text-[11px]">{state.progression.next_objective}</p>
                </div>
              )}

              {/* Requirements Checklist */}
              {!isFinished && (
                <div className="border p-2 bg-charcoal space-y-1.5">
                  <h5 className="font-bold text-accent uppercase text-[10px] mb-1.5 border-bottom pb-1 border-dashed">Outstanding Objectives</h5>
                  {state.progression.remaining_requirements.length === 0 ? (
                    <p className="text-accent text-[11px] font-bold">[✓] All current stage directives completed.</p>
                  ) : (
                    state.progression.remaining_requirements.map((req, i) => (
                      <div key={i} className="flex gap-2 items-start text-muted text-[11px]">
                        <span>[ ]</span>
                        <span>{req}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Stage Progression Action */}
              {!isFinished && (
                <div className="border-top pt-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {state.available_actions.can_advance.available ? (
                    <button
                      className="btn btn-accent uppercase font-bold text-xs px-4 py-2 animate-pulse w-full sm:w-auto"
                      disabled={!!actionLoading}
                      onClick={handleAdvance}
                    >
                      Advance to Next Stage
                    </button>
                  ) : (
                    <div className="text-[11px] text-yellow-600 font-bold border border-yellow-600 p-2 w-full text-center">
                      DIRECTIVE IN PROGRESS: {state.available_actions.can_advance.reason}
                    </div>
                  )}

                  {/* Submit Final Theory */}
                  {state.available_actions.can_solve.available ? (
                    <button
                      className="btn btn-accent uppercase font-bold text-xs px-4 py-2 bg-yellow-600 text-charcoal border-yellow-600 hover:bg-yellow-500 w-full sm:w-auto"
                      onClick={() => setShowSolveModal(true)}
                    >
                      SOLVE CASE
                    </button>
                  ) : (
                    <div className="text-[11px] text-muted text-center w-full sm:w-auto">
                      Case solve theory locked. {state.available_actions.can_solve.reason}
                    </div>
                  )}
                </div>
              )}

              {/* Case Completed Message */}
              {isFinished && (
                <div className={`border p-3 text-center uppercase font-bold text-sm ${isSolved ? 'border-accent text-accent' : 'border-red-500 text-red-500'}`}>
                  {isSolved ? 'Investigation Concluded: Case Solved' : 'Investigation Concluded: Case Failed'}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* RIGHT COLUMN: Evidence (Desktop layout, Mobile tab-dependent) */}
        <section className={`md:col-span-3 border p-3 flex flex-col bg-black-opacity ${activeTab === 'evidence' ? 'block' : 'hidden md:block'}`}>
          <EvidenceSection
            sessionId={state.session_id}
            evidenceList={state.discovered_evidence}
            onStateUpdate={fetchState}
          />
        </section>

        {/* SUSPECTS PANEL: Available Suspects list (Desktop below dashboard or sidebar, Mobile tab-dependent) */}
        <section className={`md:col-span-12 border p-3 bg-black-opacity ${activeTab === 'suspects' ? 'block' : 'hidden md:block'}`}>
          <h3 className="section-title border-bottom pb-2 mb-3 uppercase text-accent font-bold">Interrogations Lounge</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-64">
            {state.available_suspects.map((sus) => (
              <div key={sus.id} className="border p-2 bg-charcoal text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold uppercase text-accent">{sus.name}</h4>
                    <span className={`uppercase font-bold text-[9px] ${sus.already_interviewed ? 'text-accent' : 'text-yellow-600'}`}>
                      {sus.already_interviewed ? '[ Interviewed ]' : '[ Uninterviewed ]'}
                    </span>
                  </div>
                  <p className="text-muted text-[10px] mb-1 font-bold">Role: {sus.relationship_to_victim}</p>
                  <p className="text-muted text-[10px] leading-relaxed mb-3">{sus.public_description.slice(0, 100)}...</p>
                </div>
                
                <button
                  className="btn btn-sm btn-accent w-full text-[10px] uppercase mt-2"
                  disabled={!sus.can_interrogate || isFinished}
                  onClick={() => setActiveInterrogatingSuspect(sus)}
                >
                  Interrogate
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* LOG HISTORY (Desktop drawer/drawer trigger, Mobile tab-dependent) */}
        <section className={`md:col-span-12 border p-3 bg-black-opacity ${activeTab === 'history' ? 'block' : 'hidden md:block'}`}>
          <div className="flex justify-between items-center border-bottom pb-2 mb-3">
            <h3 className="uppercase text-accent font-bold text-sm">Investigation Logs History</h3>
            <button className="text-xs text-muted uppercase hidden md:block" onClick={() => setHistoryOpen(!historyOpen)}>
              {historyOpen ? '[ Close Log ]' : '[ Expand Log ]'}
            </button>
          </div>

          <div className={`space-y-2 overflow-y-auto max-h-48 text-xs ${historyOpen || activeTab === 'history' ? 'block' : 'hidden md:block md:max-h-24'}`}>
            {state.investigation_history.length === 0 ? (
              <p className="text-muted italic text-[11px] p-2 text-center border border-dashed">No events logged yet.</p>
            ) : (
              [...state.investigation_history].reverse().map((evt, idx) => (
                <div key={idx} className="flex gap-3 py-1 border-bottom border-dashed text-[11px]">
                  <span className="text-accent font-bold">[{evt.timestamp?.slice(11, 16) || '??:??'}]</span>
                  <span className="text-accent-bright font-bold uppercase">[{evt.event_type}]</span>
                  <span className="text-muted">{evt.message}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Interrogation Modal Overlay */}
      {activeInterrogatingSuspect && (
        <InterrogationPanel
          sessionId={state.session_id}
          suspect={activeInterrogatingSuspect}
          onClose={() => setActiveInterrogatingSuspect(null)}
          onStateUpdate={fetchState}
        />
      )}

      {/* Solve Case Modal Overlay */}
      {showSolveModal && (
        <SolveForm
          sessionId={state.session_id}
          suspects={state.available_suspects}
          evidence={state.discovered_evidence}
          onClose={() => setShowSolveModal(false)}
          onSolved={() => {
            fetchState();
          }}
        />
      )}
    </div>
  );
};
