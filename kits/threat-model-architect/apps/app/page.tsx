"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { generateThreatModel } from "@/actions/orchestrate";
import type { IntakeInput, ThreatModelReport } from "@/lib/types";

const sample = `We operate AcmeLedger, a multi-tenant B2B invoicing SaaS. Customers use a Next.js browser app that calls a Node.js API. Clerk provides authentication, PostgreSQL stores tenant data and invoices, Stripe sends payment webhooks, and customers upload receipts to S3 through pre-signed URLs. Internal support staff use an admin dashboard.`;

const intakeFormSchema = z.object({
  systemDescription: z
    .string()
    .trim()
    .min(1, "Describe the system to begin analysis.")
    .max(6_000, "System descriptions cannot exceed 6,000 characters."),
  accessToken: z.string().max(512, "Access tokens cannot exceed 512 characters.").optional(),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

function Section({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}

export default function Home() {
  const [report, setReport] = useState<ThreatModelReport | null>(null);
  const [error, setError] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [sessionState, setSessionState] = useState<IntakeInput["sessionState"]>();
  const [running, setRunning] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: { systemDescription: "", accessToken: "" },
  });
  const description = watch("systemDescription");

  async function submit(values: IntakeFormValues) {
    setRunning(true);
    setError("");
    setReport(null);
    try {
      const result = await generateThreatModel({
        systemDescription: values.systemDescription,
        sessionState,
        accessToken: values.accessToken || undefined,
      });
      if (result.status === "complete") {
        setReport(result.report);
        setAssistantMessage("");
        setMissingInfo([]);
        setSessionState(undefined);
      } else if (result.status === "needs_input") {
        setAssistantMessage(result.assistantMessage);
        setMissingInfo(result.missingInfo);
        setSessionState(result.sessionState);
        setValue("systemDescription", "");
      } else {
        setError(result.error);
      }
    } catch {
      setError("The request could not be completed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  function resetIntake() {
    reset({ systemDescription: "", accessToken: watch("accessToken") ?? "" });
    setAssistantMessage("");
    setMissingInfo([]);
    setSessionState(undefined);
    setReport(null);
    setError("");
  }

  function loadSample() {
    resetIntake();
    setValue("systemDescription", sample, { shouldValidate: true });
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-[72px] pt-10">
      <header>
        <span className="eyebrow">LAMATIC AGENTKIT · SECURITY</span>
        <h1>Threat Model Architect</h1>
        <p>Turn a system description into a structured architecture model, STRIDE threat register, DREAD ranking, and remediation roadmap.</p>
      </header>
      <div className="layout">
        <section className="card intake">
          <h2>System intake</h2>
          <p className="muted">Include components, data, integrations, user roles, and trust boundaries where known.</p>
          {assistantMessage && (
            <div className="follow-up" role="status" aria-live="polite">
              <strong>Intake follow-up</strong>
              <p>{assistantMessage}</p>
              {missingInfo.length > 0 && (
                <ul>{missingInfo.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit(submit)}>
            <label htmlFor="system-description" className="muted">
              {sessionState ? "Your response" : "System description"}
            </label>
            <textarea id="system-description" maxLength={6000} placeholder={sessionState ? "Answer the follow-up or confirm the summary…" : "Describe your architecture…"} rows={15} disabled={running} {...register("systemDescription")} />
            {errors.systemDescription && <p className="field-error" role="alert">{errors.systemDescription.message}</p>}
            <label htmlFor="access-token" className="muted">Deployment access token (if required)</label>
            <input id="access-token" type="password" autoComplete="current-password" maxLength={512} disabled={running} {...register("accessToken")} />
            {errors.accessToken && <p className="field-error" role="alert">{errors.accessToken.message}</p>}
            <div className="actions">
              <button type="submit" disabled={running || !description.trim()}>{running ? "Processing…" : sessionState ? "Continue intake" : "Start threat model"}</button>
              <button type="button" className="secondary" disabled={running || !!sessionState} onClick={loadSample}>Load sample</button>
              {sessionState && <button type="button" className="secondary" disabled={running} onClick={resetIntake}>Start over</button>}
            </div>
          </form>
          <ol className="pipeline">
            <li>Architecture intake</li><li>Decomposition</li><li>STRIDE</li><li>Research</li><li>DREAD</li><li>Local roadmap</li>
          </ol>
        </section>

        <section className="results">
          {error && <p className="error" role="alert">{error}</p>}
          {!report && !running && !error && <div className="empty">Your completed threat-model report will appear here after intake is confirmed.</div>}
          {running && <div className="empty" role="status" aria-live="polite">Validating intake and generating the report. This can take a few minutes.</div>}
          {report && <>
            <Section title="Architecture model" value={report.architecture} />
            <Section title="STRIDE threat register" value={report.stride} />
            <Section title="Research context" value={report.research} />
            <Section title="DREAD prioritization" value={report.prioritization} />
            <Section title="7 / 30 / 60 / 90-day roadmap" value={report.roadmap} />
          </>}
        </section>
      </div>
    </main>
  );
}
