"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, CheckCircle2, AlertCircle, Loader2, Zap, FileText, Upload, X } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";
type Tab = "preset" | "custom";

interface InitializationPanelProps {
  onComplete: () => void;
  onClose?: () => void;
}

const PRESET_RUNBOOK = {
  source: "master-remediation-runbook",
  tags: ["database", "postgresql", "mysql", "redis", "container", "restart", "storage", "disk", "network", "timeout"],
  content: `# Master Infrastructure & Services Remediation Runbook

## Remediation Guidelines for System Incidents:

### 1. DB Crash (PostgreSQL/MySQL Database Unreachable)
- Symptoms: "connection refused" or "database is unreachable"
- Diagnostics: pg_isready -h $DB_HOST -p 5432 or service mysql status
- Remediation: sudo service postgresql restart or sudo service mysql restart

### 2. API Timeout (Downstream Delays / Connection Backlog)
- Symptoms: API calls timing out with 30-second delays, 504 Gateway Timeout
- Diagnostics: curl -o /dev/null -w "Connect: %{time_connect} Total: %{time_total}\n" $API_ENDPOINT
- Remediation: kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx

### 3. Pod OOM Kill (Out Of Memory Exit Code 137)
- Symptoms: Pod state "OOMKilled" (Exit Code 137), memory resource pressure
- Diagnostics: kubectl top pod or kubectl get pod $POD_NAME -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'
- Remediation: kubectl set resources deployment/$DEPLOYMENT_NAME --limits=memory=1Gi --requests=memory=512Mi

### 4. Pod CrashLoopBackOff (Exit Code 1 / Startup Failures)
- Symptoms: Pod stuck in "CrashLoopBackOff" state, process crashes immediately
- Diagnostics: kubectl logs $POD_NAME --previous --tail=100
- Remediation: kubectl rollout restart deployment/$DEPLOYMENT_NAME

### 5. Auth Failure (Redis Session Store Down / Connection Refused)
- Symptoms: Auth API 500 errors, ECONNREFUSED redis:6379 in application logs
- Diagnostics: redis-cli -h $REDIS_HOST -p 6379 ping
- Remediation: sudo service redis-server restart or redis-cli -h $REDIS_HOST FLUSHALL

### 6. Network Partition (AZ / Region Latency & Packet Loss)
- Symptoms: Cross-region calls timing out, packet loss between microservices
- Diagnostics: traceroute $DESTINATION_HOST or mtr -rw $DESTINATION_HOST
- Remediation: Failover service traffic to healthy secondary availability zone using DNS weight changes

### 7. Disk Space & Storage Full (Increase Volume)
- Symptoms: "No space left on device" errors, file system mount 100% full
- Diagnostics: df -h or du -sh /* 2>/dev/null | sort -hr | head -n 10
- Remediation: pvresize /dev/xvda && lvextend -l +100%FREE /dev/mapper/vg-root && resize2fs /dev/mapper/vg-root`,
};

const DEFAULT_CUSTOM_RUNBOOK = `# Redis Server OOM & Memory Exhaustion Runbook
## Symptoms
- Error: "OOM command not allowed when used memory > 'maxmemory'" in application logs
- High CPU usage on Redis instance
- Session validation and caching requests failing with 500

## Immediate Actions
1. Check Redis memory usage: redis-cli info memory | grep used_memory
2. Clear cache: redis-cli FLUSHALL
3. Increase maxmemory limit temporarily: redis-cli config set maxmemory 2gb

## Root Cause Analysis
- Cache keys not having TTL set (Time to Live)
- Sudden traffic spike creating too many sessions

## Prevention
- Set default TTL for all cached keys
- Configure volatile-lru eviction policy in redis.conf`;

/**
 * Renders the vector database ingestion modal enabling SREs to upload preset or custom runbooks.
 * @param props Props containing completion callback and modal close trigger.
 * @returns React JSX modal component for runbook embedding.
 */
