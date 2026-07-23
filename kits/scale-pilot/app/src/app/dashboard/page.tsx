import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const fullName = user.user_metadata?.full_name || "System Architect";

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0D0D0B] flex flex-col font-sans selection:bg-[#FCDD2D] selection:text-[#0D0D0B] p-6 sm:p-12 relative">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#E2E2DF] pb-4 w-full shrink-0">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 bg-[#FCDD2D] border border-[#0D0D0B] flex items-center justify-center font-mono font-bold text-xs text-[#0D0D0B] transition-transform group-hover:scale-[1.05]">
            SP
          </div>
          <span className="font-display font-bold text-lg text-[#0D0D0B] tracking-tight group-hover:text-[#555550] transition-colors">
            ScalePilot
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#555550] border border-[#E2E2DF] px-2.5 py-1 bg-[#F8F8F6] font-bold">
            PRO PROFILE ACTIVE
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12 gap-8">
        <div className="space-y-2">
          <span className="font-mono text-xs text-[#555550] uppercase tracking-[0.2em] font-bold block">
            Control Dashboard
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0D0D0B]">
            Welcome, {fullName}
          </h1>
          <p className="font-mono text-xs text-[#555550] uppercase">
            Ingestion active · Security token authenticated
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: User Session Telemetry */}
          <div className="border border-[#E2E2DF] p-6 space-y-4 bg-[#F8F8F6]">
            <div className="border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-[10px] text-[#555550] uppercase font-bold block">
                Session Telemetry
              </span>
            </div>
            <div className="font-mono text-xs space-y-2 text-[#555550]">
              <div>
                <span className="text-[#888880] block text-[9px] uppercase">User Email</span>
                <span className="font-bold text-[#0D0D0B] break-all">{user.email}</span>
              </div>
              <div>
                <span className="text-[#888880] block text-[9px] uppercase">User ID</span>
                <span className="font-bold text-[#0D0D0B] text-[10px] break-all">{user.id}</span>
              </div>
              <div>
                <span className="text-[#888880] block text-[9px] uppercase">Auth Provider</span>
                <span className="font-bold text-[#0D0D0B] uppercase">{user.app_metadata?.provider || "email"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ingested Audits */}
          <div className="border border-[#E2E2DF] p-6 space-y-4 bg-[#F8F8F6]">
            <div className="border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-[10px] text-[#555550] uppercase font-bold block">
                Analysis Audits
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] text-[#555550] uppercase font-bold">Total Scans</span>
                <span className="font-display text-2xl font-bold text-[#0D0D0B]">12</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] text-[#555550] uppercase font-bold">Peak Ingress Audit</span>
                <span className="font-display text-lg font-bold text-[#FCDD2D] bg-[#0D0D0B] px-1.5 py-0.5 border border-[#0D0D0B]">
                  P99 latency
                </span>
              </div>
              <div className="pt-2 text-[11px] text-[#555550] font-mono leading-relaxed">
                Primary system metrics are stable. No deadlock risk identified in database cluster.
              </div>
            </div>
          </div>

          {/* Card 3: System Performance */}
          <div className="border border-[#E2E2DF] p-6 space-y-4 bg-[#F8F8F6]">
            <div className="border-b border-[#E2E2DF] pb-3">
              <span className="font-mono text-[10px] text-[#555550] uppercase font-bold block">
                Telemetry Insights
              </span>
            </div>
            <div className="space-y-3 font-mono text-[11px] text-[#555550] leading-relaxed">
              <p>
                ⚡ <strong className="text-[#0D0D0B]">Concurrency Target:</strong> 1,000,000 MAU
              </p>
              <p>
                🛡️ <strong className="text-[#0D0D0B]">Failover Security:</strong> Multi-region active-active replica enabled
              </p>
              <p>
                💵 <strong className="text-[#0D0D0B]">Est. Cloud Savings:</strong> 28.5% optimizer headroom
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border border-[#0D0D0B] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display font-bold text-lg text-[#0D0D0B]">
              Ready to execute custom analyzer?
            </h4>
            <p className="font-mono text-xs text-[#555550]">
              Create blueprints and view performance optimization logs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] font-mono text-xs uppercase tracking-widest font-bold transition-all text-center"
            >
              Run Analyzer
            </Link>
            <SignOutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";
