"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import { calibrateScorecard } from "@/actions/orchestrate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { splitInterviewerNotes, type Scorecard } from "@/lib/scorecard";

const formSchema = z.object({
  jobTitle: z.string().trim().min(1, "Job title is required"),
  level: z.string().trim().optional().default(""),
  rubric: z.string().trim().min(1, "Competency rubric is required"),
  interviewerNotes: z
    .string()
    .trim()
    .min(1, "Interviewer notes are required")
    .refine((value) => splitInterviewerNotes(value).length >= 2, {
      message:
        "Provide notes from at least two interviewers, separated by '---' or 'Interviewer N (Name):' headings",
    }),
});

type FormValues = z.infer<typeof formSchema>;

const SAMPLE: FormValues = {
  jobTitle: "Senior Backend Engineer",
  level: "L5",
  rubric: `System Design (High): scalable services, tradeoffs, reliability
Coding (High): correctness, clarity, edge cases
Ownership (Medium): end-to-end delivery, communication`,
  interviewerNotes: `Interviewer 1 (Alice, Staff Eng):
Strong system design around caching and failover. Coding solid but a bit slow. Ownership examples were concrete. Score: Design 4, Coding 3, Ownership 4.

---

Interviewer 2 (Bob, Eng Manager):
Design felt hand-wavy on consistency. Coding was clean. Concerned about stakeholder communication. Score: Design 2, Coding 4, Ownership 2.`,
};

