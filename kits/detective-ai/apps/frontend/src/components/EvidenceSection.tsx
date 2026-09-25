import React, { useState } from 'react';
import { api } from '../api/client';
import type { DiscoveredEvidenceState, EvidenceExamineResponse } from '../api/client';
import { MarkdownText } from './MarkdownText';

interface EvidenceSectionProps {
  sessionId: string;
  evidenceList: DiscoveredEvidenceState[];
  onStateUpdate: () => void;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  sessionId,
  evidenceList,
  onStateUpdate,
}) => {
  const [examiningId, setExaminingId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportMap, setReportMap] = useState<Record<string, EvidenceExamineResponse>>({});
  const [error, setError] = useState<string | null>(null);

  const handleExamine = async (evidenceId: string) => {
    setExaminingId(evidenceId);
    setError(null);
    try {
      const response = await api.examineEvidence(sessionId, evidenceId);
      setReportMap((prev) => ({ ...prev, [evidenceId]: response }));
      setSelectedReportId(evidenceId);
      onStateUpdate(); // Refresh session state (score, event logs, etc.)
    } catch (err: any) {
      setError(err.message || 'Evidence examination failed.');
    } finally {
      setExaminingId(null);
    }
  };

  const handleShowReport = (evidenceId: string) => {
    setSelectedReportId(evidenceId === selectedReportId ? null : evidenceId);
  };

  return (
    <div className="flex flex-col h-full font-typewriter">
      <h3 className="section-title border-bottom pb-2 mb-3 uppercase text-accent font-bold">Discovered Evidence</h3>

      {error && (
        <div className="error-banner mb-3 text-xs">
          <strong>FORENSIC LAB ERROR:</strong> {error}
        </div>
      )}

      {evidenceList.length === 0 ? (
        <div className="text-center text-muted p-4 border border-dashed text-xs">
          No evidence discovered yet. Search current location (INSPECT) or explore other areas.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-grow pr-1 max-h-[70vh]">
          {evidenceList.map((ev) => {
            const isExamining = examiningId === ev.id;
            const isReportOpen = selectedReportId === ev.id;

            return (
              <div key={ev.id} className={`border p-3 bg-black-opacity text-xs ${ev.examined ? 'border-accent-dim' : ''}`}>
                {/* Header */}
                <div className="flex-between border-bottom pb-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm uppercase">{ev.name}</h4>
                    <span className="badge badge-accent uppercase text-[9px] mt-1 inline-block">{ev.type}</span>
                  </div>
                  <span className="text-muted text-[10px] uppercase">
                    Location: {ev.location_name || 'Unknown'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted leading-relaxed mb-3">{ev.description}</p>

                {/* Actions */}
                <div className="flex-between">
                  <span className={`uppercase font-bold ${ev.examined ? 'text-accent' : 'text-yellow-600'}`}>
                    {ev.examined ? '[ Examined ]' : '[ Unexamined ]'}
                  </span>
                  
                  {ev.examined ? (
                    <button
                      className="btn btn-sm btn-muted text-[10px] uppercase"
                      disabled={isExamining}
                      onClick={() => handleShowReport(ev.id)}
                    >
                      {isReportOpen ? 'Hide Reports' : 'View Reports'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-accent text-[10px] uppercase"
                      disabled={examiningId !== null}
                      onClick={() => handleExamine(ev.id)}
                    >
                      {isExamining ? 'Analyzing...' : 'Examine'}
                    </button>
                  )}
                </div>

                {/* Examination Loader / Reports Panel */}
                {isExamining && (
                  <div className="border-top mt-3 pt-3 text-center text-accent animate-pulse">
                    <span className="spinner inline-block mr-2" />
                    ANALYZING EVIDENCE ARTIFACT IN LABORATORY...
                  </div>
                )}

                {isReportOpen && (
                  <div className="border-top mt-3 pt-3 space-y-3 report-panel border-accent-dim">
                    <h5 className="font-bold text-accent border-bottom pb-1 uppercase">AI Forensic Analysis Logs</h5>
                    {reportMap[ev.id] ? (
                      reportMap[ev.id].analysis.status === 'unavailable' ? (
                        <div className="text-red-500 italic">
                          Analysis unavailable: {reportMap[ev.id].analysis.error}
                        </div>
                      ) : (
                        <div className="text-muted leading-relaxed whitespace-pre-line report-text">
                          <MarkdownText text={reportMap[ev.id].analysis.content} />
                        </div>
                      )
                    ) : (
                      <div className="text-muted italic">
                        Loading archived analysis... Click Examine if report not found in cache.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
