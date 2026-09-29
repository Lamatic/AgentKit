"use client";

import React, { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { artifactText, type BountyView, type Market } from "@/lib/engine-client";
import { cn, formatAmount, formatPercent, shortId, timeAgo } from "@/lib/utils";

const STEP_LABELS = ["Posted", "Bidding", "Escrow", "Delivered", "QA", "Settled"];

/** phaseIndex helper. */
function phaseIndex(status: string): number {
  switch (status) {
    case "draft":
      return 0;
    case "open":
      return 1;
    case "awarded":
    case "in_escrow":
      return 2;
    case "delivered":
      return 3;
    case "qa_pass":
    case "qa_fail":
      return 4;
    case "settled":
    case "refunded":
      return 5;
    default:
      return 1;
  }
}

interface LiveTaskPanelProps {
  market: Market | null;
  bounty: BountyView | null;
}

/** Render the live task pipeline panel. */
export function LiveTaskPanel({ market, bounty }: LiveTaskPanelProps) {
  if (!market) {
    return (
      <section className="rounded-[10px] border border-hairline bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-2/3 rounded bg-neutral-200" />
          <div className="h-3 w-1/3 rounded bg-neutral-200" />
          <div className="mt-4 h-10 w-full rounded bg-neutral-100" />
          <div className="h-32 w-full rounded bg-neutral-100" />
        </div>
      </section>
    );
  }

  if (!bounty) {
    return (
      <section className="rounded-[10px] border border-hairline bg-card p-6">
        <div className="py-16 text-center">
          <p className="text-[13px] font-medium text-neutral-500">No task selected</p>
          <p className="mt-1 text-[12px] text-neutral-400">Post a task or select one from the list below.</p>
        </div>
      </section>
    );
  }

  const bids = market.bids
    .filter((bid) => bid.bounty_id === bounty.id)
    .sort((a, b) => a.price - b.price);
  const escrow = market.escrows.find((item) => item.bounty_id === bounty.id) ?? null;
  const delivery =
    market.deliveries
      .filter((item) => item.bounty_id === bounty.id)
      .sort((a, b) => b.attempt - a.attempt)[0] ?? null;
  const verdict = delivery
    ? (market.verdicts.find((item) => item.delivery_id === delivery.id) ?? null)
    : null;
  const receipt = market.receipts.find((item) => item.bounty_id === bounty.id) ?? null;
  const poster = market.agents.find((agent) => agent.id === bounty.posted_by);
  /** nameOf helper. */
  const nameOf = (agentId: string) =>
    market.agents.find((agent) => agent.id === agentId)?.name ?? shortId(agentId);

  const activeIndex = phaseIndex(bounty.status);
  const settledAll = bounty.status === "settled" || bounty.status === "refunded";
  const failedAll = bounty.status === "refunded";
  const winnerAgentId = bids.find((bid) => bid.id === escrow?.bid_id)?.agent_id;
  const pill = statusPillFor(bounty.status);

  return (
    <section className="overflow-hidden rounded-[10px] border border-hairline bg-card p-6 transition-all">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="max-w-xl text-[16px] font-semibold leading-snug text-neutral-900">
              {bounty.goal}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[12px] text-neutral-500">
              <span className="text-neutral-700">{shortId(bounty.id, 8)}</span>
              <span>·</span>
              <span>
                posted by <span className="font-medium text-neutral-900">{poster?.name ?? "unknown"}</span>
              </span>
              <span>·</span>
              <span suppressHydrationWarning>{timeAgo(bounty.created_at)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="font-mono text-[18px] font-semibold text-neutral-900">
              {formatAmount(bounty.budget)}{" "}
              <span className="text-[12px] font-normal text-neutral-500">CRT</span>
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                pill.className,
              )}
            >
              {pill.label}
            </span>
          </div>
        </div>

        {/* Progress rail */}
        <div className="pb-1 pt-2">
          <div className="grid grid-cols-6 gap-2">
            {STEP_LABELS.map((label, index) => (
              <ProgressStep
                key={label}
                label={label}
                index={index}
                activeIndex={activeIndex}
                settledAll={settledAll}
                failedAll={failedAll}
              />
            ))}
          </div>
        </div>

        {/* Worker bids */}
        <div className="border-t border-hairline pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">
              Worker Bids ({bids.length} Submitted)
            </span>
            <span className="font-mono text-[11px] text-neutral-400">
              {bids.length} bid{bids.length === 1 ? "" : "s"} received
            </span>
          </div>
          {bids.length === 0 ? (
            <p className="rounded-[8px] border border-hairline bg-subtle/60 px-3 py-3 text-[12px] italic text-neutral-400">
              Waiting for bids…
            </p>
          ) : (
            <div className="space-y-2">
              {bids.map((bid) => {
                const winner = escrow?.bid_id === bid.id;
                return (
                  <div
                    key={bid.id}
                    className={cn(
                      "animate-rise flex items-start justify-between gap-3 rounded-[8px] border p-3",
                      winner
                        ? "border-status-green/30 bg-status-green-bg/50"
                        : "border-hairline bg-white",
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium text-neutral-900">
                          {nameOf(bid.agent_id)}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                          {bid.capability.replace("capabilities/", "").replace(".md", "")}
                        </span>
                        {winner && (
                          <span className="rounded-full border border-status-green/30 bg-status-green-bg px-2 py-0.5 text-[10px] font-semibold text-status-green">
                            awarded
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-600">{bid.pitch}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-[13px] font-semibold text-neutral-900">
                        {formatAmount(bid.price)} CRT
                      </span>
                      <span className="block font-mono text-[11px] text-neutral-500">
                        {formatAmount(bid.eta_hours, 1)}h ETA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Escrow + QA */}
        <div className="grid grid-cols-2 gap-4 border-t border-hairline pt-4">
          <div className="space-y-2 rounded-[8px] border border-hairline bg-subtle/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Escrow Contract
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                {escrow ? shortId(escrow.lock_ref, 6) : "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-neutral-600">Locked Amount</span>
              <span className="font-mono text-[14px] font-semibold text-neutral-900">
                {escrow ? `${formatAmount(escrow.amount)} CRT` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-neutral-500">Beneficiary</span>
              <span className="font-medium text-neutral-800">
                {winnerAgentId ? nameOf(winnerAgentId) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-neutral-500">Deposit Status</span>
              {escrow ? (
                <span className="rounded-full border border-status-amber/30 bg-status-amber-bg px-2 py-0.5 text-[10px] font-medium text-status-amber">
                  {escrow.status.replace(/_/g, " ")}
                </span>
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </div>
          </div>

          <div className="space-y-2 rounded-[8px] border border-hairline bg-subtle/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                QA Judge Verdict
              </span>
              {verdict ? (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    verdict.verdict === "pass"
                      ? "border-status-green/30 bg-status-green-bg text-status-green"
                      : "border-status-red/30 bg-status-red-bg text-status-red",
                  )}
                >
                  {verdict.verdict}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">pending</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-600">Rubric Score</span>
                <span className="font-mono text-[13px] font-semibold text-status-green">
                  {verdict ? (
                    <>
                      {formatAmount(verdict.score)}{" "}
                      <span className="text-[11px] font-normal text-neutral-400">/ 1.00</span>
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={cn(
                    "animate-bar h-full rounded-full",
                    verdict && verdict.verdict === "fail" ? "bg-status-red" : "bg-status-green",
                  )}
                  style={{ width: `${Math.round((verdict?.score ?? 0) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] leading-snug text-neutral-600">
              {verdict
                ? verdict.rationale || "No rationale recorded."
                : "Awaiting the judge oracle's rubric evaluation."}
            </p>
          </div>
        </div>

        {/* Delivery */}
        <div className="border-t border-hairline pt-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">
                Delivery
              </span>
              <p className="mt-0.5 text-[13px] text-neutral-800">
                {delivery
                  ? delivery.summary
                  : "No artifact delivered yet — the awarded worker has not submitted."}
              </p>
            </div>
          </div>
          {delivery && <ArtifactToggle artifact={delivery.artifact} attempt={delivery.attempt} />}
        </div>

        {/* Settlement */}
        {receipt && (
          <div className="animate-rise border-t border-hairline pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500">
                {failedAll ? "Refund Ledger" : "Settlement Ledger"}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  failedAll
                    ? "border-status-red/30 bg-status-red-bg text-status-red"
                    : "border-status-green/30 bg-status-green-bg text-status-green",
                )}
              >
                {failedAll ? "Refunded" : "Settled & Finalized"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 rounded-[8px] border border-hairline bg-subtle/60 p-3.5 text-[12px]">
              <div>
                <span className="block text-[11px] text-neutral-500">Transfer</span>
                <span className="font-medium text-neutral-900">
                  {nameOf(receipt.from_agent)} → {nameOf(receipt.to_agent)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-neutral-500">
                  {failedAll ? "Refunded / Gross" : "Net / Gross"}
                </span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    failedAll ? "text-status-red" : "text-status-green",
                  )}
                >
                  {formatAmount(receipt.net_amount)}{" "}
                  <span className="text-[10px] font-normal text-neutral-500">
                    / {formatAmount(receipt.gross_amount)} CRT
                  </span>
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-neutral-500">
                  Platform Fee ({formatPercent(receipt.fee_amount / (receipt.gross_amount || 1))})
                </span>
                <span className="font-mono text-neutral-700">
                  {formatAmount(receipt.fee_amount)} CRT
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-neutral-500">Adapter / Tx Hash</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                    {receipt.adapter === "x402" ? "x402" : "ledger"}
                  </span>
                  {receipt.tx_hash && (
                    <span className="max-w-[90px] truncate font-mono text-[11px] text-neutral-600">
                      {shortId(receipt.tx_hash, 6)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rubric */}
        {bounty.rubric?.criteria?.length ? (
          <div className="border-t border-hairline pt-4">
            <span className="mb-3 block text-[12px] font-semibold uppercase tracking-wider text-neutral-500">
              Evaluation Rubric (Strict Scoring)
            </span>
            <div className="grid grid-cols-4 gap-3">
              {bounty.rubric.criteria.map((criterion) => (
                <div
                  key={criterion.name}
                  className="space-y-1 rounded-[8px] border border-hairline bg-white p-2.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[12px] font-semibold text-neutral-800">
                      {criterion.name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-indigo-600">
                      {formatPercent(criterion.weight)}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight text-neutral-500">
                    {criterion.description ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Render a single progress step. */
function ProgressStep({
  label,
  index,
  activeIndex,
  settledAll,
  failedAll,
}: {
  label: string;
  index: number;
  activeIndex: number;
  settledAll: boolean;
  failedAll: boolean;
}) {
  // A refunded bounty is terminal but a failure, never a success: render the
  // complete rail with failure styling instead of the settled success theme.
  const lineColor = failedAll ? "bg-status-red" : settledAll ? "bg-status-green" : "bg-primary";
  const leftComplete = settledAll || index <= activeIndex;
  const rightComplete = settledAll || index < activeIndex;
  const isActive = !settledAll && index === activeIndex;

  const dotClass = failedAll
    ? "bg-status-red ring-4 ring-red-50"
    : settledAll
      ? "bg-status-green ring-4 ring-emerald-50"
      : index < activeIndex
        ? "bg-primary ring-4 ring-indigo-50"
        : isActive
          ? "bg-status-amber dot-pulse ring-4 ring-amber-50"
          : "bg-neutral-300";

  const labelClass = failedAll
    ? "text-status-red"
    : settledAll
      ? "text-status-green"
      : index < activeIndex
        ? "text-primary"
        : isActive
          ? "text-status-amber"
          : "text-neutral-400";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex w-full items-center">
        <div
          className={cn(
            "h-[2px] w-full",
            index === 0 ? "bg-transparent" : leftComplete ? lineColor : "bg-neutral-200",
          )}
        />
        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotClass)} />
        <div
          className={cn(
            "h-[2px] w-full",
            index === STEP_LABELS.length - 1
              ? "bg-transparent"
              : rightComplete
                ? lineColor
                : "bg-neutral-200",
          )}
        />
      </div>
      <span
        className={cn(
          "mt-2 font-mono text-[10px] font-semibold uppercase tracking-wider",
          labelClass,
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Toggle the delivery artifact viewer. */
function ArtifactToggle({ artifact, attempt }: { artifact: unknown; attempt: number }) {
  const [open, setOpen] = useState(false);
  const text = artifactText(artifact);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Move focus into the dialog on open; trap Tab inside while open and
    // restore focus to the trigger on close. Escape/overlay-click behavior kept.
    panelRef.current?.focus();
    /** onKey helper. */
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // The panel container itself receives initial focus (tabIndex -1), so
      // treat it as the position before the first element: Shift+Tab wraps
      // to the last focusable element instead of escaping the dialog.
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="mt-2">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-[6px] border border-hairline bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
      >
        <span>View artifact</span>
        <ExternalLink aria-hidden className="h-3.5 w-3.5 text-neutral-500" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delivery artifact"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[70vh] w-[40vw] min-w-[320px] max-w-[720px] flex-col overflow-hidden rounded-[10px] border border-neutral-800 bg-neutral-900 shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-2.5 font-mono text-[11px] text-neutral-500">
              <div className="flex items-center gap-4">
                <span>ATTEMPT: {attempt}</span>
                <span>SIZE: {text.length.toLocaleString()} B</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close artifact"
                className="rounded-[4px] px-2 py-0.5 text-[12px] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-[12px] leading-relaxed text-neutral-300">
              {text || "—"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/** statusPillFor helper. */
function statusPillFor(status: string): { label: string; className: string } {
  switch (status) {
    case "settled":
      return {
        label: "Settled & Paid",
        className: "border-status-green/30 bg-status-green-bg text-status-green",
      };
    case "refunded":
      return {
        label: "Refunded",
        className: "border-status-red/30 bg-status-red-bg text-status-red",
      };
    case "qa_pass":
      return {
        label: "QA Passed",
        className: "border-status-green/30 bg-status-green-bg text-status-green",
      };
    case "qa_fail":
      return {
        label: "QA Failed",
        className: "border-status-red/30 bg-status-red-bg text-status-red",
      };
    case "delivered":
      return {
        label: "Delivered",
        className: "border-primary/20 bg-primary-light text-primary",
      };
    case "awarded":
    case "in_escrow":
      return {
        label: "Escrow locked",
        className: "border-status-amber/30 bg-status-amber-bg text-status-amber",
      };
    case "open":
      return {
        label: "Open for bids",
        className: "border-status-amber/30 bg-status-amber-bg text-status-amber",
      };
    default:
      return {
        label: "Draft",
        className: "border-hairline bg-neutral-100 text-neutral-600",
      };
  }
}