function recommendationStyles(value?: string) {
  const key = (value || "").toLowerCase();
  if (key === "hire") {
    return "bg-[var(--rec-hire-bg)] text-[var(--rec-hire-fg)] border-[var(--rec-hire-border)]";
  }
  if (key === "lean-hire") {
    return "bg-[var(--rec-lean-hire-bg)] text-[var(--rec-lean-hire-fg)] border-[var(--rec-lean-hire-border)]";
  }
  if (key === "lean-no") {
    return "bg-[var(--rec-lean-no-bg)] text-[var(--rec-lean-no-fg)] border-[var(--rec-lean-no-border)]";
  }
  if (key === "no-hire") {
    return "bg-[var(--rec-no-hire-bg)] text-[var(--rec-no-hire-fg)] border-[var(--rec-no-hire-border)]";
  }
  return "bg-[var(--rec-fallback-bg)] text-[var(--rec-fallback-fg)] border-[var(--rec-fallback-border)]";
}

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState("");
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: SAMPLE,
  });

  const confidencePct = useMemo(() => {
    if (typeof scorecard?.confidence !== "number") return null;
    return Math.round(Math.max(0, Math.min(1, scorecard.confidence)) * 100);
  }, [scorecard]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError("");
    setScorecard(null);
    setBrief("");

    try {
      const response = await calibrateScorecard(values);

      if (!response.success || !response.data) {
        setError(response.error || "Calibration failed");
        return;
      }

      setScorecard(response.data.scorecard);
      setBrief(response.data.brief || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  });

  function loadSample() {
    reset(SAMPLE);
    setError("");
  }

  function resetResults() {
    setScorecard(null);
    setBrief("");
    setError("");
  }

  return (
    <main className="px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4 text-center">
          <p className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            AgentKit Challenge
          </p>
          <h1 className="display-font text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Interview Scorecard Calibrator
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Turn fragmented panel feedback into a calibrated competency scorecard,
            disagreement map, and hiring-committee brief.
          </p>
        </header>

        {!scorecard && (
          <section className="rounded-3xl border border-[var(--border)] bg-white/90 p-6 shadow-xl shadow-slate-200/60 md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Job title</span>
                    <Input
                      placeholder="Senior Backend Engineer"
                      disabled={loading}
                      {...register("jobTitle")}
                      aria-invalid={errors.jobTitle ? true : undefined}
                      aria-describedby={errors.jobTitle ? "jobTitle-error" : undefined}
                    />
                  </label>
                  {errors.jobTitle && (
                    <p id="jobTitle-error" className="text-sm text-[var(--destructive)]">
                      {errors.jobTitle.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-[var(--foreground)]">Level</span>
                    <Input
                      placeholder="L5"
                      disabled={loading}
                      {...register("level")}
                      aria-invalid={errors.level ? true : undefined}
                      aria-describedby={errors.level ? "level-error" : undefined}
                    />
                  </label>
                  {errors.level && (
                    <p id="level-error" className="text-sm text-[var(--destructive)]">
                      {errors.level.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Competency rubric
                  </span>
                  <Textarea
                    className="min-h-36"
                    disabled={loading}
                    {...register("rubric")}
                    aria-invalid={errors.rubric ? true : undefined}
                    aria-describedby={errors.rubric ? "rubric-error" : undefined}
                  />
                </label>
                {errors.rubric && (
                  <p id="rubric-error" className="text-sm text-[var(--destructive)]">
                    {errors.rubric.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Interviewer notes (2+ interviewers, separated by ---)
                  </span>
                  <Textarea
                    className="min-h-56"
                    disabled={loading}
                    {...register("interviewerNotes")}
                    aria-invalid={errors.interviewerNotes ? true : undefined}
                    aria-describedby={
                      errors.interviewerNotes ? "interviewerNotes-error" : undefined
                    }
                  />
                </label>
                {errors.interviewerNotes && (
                  <p
                    id="interviewerNotes-error"
                    className="text-sm text-[var(--destructive)]"
                  >
                    {errors.interviewerNotes.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? "Calibrating panel feedback..." : "Calibrate scorecard"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadSample}
                  disabled={loading}
                  size="lg"
                >
                  Load sample
                </Button>
              </div>
            </form>
          </section>
        )}

        {scorecard && (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Candidate summary
                </p>
                <p className="mt-3 text-base leading-relaxed text-slate-800">
                  {scorecard.candidate_summary || "No summary returned."}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Recommendation
                </p>
                <div
                  className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wide ${recommendationStyles(scorecard.recommendation)}`}
                >
                  {scorecard.recommendation || "n/a"}
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Confidence: {confidencePct !== null ? `${confidencePct}%` : "n/a"}
                </p>
              </div>
            </div>

            {scorecard.rationale && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Rationale
                </p>
                <p className="mt-3 text-slate-800">{scorecard.rationale}</p>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-md">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="display-font text-xl font-semibold">Competency scorecard</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Competency</th>
                      <th className="px-5 py-3 font-semibold">Weight</th>
                      <th className="px-5 py-3 font-semibold">Score</th>
                      <th className="px-5 py-3 font-semibold">Evidence</th>
                      <th className="px-5 py-3 font-semibold">Gaps / spread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecard.competencies.map((item, idx) => (
                      <tr key={`${item.name}-${idx}`} className="border-t border-slate-100 align-top">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{item.weight}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-800">
                            {item.calibrated_score}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          <ul className="list-disc space-y-1 pl-4">
                            {item.evidence.map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>{item.missing_evidence || "No major gaps noted."}</p>
                          {item.interviewer_spread && (
                            <p className="mt-2 text-xs text-slate-500">
                              Spread: {item.interviewer_spread}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <h2 className="display-font text-xl font-semibold">Disagreements</h2>
                <div className="mt-4 space-y-3">
                  {scorecard.disagreements.length === 0 && (
                    <p className="text-sm text-slate-600">No major disagreements surfaced.</p>
                  )}
                  {scorecard.disagreements.map((item, idx) => (
                    <div
                      key={`${item.topic}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{item.topic}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">
                          {item.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{item.summary}</p>
                      {item.interviewers.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          {item.interviewers.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <h2 className="display-font text-xl font-semibold">Follow-up questions</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {scorecard.follow_up_questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>

            {scorecard.email_draft && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <h2 className="display-font text-xl font-semibold">Decision email draft</h2>
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
                  {scorecard.email_draft}
                </pre>
              </div>
            )}

            {brief && (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-md">
                <h2 className="display-font text-xl font-semibold">Hiring committee brief</h2>
                <div className="prose prose-slate mt-4 max-w-none prose-headings:font-semibold">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={resetResults}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Calibrate another panel
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
