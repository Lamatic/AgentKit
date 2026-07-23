"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProblemStatement } from "@/components/ProblemStatement";
import { HowItWorks } from "@/components/HowItWorks";
import { BentoGrid } from "@/components/BentoGrid";
import { SocialProof } from "@/components/SocialProof";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { StackConfig } from "@/components/AnalyzerModal";
import { ReportPreview } from "@/components/ReportPreview";

function SearchParamsHandler({
  setActiveConfig,
  setIsReportOpen,
}: {
  setActiveConfig: (config: StackConfig) => void;
  setIsReportOpen: (open: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const showReport = searchParams.get("report");
    if (showReport === "true") {
      const configData: StackConfig = {
        backend: searchParams.get("backend") || "Node.js",
        database: searchParams.get("database") || "PostgreSQL",
        cloud: searchParams.get("cloud") || "AWS",
        users: searchParams.get("users") || "100k MAU",
        challenge: searchParams.get("challenge") || "High latency during peak traffic",
      };
      setActiveConfig(configData);
      setIsReportOpen(true);
      router.replace("/");
    }
  }, [searchParams, router, setActiveConfig, setIsReportOpen]);

  return null;
}

export default function Home() {
  const router = useRouter();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState<StackConfig | null>(null);

  // Setup scroll reveals using standard browser IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.08 }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleOpenAnalyzer = () => {
    router.push("/sign-up");
  };

  const handleOpenSampleReport = () => {
    setActiveConfig({
      backend: "Node.js (Express)",
      database: "PostgreSQL Primary",
      cloud: "AWS ECS Fargate",
      users: "120,000 Active Users",
      challenge: "High latency during peak traffic",
    });
    setIsReportOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0D0D0B] flex flex-col font-sans selection:bg-[#FCDD2D] selection:text-[#0D0D0B]">
      {/* Top Navbar */}
      <Navbar
        onOpenModal={handleOpenAnalyzer}
        onSelectSampleReport={handleOpenSampleReport}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onOpenModal={handleOpenAnalyzer}
          onSelectSampleReport={handleOpenSampleReport}
        />

        {/* Social Proof / Tech Stack Bar */}
        <SocialProof />

        {/* Problem Statement Section */}
        <ProblemStatement />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Bento Grid Features / Matrix Section */}
        <BentoGrid />

        {/* CTA Section */}
        <CTA onOpenModal={handleOpenAnalyzer} />
      </main>

      {/* Footer */}
      <Footer />

      <Suspense fallback={null}>
        <SearchParamsHandler setActiveConfig={setActiveConfig} setIsReportOpen={setIsReportOpen} />
      </Suspense>

      {/* Full Generated Architecture Report Preview Modal */}
      <ReportPreview
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        config={activeConfig}
      />
    </div>
  );
}
