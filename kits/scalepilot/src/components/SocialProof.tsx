"use client";

import React from "react";

const STACKS = [
  "AWS",
  "GCP",
  "AZURE",
  "POSTGRESQL",
  "MYSQL",
  "MONGODB",
  "DYNAMODB",
  "NODE.JS",
  "GO",
  "PYTHON",
  "FASTAPI",
  "DJANGO",
  "RUBY ON RAILS",
  "JAVA SPRING",
  "RUST",
  "KUBERNETES",
  "DOCKER",
  "REDIS",
  "NATS JETSTREAM",
  "KAFKA",
  "CLICKHOUSE",
  "ELASTICSEARCH",
  "NEXT.JS",
  "REACT",
  "GRAPHQL",
  "gRPC",
  "CLOUDFLARE",
];

export function SocialProof() {
  const marqueeItems = [...STACKS, ...STACKS, ...STACKS];

  return (
    <section className="py-10 border-b border-[#E2E2DF] bg-[#FFFFFF] overflow-hidden reveal-on-scroll">
      <div className="w-full text-center space-y-6">
        <p className="font-mono text-[10px] text-[#888880] uppercase tracking-[0.2em] font-bold px-4">
          ENGINEERED FOR MODERN TECH STACKS &amp; DISTRIBUTED SYSTEMS
        </p>

        {/* Full Viewport Edge-to-Edge Continuous Infinity Marquee Container */}
        <div
          className="relative w-full overflow-hidden group cursor-pointer"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
          }}
        >
          <div className="animate-infinite-marquee flex items-center gap-8 w-max font-mono text-xs text-[#555550] tracking-widest uppercase py-1">
            {marqueeItems.map((tech, index) => (
              <div key={`${tech}-${index}`} className="flex items-center gap-8 shrink-0">
                <span className="hover:text-[#0D0D0B] font-bold transition-colors">
                  {tech}
                </span>
                <span className="text-[#E2E2DF] font-bold">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
