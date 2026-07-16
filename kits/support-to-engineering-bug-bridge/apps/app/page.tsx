import type { Metadata } from "next";
import type { ClusterSummary } from "@/lib/types";
import { DashboardClient } from "@/components/DashboardClient";


export const metadata: Metadata = {
  title: "Bug Bridge — Cluster Dashboard",
  description:
    "Real-time view of support ticket clusters, severity tiers, and linked GitHub issues for the Support-to-Engineering Bug Bridge.",
};

// Server component: fetches data at request time (no client-side fetch)
async function getClusters(): Promise<{
  clusters: ClusterSummary[];
  error?: string;
}> {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const base = process.env.NEXT_PUBLIC_BASE_URL || (isDev ? `http://localhost:${process.env.PORT ?? 3000}` : "");
    if (!base) {
      throw new Error("NEXT_PUBLIC_BASE_URL is required in production.");
    }
    const res = await fetch(`${base}/api/clusters`, {
      // Do not cache: data should reflect state as of page load
      cache: "no-store",
    });
    return res.json();
  } catch {
    return {
      clusters: [],
      error: "Could not reach /api/clusters. Check that the server is running.",
    };
  }
}

export default async function Page() {
  const { clusters, error } = await getClusters();
  return <DashboardClient clusters={clusters} error={error} />;
}
