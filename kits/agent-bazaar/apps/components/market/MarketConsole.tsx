"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMarketState, postTask, resetMarket, setAutoMarket } from "@/actions/market";
import type { Market } from "@/lib/engine-client";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { cn, formatInt } from "@/lib/utils";
import { TaskComposer } from "./TaskComposer";
import { LiveTaskPanel } from "./LiveTaskPanel";
import { AgentRoster } from "./AgentRoster";
import { LedgerPanel } from "./LedgerPanel";
import { BountyList } from "./BountyList";

const TERMINAL = new Set(["settled", "refunded"]);
const TABLES = [
  "agents",
  "bounties",
  "bids",
  "escrows",
  "deliveries",
  "qa_verdicts",
  "credit_ledger",
  "settlement_receipts",
] as const;

type RealtimeStatus = "live" | "syncing" | "offline";

/** Render the market console dashboard. */
export function MarketConsole({ initialMarket }: { initialMarket: Market | null }) {
  const [market, setMarket] = useState<Market | null>(initialMarket);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [online, setOnline] = useState(initialMarket !== null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("offline");

  const marketRef = useRef(market);
  const autoplayRef = useRef(autoplay);
  const catchUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Status of the selected bounty in the previous market snapshot — used to detect
  // a live → terminal *transition* (auto-advance) vs a deliberate user selection
  // of an already-settled bounty (leave it alone).
  const prevActiveStatusRef = useRef<string | null>(null);

  useEffect(() => {
    marketRef.current = market;
  }, [market]);
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  // Cleanup catch-up timer on unmount
  useEffect(() => {
    return () => {
      if (catchUpTimerRef.current) clearTimeout(catchUpTimerRef.current);
    };
  }, []);

  const handleAutoplayToggle = useCallback(async (value: boolean) => {
    const prev = autoplayRef.current;
    setAutoplay(value);
    try {
      const res = await setAutoMarket({ run: value, market: value });
      if (!res.ok) {
        setAutoplay(prev);
        setError(res.error);
      }
    } catch (err) {
      setAutoplay(prev);
      setError(err instanceof Error ? err.message : "Auto-market toggle failed");
    }
  }, []);

  // Monotonic request sequence: refresh() is fired from the watchdog,
  // realtime debounce, catch-up polls, and handlers, so concurrent requests
  // can resolve out of order. Only the latest request may write market state.
  const requestSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    try {
      const res = await getMarketState();
      // Stale response: return it for the caller but don't touch state.
      if (seq !== requestSeqRef.current) return res;
      if (res.ok) {
        setMarket(res.data);
        setOnline(true);
        setError(null);
      } else {
        setOnline(false);
        setError(res.error);
      }
      return res;
    } catch (err) {
      const failure = { ok: false as const, error: err instanceof Error ? err.message : "Market refresh failed" };
      if (seq === requestSeqRef.current) {
        setOnline(false);
        setError(failure.error);
      }
      return failure;
    }
  }, []);

  // Bounded catch-up burst: poll every 2s until condition is met or timeout
  const startCatchUp = useCallback(
    (check: (m: Market) => boolean, maxMs: number) => {
      if (catchUpTimerRef.current) clearTimeout(catchUpTimerRef.current);
      const startTime = Date.now();

      /** poll helper. */
      const poll = async () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= maxMs) {
          catchUpTimerRef.current = null;
          return;
        }
        const res = await refresh();
        if (res.ok && check(res.data)) {
          catchUpTimerRef.current = null;
          return;
        }
        catchUpTimerRef.current = setTimeout(poll, 2000);
      };

      catchUpTimerRef.current = setTimeout(poll, 2000);
    },
    [refresh],
  );

  // Auto-select first non-terminal bounty on mount or when activeId is null
  useEffect(() => {
    if (activeId || !market) return;
    const inFlight = market.bounties.find((bounty) => !TERMINAL.has(bounty.status));
    setActiveId((inFlight ?? market.bounties[0])?.id ?? null);
  }, [market, activeId]);

  // Auto-advance only when the *selected* bounty transitions live → terminal
  // while watched. A deliberate click on an already-settled bounty stays put.
  useEffect(() => {
    if (!market || !activeId) return;
    const current = market.bounties.find((b) => b.id === activeId);
    const prevStatus = prevActiveStatusRef.current;
    prevActiveStatusRef.current = current?.status ?? null;
    if (
      current &&
      TERMINAL.has(current.status) &&
      prevStatus &&
      !TERMINAL.has(prevStatus)
    ) {
      const next = market.bounties.find((b) => !TERMINAL.has(b.status));
      if (next) {
        prevActiveStatusRef.current = next.status;
        setActiveId(next.id);
      } else {
        setActiveId(null);
      }
    }
  }, [market, activeId]);

  const handleSelect = useCallback(
    (id: string) => {
      // Seed the ref with the clicked bounty's status so the transition
      // watcher above doesn't mistake a deliberate selection for a transition.
      const clicked = marketRef.current?.bounties.find((b) => b.id === id);
      prevActiveStatusRef.current = clicked?.status ?? null;
      setActiveId(id);
    },
    [],
  );

  // Timestamp of the last postgres event actually received. SUBSCRIBED alone
  // proves nothing — if the tables aren't in the realtime publication, channels
  // report SUBSCRIBED yet stay silent forever.
  const lastEventRef = useRef<number>(0);

  // Supabase Realtime: subscribe to all table changes, refetch on any change
  useEffect(() => {
    if (!supabaseBrowser) {
      setRealtimeStatus("offline");
      return;
    }
    setRealtimeStatus("syncing");

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let subscribedCount = 0;

    /** onPostgresEvent helper. */
    const onPostgresEvent = () => {
      lastEventRef.current = Date.now();
      setRealtimeStatus("live");
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void refresh();
      }, 300);
    };

    const channels = TABLES.map((table) => {
      const ch = supabaseBrowser!
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          onPostgresEvent,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            subscribedCount++;
            // Optimistic only — the watchdog below demotes us to syncing if
            // no event actually arrives (e.g. publication missing).
            if (subscribedCount === TABLES.length && lastEventRef.current > 0) {
              setRealtimeStatus("live");
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setRealtimeStatus("syncing");
          }
        });
      return ch;
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (catchUpTimerRef.current) clearTimeout(catchUpTimerRef.current);
      subscribedCount = 0;
      for (const ch of channels) {
        void supabaseBrowser!.removeChannel(ch);
      }
    };
  }, [refresh]);

  // Watchdog: while autoplay is on the engine writes constantly (1s ticks), so
  // 20s without a single postgres event means a silent subscription (channels
  // SUBSCRIBED but tables missing from the realtime publication) or no client.
  // Fall back to polling every 5s so the board never goes stale. The moment a
  // real event lands, onPostgresEvent flips us back to live and polling stops.
  // Autoplay off = idle by choice → no polling, no chip flicker.
  useEffect(() => {
    const id = setInterval(() => {
      if (!autoplayRef.current) return;
      if (!supabaseBrowser) {
        setRealtimeStatus("offline");
        void refresh();
        return;
      }
      if (Date.now() - lastEventRef.current <= 20_000) return;
      setRealtimeStatus("syncing");
      void refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const handlePost = useCallback(
    async (goal: string, budget: number) => {
      setError(null);
      let res;
      try {
        res = await postTask({ goal, budget });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Post task failed");
        return false;
      }
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      const bountyId = res.data.bountyId;
      setActiveId(bountyId);
      await refresh();

      // Catch-up burst: poll until this bounty has bids or 60s elapsed
      startCatchUp(
        (m) => m.bids.some((b) => b.bounty_id === bountyId),
        60_000,
      );
      return true;
    },
    [refresh, startCatchUp],
  );

  const handleReset = useCallback(async () => {
    setResetting(true);
    setError(null);
    try {
      const res = await resetMarket();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setActiveId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }, [refresh]);

  const activeBounty = useMemo(
    () => market?.bounties.find((bounty) => bounty.id === activeId) ?? null,
    [market, activeId],
  );

  const activeAgentIds = useMemo(() => {
    const ids = new Set<string>();
    if (market && activeId) {
      for (const bid of market.bids) {
        if (bid.bounty_id === activeId) ids.add(bid.agent_id);
      }
    }
    return ids;
  }, [market, activeId]);

  const stats = market?.stats;

  return (
    <div className="min-h-screen bg-canvas">
      {!online && (
        <div className="flex items-center justify-between border-b border-status-red/20 bg-status-red-bg px-6 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-status-red" />
            <span className="text-[13px] font-medium text-status-red">Engine offline</span>
            <span className="text-neutral-400">·</span>
            <span className="font-mono text-[12px] text-neutral-600">
              {error ?? "connection refused — queue halted"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-[12px] font-medium text-status-red hover:underline"
          >
            Reconnect
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-hairline bg-white/90 px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-neutral-900 text-[13px] font-semibold tracking-tight text-white">
            AB
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
              Agent Bazaar
            </span>
            <span className="text-[13px] font-normal text-neutral-500">
              two-sided agent economy
            </span>
          </div>
          <span className="mx-1 text-neutral-300">|</span>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-medium",
              !online
                ? "border-status-red/30 bg-status-red-bg text-status-red"
                : realtimeStatus === "live"
                  ? "border-status-green/30 bg-status-green-bg text-status-green"
                  : "border-status-amber/30 bg-status-amber-bg text-status-amber",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                !online
                  ? "bg-status-red"
                  : realtimeStatus === "live"
                    ? "bg-status-green dot-pulse"
                    : "bg-status-amber dot-pulse",
              )}
            />
            {!online
              ? "Engine offline"
              : realtimeStatus === "live"
                ? "Live"
                : "Syncing"}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6">
            <Metric label="Settled">{stats ? formatInt(stats.totalSettled) : "—"}</Metric>
            <div className="h-6 w-px bg-hairline" />
            <Metric label="Escrowed">
              {stats ? formatInt(stats.escrowValue) : "—"}{" "}
              <span className="text-[11px] text-neutral-500">CRT</span>
            </Metric>
            <div className="h-6 w-px bg-hairline" />
            <Metric label="Avg QA">
              <span className="text-status-green">
                {stats ? stats.avgQaScore.toFixed(2) : "—"}
              </span>
            </Metric>
            <div className="h-6 w-px bg-hairline" />
            <Metric label="Fees">
              {stats ? formatInt(stats.feesCollected) : "—"}{" "}
              <span className="text-[11px] text-neutral-500">CRT</span>
            </Metric>
            <div className="h-6 w-px bg-hairline" />
            <Metric label="Budget">
              {market ? market.budget.remaining : "—"}{" "}
              <span className="font-normal text-neutral-400">/ {market?.budget.daily ?? "—"}</span>
            </Metric>
          </div>

          <div className="h-6 w-px bg-hairline" />

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="rounded-[6px] border border-hairline bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-5 px-8 py-6">
        <TaskComposer
          onSubmit={handlePost}
          autoplay={autoplay}
          onAutoplayChange={handleAutoplayToggle}
          error={error}
        />

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 space-y-5">
            <LiveTaskPanel market={market} bounty={activeBounty} />
            <BountyList
              bounties={market?.bounties ?? []}
              bids={market?.bids ?? []}
              agents={market?.agents ?? []}
              activeId={activeId}
              onSelect={handleSelect}
            />
          </div>
          <div className="col-span-4 space-y-5">
            <AgentRoster agents={market?.agents ?? []} activeAgentIds={activeAgentIds} />
            <LedgerPanel ledger={market?.ledger ?? []} agents={market?.agents ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Render a header metric. */
function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      <span className="font-mono text-[13px] font-medium text-neutral-900">{children}</span>
    </div>
  );
}
