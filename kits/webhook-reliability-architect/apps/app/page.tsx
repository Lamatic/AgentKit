"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  DatabaseZap,
  FlaskConical,
  Gauge,
  Network,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { analyzeWebhookScenario } from "@/actions/orchestrate";
import { webhookScenarioSchema } from "@/lib/schemas";
import type {
  AnalysisResult,
  BusinessEffect,
  DeliverySemantics,
  ReliabilityReport,
  WebhookScenario,
} from "@/lib/types";

const SAMPLE_SCENARIO: WebhookScenario = {
  systemName: "Checkout payment events",
  eventType: "payment.succeeded",
  businessEffect: "financial",
  deliverySemantics: "at-least-once",
  orderingRequired: true,
  maxAttempts: 6,
  timeoutSeconds: 10,
  maxDeliveryAgeMinutes: 1_440,
  currentSafeguards:
    "HMAC signature verification and request logs. Retries currently use a fixed 10-second delay. There is no durable idempotency record or dead-letter queue.",
  samplePayload: `{
  "event_id": "evt_01J8Z8K7G2",
  "type": "payment.succeeded",
  "occurred_at": "2026-08-08T08:30:00Z",
  "data": { "order_id": "ord_4831", "amount": 4999, "currency": "INR" }
}`,
  failureContext:
    "The receiver occasionally times out after committing the order update, so the provider retries and duplicate confirmation emails are sent.",
};

const EFFECT_OPTIONS: Array<{ value: BusinessEffect; label: string }> = [
  { value: "read-only", label: "Read-only" },
  { value: "reversible-write", label: "Reversible write" },
  { value: "notification", label: "Notification" },
  { value: "inventory", label: "Inventory / entitlement" },
  { value: "financial", label: "Financial" },
];

const DELIVERY_OPTIONS: Array<{ value: DeliverySemantics; label: string }> = [
  { value: "at-least-once", label: "At least once" },
  { value: "at-most-once", label: "At most once" },
  { value: "best-effort", label: "Best effort" },
  { value: "unknown", label: "Unknown" },
];

const inputClass =
  "w-full rounded-[10px] border border-[#29473d] bg-[#091512] px-[13px] py-3 text-[var(--text)] outline-none transition focus:border-[var(--green)] focus:ring-3 focus:ring-[rgba(125,240,183,0.12)]";
const labelClass = "grid gap-2 text-xs font-bold tracking-[0.015em] text-[#cbe0d7]";
const panelClass = "rounded-[20px] border border-[var(--line)] bg-[rgba(13,25,22,0.88)]";
const eyebrowClass =
  "mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--green)]";
const cardTitleClass = "mb-[17px] flex items-center gap-3 text-[var(--green)]";
const listClass = "m-0 pl-5 text-xs text-[#bed2ca] [&>li+li]:mt-2";

