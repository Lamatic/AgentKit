"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateReport } from "@/actions/orchestrate";

const formSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  buyingClub: z.string().min(1, "Buying club is required"),
  budget: z.string().min(1, "Budget is required"),
  needs: z.string().min(1, "Club needs is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await generateReport(
        values.playerName,
        values.buyingClub,
        values.budget,
        values.needs
      );

      if (!result.success) {
        setError(result.error);
      } else {
        setReport(result.data.report);
      }
    } catch {
      setError("Could not generate the report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70 backdrop-blur-[2px]" />

      <div className="relative max-w-2xl mx-auto px-4 py-24">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white/80">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-medium text-white">Agent Hunt</h1>
            <p className="text-xs text-white/60">Sporting Director</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 mb-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl"
        >
          <div>
            <label htmlFor="playerName" className="block text-xs text-white/60 mb-1">Player Name</label>
            <input
              id="playerName"
              {...register("playerName")}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. Sunil Chetri"
            />
            {errors.playerName && (
              <p className="text-xs text-red-300 mt-1">{errors.playerName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="buyingClub" className="block text-xs text-white/60 mb-1">Buying Club</label>
            <input
              id="buyingClub"
              {...register("buyingClub")}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. Chennayin FC"
            />
            {errors.buyingClub && (
              <p className="text-xs text-red-300 mt-1">{errors.buyingClub.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="budget" className="block text-xs text-white/60 mb-1">Budget</label>
            <input
              id="budget"
              {...register("budget")}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="e.g. £80 million"
            />
            {errors.budget && (
              <p className="text-xs text-red-300 mt-1">{errors.budget.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="needs" className="block text-xs text-white/60 mb-1">Club Needs</label>
            <textarea
              id="needs"
              {...register("needs")}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-colors resize-none"
              placeholder="e.g. India's finest talent"
              rows={2}
            />
            {errors.needs && (
              <p className="text-xs text-red-300 mt-1">{errors.needs.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-gray-900 hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? "Analyzing..." : "Generate Report"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-950/40 backdrop-blur-md text-red-200 px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {report && (
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-5 py-4 whitespace-pre-wrap text-sm leading-relaxed text-white/90 shadow-2xl">
            {report}
          </div>
        )}
      </div>
    </main>
  );
}