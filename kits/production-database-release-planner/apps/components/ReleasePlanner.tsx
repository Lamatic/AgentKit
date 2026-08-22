"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import MigrationInput from "@/components/MigrationInput";
import PipelineExecution from "@/components/PipelineExecution";
import ResultsDashboard from "@/components/ResultsDashboard";
import type { MigrationPipelineResult } from "@/types/migrationPipeline";
import {
  createIdlePipelineNodes,
  setPipelineNodeState,
  type PipelineNodeState,
} from "@/lib/pipeline";
import { buildPipelineSummaries } from "@/lib/pipeline";
import { runMigrationPipeline } from "@/services/migrationPipeline";
import type { SqlPreset } from "@/lib/presets";

type RunState = "IDLE" | "RUNNING" | "COMPLETED" | "ERROR";

type ReleasePlannerProps = {
  initialSql: string;
  presets: SqlPreset[];
};

export default function ReleasePlanner({
  initialSql,
  presets,
}: ReleasePlannerProps) {
  const [sql, setSql] = useState(initialSql);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("IDLE");
  const [result, setResult] = useState<MigrationPipelineResult | null>(null);
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNodeState[]>(
    () => createIdlePipelineNodes(),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [resultsViewKey, setResultsViewKey] = useState(0);
  const timeoutRefs = useRef<number[]>([]);
  const executionIdRef = useRef(0);
  const currentNodeIndexRef = useRef(0);
  const [isPresetPending, startPresetTransition] = useTransition();

  useEffect(() => {
    return () => {
      executionIdRef.current += 1;
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

  const clearPendingExecution = () => {
    executionIdRef.current += 1;
    timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutRefs.current = [];
  };

  const resetPrototypeState = () => {
    clearPendingExecution();
    currentNodeIndexRef.current = 0;
    setRunState("IDLE");
    setResult(null);
    setPipelineNodes(createIdlePipelineNodes());
    setValidationMessage(null);
    setResultsViewKey((current) => current + 1);
  };

  const wait = (durationMs: number) =>
    new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        timeoutRefs.current = timeoutRefs.current.filter((id) => id !== timeoutId);
        resolve();
      }, durationMs);

      timeoutRefs.current.push(timeoutId);
    });

  const handleSqlChange = (nextSql: string) => {
    setSql(nextSql);
    resetPrototypeState();

    if (!selectedPresetId) {
      return;
    }

    const selectedPreset = presets.find((preset) => preset.id === selectedPresetId);

    if (selectedPreset && selectedPreset.sql !== nextSql) {
      setSelectedPresetId(null);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    startPresetTransition(() => {
      resetPrototypeState();
      setSql(preset.sql);
      setSelectedPresetId(preset.id);
    });
  };

  const handleRun = async () => {
    const trimmedSql = sql.trim();

    if (!trimmedSql) {
      setValidationMessage("Enter a migration before running the pipeline.");
      return;
    }

    resetPrototypeState();
    setRunState("RUNNING");
    const currentExecutionId = executionIdRef.current;

    const animationPromise = (async () => {
      for (let nodeIndex = 0; nodeIndex < 4; nodeIndex += 1) {
        if (executionIdRef.current !== currentExecutionId) {
          return false;
        }

        currentNodeIndexRef.current = nodeIndex;
        setPipelineNodes((currentNodes) =>
          setPipelineNodeState(currentNodes, nodeIndex, "RUNNING", null),
        );

        await wait(700);

        if (executionIdRef.current !== currentExecutionId) {
          return false;
        }

        setPipelineNodes((currentNodes) =>
          setPipelineNodeState(currentNodes, nodeIndex, "COMPLETED", null),
        );
      }

      return true;
    })();

    try {
      const pipelineResult = await runMigrationPipeline(sql);

      const animationCompleted = await animationPromise;

      if (executionIdRef.current !== currentExecutionId || !animationCompleted) {
        return;
      }

      const nodeSummaries = buildPipelineSummaries(pipelineResult);

      setPipelineNodes((currentNodes) =>
        currentNodes.map((node, nodeIndex) => ({
          ...node,
          status: "COMPLETED",
          summary: nodeSummaries[nodeIndex] ?? node.summary,
        })),
      );

      setResult(pipelineResult);
      setRunState("COMPLETED");
      setValidationMessage(null);
    } catch (error) {
      clearPendingExecution();

      setPipelineNodes((currentNodes) =>
        currentNodes.map((node, nodeIndex) => {
          if (nodeIndex < currentNodeIndexRef.current) {
            return {
              ...node,
              status: "COMPLETED",
            };
          }

          if (nodeIndex === currentNodeIndexRef.current) {
            return {
              ...node,
              status: "ERROR",
            };
          }

          return {
            ...node,
            status: "IDLE",
            summary: null,
          };
        }),
      );

      setResult(null);
      setRunState("ERROR");
      setValidationMessage(
        error instanceof Error
          ? error.message
          : "Pipeline execution failed. No release decision was generated.",
      );

      console.error("Release planner execution failed", error);
    }
  };

  return (
    <div className="mt-6 lg:mt-8">
      <MigrationInput
        isPresetPending={isPresetPending}
        isStarting={runState === "RUNNING"}
        onPresetSelect={handlePresetSelect}
        onRun={handleRun}
        onSqlChange={handleSqlChange}
        presets={presets}
        selectedPresetId={selectedPresetId}
        sql={sql}
        validationMessage={validationMessage}
      />
      <PipelineExecution nodes={pipelineNodes} />
      <ResultsDashboard key={resultsViewKey} result={result} />
    </div>
  );
}
