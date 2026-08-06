"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Receipt, Sparkles, ChevronDown } from "lucide-react";
import { analyzeExpenses, type ExpenseAnalysis } from "@/actions/orchestrate";

const schema = z.object({
  transactionText: z
    .string()
    .min(5, "Please enter at least one transaction."),
  currency: z.enum(["USD", "INR", "EUR", "GBP"]),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_COLOR: Record<string, string> = {
  Food: "border-stamp text-stamp",
  Transport: "border-ledger text-ledger",
  Rent: "border-flag text-flag",
  Shopping: "border-stamp text-stamp",
  Utilities: "border-ledger text-ledger",
  Entertainment: "border-stamp text-stamp",
  Healthcare: "border-flag text-flag",
  Other: "border-ink/40 text-ink/60",
};

const SAMPLE_INPUT = `Jan 5 - Starbucks - $6.50
Jan 6 - Uber - $18.20
Jan 7 - Amazon - $45.00
Jan 8 - Rent Payment - $1200.00
Jan 9 - Electricity Bill - $85.30`;

export default function Home() {
  const [result, setResult] = useState<ExpenseAnalysis | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { transactionText: "", currency: "USD" },
  });

  function onSubmit(values: FormValues) {
    clearErrors();
    startTransition(async () => {
      const response = await analyzeExpenses(
        values.transactionText,
        values.currency
      );
      if (response.success) {
        setResult(response.data);
      } else {
        setResult(null);
        setError("transactionText", { message: response.error });
      }
    });
  }

  return (
    <main className="min-h-screen px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ledger/70">
            Ledger No. 001
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
            Expense &amp; Budget Copilot
          </h1>
          <p className="mt-3 max-w-xl text-ink/70">
            Paste in a receipt, a few bank-statement lines, or any list of
            transactions. Get them categorized instantly, plus one honest note
            about where your money went.
          </p>
        </header>

        <div className="grid gap-8 sm:grid-cols-5">
          {/* ── Input column ── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="sm:col-span-2 flex flex-col gap-4"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="transactionText"
                  className="font-mono text-xs uppercase tracking-wide text-ink/60"
                >
                  Transactions
                </label>
                <button
                  type="button"
                  onClick={() => setValue("transactionText", SAMPLE_INPUT)}
                  className="font-mono text-xs text-ledger underline underline-offset-2 hover:text-ink"
                >
                  Use sample
                </button>
              </div>
              <textarea
                id="transactionText"
                rows={10}
                placeholder={"Jan 5 - Starbucks - $6.50\nJan 6 - Uber - $18.20\n..."}
                {...register("transactionText")}
                className="w-full resize-none rounded-md border border-ink/20 bg-white/60 p-3 font-mono text-sm text-ink placeholder:text-ink/30 focus:border-ledger focus:outline-none focus:ring-2 focus:ring-ledger/30"
              />
              {errors.transactionText && (
                <p className="mt-1 text-sm text-flag">
                  {errors.transactionText.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="currency"
                className="mb-1 block font-mono text-xs uppercase tracking-wide text-ink/60"
              >
                Currency
              </label>
              <div className="relative">
                <select
                  id="currency"
                  {...register("currency")}
                  className="w-full appearance-none rounded-md border border-ink/20 bg-white/60 p-2 pr-8 text-sm text-ink focus:border-ledger focus:outline-none focus:ring-2 focus:ring-ledger/30"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-md bg-ledger px-4 py-2.5 font-medium text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Tallying up…
                </>
              ) : (
                <>
                  <Receipt size={16} />
                  Tally it up
                </>
              )}
            </button>
          </form>

          {/* ── Output column ── */}
          <div className="sm:col-span-3">
            {!result && !isPending && (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border border-dashed border-ink/20 p-8 text-center">
                <p className="max-w-xs text-sm text-ink/50">
                  Your categorized breakdown and a short spending note will
                  print here once you tally up.
                </p>
              </div>
            )}

            {isPending && (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border border-ink/10 p-8 text-center">
                <p className="font-mono text-sm text-ink/50">
                  Reading the receipts…
                </p>
              </div>
            )}

            {result && !isPending && (
              <div>
                <div className="receipt-edge-top" aria-hidden="true" />
                <div className="border-x border-ink/10 bg-white/70 px-6 py-6 shadow-sm">
                  <p className="text-center font-display text-lg font-semibold text-ink">
                    Spending Summary
                  </p>
                  <p className="mb-4 text-center font-mono text-xs text-ink/40">
                    {result.transactions.length} transaction
                    {result.transactions.length !== 1 ? "s" : ""}
                  </p>

                  <div className="mb-4 border-t border-dashed border-ink/20" />

                  <ul className="flex flex-col gap-3">
                    {result.transactions.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 font-mono text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-ink">{t.merchant}</p>
                          <p className="text-xs text-ink/40">{t.date}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                            CATEGORY_COLOR[t.category] ?? CATEGORY_COLOR.Other
                          }`}
                        >
                          {t.category}
                        </span>
                        <span className="shrink-0 tabular-nums text-ink">
                          {t.amount.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="my-4 border-t border-dashed border-ink/20" />

                  <div className="flex items-center justify-between font-mono text-base font-semibold text-ink">
                    <span>Total spent</span>
                    <span>
                      {result.totalSpent.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="receipt-edge-bottom" aria-hidden="true" />

                <div className="mt-6 rounded-md border border-stamp/30 bg-stamp/5 p-4">
                  <p className="mb-1 flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-stamp">
                    <Sparkles size={12} />
                    A note from your copilot
                  </p>
                  <p className="text-sm leading-relaxed text-ink/80">
                    {result.insight}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
