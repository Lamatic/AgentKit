import React, { useState } from 'react';
import { api } from '../api/client';
import type { AvailableSuspectState, DiscoveredEvidenceState, SolveResponse } from '../api/client';

interface SolveFormProps {
  sessionId: string;
  suspects: AvailableSuspectState[];
  evidence: DiscoveredEvidenceState[];
  onClose: () => void;
  onSolved: (score: number) => void;
}

export const SolveForm: React.FC<SolveFormProps> = ({
  sessionId,
  suspects,
  evidence,
  onClose,
  onSolved,
}) => {
  const [culpritId, setCulpritId] = useState<string>('');
  const [motive, setMotive] = useState<string>('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResponse | null>(null);

  const handleToggleEvidence = (id: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!culpritId || loading) return;

    setLoading(true);
    setError(null);

    // Resolve exact suspect name or ID for the culprit (dropdown has suspect.name as value/label, wait! Let's check:
    // the backend solve endpoint expects suspect.name or ID, let's pass culpritId which represents suspect name or ID)
    // Actually, let's verify what culprit_id the backend tests use:
    // In test_solve_case_correct_culprit, culprit_id is "Sofia Bennett" (which is the suspect's name, not suspect_05).
    // In test_solve_case_invalid_suspect, culprit_id is "Ghost Suspect".
    // So the culprit_id parameter is actually the suspect name! Let's make sure our select value is suspect.name!
    const payload = {
      culprit_id: culpritId,
      motive,
      evidence_ids: selectedEvidenceIds,
      reasoning,
      timeline,
    };

    try {
      const response = await api.solveCase(sessionId, payload);
      setResult(response);
      if (response.status === 'solved') {
        onSolved(response.score);
      }
    } catch (err: any) {
      setError(err.message || 'Solution submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-xl w-full flex flex-col max-h-90vh border font-typewriter bg-charcoal text-light">
        {/* Header */}
        <div className="flex-between border-bottom p-3">
          <h2 className="text-accent uppercase text-lg font-bold">CASE RESOLUTION THEORY</h2>
          <button className="btn-close" onClick={onClose} disabled={loading}>&times;</button>
        </div>

        {result ? (
          /* Evaluation Results Screen */
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`border p-3 text-center uppercase font-bold ${result.status === 'solved' ? 'border-accent text-accent' : 'border-red-500 text-red-500'}`}>
              STATUS: {result.status === 'solved' ? 'CASE SOLVED SUCCESSFULLY' : 'CASE NOT SOLVED'}
            </div>

            <div className="border p-3 space-y-2 bg-black-opacity text-sm">
              <h3 className="border-bottom pb-2 font-bold mb-2 uppercase text-accent">Scoring Breakdown</h3>
              
              <div className="flex-between text-xs">
                <span>Culprit Identification:</span>
                <span className="font-bold">{result.evaluation.culprit_identification} / 30</span>
              </div>
              <div className="flex-between text-xs">
                <span>Evidence Relevance:</span>
                <span className="font-bold">{result.evaluation.evidence_relevance} / 20</span>
              </div>
              <div className="flex-between text-xs">
                <span>Motive Reasoning:</span>
                <span className="font-bold">{result.evaluation.motive_reasoning} / 15</span>
              </div>
              <div className="flex-between text-xs">
                <span>Reasoning Quality:</span>
                <span className="font-bold">{result.evaluation.reasoning_quality} / 20</span>
              </div>
              <div className="flex-between text-xs">
                <span>Timeline Accuracy:</span>
                <span className="font-bold">{result.evaluation.timeline} / 15</span>
              </div>
              <div className="border-top pt-2 flex-between font-bold text-accent">
                <span>TOTAL EVALUATION SCORE:</span>
                <span>{result.evaluation.total_score} / 100</span>
              </div>
            </div>

            <div className="p-3 border text-sm leading-relaxed">
              <h3 className="font-bold mb-1 uppercase">Evaluation Feedback</h3>
              <p className="text-muted text-xs leading-relaxed">{result.evaluation.feedback}</p>
            </div>

            <div className="flex gap-3 pt-2">
              {result.status !== 'solved' && (
                <button className="btn btn-muted w-full uppercase" onClick={() => setResult(null)}>
                  Revise Theory
                </button>
              )}
              <button className="btn btn-accent w-full uppercase" onClick={onClose}>
                Return to Game
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form Screen */
          <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="error-banner text-xs">
                <strong>SUBMISSION ERROR:</strong> {error}
              </div>
            )}

            {/* Culprit Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold">Select Accused Culprit *</label>
              <select
                className="input-select bg-charcoal border text-light p-2 text-sm font-typewriter"
                value={culpritId}
                onChange={(e) => setCulpritId(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">-- CHOOSE SUSPECT --</option>
                {suspects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.relationship_to_victim})
                  </option>
                ))}
              </select>
            </div>

            {/* Motive Textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold">Suspect Motive *</label>
              <textarea
                className="input-textarea bg-charcoal border text-light p-2 text-xs font-typewriter h-20"
                placeholder="Describe the accused suspect's motive for committing the crime..."
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Evidence Checklist */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold">Supporting Evidence (Multi-select)</label>
              <div className="border p-2 max-h-36 overflow-y-auto bg-black-opacity space-y-2">
                {evidence.length === 0 ? (
                  <p className="text-muted text-xs p-2">No evidence discovered yet.</p>
                ) : (
                  evidence.map((ev) => (
                    <label key={ev.id} className="flex gap-2 items-start text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedEvidenceIds.includes(ev.id)}
                        onChange={() => handleToggleEvidence(ev.id)}
                        disabled={loading}
                      />
                      <span>
                        [{ev.type.toUpperCase()}] {ev.name} ({ev.location_name || 'Unknown Location'})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Reasoning Textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold">Deductive Reasoning & Evidence Chain *</label>
              <textarea
                className="input-textarea bg-charcoal border text-light p-2 text-xs font-typewriter h-24"
                placeholder="Explain the chain of logic connecting the supporting evidence to the accused culprit..."
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Timeline Textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase font-bold">Reconstructed Timeline *</label>
              <textarea
                className="input-textarea bg-charcoal border text-light p-2 text-xs font-typewriter h-20"
                placeholder="Reconstruct the sequence of events and timeline on the night of the crime..."
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                className="btn btn-muted w-full uppercase"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-accent w-full uppercase"
                disabled={loading || !culpritId}
              >
                {loading ? 'Submitting Theory...' : 'Submit Final Solution'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
