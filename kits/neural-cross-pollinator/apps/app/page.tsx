"use client";

import { useState } from "react";
import { orchestrate, type OrchestrateResponse } from "@/actions/orchestrate";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [domainA, setDomainA] = useState("");
  const [domainB, setDomainB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrateResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const response = await orchestrate(domainA, domainB);
    setResult(response);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Neural Cross-Pollinator</h1>
        <p className="mt-2 text-muted-foreground">
          Give it two unrelated domains. It finds structural parallels between
          them, proposes a mechanism transfer, and critiques whether the idea
          is genuinely novel — honestly, not just enthusiastically.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="domainA" className="block text-sm font-medium text-foreground">Domain A</label>
            <input
              id="domainA"
              value={domainA}
              onChange={(e) => setDomainA(e.target.value)}
              placeholder="e.g. bee colony behavior"
              className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="domainB" className="block text-sm font-medium text-foreground">Domain B</label>
            <input
              id="domainB"
              value={domainB}
              onChange={(e) => setDomainB(e.target.value)}
              placeholder="e.g. stock market crashes"
              className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {loading ? "Cross-pollinating..." : "Find the parallel"}
          </button>
        </form>

        {result && !result.success && (
          <div className="mt-8 rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {result.error}
          </div>
        )}

        {result?.success && result.data && (
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-lg font-semibold">Structural Parallels</h2>
              <div className="mt-3 space-y-3">
                {result.data.parallels.map((p, i) => (
                  <div key={i} className="rounded-md border border-card-border bg-card p-4 text-sm">
                    <p><span className="text-muted-foreground">Domain A: </span>{p.domainA_element}</p>
                    <p className="mt-1"><span className="text-muted-foreground">Domain B: </span>{p.domainB_element}</p>
                    <p className="mt-2 text-foreground">{p.shared_structure}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Proposed Innovation</h2>
              <div className="mt-2 text-sm text-foreground [&_strong]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-card-border [&_td]:p-2 [&_th]:border [&_th]:border-card-border [&_th]:p-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data.proposed_innovation}</ReactMarkdown>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Summary</h2>
              <div className="mt-2 text-sm text-foreground [&_strong]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-card-border [&_td]:p-2 [&_th]:border [&_th]:border-card-border [&_th]:p-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data.final_summary}</ReactMarkdown>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}