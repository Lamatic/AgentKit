"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ShieldOff, X } from "lucide-react";
import type { Decision, ReviewResult } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_JUSTIFICATION = 20;

function schemaFor(needsText: boolean) {
  return z.object({
    justification: needsText
      ? z.string().trim().min(MIN_JUSTIFICATION, `Write at least ${MIN_JUSTIFICATION} characters: what was checked, who signed off.`)
      : z.string().trim(),
  });
}

type FormValues = { justification: string };

/**
 * The human step. The gate never applies anything; it records what a person
 * decided and why, so the record can travel with the change (PR comment,
 * ticket, audit log). An override of a block requires a written justification.
 */
export function DecisionPanel({
  result,
  decision,
  onDecide,
}: {
  result: ReviewResult;
  decision: Decision | null;
  onDecide: (d: Decision) => void;
}) {
  const needsText = result.verdict !== "allow";
  const { register, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(needsText)),
    defaultValues: { justification: "" },
    mode: "onChange",
  });
  const error = formState.errors.justification?.message;
  const canApprove = !needsText || watch("justification").trim().length >= MIN_JUSTIFICATION;

  function decide(action: Decision["action"], justification: string) {
    onDecide({
      verdict: result.verdict,
      action,
      justification: justification.trim(),
      decidedAt: new Date().toISOString(),
      planSummary: result.summary,
    });
  }

  const approveAction: Decision["action"] = result.verdict === "block" ? "overridden" : "approved";

  return (
    <section className="rounded-lg border border-border bg-panel p-4">
      <h2 className="text-sm font-semibold">Decision</h2>
      <p className="mt-1 text-xs text-muted">
        {result.verdict === "allow" && "Nothing above low risk. Approve to record the decision."}
        {result.verdict === "needs-approval" && `Approval needs a written reason (${MIN_JUSTIFICATION}+ characters): what was checked, who signed off.`}
        {result.verdict === "block" && "Blocked by a critical finding. Overriding requires a written justification and is recorded as an override."}
        {result.verdict === "no-changes" && "Nothing to decide."}
      </p>
      {result.verdict !== "no-changes" && (
        <form onSubmit={handleSubmit((v) => decide(approveAction, v.justification))} noValidate>
          {needsText && (
            <>
              <Label htmlFor="decision-justification" className="mt-3 block text-xs">
                Justification
              </Label>
              <Textarea
                id="decision-justification"
                className="mt-1 h-24"
                placeholder="e.g. Snapshot orders-prod-2026-09-03 taken, change window 02:00 UTC agreed with payments on-call (R. Mehta)."
                disabled={!!decision}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "decision-justification-error" : undefined}
                {...register("justification")}
              />
              {error && (
                <p id="decision-justification-error" role="alert" className="mt-1 text-xs text-block">
                  {error}
                </p>
              )}
            </>
          )}
          {!decision && (
            <div className="mt-3 flex gap-2">
              <Button type="submit" variant={result.verdict === "block" ? "override" : "approve"} size="sm" disabled={!canApprove}>
                {result.verdict === "block" ? <ShieldOff aria-hidden="true" /> : <Check aria-hidden="true" />}
                {result.verdict === "block" ? "Override and approve" : "Approve"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => decide("rejected", watch("justification"))}>
                <X aria-hidden="true" />
                Reject
              </Button>
            </div>
          )}
        </form>
      )}
      {decision && (
        <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface-deep p-3 text-xs">{JSON.stringify(decision, null, 2)}</pre>
      )}
    </section>
  );
}
