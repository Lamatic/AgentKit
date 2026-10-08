import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ScenarioSummary } from '../api/client';

export const LandingScreen: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listScenarios()
      .then((data) => {
        setScenarios(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load scenarios.');
        setLoading(false);
      });
  }, []);

  const handleStart = async (scenarioId: string) => {
    setStartingScenarioId(scenarioId);
    setError(null);
    try {
      const response = await api.createSession(scenarioId);
      navigate(`/game/${response.session_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start game session.');
      setStartingScenarioId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-center full-screen container bg-charcoal text-light font-typewriter">
        <div className="terminal-card text-center">
          <div className="spinner mb-2" />
          <p>LOADING SCENARIOS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-screen bg-charcoal text-light font-typewriter flex-center p-4">
      <div className="terminal-card max-w-lg w-full">
        <h1 className="title-glow text-center border-bottom pb-3 mb-4">DETECTIVE AI</h1>
        <p className="text-muted text-center mb-4 subtitle">ACTIVE CASES ARCHIVE</p>

        {error && (
          <div className="error-banner mb-4">
            <strong>ERROR CODE:</strong> {error}
          </div>
        )}

        <div className="scenarios-list">
          {scenarios.length === 0 ? (
            <p className="text-center text-muted">No scenarios available.</p>
          ) : (
            scenarios.map((scen) => (
              <div key={scen.id} className="scenario-item mb-4 p-3 border">
                <div className="flex-between border-bottom pb-2 mb-2">
                  <h3 className="text-accent uppercase font-bold">{scen.name}</h3>
                  <span className="text-muted text-xs">v{scen.version}</span>
                </div>
                <p className="text-sm mb-3 leading-relaxed">{scen.description}</p>
                <button
                  className="btn btn-accent w-full uppercase"
                  disabled={startingScenarioId !== null}
                  onClick={() => handleStart(scen.id)}
                >
                  {startingScenarioId === scen.id ? 'Starting Investigation...' : 'Start Investigation'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