export default function InitializationPanel({ onComplete, onClose }: InitializationPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preset");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  // Custom runbook form state
  const [customSource, setCustomSource] = useState("redis-oom-runbook");
  const [customTags, setCustomTags] = useState("redis, auth, cache");
  const [customContent, setCustomContent] = useState(DEFAULT_CUSTOM_RUNBOOK);

  const handleIngest = async (runbookData: { source: string; content: string }) => {
    setStatus("loading");
    setProgress(15);

    try {
      setProgress(45);
      const res = await fetch("/api/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runbookData),
      });

      if (!res.ok) throw new Error("Ingestion failed");
      const data = await res.json();
      
      setProgress(85);
      setTotalChunks(data.chunks_indexed || 3);
      
      await new Promise((r) => setTimeout(r, 600));
      setProgress(100);
      setStatus("success");
      setTimeout(onComplete, 1600);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="glass rounded-2xl p-6 w-full max-w-xl mx-4 my-auto relative"
        style={{ 
          border: "1px solid rgba(99, 102, 241, 0.25)", 
          boxShadow: "0 0 60px rgba(99, 102, 241, 0.15), 0 25px 50px rgba(0,0,0,0.6)",
          background: "rgba(10, 10, 15, 0.85)"
        }}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors duration-200"
            style={{ background: "transparent", border: "none" }}
          >
            <X size={16} />
          </button>
        )}
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
            <Database size={20} color="#6366f1" />
          </div>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "#f9fafb" }}>System Initialization</h2>
            <p className="text-xs" style={{ color: "#6b7280" }}>Ingest operations runbooks into your Knowledge Base Vector DB</p>
          </div>
        </div>

        {/* Tab Switcher */}
        {status !== "loading" && status !== "success" && (
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              onClick={() => setActiveTab("preset")}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
              style={{
                background: activeTab === "preset" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "preset" ? "#818cf8" : "#9ca3af",
                border: activeTab === "preset" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent"
              }}
            >
              <FileText size={14} />
              Load Preset Runbook
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
              style={{
                background: activeTab === "custom" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "custom" ? "#818cf8" : "#9ca3af",
                border: activeTab === "custom" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent"
              }}
            >
              <Upload size={14} />
              Upload Custom Runbook
            </button>
          </div>
        )}

        {/* Tab Contents */}
        {status !== "loading" && status !== "success" && (
          <div className="mb-6">
            {activeTab === "preset" ? (
              <div className="space-y-4">
                <div 
                  className="rounded-xl p-5 text-center transition-all duration-300"
                  style={{
                    background: "rgba(99, 102, 241, 0.03)",
                    border: "1px solid rgba(99, 102, 241, 0.1)",
                  }}
                >
                  <h3 className="text-sm font-bold text-indigo-400 mb-1">
                    📖 Unified Master Runbook
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preloaded diagnostic workflows and CLI scripts for database, caching, pod, and storage failures.
                  </p>
                </div>
                <button
                  id="btn-initialize"
                  onClick={() => handleIngest({ source: PRESET_RUNBOOK.source, content: PRESET_RUNBOOK.content })}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                >
                  <Zap size={16} /> Load and Ingest Preset Runbook
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {/* Source Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Runbook ID / Source Name</label>
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    className="rounded-lg text-xs px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Tags Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    className="rounded-lg text-xs px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Content Area */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-slate-400">Remediation Steps (Markdown)</label>
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    rows={8}
                    className="rounded-lg text-xs p-3 font-mono"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      outline: "none",
                      resize: "none"
                    }}
                  />
                </div>

                <button
                  id="btn-initialize-custom"
                  onClick={() => handleIngest({ source: customSource, content: customContent })}
                  disabled={!customSource.trim() || !customContent.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap size={16} /> Load and Ingest Custom Runbook
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Display */}
        <AnimatePresence>
          {status === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="my-6">
              <div className="flex justify-between text-xs mb-2" style={{ color: "#6b7280" }}>
                <span>Indexing runbook to Vector DB...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success state */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-6 rounded-xl p-4 flex items-center gap-3 text-left"
              style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}
            >
              <CheckCircle2 size={20} color="#10b981" />
              <div>
                <p className="text-sm font-semibold text-glow-green" style={{ color: "#10b981" }}>Vector DB Synced Successfully</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>{totalChunks} chunks indexed for "{activeTab === "preset" ? PRESET_RUNBOOK.source : customSource}"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="my-6 rounded-xl p-4 flex items-center gap-3 text-left"
              style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}
            >
              <AlertCircle size={20} color="#ef4444" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>Ingestion Failed</p>
                <p className="text-xs" style={{ color: "#6b7280" }}>Verify your Lamatic API Keys or Flow IDs in .env.local</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back / Reset on Error */}
        {status === "error" && (
          <button
            onClick={() => setStatus("idle")}
            className="btn-ghost w-full flex items-center justify-center gap-2 py-2"
          >
            Go Back
          </button>
        )}
      </motion.div>
    </div>
  );
}
