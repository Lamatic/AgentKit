import type { ConfiguredExperimentalFeature } from '../config';
import { type AgentFilesResult } from './generate-agent-files';
export type { ConfiguredExperimentalFeature };
/**
 * Logs basic startup info that doesn't require config.
 * Called before "Ready in X" to show immediate feedback.
 */
export declare function logStartInfo({ networkUrl, appUrl, envInfo, logBundler, }: {
    networkUrl: string | null;
    appUrl: string | null;
    envInfo?: string[];
    logBundler: boolean;
}): void;
/**
 * Logs experimental features and config-dependent info.
 * Called after getRequestHandlers completes.
 */
export declare function logExperimentalInfo({ experimentalFeatures, cacheComponents, partialPrefetching, }: {
    experimentalFeatures?: ConfiguredExperimentalFeature[];
    cacheComponents?: boolean;
    partialPrefetching?: boolean | 'unstable_eager';
}): void;
/**
 * When `next dev` detects an AI coding agent but the managed
 * agent-rules block is missing from AGENTS.md / CLAUDE.md — or an
 * outdated version of it is installed — auto-generate or refresh the
 * files so the agent has access to version-matched docs. Returns the
 * write result when files were touched, or `null` when no action was
 * needed.
 *
 * Callers gate this on `config.agentRules !== false` — opt-out is
 * declarative in next.config, not inside this function.
 */
export declare function ensureAgentRulesForDev(dir: string): Promise<AgentFilesResult | null>;
/**
 * Gets environment info for logging. Fast operation that doesn't require config.
 */
export declare function getEnvInfo(dir: string): string[];
