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
    id: "vector-db",
    title: "PostgreSQL pgvector vs Dedicated Qdrant",
    category: "Data & Storage",
    icon: Database,
    instructions: "We need to select a vector storage architecture for our high-throughput AI search engine indexing 10 million vector embeddings. Should we extend our existing PostgreSQL cluster using pgvector HNSW indexing, or provision a dedicated managed Qdrant vector database cluster?",
    constraints: "Sub-50ms query latency required, budget under $500/mo, team is proficient in SQL & PostgreSQL administration."
  },
  {
    id: "event-bus",
    title: "Apache Kafka vs AWS SQS/SNS Event Pipeline",
    category: "Messaging",
    icon: Network,
    instructions: "Evaluating event streaming for order processing and inventory auditing. Option 1: Managed Apache Kafka (Confluent Cloud) for event log replay. Option 2: AWS SQS/SNS for serverless simplicity.",
    constraints: "High throughput (5,000 msgs/sec peak), event replay ability needed for auditing, 99.99% availability SLA."
  },
  {
    id: "auth-strategy",
    title: "Managed Auth0 vs Self-Hosted Supabase Auth",
    category: "Security",
    icon: Lock,
    instructions: "Selecting user identity & authentication provider for enterprise SaaS client app. Comparing Auth0 Enterprise SSO against Supabase Auth (self-hosted PostgreSQL auth).",
    constraints: "Must support SAML 2.0 / OIDC enterprise single-sign-on, SOC2 compliance target in Q3, max budget $1,200/mo."
  },
  {
    id: "monolith-microservice",
    title: "Modular Monolith vs Microservices Migration",
    category: "Architecture",
    icon: Server,
    instructions: "Our core API monolith is slowing down PR reviews. Deciding whether to split billing & notifications into independent Next.js/Node microservices or refactor into a strictly-bounded Modular Monolith with Nx workspace boundaries.",
    constraints: "Team size: 6 engineers. Cannot afford dedicated DevOps engineer. Must deploy to Vercel + Railway."
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
