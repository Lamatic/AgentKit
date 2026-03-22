"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import Header from "@/components/Header";
import IssueForm from "@/components/IssueForm";
import SuccessResult from "@/components/SuccessResult";
import ErrorResult from "@/components/ErrorResult";
import Footer from "@/components/Footer";

export default function Home() {
  const [issueUrl, setIssueUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl) return alert("Enter issue URL");

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issue_url: issueUrl,
          file_path: filePath,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        throw new Error("API failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        error: "An unexpected error occurred while processing the request.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundDecoration />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Header />

        <IssueForm
          issueUrl={issueUrl}
          setIssueUrl={setIssueUrl}
          filePath={filePath}
          setFilePath={setFilePath}
          loading={loading}
          onSubmit={handleSubmit}
        />

        <AnimatePresence mode="wait">
          {result &&
            (result.success ? (
              <SuccessResult result={result} />
            ) : (
              <ErrorResult error={result.error} />
            ))}
        </AnimatePresence>

        <Footer />
      </main>
    </div>
  );
}
