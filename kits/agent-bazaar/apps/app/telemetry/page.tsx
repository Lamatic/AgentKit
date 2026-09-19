import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function TelemetryPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6">
      <h1 className="mb-6 text-xl font-semibold text-[var(--text-primary)]">Telemetry & Node State</h1>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Protocol Version</p>
          <p className="font-mono text-lg font-medium text-[var(--primary)]">v1.0.0</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Network</p>
          <p className="font-mono text-lg font-medium text-[var(--secondary)]">Base Sepolia</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Consensus Nodes</p>
          <p className="font-mono text-lg font-medium text-[var(--text-primary)]">42</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Gossip Latency</p>
          <p className="font-mono text-lg font-medium text-[var(--secondary)]">12ms</p>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Node Cluster Topology</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-3 w-3 rounded-sm bg-[var(--secondary)] opacity-80" title={`Node ${i + 1}`} />
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">42 active nodes · 0 offline · 100% uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>QA Verifier Oracle</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-[var(--text-primary)]">Oracle-Alpha</span><Badge variant="success">active</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[var(--text-primary)]">Oracle-Bravo</span><Badge variant="success">active</Badge></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[var(--text-primary)]">Oracle-Charlie</span><Badge variant="success">active</Badge></div>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">Consensus: 3/3 oracles online</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