function formatDelay(seconds: number): string {
  if (seconds === 0) return "Immediate";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3_600)}h`;
}

function riskTone(level: ReliabilityReport["riskLevel"]): string {
  if (level === "low") return "border-[rgba(125,240,183,0.45)] text-[var(--green)]";
  if (level === "moderate") return "border-[rgba(255,197,110,0.4)] text-[var(--amber)]";
  return "border-[rgba(255,141,131,0.46)] text-[var(--red)]";
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-[11px] font-medium text-[var(--red)]">{message}</span> : null;
}

type CopyStatus = "idle" | "copied" | "error";

export default function HomePage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [submittedScenario, setSubmittedScenario] = useState<WebhookScenario | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookScenario>({
    resolver: zodResolver(webhookScenarioSchema),
    defaultValues: SAMPLE_SCENARIO,
  });

  function submitScenario(scenario: WebhookScenario) {
    setCopyStatus("idle");
    startTransition(async () => {
      const nextResult = await analyzeWebhookScenario(scenario);
      setResult(nextResult);
      setSubmittedScenario(nextResult.success ? scenario : null);
      if (nextResult.success) {
        window.requestAnimationFrame(() => {
          const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document
            .getElementById("report")
            ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        });
      }
    });
  }

  async function copyReport() {
    if (!result?.report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.report, null, 2));
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2_000);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 3_000);
    }
  }

  const report = result?.report;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(125,240,183,0.13)] bg-[rgba(7,17,15,0.82)] px-[clamp(20px,5vw,72px)] py-3.5 backdrop-blur-[18px]">
        <a className="inline-flex items-center gap-2.5 text-sm font-bold no-underline" href="#top" aria-label="Webhook Reliability Architect home">
          <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[var(--green)] text-[#06271b]" aria-hidden="true">
            <Network size={20} />
          </span>
          <span>Webhook Reliability Architect</span>
        </a>
        <span className="hidden items-center gap-2 rounded-full border border-[rgba(125,240,183,0.2)] bg-[rgba(125,240,183,0.08)] px-[11px] py-[7px] text-xs font-semibold text-[#c2ead8] sm:inline-flex">
          <span className="size-[7px] rounded-full bg-[var(--green-strong)] shadow-[0_0_0_5px_rgba(36,216,137,0.13)]" aria-hidden="true" />
          Built for Lamatic AgentKit
        </span>
      </header>

      <section className="mx-auto grid max-w-[1440px] items-center gap-[clamp(32px,6vw,96px)] px-[clamp(20px,5vw,72px)] pt-[clamp(60px,9vw,132px)] pb-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]" id="top">
        <div>
          <p className={eyebrowClass}>Failure-aware architecture, in one reviewable brief</p>
          <h1 className="m-0 max-w-[980px] text-[clamp(44px,6.2vw,88px)] leading-[0.98] font-bold tracking-[-0.055em]">
            Stop duplicate webhooks before they duplicate the business effect.
          </h1>
          <p className="mt-7 max-w-[780px] text-[clamp(17px,2vw,21px)] text-[#b7cdc4]">
            Describe a delivery contract. Get an idempotency design, bounded retry schedule,
            dead-letter replay procedure, observability SLO, and failure-injection test matrix.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5" aria-label="Report coverage">
            {[{ icon: ShieldCheck, text: "Idempotency" }, { icon: RefreshCw, text: "Retries" }, { icon: DatabaseZap, text: "Dead letters" }, { icon: Activity, text: "SLOs" }].map(({ icon: Icon, text }) => (
              <span className="inline-flex items-center gap-[7px] rounded-[9px] border border-[var(--line)] bg-[rgba(255,255,255,0.035)] px-[11px] py-[9px] text-xs font-semibold text-[#cee1d9]" key={text}>
                <Icon size={16} /> {text}
              </span>
            ))}
          </div>
        </div>
        <div className="relative rounded-[22px] border border-[var(--line-bright)] bg-[linear-gradient(145deg,rgba(17,35,30,0.94),rgba(8,20,16,0.98))] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.32)] before:absolute before:-top-px before:right-[22px] before:left-[22px] before:h-[3px] before:rounded-t-[22px] before:bg-[var(--green)]">
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[var(--muted)]">Core invariant</p>
          <p className="my-[14px] mb-6 text-[clamp(25px,3vw,38px)] leading-[1.08] font-bold tracking-[-0.035em]">One event → one business mutation</p>
          <div className="grid grid-cols-4 items-center gap-[7px] text-center text-[10px] font-extrabold uppercase text-[var(--green)] sm:grid-cols-7" aria-hidden="true">
            <span className="rounded-[7px] border border-[rgba(125,240,183,0.17)] bg-[rgba(125,240,183,0.06)] px-1.5 py-2">Receive</span><ArrowRight className="hidden sm:block" size={14} />
            <span className="rounded-[7px] border border-[rgba(125,240,183,0.17)] bg-[rgba(125,240,183,0.06)] px-1.5 py-2">Claim</span><ArrowRight className="hidden sm:block" size={14} />
            <span className="rounded-[7px] border border-[rgba(125,240,183,0.17)] bg-[rgba(125,240,183,0.06)] px-1.5 py-2">Commit</span><ArrowRight className="hidden sm:block" size={14} />
            <span className="rounded-[7px] border border-[rgba(125,240,183,0.17)] bg-[rgba(125,240,183,0.06)] px-1.5 py-2">Remember</span>
          </div>
          <p className="mt-[22px] mb-0 border-t border-[var(--line)] pt-[18px] text-[13px] text-[var(--muted)]">Redelivery returns the remembered result, not a second side effect.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] items-start gap-[22px] px-[clamp(20px,5vw,72px)] pt-7 pb-[76px] lg:grid-cols-[minmax(0,1fr)_360px]" aria-label="Webhook architecture workspace">
        <form className={`${panelClass} grid gap-[22px] p-[clamp(22px,4vw,42px)] shadow-[0_28px_80px_rgba(0,0,0,0.32)]`} onSubmit={handleSubmit(submitScenario)} noValidate>
          <div className="flex items-start justify-between">
            <div>
              <p className={eyebrowClass}>01 · Delivery contract</p>
              <h2 className="m-0 text-[clamp(28px,3.4vw,46px)] leading-[1.05] font-bold tracking-[-0.04em]">Describe the webhook</h2>
            </div>
            <button className="border-0 bg-transparent p-2 text-[13px] font-bold text-[var(--green)] hover:text-white" type="button" onClick={() => { reset(SAMPLE_SCENARIO); setResult(null); setSubmittedScenario(null); }}>
              Load sample
            </button>
          </div>

          <div className="grid gap-[18px] md:grid-cols-2">
            <label className={labelClass}>System name<input className={inputClass} {...register("systemName")} placeholder="Checkout payment events" /><FieldError message={errors.systemName?.message} /></label>
            <label className={labelClass}>Event type<input className={inputClass} {...register("eventType")} placeholder="payment.succeeded" /><FieldError message={errors.eventType?.message} /></label>
            <label className={labelClass}>Business effect<select className={inputClass} {...register("businessEffect")}>{EFFECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><FieldError message={errors.businessEffect?.message} /></label>
            <label className={labelClass}>Sender semantics<select className={inputClass} {...register("deliverySemantics")}>{DELIVERY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><FieldError message={errors.deliverySemantics?.message} /></label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(125,240,183,0.035)] p-[13px] text-xs font-bold text-[#cbe0d7]">
            <input className="size-[18px] accent-[var(--green-strong)]" type="checkbox" {...register("orderingRequired")} />
            <span className="grid"><strong>Ordering matters</strong><small className="text-[11px] font-normal text-[var(--muted)]">Older events must not overwrite newer aggregate state.</small></span>
          </label>

          <div className="grid gap-[18px] md:grid-cols-3">
            <label className={labelClass}>Max attempts<input className={inputClass} type="number" min={1} max={12} {...register("maxAttempts", { valueAsNumber: true })} /><FieldError message={errors.maxAttempts?.message} /></label>
            <label className={labelClass}>Timeout (seconds)<input className={inputClass} type="number" min={1} max={300} {...register("timeoutSeconds", { valueAsNumber: true })} /><FieldError message={errors.timeoutSeconds?.message} /></label>
            <label className={labelClass}>Delivery age (minutes)<input className={inputClass} type="number" min={1} max={10_080} {...register("maxDeliveryAgeMinutes", { valueAsNumber: true })} /><FieldError message={errors.maxDeliveryAgeMinutes?.message} /></label>
          </div>

          <label className={labelClass}>Existing safeguards<textarea className={inputClass} rows={4} {...register("currentSafeguards")} placeholder="Signature checks, retry logic, persisted deduplication, logs, queues…" /><FieldError message={errors.currentSafeguards?.message} /></label>
          <label className={labelClass}>Sample payload<textarea className={`${inputClass} resize-y font-mono text-xs leading-[1.65] text-[#c4f3dc]`} rows={8} {...register("samplePayload")} spellCheck={false} placeholder={'{ "event_id": "evt_123", "type": "order.created" }'} /><FieldError message={errors.samplePayload?.message} /></label>
          <label className={labelClass}>Failure context<textarea className={inputClass} rows={4} {...register("failureContext")} placeholder="What already fails, or what are you most worried about?" /><FieldError message={errors.failureContext?.message} /></label>

          {result && !result.success ? <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(255,141,131,0.28)] bg-[rgba(255,141,131,0.07)] p-[13px] text-[13px] text-[#ffd0cc]" role="alert"><AlertTriangle size={18} /> {result.error}</div> : null}

          <button className="inline-flex min-h-[50px] items-center justify-center gap-[9px] rounded-[10px] border border-[var(--green)] bg-[var(--green)] px-[18px] py-[13px] font-extrabold text-[#052117] transition hover:-translate-y-px hover:bg-[#9af8c9] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={isPending}>
            {isPending ? <RefreshCw className="animate-spin motion-reduce:animate-none" size={18} /> : <Send size={18} />}
            {isPending ? "Modeling failure paths…" : "Generate reliability blueprint"}
          </button>
          <p className="-mt-2.5 mb-0 text-center text-[11px] text-[var(--muted)]">Avoid real secrets or personal data. Demo mode is deterministic and stays local to the app.</p>
        </form>

        <aside className={`${panelClass} top-[84px] p-7 lg:sticky`}>
          <p className={eyebrowClass}>Reliability lens</p>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.04em]">What the architect checks</h2>
          <ol className="my-7 list-none p-0">
            {[['Identity', 'Can every event claim one durable key?'], ['Atomicity', 'Can the side effect and receipt commit together?'], ['Bounded retry', 'Which failures deserve another attempt—and for how long?'], ['Safe replay', 'Can an operator recover poison or exhausted events deliberately?'], ['Evidence', 'Will metrics and chaos tests prove the invariant?']].map(([title, copy], index) => (
              <li className="grid grid-cols-[30px_1fr] gap-3.5 border-t border-[var(--line)] py-[17px]" key={title}>
                <span className="inline-flex size-[27px] items-center justify-center rounded-full border border-[var(--line-bright)] text-[11px] text-[var(--green)]">{index + 1}</span>
                <div><strong className="text-sm">{title}</strong><p className="mt-[3px] mb-0 text-xs text-[var(--muted)]">{copy}</p></div>
              </li>
            ))}
          </ol>
          <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(255,141,131,0.28)] bg-[rgba(255,141,131,0.07)] p-[13px] text-[#ffd0cc]">
            <AlertTriangle size={18} /><div><strong>Retry is not recovery by itself.</strong><p className="mt-[3px] mb-0 text-xs text-[var(--muted)]">Without idempotency, faster retries can multiply the damage.</p></div>
          </div>
        </aside>
      </section>

      {report ? (
        <section className="mx-auto grid max-w-[1440px] gap-[22px] px-[clamp(20px,5vw,72px)] pt-10 pb-[100px]" id="report" aria-live="polite">
          <div className="flex flex-col items-start justify-between gap-[30px] border-b border-[var(--line)] pb-7 md:flex-row md:items-end">
            <div className="max-w-[920px]"><p className={eyebrowClass}>02 · Architecture brief</p><h2 className="m-0 text-[clamp(28px,3.4vw,46px)] leading-[1.05] font-bold tracking-[-0.04em]">{submittedScenario?.systemName}</h2><p className="mt-3.5 mb-0 text-[15px] text-[var(--muted)]">{report.executiveSummary}</p></div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full border border-[rgba(125,240,183,0.2)] bg-[rgba(125,240,183,0.08)] px-[11px] py-[7px] text-xs font-semibold text-[#c2ead8]">{result?.mode === "live" ? "Live flow" : "Demo engine"}</span>
              <button className="inline-flex min-h-[38px] items-center justify-center gap-[9px] rounded-[10px] border border-[var(--line-bright)] bg-[#10231d] px-3 py-[9px] font-extrabold text-[var(--text)]" type="button" onClick={copyReport} aria-live="polite">
                {copyStatus === "copied" ? <CheckCircle2 size={16} /> : copyStatus === "error" ? <XCircle size={16} /> : <Copy size={16} />}
                {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy failed" : "Copy JSON"}
              </button>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-[1.35fr_repeat(3,1fr)]">
            <article className={`min-h-[132px] rounded-2xl border bg-[rgba(13,25,22,0.9)] p-5 ${riskTone(report.riskLevel)}`}><div className="flex items-center gap-2.5 text-xs text-[var(--muted)]"><Gauge size={20} /><span>Delivery risk</span></div><strong className="mt-3 block text-5xl leading-none tracking-[-0.05em]">{report.riskScore}<small className="text-sm tracking-normal text-[var(--muted)]">/100</small></strong><p className="mt-[5px] mb-0 text-[11px] font-black uppercase tracking-[0.12em]">{report.riskLevel}</p></article>
            {[{ icon: Clock3, label: 'Delivery budget', value: `${report.retryPlan.maxDeliveryAgeMinutes} min` }, { icon: RefreshCw, label: 'Bounded attempts', value: report.retryPlan.maxAttempts }, { icon: FlaskConical, label: 'Failure tests', value: report.testMatrix.length }].map(({ icon: Icon, label, value }) => <article className={`${panelClass} flex min-h-[132px] items-center gap-2.5 p-5 text-[var(--green)]`} key={label}><Icon size={20} /><div className="grid"><span className="text-[11px] font-bold text-[var(--muted)]">{label}</span><strong className="text-[22px] text-[var(--text)]">{value}</strong></div></article>)}
          </div>

          <div className="grid gap-[18px] md:grid-cols-2">
            <article className={`${panelClass} p-[26px] md:col-span-2`}><div className={cardTitleClass}><ShieldCheck size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Control 01</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">Idempotency contract</h3></div></div><p className="text-[13px] text-[var(--muted)]">{report.idempotencyPlan.keyStrategy}</p><div className="my-[18px] flex items-center justify-between gap-3.5 rounded-[11px] border border-[var(--line)] bg-[#07120f] p-[13px]"><span className="text-[11px] font-extrabold uppercase text-[var(--muted)]">Example key</span><code className="[overflow-wrap:anywhere] font-mono text-xs text-[var(--green)]">{report.idempotencyPlan.keyExample}</code></div><dl className="m-0">{[['Storage', report.idempotencyPlan.storage], ['First delivery', report.idempotencyPlan.firstSeenBehavior], ['Duplicate', report.idempotencyPlan.duplicateBehavior], ['Key conflict', report.idempotencyPlan.conflictBehavior], ['Retention', `${report.idempotencyPlan.ttlHours} hours`]].map(([term, detail]) => <div className="grid gap-1 border-t border-[var(--line)] py-[13px] md:grid-cols-[140px_1fr] md:gap-4" key={term}><dt className="text-[11px] font-extrabold uppercase text-[var(--muted)]">{term}</dt><dd className="m-0 text-[13px]">{detail}</dd></div>)}</dl></article>

            <article className={`${panelClass} p-[26px] md:col-span-2`}><div className={cardTitleClass}><RefreshCw size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Control 02</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">Retry schedule</h3></div></div><p className="text-[13px] text-[var(--muted)]">{report.retryPlan.policy}</p><div className="my-[22px] flex gap-2 overflow-x-auto pb-[5px]">{report.retryPlan.schedule.map((item) => <div className="relative grid flex-[1_0_130px] gap-0.5 rounded-[10px] border border-[var(--line)] bg-[#091512] p-3" key={item.attempt}><span className="flex size-5 items-center justify-center rounded-full bg-[var(--green)] text-[10px] font-black text-[#09241a]">{item.attempt}</span><strong className="mt-[5px] text-[17px]">{formatDelay(item.delaySeconds)}</strong><small className="text-[10px] text-[var(--muted)]">{item.purpose}</small></div>)}</div><div className="grid gap-[22px] md:grid-cols-2"><div><h4 className="my-2.5 text-xs font-bold uppercase tracking-[0.06em] text-[#d7ebe2]">Retry</h4><ul className={listClass}>{report.retryPlan.retryableConditions.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h4 className="my-2.5 text-xs font-bold uppercase tracking-[0.06em] text-[#d7ebe2]">Do not retry</h4><ul className={listClass}>{report.retryPlan.nonRetryableConditions.map((item) => <li key={item}>{item}</li>)}</ul></div></div></article>

            <article className={`${panelClass} p-[26px]`}><div className={cardTitleClass}><DatabaseZap size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Control 03</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">Dead-letter & replay</h3></div></div><p className="text-[13px] text-[var(--muted)]">{report.deadLetterPlan.trigger}</p><h4 className="my-2.5 text-xs font-bold uppercase tracking-[0.06em] text-[#d7ebe2]">Replay gate</h4><ol className={listClass}>{report.deadLetterPlan.replayChecklist.map((item) => <li key={item}>{item}</li>)}</ol></article>
            <article className={`${panelClass} p-[26px]`}><div className={cardTitleClass}><Activity size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Control 04</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">Observability</h3></div></div><div className="my-4 border-l-[3px] border-[var(--green)] bg-[rgba(125,240,183,0.05)] p-[13px]"><span className="text-[10px] font-black tracking-[0.12em] text-[var(--green)]">SLO</span><p className="mt-[3px] mb-0 text-[13px]">{report.observability.slo}</p></div><h4 className="my-2.5 text-xs font-bold uppercase tracking-[0.06em] text-[#d7ebe2]">Page when</h4><ul className={listClass}>{report.observability.alerts.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>

          <article className={`${panelClass} overflow-hidden p-[26px]`}><div className={cardTitleClass}><AlertTriangle size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Failure analysis</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">What breaks, how you know, what contains it</h3></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-xs"><thead><tr>{['Failure mode', 'Impact', 'Signal', 'Mitigation'].map((heading) => <th className="border-b border-[var(--line)] px-3 py-[13px] text-left text-[10px] uppercase tracking-[0.1em] text-[var(--green)]" key={heading}>{heading}</th>)}</tr></thead><tbody>{report.failureModes.map((item) => <tr key={item.scenario}><td className="border-b border-[var(--line)] px-3 py-[13px] align-top font-bold text-[var(--text)]">{item.scenario}</td><td className="border-b border-[var(--line)] px-3 py-[13px] align-top text-[#bed2ca]">{item.impact}</td><td className="border-b border-[var(--line)] px-3 py-[13px] align-top text-[#bed2ca]">{item.signal}</td><td className="border-b border-[var(--line)] px-3 py-[13px] align-top text-[#bed2ca]">{item.mitigation}</td></tr>)}</tbody></table></div></article>

          <article className={`${panelClass} overflow-hidden p-[26px]`}><div className={cardTitleClass}><FlaskConical size={20} /><div><p className={`${eyebrowClass} mb-0.5`}>Evidence plan</p><h3 className="m-0 text-[21px] font-bold text-[var(--text)]">Failure-injection matrix</h3></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-xs"><thead><tr>{['Test', 'Setup', 'Expected evidence'].map((heading) => <th className="border-b border-[var(--line)] px-3 py-[13px] text-left text-[10px] uppercase tracking-[0.1em] text-[var(--green)]" key={heading}>{heading}</th>)}</tr></thead><tbody>{report.testMatrix.map((item) => <tr key={item.name}><td className="border-b border-[var(--line)] px-3 py-[13px] align-top font-bold text-[var(--text)]">{item.name}</td><td className="border-b border-[var(--line)] px-3 py-[13px] align-top text-[#bed2ca]">{item.setup}</td><td className="border-b border-[var(--line)] px-3 py-[13px] align-top text-[#bed2ca]">{item.expected}</td></tr>)}</tbody></table></div></article>

          <article className={`${panelClass} grid items-start gap-10 p-[26px] md:grid-cols-[0.8fr_1.2fr]`}><div><p className={eyebrowClass}>Safe rollout</p><h3 className="m-0 text-[21px] font-bold">Move from advice to production evidence</h3></div><ol className="m-0 list-none p-0">{report.rolloutSteps.map((item, index) => <li className="grid grid-cols-[34px_1fr] items-start gap-3.5 border-t border-[var(--line)] py-[13px]" key={item}><span className="text-[11px] font-black text-[var(--green)]">{String(index + 1).padStart(2, "0")}</span><p className="m-0 text-[13px] text-[#c6d9d1]">{item}</p></li>)}</ol></article>
        </section>
      ) : null}

      <footer className="mx-[clamp(20px,5vw,72px)] flex flex-col justify-between gap-5 border-t border-[var(--line)] py-6 pb-9 text-[11px] text-[var(--muted)] sm:flex-row"><span className="font-bold text-[var(--text)]">Webhook Reliability Architect</span><p className="m-0">Architecture guidance, not an automatic production change. Validate every recommendation in your environment.</p></footer>
    </main>
  );
}
