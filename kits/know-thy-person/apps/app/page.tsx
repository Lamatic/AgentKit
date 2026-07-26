"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { researchPerson } from "@/actions/orchestrate";
import type { Dossier } from "@/lib/dossier";
import { DossierCard } from "@/components/dossier-card";
import { Header } from "@/components/header";

export default function KnowThyPersonPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [personContext, setPersonContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Dossier | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Email and name are both required.");
      return;
    }
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await researchPerson({
        email: email.trim(),
        name: name.trim(),
        personContext: personContext.trim() || undefined,
      });
      if (res.success && res.data) setResult(res.data);
      else setError(res.error || "Research failed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Know Thy Person</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sourced meeting prep — who they are, what they&apos;re into outside
          work, and warm talking points. Every claim links to a real source;
          anything it can&apos;t verify is shown as &quot;couldn&apos;t
          confirm&quot; instead of invented.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">
              Email <span className="text-zinc-400">(required)</span>
            </label>
            <Input
              type="email"
              placeholder="jane@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">
              Name <span className="text-zinc-400">(required)</span>
            </label>
            <Input
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800">
              Their LinkedIn / X / company or personal site{" "}
              <span className="text-zinc-400">(optional)</span>
            </label>
            <Input
              placeholder="https://…"
              value={personContext}
              onChange={(e) => setPersonContext(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Researching…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" /> Research
              </>
            )}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {result && (
          <div className="mt-6">
            <DossierCard d={result} />
          </div>
        )}
      </main>
    </div>
  );
}
