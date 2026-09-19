"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Job {
  id: string;
  goal: string;
  status: string;
  amount: number;
  attempt: number;
}

interface ActiveJobsProps {
  jobs: Job[];
}

const STEPS = ["draft", "open", "awarded", "in_escrow", "delivered", "qa_pass", "settled"];

/** Explicit workflow position per status; failure states map to their real stage. */
const STATUS_PROGRESS: Record<string, number> = {
  draft: 0,
  open: 1,
  awarded: 2,
  in_escrow: 3,
  delivered: 4,
  qa_pass: 5,
  qa_fail: 4,
  settled: 6,
  refunded: 6,
};

const FAILED_STATES = new Set(["qa_fail", "refunded"]);

/** Active jobs rail with per-status progress and failure styling. */
export function ActiveJobs({ jobs }: ActiveJobsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => {
            const currentStep = STATUS_PROGRESS[job.status] ?? 0;
            const failed = FAILED_STATES.has(job.status);
            return (
              <div
                key={job.id}
                className="rounded border border-[var(--border)] bg-[var(--bg-surface-container)] p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-primary)]">{job.goal}</p>
                  <span className="font-mono text-sm font-medium text-[var(--primary)]">
                    {job.amount} CRT
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {STEPS.map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`h-2 w-8 rounded ${
                          i <= currentStep
                            ? failed
                              ? "bg-[var(--error)]"
                              : "bg-[var(--secondary)]"
                            : "bg-[var(--border)]"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant={job.status === "settled" ? "success" : "default"}>
                    {job.status}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)]">
                    attempt {job.attempt}/3
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
