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

export function ActiveJobs({ jobs }: ActiveJobsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => {
            const currentStep = STEPS.indexOf(job.status);
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
                            ? "bg-[var(--secondary)]"
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
