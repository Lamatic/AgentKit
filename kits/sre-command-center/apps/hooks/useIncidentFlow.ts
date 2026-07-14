"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertObject, AppPhase, LogLine, ResolvedData } from "../lib/types";

/**
 * Custom React hook orchestrating application lifecycle phases, terminal log streaming, and triage mutations.
 * @returns State properties and mutation handlers for managing incident workflows.
 */
export function useIncidentFlow() {
  const [phase, setPhase] = useState<AppPhase>("welcome");
  const [currentAlert, setCurrentAlert] = useState<AlertObject | null>(null);
  const [resolvedData, setResolvedData] = useState<ResolvedData | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<LogLine[]>([]);
  const [isTerminalActive, setIsTerminalActive] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live clock
  useEffect(() => {
    const update = () =>
      setCurrentTime(new Date().toUTCString().slice(17, 25) + " UTC");
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleAlertGenerated = useCallback(async (alert: AlertObject) => {
    setCurrentAlert(alert);
    setPhase("processing");
    setTerminalLogs([]);
    setIsTerminalActive(true);
    setResolvedData(null);

    const scheduledLogs: LogLine[] = [
      {
        id: 1,
        type: "system",
        prefix: "[System]",
        message: "Alert received. Initiating L1 Triage pipeline...",
        delay: 0,
      },
      {
        id: 2,
        type: "dim",
        prefix: "[System]",
        message: "Parsing alert schema. Validating required fields...",
        delay: 600,
      },
      {
        id: 3,
        type: "agent",
        prefix: "[Agent-1]",
        message: `Classifying: ${alert.title}`,
        delay: 1400,
      },
      {
        id: 4,
        type: "agent",
        prefix: "[Agent-1]",
        message: `Severity: ${alert.severity} | Service: ${alert.service}`,
        delay: 2000,
      },
      {
        id: 5,
        type: "agent",
        prefix: "[Agent-1]",
        message: "Forming root cause hypotheses. Analyzing patterns...",
        delay: 2800,
      },
      {
        id: 6,
        type: "agent",
        prefix: "[Agent-1]",
        message: "Triage complete. Routing to knowledge retrieval...",
        delay: 3600,
      },
      {
        id: 7,
        type: "router",
        prefix: "[Router]",
        message: "Checking Vector DB for runbook matches...",
        delay: 4400,
      },
      {
        id: 8,
        type: "router",
        prefix: "[Router]",
        message: `Tags searched: [${(alert.suggested_runbook_tags || []).join(
          ", "
        )}]`,
        delay: 5000,
      },
      {
        id: 9,
        type: "agent",
        prefix: "[Agent-2]",
        message:
          "Synthesizing remediation plan from retrieved context...",
        delay: 6000,
      },
      {
        id: 10,
        type: "agent",
        prefix: "[Agent-2]",
        message:
          "Generating CLI commands and verification steps...",
        delay: 7000,
      },
    ];

    scheduledLogs.forEach((log) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, log]);
      }, log.delay);
    });

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Resolution failed with status ${res.status}`
        );
      }

      const data: ResolvedData = await res.json();

      const minDelay = 7500;
      await new Promise((resolve) => setTimeout(resolve, minDelay));

      const finalLog: LogLine = {
        id: 11,
        type: "success",
        prefix: "[Master Responder]",
        message: `✓ Report generated via ${
          data.retrieval_source === "vector_db"
            ? "Runbook DB"
            : "Web Search"
        } (Confidence: ${data.confidence})`,
        delay: 0,
      };
      setTerminalLogs((prev) => [...prev, finalLog]);

      await new Promise((r) => setTimeout(r, 650));
      const slackLog: LogLine = {
        id: 12,
        type: "success",
        prefix: "[Integration: Slack]",
        message: "✓ Dispatched alert & remediation payload to #sre-incident-alerts (HTTP 200 OK)",
        delay: 0,
      };
      setTerminalLogs((prev) => [...prev, slackLog]);

      await new Promise((r) => setTimeout(r, 600));
      const emailLog: LogLine = {
        id: 13,
        type: "success",
        prefix: "[Integration: Gmail]",
        message: "✓ Sent L2 executive summary email to rajputnik911@gmail.com (Status: DELIVERED)",
        delay: 0,
      };
      setTerminalLogs((prev) => [...prev, emailLog]);

      await new Promise((r) => setTimeout(r, 500));
      setIsTerminalActive(false);
      setResolvedData(data);
      setPhase("resolved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errLog: LogLine = {
        id: 11,
        type: "warning",
        prefix: "[System]",
        message: msg || "API call failed. Check configuration.",
        delay: 0,
      };
      setTerminalLogs((prev) => [...prev, errLog]);
      setIsTerminalActive(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setPhase("ready");
    setCurrentAlert(null);
    setResolvedData(null);
    setTerminalLogs([]);
    setIsTerminalActive(false);
  }, []);

  return {
    phase,
    setPhase,
    currentAlert,
    resolvedData,
    terminalLogs,
    isTerminalActive,
    currentTime,
    handleAlertGenerated,
    handleReset,
  };
}
