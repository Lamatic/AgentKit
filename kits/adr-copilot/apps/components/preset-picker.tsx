"use client";

import React from "react";
import { Database, Network, Lock, Server, Zap } from "lucide-react";

export interface Preset {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  instructions: string;
  constraints: string;
}

export const PRESETS: Preset[] = [
  {
    id: "ai-doc-platform",
    title: "AI Document Intelligence Platform",
    category: "Architecture",
    icon: Database,
    instructions: "We need to design a platform processing 500M documents and billions of chunks. Documents enter through APIs, S3, email, and batch imports, then pass through OCR, classification, chunking, PII detection, embeddings, entity extraction, and indexing. Should we build around PostgreSQL, Redis, object storage, and pgvector, or use Kafka, Elasticsearch/Qdrant, workflow orchestration, and isolated processing services?",
    constraints: "A 5-person infrastructure team must maintain 99.99% availability, RPO of 5 minutes, and RTO of 30 minutes. Processing must support retries, checkpoints, backpressure, idempotency, dead-letter queues, versioning, and zero-downtime deployments. The system must survive downstream failures without stopping ingestion and support 5× growth while staying below $25,000/month initially."
  },
  {
    id: "global-payments",
    title: "Global Payment Processing Platform",
    category: "Architecture",
    icon: Network,
    instructions: "We need to process 100,000 payment transactions per second across multiple countries, currencies, and payment providers. Transactions require fraud detection, authorization, ledger updates, notifications, and reconciliation. Should we build around PostgreSQL and Kafka, or use a distributed database with event sourcing and regional processing clusters?",
    constraints: "The system requires 99.999% availability, strict financial consistency, idempotent transactions, automatic provider failover, replayable events, and complete auditability. Regional outages must not cause duplicate charges or lost transactions. RPO must be near-zero and RTO below 15 minutes. The platform must handle 10× traffic spikes during major sales events."
  },
  {
    id: "realtime-logistics",
    title: "Real-Time Logistics Platform",
    category: "Architecture",
    icon: Zap,
    instructions: "We need to track 20 million vehicles and delivery devices sending location and telemetry events every few seconds. The platform must calculate ETAs, detect route deviations, trigger alerts, and provide real-time dashboards. Should we use Kafka, PostgreSQL, Redis, and TimescaleDB, or adopt a fully distributed streaming architecture using Kafka, Flink, and specialized time-series storage?",
    constraints: "The system must process bursts without losing events, tolerate regional failures, support out-of-order events, and maintain accurate vehicle state. Operations are handled by a 4-person team. We require 99.99% availability, replayable event streams, automated scaling, disaster recovery, and less than 60 seconds of telemetry lag."
  },
  {
    id: "ai-chat-platform",
    title: "Global AI Chat Platform",
    category: "Architecture",
    icon: Server,
    instructions: "We need to support 50 million AI conversations and 100,000 concurrent users across multiple regions. Requests require authentication, conversation history, retrieval, model routing, tool execution, streaming responses, moderation, and usage accounting. Should we use a centralized architecture with PostgreSQL and Redis, or deploy regional inference gateways with distributed databases and event streaming?",
    constraints: "The system must survive model-provider outages, regional failures, traffic spikes, and slow downstream tools. Streaming responses cannot block other requests. Usage accounting must remain accurate despite retries. We require 99.99% availability, multi-region failover, rate limiting, token budgets, observability, and the ability to deploy new models without downtime."
  },
  {
    id: "video-processing",
    title: "Video Processing Platform",
    category: "Architecture",
    icon: Database,
    instructions: "We need to process 10 million uploaded videos per day. Each video requires transcoding into multiple resolutions, thumbnail generation, audio extraction, speech-to-text, content moderation, metadata extraction, and CDN publishing. Should we build a queue-based architecture around object storage and Kubernetes workers, or use a managed workflow and serverless processing architecture?",
    constraints: "Videos range from seconds to several hours, creating unpredictable workloads. Processing must survive worker failures, support resumable jobs, avoid duplicate processing, and prioritize premium customers. The platform must absorb 5× traffic spikes, maintain processing status in real time, support regional failover, and keep infrastructure costs predictable while minimizing operational work for a small engineering team."
  }
];

interface PresetPickerProps {
  onSelect: (preset: Preset) => void;
}

export function PresetPicker({ onSelect }: PresetPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span>Quick Scenario Presets</span>
        </label>
        <span className="text-[11px] text-slate-500">Click to auto-fill</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className="group text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-cyan-500/10 text-slate-300 group-hover:text-cyan-400 border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {preset.category}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
