import React from "react";
import { cn } from "@/lib/utils";

interface PillStyle {
  label: string;
  className: string;
}

const STATUS_STYLES: Record<string, PillStyle> = {
  draft: {
    label: "draft",
    className: "bg-neutral-100 text-neutral-600 border border-hairline",
  },
  open: {
    label: "open",
    className: "bg-status-amber-bg text-status-amber border border-status-amber/30",
  },
  awarded: {
    label: "escrow",
    className: "bg-status-amber-bg text-status-amber border border-status-amber/30",
  },
  in_escrow: {
    label: "escrow",
    className: "bg-status-amber-bg text-status-amber border border-status-amber/30",
  },
  delivered: {
    label: "delivered",
    className: "bg-primary-light text-primary border border-primary/20",
  },
  qa_pass: {
    label: "qa pass",
    className: "bg-status-green-bg text-status-green border border-status-green/30",
  },
  qa_fail: {
    label: "qa fail",
    className: "bg-status-red-bg text-status-red border border-status-red/30",
  },
  settled: {
    label: "settled",
    className: "bg-status-green-bg text-status-green border border-status-green/30",
  },
  refunded: {
    label: "refunded",
    className: "bg-status-red-bg text-status-red border border-status-red/30",
  },
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const style =
    STATUS_STYLES[status] ?? {
      label: status.replace(/_/g, " "),
      className: "bg-neutral-100 text-neutral-600 border border-hairline",
    };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

const REASON_STYLES: Record<string, string> = {
  initial_grant: "bg-neutral-100 text-neutral-600",
  bid_lock: "bg-status-amber-bg text-status-amber",
  settlement: "bg-status-green-bg text-status-green",
  fee: "bg-neutral-100 text-neutral-600",
  refund: "bg-status-red-bg text-status-red",
};

export function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
        REASON_STYLES[reason] ?? "bg-neutral-100 text-neutral-600",
      )}
    >
      {reason.replace(/_/g, " ")}
    </span>
  );
}
