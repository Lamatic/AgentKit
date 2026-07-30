"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck
} from "lucide-react";
import {
  analyzePurchase,
  type TrackerResult,
  type TrackedItem
} from "@/actions/orchestrate";

const SAMPLE_RECEIPT = `Reliance Digital
Invoice: RD55192
Purchase Date: 20/07/2026
Samsung Galaxy S26
INR 74999
Return policy: Returns accepted within 14 days of purchase.
Warranty: 12 months manufacturer warranty.`;

function statusClass(status: string) {
  switch (status) {
    case "expired":
      return "status expired";
    case "urgent":
      return "status urgent";
    case "upcoming":
      return "status upcoming";
    case "safe":
      return "status safe";
    default:
      return "status unknown";
  }
}

function prettyAction(value: string) {
  return value
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Coverage({
  title,
  status,
  deadline,
  days,
  source
}: {
  title: string;
  status: string;
  deadline: string | null;
  days: number | null;
  source: string | null;
}) {
  return (
    <section className="coverage">
      <div className="coverage-heading">
        <strong>{title}</strong>
        <span className={statusClass(status)}>{status}</span>
      </div>

      {deadline ? (
        <div className="coverage-details">
          <span>
            <CalendarDays size={15} />
            {deadline}
          </span>
          <span>
            <Clock3 size={15} />
            {days === null
              ? "Unknown"
              : days < 0
                ? `${Math.abs(days)} days expired`
                : `${days} days remaining`}
          </span>
        </div>
      ) : (
        <p className="muted">Deadline unavailable</p>
      )}

      {source && (
        <div className="evidence">
          <span>Source evidence</span>
          <p>{source}</p>
        </div>
      )}
    </section>
  );
}

function ItemCard({ item }: { item: TrackedItem }) {
  return (
    <article className="item-card">
      <div className="item-title">
        <div>
          <p className="eyebrow">Tracked item</p>
          <h3>{item.name}</h3>
        </div>

        {item.price !== null && (
          <span className="price">{item.price.toLocaleString()}</span>
        )}
      </div>

      <div className="coverage-grid">
        <Coverage
          title="Return window"
          status={item.return_status}
          deadline={item.return_deadline}
          days={item.return_days_remaining}
          source={item.return_source_text}
        />

        <Coverage
          title="Warranty"
          status={item.warranty_status}
          deadline={item.warranty_deadline}
          days={item.warranty_days_remaining}
          source={item.warranty_source_text}
        />
      </div>

      <div className="recommendation">
        <ShieldCheck size={20} />
        <div>
          <span>Recommended action</span>
          <strong>{prettyAction(item.recommended_action)}</strong>
          <p>{item.recommendation_reason}</p>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [receiptText, setReceiptText] = useState("");
  const [todayDate, setTodayDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [result, setResult] = useState<TrackerResult | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await analyzePurchase(receiptText, todayDate);

      if (response.success) {
        setResult(response.data);
      } else {
        setResult(null);
        setError(response.error);
      }
    });
  }

  return (
    <main>
      <div className="shell">
        <header className="hero">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>

          <div>
            <p className="eyebrow">Lamatic AgentKit</p>
            <h1>Warranty &amp; Return Tracker</h1>
            <p className="subtitle">
              Turn purchase text into clear return deadlines, warranty coverage,
              and next actions — without guessing missing policy information.
            </p>
          </div>
        </header>

        <div className="workspace">
          <form className="input-panel" onSubmit={submit}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Purchase input</p>
                <h2>Receipt or order confirmation</h2>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() => setReceiptText(SAMPLE_RECEIPT)}
              >
                Use sample
              </button>
            </div>

            <label htmlFor="receipt">Purchase text</label>

            <textarea
              id="receipt"
              rows={15}
              value={receiptText}
              onChange={event => setReceiptText(event.target.value)}
              placeholder="Paste a receipt, invoice, or order confirmation here..."
            />

            <label htmlFor="today">Today's date</label>

            <input
              id="today"
              type="date"
              value={todayDate}
              onChange={event => setTodayDate(event.target.value)}
            />

            {error && (
              <div className="error-box">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Clock3 size={18} />
                  Analysing purchase...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Analyse purchase
                </>
              )}
            </button>

            <p className="privacy-note">
              Policy terms are extracted by the model. Deadline calculations
              and recommendations are handled deterministically.
            </p>
          </form>

          <section className="results-panel">
            {!result && !isPending && (
              <div className="empty-state">
                <ShieldCheck size={42} />
                <h2>Your coverage summary will appear here</h2>
                <p>
                  Paste purchase information to see return deadlines, warranty
                  status, supporting evidence and the recommended next step.
                </p>
              </div>
            )}

            {isPending && (
              <div className="empty-state">
                <Clock3 size={42} className="spin" />
                <h2>Reading purchase information</h2>
                <p>Extracting policy terms and calculating deadlines...</p>
              </div>
            )}

            {result && !isPending && (
              <div className="results">
                <div className="result-heading">
                  <div>
                    <p className="eyebrow">Analysis complete</p>
                    <h2>
                      {result.purchase?.retailer || "Purchase summary"}
                    </h2>
                  </div>

                  <CheckCircle2 size={28} />
                </div>

                {result.purchase && (
                  <div className="purchase-meta">
                    {result.purchase.purchase_date && (
                      <span>
                        Purchased <strong>{result.purchase.purchase_date}</strong>
                      </span>
                    )}

                    {result.purchase.invoice_number && (
                      <span>
                        Invoice <strong>{result.purchase.invoice_number}</strong>
                      </span>
                    )}

                    {result.purchase.currency && (
                      <span>
                        Currency <strong>{result.purchase.currency}</strong>
                      </span>
                    )}
                  </div>
                )}

                {result.needs_confirmation && (
                  <div className="warning-box">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>More information required</strong>
                      <p>
                        Missing: {result.missing_required_fields.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="items">
                  {result.items.map((item, index) => (
                    <ItemCard key={`${item.name}-${index}`} item={item} />
                  ))}
                </div>

                {result.items.length === 0 && (
                  <div className="warning-box">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>No products extracted</strong>
                      <p>Check the purchase text and try again.</p>
                    </div>
                  </div>
                )}

                {result.digest && (
                  <div className="digest">
                    <p className="eyebrow">Quick digest</p>
                    <pre>{result.digest}</pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
