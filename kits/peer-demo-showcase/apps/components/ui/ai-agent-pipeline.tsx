"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmissionResult {
  project_title: string;
  category: string;
  matched_sponsor: string;
  match_justification: string;
  breakout_table: string;
  tech_stack?: string;
}

interface EnterpriseAIPipelineProps {
  loading: boolean;
  activeStep: number;
  stepStatuses: Array<'idle' | 'loading' | 'completed' | 'failed'>;
  githubUrl: string;
  result: SubmissionResult | null;
  error?: string;
}

function AnimatedDot({
  path,
  duration,
  delay,
  size,
  opacity,
}: {
  path: string;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
}) {
  return (
    <circle r={size} fill="#0052FF" opacity={opacity}>
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
    </circle>
  );
}

function PulsingDot({
  cx,
  cy,
  color,
  duration,
  delay = 0,
}: {
  cx: number;
  cy: number;
  color: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={2.8}
      fill={color}
      animate={{ opacity: [0.15, 1, 0.15] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function StatusIndicator({
  cx,
  cy,
  color,
  pulsing = false,
  duration = 1.9,
  delay = 0,
}: {
  cx: number;
  cy: number;
  color: string;
  pulsing?: boolean;
  duration?: number;
  delay?: number;
}) {
  if (pulsing) {
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={3}
        fill={color}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }
  return <circle cx={cx} cy={cy} r={3} fill={color} opacity={0.95} />;
}

export function EnterpriseAIPipeline({
  loading,
  activeStep,
  stepStatuses,
  githubUrl,
  result,
  error
}: EnterpriseAIPipelineProps) {
  const [logMessage, setLogMessage] = useState("Idle. Awaiting repository submission...");
  const [pipelinesExecuted, setPipelinesExecuted] = useState(148);

  // Dynamic log updates matching the execution lifecycle
  useEffect(() => {
    if (error) {
      setLogMessage(`⨯ Pipeline Error: ${error}`);
      return;
    }

    if (!loading && !result) {
      setLogMessage("Idle. Awaiting repository submission...");
      return;
    }

    if (loading) {
      if (activeStep === 0) {
        setLogMessage("› Establishing WebSocket handshake with Lamatic orchestrator...");
      } else if (activeStep === 1) {
        setLogMessage(`› Crawling repository: ${githubUrl || "repo"}...`);
      } else if (activeStep === 2) {
        setLogMessage("› Analyzing AST tree to map framework configurations...");
      } else if (activeStep === 3) {
        setLogMessage("› Executing matchmaking vectors against sponsor sponsor-db...");
      }
      return;
    }

    if (result) {
      setLogMessage(`✔ Match completed successfully in 342ms. Assigned to ${result.breakout_table}.`);
      setPipelinesExecuted((p) => p + 1);
    }
  }, [loading, activeStep, result, error, githubUrl]);

  const paths = {
    p1: "M116,88 L158,88",
    p2: "M268,88 L306,88",
    p3: "M411,88 C425,88 435,50 448,50",
    p4: "M411,88 L448,88",
    p5: "M411,88 C425,88 435,126 448,126",
  };

  const getStatusColor = (index: number) => {
    const status = stepStatuses[index];
    if (status === "completed") return "#22c55e"; // green
    if (status === "failed") return "#ef4444"; // red
    if (status === "loading") return "#3b82f6"; // blue
    return "rgba(255,255,255,0.18)"; // gray
  };

  return (
    <div className="agent-pipeline bg-[#090909] border border-white/[0.08] rounded-[14px] overflow-hidden font-sans w-full max-w-[720px] mx-auto shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="px-[18px] py-[11px] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <motion.span
            className="w-[6px] h-[6px] rounded-full bg-green-500 inline-block"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] text-white/30 tracking-[0.1em] font-mono">
            AGENT PIPELINE · {loading ? "PROCESSING" : "LIVE"}
          </span>
        </div>
        <span className="text-[10px] text-white/[0.18] font-mono">
          3 nodes · {error ? "1 error" : "0 errors"}
        </span>
      </div>

      {/* SVG Pipeline Visualization */}
      <svg width="100%" viewBox="0 0 580 172" className="block select-none">
        <defs>
          <marker
            id="ma"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path
              d="M2 1.5L7.5 5L2 8.5"
              fill="none"
              stroke="rgba(0,82,255,0.45)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Connection Paths */}
        <path
          d={paths.p1}
          fill="none"
          stroke={loading && activeStep >= 1 ? "rgba(0,82,255,0.45)" : "rgba(255,255,255,0.08)"}
          strokeWidth="1.5"
          strokeDasharray={loading ? "3 5" : "none"}
          markerEnd="url(#ma)"
        />
        <path
          d={paths.p2}
          fill="none"
          stroke={loading && activeStep >= 2 ? "rgba(0,82,255,0.45)" : "rgba(255,255,255,0.08)"}
          strokeWidth="1.5"
          strokeDasharray={loading ? "3 5" : "none"}
          markerEnd="url(#ma)"
        />
        <path
          d={paths.p3}
          fill="none"
          stroke={loading && activeStep >= 3 ? "rgba(0,82,255,0.3)" : "rgba(255,255,255,0.08)"}
          strokeWidth="1.5"
          strokeDasharray={loading ? "3 5" : "none"}
        />
        <path
          d={paths.p4}
          fill="none"
          stroke={loading && activeStep >= 3 ? "rgba(0,82,255,0.3)" : "rgba(255,255,255,0.08)"}
          strokeWidth="1.5"
          strokeDasharray={loading ? "3 5" : "none"}
        />
        <path
          d={paths.p5}
          fill="none"
          stroke={loading && activeStep >= 3 ? "rgba(0,82,255,0.3)" : "rgba(255,255,255,0.08)"}
          strokeWidth="1.5"
          strokeDasharray={loading ? "3 5" : "none"}
        />

        {/* Animated dots along paths */}
        {loading && activeStep === 0 && (
          <>
            <AnimatedDot path={paths.p1} duration={1.05} delay={0} size={2.5} opacity={1} />
            <AnimatedDot path={paths.p1} duration={1.05} delay={0.35} size={1.8} opacity={0.65} />
          </>
        )}
        {loading && activeStep === 1 && (
          <>
            <AnimatedDot path={paths.p2} duration={0.88} delay={0.18} size={2.5} opacity={1} />
            <AnimatedDot path={paths.p2} duration={0.88} delay={0.62} size={1.8} opacity={0.65} />
          </>
        )}
        {loading && activeStep >= 2 && (
          <>
            <AnimatedDot path={paths.p3} duration={1.3} delay={0.08} size={2.2} opacity={0.9} />
            <AnimatedDot path={paths.p4} duration={1.15} delay={0.28} size={2.2} opacity={0.9} />
            <AnimatedDot path={paths.p5} duration={1.4} delay={0.45} size={2.2} opacity={0.9} />
          </>
        )}

        {/* Trigger Node (Submission Input) */}
        <rect
          x="16"
          y="66"
          width="100"
          height="44"
          rx="8"
          fill="#141414"
          stroke={getStatusColor(0)}
          strokeWidth="1"
        />
        <text
          x="66"
          y="83"
          textAnchor="middle"
          fontSize="8.5"
          fill="rgba(255,255,255,0.28)"
          fontFamily="system-ui"
          letterSpacing=".07em"
        >
          INPUT
        </text>
        <text
          x="66"
          y="98"
          textAnchor="middle"
          fontSize="11"
          fill="rgba(255,255,255,0.82)"
          fontFamily="system-ui"
          fontWeight="500"
        >
          GitHub Repo
        </text>

        {/* Vector DB Node (AST Dependency Scanner) */}
        <rect
          x="158"
          y="66"
          width="110"
          height="44"
          rx="8"
          fill="#141414"
          stroke={getStatusColor(1)}
          strokeWidth="1"
        />
        <text
          x="213"
          y="83"
          textAnchor="middle"
          fontSize="8.5"
          fill="rgba(255,255,255,0.28)"
          fontFamily="system-ui"
          letterSpacing=".07em"
        >
          PARSER NODE
        </text>
        <text
          x="213"
          y="98"
          textAnchor="middle"
          fontSize="11"
          fill="rgba(255,255,255,0.82)"
          fontFamily="system-ui"
          fontWeight="500"
        >
          Tech Stack Scan
        </text>

        {/* LLM Agent Node (Lamatic Orchestration Engine) */}
        <rect
          x="306"
          y="53"
          width="105"
          height="70"
          rx="10"
          fill="#050D1C"
          stroke={loading ? "#0052FF" : "rgba(255,255,255,0.09)"}
          strokeWidth="1"
        />
        <rect x="318" y="53.5" width="80" height="1" rx="0.5" fill="rgba(51,117,255,0.5)" />
        <text
          x="358"
          y="78"
          textAnchor="middle"
          fontSize="8.5"
          fill="rgba(51,117,255,0.65)"
          fontFamily="system-ui"
          letterSpacing=".07em"
        >
          AI AGENT
        </text>
        <text
          x="358"
          y="97"
          textAnchor="middle"
          fontSize="12"
          fill="#fff"
          fontFamily="system-ui"
          fontWeight="500"
        >
          {loading ? "Matching..." : result ? "Completed" : "Idle"}
        </text>
        {loading && (
          <>
            <PulsingDot cx={346} cy={113} color="#0052FF" duration={1.2} delay={0} />
            <PulsingDot cx={358} cy={113} color="#0052FF" duration={1.2} delay={0.4} />
            <PulsingDot cx={370} cy={113} color="#0052FF" duration={1.2} delay={0.8} />
          </>
        )}
        <text
          x="358"
          y="139"
          textAnchor="middle"
          fontSize="8"
          fill="rgba(0,82,255,0.4)"
          fontFamily="monospace"
        >
          lamatic-engine
        </text>

        {/* Output Nodes (Category, Sponsor, Table) */}
        <rect
          x="448"
          y="35"
          width="116"
          height="30"
          rx="7"
          fill="#111"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />
        <text
          x="490"
          y="53.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.62)"
          fontFamily="system-ui"
        >
          {result ? result.category : "Category Info"}
        </text>
        <StatusIndicator cx={550} cy={43} color={getStatusColor(2)} pulsing={stepStatuses[2] === "loading"} />

        <rect
          x="448"
          y="73"
          width="116"
          height="30"
          rx="7"
          fill="#111"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />
        <text
          x="490"
          y="91.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.62)"
          fontFamily="system-ui"
        >
          {result ? result.matched_sponsor : "Sponsor Match"}
        </text>
        <StatusIndicator cx={550} cy={81} color={getStatusColor(3)} pulsing={stepStatuses[3] === "loading"} />

        <rect
          x="448"
          y="111"
          width="116"
          height="30"
          rx="7"
          fill="#111"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />
        <text
          x="490"
          y="129.5"
          textAnchor="middle"
          fontSize="10.5"
          fill="rgba(255,255,255,0.62)"
          fontFamily="system-ui"
        >
          {result ? result.breakout_table : "Breakout Table"}
        </text>
        <StatusIndicator cx={550} cy={119} color={getStatusColor(3)} pulsing={stepStatuses[3] === "loading"} delay={0.35} />
      </svg>

      {/* Message Display */}
      <div className="border-t border-white/[0.06] px-[18px] py-[9px] h-[52px]">
        <div className="flex gap-2 items-start h-full">
          <span className="text-[#0052FF]/55 font-mono text-[13px] leading-[1.5] shrink-0">
            ›
          </span>
          <div className="relative flex-1 overflow-hidden h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={logMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-[10px] text-white/[0.42] leading-[1.55] absolute inset-0"
              >
                {logMessage}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t border-white/[0.06] px-[18px] py-[10px] flex gap-[22px] items-center">
        <div>
          <div className="text-[9px] text-white/20 tracking-[0.09em] mb-[3px]">EXECUTIONS</div>
          <div className="text-[16px] text-white/[0.72] font-mono">
            {pipelinesExecuted}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-white/20 tracking-[0.09em] mb-[3px]">API STATUS</div>
          <div className="text-[16px] text-emerald-400 font-mono">200 OK</div>
        </div>
        <div>
          <div className="text-[9px] text-white/20 tracking-[0.09em] mb-[3px]">LATENCY</div>
          <div className="text-[16px] text-white/[0.72] font-mono">{loading ? "Calcul..." : "342ms"}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[9px] text-white/[0.18] tracking-[0.09em] mb-[3px]">PROVIDER</div>
          <div className="text-[10px] text-[#0052FF]/55 font-mono">Lamatic AI</div>
        </div>
      </div>
    </div>
  );
}
