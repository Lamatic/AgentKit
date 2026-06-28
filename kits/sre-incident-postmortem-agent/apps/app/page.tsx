"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown from "react-markdown";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Clipboard,
  ClipboardCheck,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { generatePostmortem } from "@/actions/orchestrate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IncidentInput, Postmortem } from "@/lib/types";

const incidentSchema = z.object({
  service_name: z.string().trim().min(1, "Service name is required."),
  incident_title: z.string().trim().min(1, "Incident title is required."),
  alert_details: z.string(),
  logs_or_symptoms: z.string(),
  timeline_notes: z.string(),
  impact_description: z.string(),
  current_status: z.string(),
});

const emptyIncident: IncidentInput = {
  service_name: "",
  incident_title: "",
  alert_details: "",
  logs_or_symptoms: "",
  timeline_notes: "",
  impact_description: "",
  current_status: "",
};

const sampleIncident: IncidentInput = {
  service_name: "checkout-api",
  incident_title: "Elevated checkout latency after deployment",
  alert_details:
    "p95 latency exceeded 2.5s for 15 minutes. Error budget burn alert fired from the payments dashboard.",
  logs_or_symptoms:
    "Database connection pool saturation, increased 504 responses, slow payment confirmations, and retry storms from background workers.",
  timeline_notes:
    "10:05 deployment completed. 10:12 latency alert fired. 10:18 on-call acknowledged. 10:23 database pool saturation identified. 10:27 rollback started. 10:38 latency recovered.",
  impact_description:
    "Some customers could not complete checkout or saw delayed payment confirmation. Support volume increased during the incident window.",
  current_status:
    "Mitigated by rollback. Database metrics are stable. Follow-up verification and query review are pending.",
};

const fields: Array<{
  key: keyof IncidentInput;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  {
    key: "service_name",
    label: "Service Name",
    placeholder: "checkout-api",
  },
  {
    key: "incident_title",
    label: "Incident Title",
    placeholder: "Elevated checkout latency after deployment",
  },
  {
    key: "alert_details",
    label: "Alert Details",
    placeholder: "Alert source, threshold, trigger time, severity, dashboard link notes",
    multiline: true,
  },
  {
    key: "logs_or_symptoms",
    label: "Logs Or Symptoms",
    placeholder: "Errors, metrics, traces, user symptoms, responder observations",
    multiline: true,
  },
  {
    key: "timeline_notes",
    label: "Timeline Notes",
    placeholder: "Detection, acknowledgement, investigation, mitigation, recovery events",
    multiline: true,
  },
  {
    key: "impact_description",
    label: "Impact Description",
    placeholder: "Customer, business, operational, or internal impact",
    multiline: true,
  },
  {
    key: "current_status",
    label: "Current Status",
    placeholder: "Active, mitigated, resolved, pending verification",
    multiline: true,
  },
];

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-3 text-sm text-slate-700">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  if (!value) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-700">{value}</p>
    </section>
  );
}

export default function Home() {
  const form = useForm<IncidentInput>({
    resolver: zodResolver(incidentSchema),
    defaultValues: emptyIncident,
  });
  const [postmortem, setPostmortem] = useState<Postmortem | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { errors } = form.formState;
  const serviceName = form.watch("service_name");
  const incidentTitle = form.watch("incident_title");

  const canSubmit = useMemo(
    () => serviceName.trim() && incidentTitle.trim(),
    [incidentTitle, serviceName],
  );

  const loadSample = () => {
    form.reset(sampleIncident);
    setPostmortem(null);
    setError("");
    setCopied(false);
  };

  const clearAll = () => {
    form.reset(emptyIncident);
    setPostmortem(null);
    setError("");
    setCopied(false);
  };

  const submit = async (values: IncidentInput) => {
    setError("");
    setPostmortem(null);
    setCopied(false);
    setIsLoading(true);

    try {
      const response = await generatePostmortem(values);
      if (response.success && response.postmortem) {
        setPostmortem(response.postmortem);
      } else {
        setError(response.error || "Unable to generate a postmortem.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to generate a postmortem.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyMarkdown = async () => {
    if (!postmortem?.markdown_postmortem) {
      return;
    }

    await navigator.clipboard.writeText(postmortem.markdown_postmortem);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-medium text-teal-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                <FileText className="h-5 w-5" />
              </span>
              Lamatic AgentKit
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              SRE Incident Postmortem Agent
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Convert incident notes into a structured, blameless postmortem with
              remediation, prevention work, owner follow-ups, and a Markdown draft.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Server-side Lamatic GraphQL execution
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Incident Intake
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Service name and incident title are required.
              </p>
            </div>
            <Button
              type="button"
              onClick={loadSample}
              className="border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Load Sample Incident
            </Button>
          </div>

          <form onSubmit={form.handleSubmit(submit)}>
            <div className="mt-5 space-y-4">
              {fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="text-sm font-medium text-slate-700">
                    {field.label}
                  </span>
                  {field.multiline ? (
                    <Textarea
                      {...form.register(field.key)}
                      placeholder={field.placeholder}
                      rows={4}
                    />
                  ) : (
                    <Input
                      {...form.register(field.key)}
                      placeholder={field.placeholder}
                    />
                  )}
                  {errors[field.key]?.message ? (
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      {errors[field.key]?.message}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="flex-1 bg-teal-700 px-4 py-3 text-white hover:bg-teal-800"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Postmortem
              </Button>
              <Button
                type="button"
                onClick={clearAll}
                className="border border-slate-300 bg-white px-4 py-3 text-slate-700 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </form>

          {error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="space-y-5">
          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div>
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  Generating blameless postmortem draft...
                </p>
              </div>
            </div>
          ) : null}

          {!isLoading && !postmortem ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm">
                Results will appear here after you generate a postmortem.
              </p>
            </div>
          ) : null}

          {postmortem ? (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                    Severity
                  </h3>
                  <p className="mt-3 text-2xl font-semibold text-teal-950">
                    {postmortem.severity}
                  </p>
                </section>
                <ResultCard
                  title="Executive Summary"
                  value={postmortem.executive_summary}
                />
              </div>

              <ResultCard
                title="Suspected Root Cause"
                value={postmortem.suspected_root_cause}
              />
              <ResultCard
                title="Customer Impact"
                value={postmortem.customer_impact}
              />
              <ResultCard
                title="Immediate Remediation"
                value={postmortem.immediate_remediation}
              />
              <ResultList title="Timeline" items={postmortem.timeline} />
              <ResultList
                title="Long-Term Prevention"
                items={postmortem.long_term_prevention}
              />
              <ResultList
                title="Owner Follow-ups"
                items={postmortem.owner_followups}
              />

              <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      Markdown Postmortem
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Review and edit before publishing.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={copyMarkdown}
                    className="border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copied ? (
                      <ClipboardCheck className="h-4 w-4 text-teal-700" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy Markdown"}
                  </Button>
                </div>
                <div className="prose prose-slate max-w-none p-5 prose-headings:scroll-mt-24 prose-pre:overflow-auto">
                  <ReactMarkdown>{postmortem.markdown_postmortem}</ReactMarkdown>
                </div>
              </section>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
