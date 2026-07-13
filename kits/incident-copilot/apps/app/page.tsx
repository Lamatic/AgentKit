"use client";

import { useEffect, useRef, useState } from "react";
import { investigate, draftComms } from "@/actions/orchestrate";
import { HypothesisCard } from "@/components/hypothesis-card";
import { CommsPanel } from "@/components/comms-panel";
import { InvestigationTimeline, TIMELINE_STEP_COUNT } from "@/components/investigation-timeline";
import { evidenceBlock, rankedList } from "@/lib/format";
import type { CommsResult, InvestigationResult } from "@/lib/types";

const EXAMPLE = {
  incidentId: "INC-2043",
  alertText:
    "[PagerDuty] checkout-service p99 latency 1.4s (threshold 800ms) and 5xx error rate 3.1% for the last 8 minutes. orders-service also showing elevated latency. Started ~09:12 UTC. No paging from payments-service.",
  repoUrl: "",
  followUp:
    "Update: DB dashboard shows active connections pegged at max (200/200) on the orders DB. payments-service provider status page is green."
};

export default function Page() {
  const [alertText, setAlertText] = useState("");
  const [incidentId, setIncidentId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [followUp, setFollowUp] = useState("");

  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [comms, setComms] = useState<CommsResult | null>(null);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [commsBusy, setCommsBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [revised, setRevised] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopTimer(), []);

  function stopTimer() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }

  function startTimer() {
    setStep(0);
    stopTimer();
    timer.current = setInterval(() => {
      setStep((s) => (s < TIMELINE_STEP_COUNT - 1 ? s + 1 : s));
    }, 700);
  }

  async function runInvestigation(text: string, isFollowUp: boolean) {
    setError("");
    setComms(null);
    setBusy(true);
    setRevised(isFollowUp);
    startTimer();

    const res = await investigate(text, incidentId, repoUrl);

    stopTimer();
    setStep(TIMELINE_STEP_COUNT);
    setBusy(false);

    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  async function onDraftComms() {
    if (!result || result.hypotheses.length === 0) return;
    setCommsBusy(true);
    setError("");
    const top = result.hypotheses[0];
    const res = await draftComms(
      `${top.title} — ${top.reasoning}`,
      evidenceBlock(top),
      rankedList(result.hypotheses),
      incidentId || "INC"
    );
    setCommsBusy(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setComms(res.data);
  }

  function loadExample() {
    setIncidentId(EXAMPLE.incidentId);
    setAlertText(EXAMPLE.alertText);
    setRepoUrl(EXAMPLE.repoUrl);
    setFollowUp(EXAMPLE.followUp);
    setResult(null);
    setComms(null);
    setError("");
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🚨 Incident Copilot</h1>
        <p>Paste an alert. It investigates — runbooks, recent changes, ranked hypotheses with evidence.</p>
      </header>

      <section className="panel">
        <div className="row">
          <div>
            <label htmlFor="incidentId">Incident ID (scopes memory for follow-ups)</label>
            <input
              id="incidentId"
              type="text"
              placeholder="INC-2043"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="repoUrl">Affected repo URL (optional)</label>
            <input
              id="repoUrl"
              type="text"
              placeholder="https://github.com/owner/service"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
        </div>

        <label htmlFor="alertText">Alert</label>
        <textarea
          id="alertText"
          rows={4}
          placeholder="[PagerDuty] checkout-service p99 latency 1.4s ..."
          value={alertText}
          onChange={(e) => setAlertText(e.target.value)}
        />

        <div className="actions">
          <button onClick={() => runInvestigation(alertText, false)} disabled={busy || !alertText.trim()}>
            {busy ? "Investigating…" : "Investigate"}
          </button>
          <button className="secondary" onClick={loadExample} disabled={busy}>
            Load example
          </button>
        </div>

        {(busy || step > 0) && <InvestigationTimeline activeStep={step} />}
        {error && (
          <div className="error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
      </section>

      {result && (
        <section className="panel">
          {revised && <div className="callout">Revised ranking — new information was folded into the prior hypotheses for {incidentId}.</div>}
          {result.insufficientInfo && result.hypotheses.length === 0 ? (
            <p className="summary">{result.summary || "The alert is too vague to diagnose. Add the affected service, symptom, and timeframe."}</p>
          ) : (
            <>
              {result.summary && <p className="summary">{result.summary}</p>}
              {result.hypotheses.map((h, i) => (
                <HypothesisCard key={`${h.rank}-${h.title}`} h={h} isTop={i === 0} />
              ))}
            </>
          )}

          {result.hypotheses.length > 0 && (
            <>
              <label htmlFor="followUp">New information? (revises the ranking for this incident)</label>
              <textarea
                id="followUp"
                rows={2}
                placeholder="Update: DB dashboard shows connections pegged at max…"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
              <div className="actions">
                <button onClick={() => runInvestigation(followUp, true)} disabled={busy || !followUp.trim()}>
                  {busy ? "Revising…" : "Add info & re-investigate"}
                </button>
                <button className="secondary" onClick={onDraftComms} disabled={commsBusy || busy}>
                  {commsBusy ? "Drafting…" : "Draft Slack + postmortem"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {comms && (
        <section className="panel">
          <CommsPanel comms={comms} />
        </section>
      )}
    </div>
  );
}
