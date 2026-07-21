"use client";

import {
  CheckCircle2,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type ApprovalStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

interface ApprovalCardProps {
  approvalReason: string;
  status: ApprovalStatus;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function ApprovalCard({
  approvalReason,
  status,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  if (status === "APPROVED") {
    return (
      <Card className="rounded-2xl border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />

          <div>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
              Strategy approved
            </h3>

            <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-300">
              Manager approval has been recorded. The accounts team may now
              execute the recommended strategy.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "REJECTED") {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50/80 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />

          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Strategy rejected
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
              The recommendation cannot proceed. The account is waiting for a
              revised collection strategy.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-amber-200 bg-amber-50/70 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <ShieldAlert className="size-5 text-amber-700 dark:text-amber-300" />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold tracking-tight">
            Manager approval required
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {approvalReason}
          </p>

          <div className="mt-5 space-y-2">
            <label htmlFor="rejection-reason" className="text-sm font-medium">
              Rejection reason
              <span className="ml-1 font-normal text-muted-foreground">
                optional
              </span>
            </label>

            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Add context if this strategy should not proceed..."
              className="min-h-[96px] resize-none bg-background/80"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onReject(rejectionReason.trim())}
              className="gap-2 bg-transparent"
            >
              <ThumbsDown className="size-4" />
              Reject strategy
            </Button>

            <Button type="button" onClick={onApprove} className="gap-2">
              <ThumbsUp className="size-4" />
              Approve strategy
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
