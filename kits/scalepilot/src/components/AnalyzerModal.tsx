"use client";

import React, { useState } from "react";

export interface StackConfig {
  backend: string;
  database: string;
  cloud: string;
  users: string;
  challenge: string;
}

interface AnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (config: StackConfig) => void;
}

export function AnalyzerModal({ isOpen, onClose, onGenerateReport }: AnalyzerModalProps) {
  const [config, setConfig] = useState<StackConfig>({
    backend: "Node.js",
    database: "PostgreSQL",
    cloud: "AWS",
    users: "100k MAU",
    challenge: "High latency during peak traffic",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateReport(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#FFFFFF] border border-[#0D0D0B] p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[#0D0D0B]">
        {/* L-corner markers */}
        <div className="corner-marker-tl" />
        <div className="corner-marker-tr" />
        <div className="corner-marker-bl" />
        <div className="corner-marker-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E2DF] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#0D0D0B] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#FCDD2D] border border-[#0D0D0B] animate-pulse" />
            <span className="uppercase tracking-wider">LIVE ARCHITECTURE ANALYZER</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#555550] hover:text-[#0D0D0B] font-mono text-xs uppercase px-2 py-1 border border-[#E2E2DF] bg-[#F8F8F6] cursor-pointer"
          >
            [ ESC ]
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold text-[#0D0D0B]">
            Configure Your Stack
          </h3>
          <p className="font-mono text-xs text-[#555550] uppercase tracking-wider">
            Select your architectural parameters for custom analysis.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
          {/* Backend Selection */}
          <div className="space-y-2">
            <label className="text-[#555550] uppercase tracking-wider block font-bold">
              1. Backend Runtime / Services
            </label>
            <select
              value={config.backend}
              onChange={(e) => setConfig({ ...config, backend: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[#E2E2DF] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
            >
              <option value="Node.js">Node.js (Express / NestJS)</option>
              <option value="Go">Go (Gin / Fiber microservices)</option>
              <option value="Python">Python (Django / FastAPI)</option>
              <option value="Ruby on Rails">Ruby on Rails</option>
              <option value="Java / Spring">Java / Spring Boot</option>
            </select>
          </div>

          {/* Database Selection */}
          <div className="space-y-2">
            <label className="text-[#555550] uppercase tracking-wider block font-bold">
              2. Primary Database Engine
            </label>
            <select
              value={config.database}
              onChange={(e) => setConfig({ ...config, database: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[#E2E2DF] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
            >
              <option value="PostgreSQL">PostgreSQL (Single Instance)</option>
              <option value="MySQL">MySQL / InnoDB Cluster</option>
              <option value="MongoDB">MongoDB Atlas Sharded</option>
              <option value="DynamoDB">Amazon DynamoDB</option>
            </select>
          </div>

          {/* Cloud Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[#555550] uppercase tracking-wider block font-bold">
                3. Cloud Platform
              </label>
              <select
                value={config.cloud}
                onChange={(e) => setConfig({ ...config, cloud: e.target.value })}
                className="w-full bg-[#F8F8F6] border border-[#E2E2DF] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
              >
                <option value="AWS">AWS (ECS / EKS)</option>
                <option value="GCP">GCP (Cloud Run / GKE)</option>
                <option value="Azure">Azure App Services</option>
                <option value="Bare Metal / Hetzner">Bare Metal / Hetzner</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[#555550] uppercase tracking-wider block font-bold">
                4. Scale Tier
              </label>
              <select
                value={config.users}
                onChange={(e) => setConfig({ ...config, users: e.target.value })}
                className="w-full bg-[#F8F8F6] border border-[#E2E2DF] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
              >
                <option value="10k MAU">10,000 Active Users</option>
                <option value="100k MAU">100,000 Active Users</option>
                <option value="1M MAU">1,000,000 Active Users</option>
                <option value="10M+ MAU">10,000,000+ Active Users</option>
              </select>
            </div>
          </div>

          {/* Primary Bottleneck */}
          <div className="space-y-2">
            <label className="text-[#555550] uppercase tracking-wider block font-bold">
              5. Primary Operational Challenge
            </label>
            <select
              value={config.challenge}
              onChange={(e) => setConfig({ ...config, challenge: e.target.value })}
              className="w-full bg-[#F8F8F6] border border-[#E2E2DF] text-[#0D0D0B] p-3 focus:outline-none focus:border-[#0D0D0B] font-bold"
            >
              <option value="High latency during peak traffic">High latency during peak traffic (P99 &gt; 2.5s)</option>
              <option value="Database query locks & memory exhaustion">Database query locks &amp; CPU spikes</option>
              <option value="Deployments breaking down independent services">Deployments breaking downstream services</option>
              <option value="Rapidly scaling cloud bill without clear optimization">Cloud infrastructure cost inefficiency</option>
            </select>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-[#F8F8F6] text-[#555550] hover:text-[#0D0D0B] border border-[#E2E2DF] uppercase tracking-wider cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#FCDD2D] hover:bg-[#ebd028] text-[#0D0D0B] border border-[#0D0D0B] uppercase tracking-wider flex items-center gap-2 cursor-pointer font-bold"
            >
              <span>Generate Evolution Report</span>
              <span className="text-[#0D0D0B]">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
