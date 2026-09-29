"use client";

import React from "react";
import { Badge } from "./ui/Badge";

interface StateBadgeProps {
  status: string;
}

const stateConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "outline" }> = {
  draft: { label: "Draft", variant: "outline" },
  open: { label: "Open", variant: "success" },
  awarded: { label: "Awarded", variant: "default" },
  in_escrow: { label: "In Escrow", variant: "warning" },
  delivered: { label: "Delivered", variant: "default" },
  qa_pass: { label: "QA Pass", variant: "success" },
  qa_fail: { label: "QA Fail", variant: "error" },
  settled: { label: "Settled", variant: "success" },
  refunded: { label: "Refunded", variant: "error" },
};

/** Render a bounty state badge. */
export function StateBadge({ status }: StateBadgeProps) {
  const config = stateConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
