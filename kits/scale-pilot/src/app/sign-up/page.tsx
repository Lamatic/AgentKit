"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnalyzerModal } from "@/components/AnalyzerModal";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <AnalyzerModal
      isOpen={true}
      initialStep="preloader"
      onClose={() => router.push("/")}
      onGenerateReport={(config) => {
        const params = new URLSearchParams({
          report: "true",
          backend: config.backend,
          database: config.database,
          cloud: config.cloud,
          users: config.users,
          challenge: config.challenge,
        });
        router.push(`/?${params.toString()}`);
      }}
    />
  );
}
export const dynamic = "force-dynamic";
