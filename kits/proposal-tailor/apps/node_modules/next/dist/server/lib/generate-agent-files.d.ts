/**
 * Auto-generate AGENTS.md / CLAUDE.md with the managed Next.js agent-rules
 * block when `next dev` detects an AI coding agent but the block is missing.
 *
 * Keep the marker and block content in sync with:
 *   - packages/create-next-app/helpers/generate-agent-files.ts
 *   - packages/next-codemod/lib/agents-md.ts
 */
export declare const AGENT_RULES_START_MARKER = "<!-- BEGIN:nextjs-agent-rules -->";
export declare const AGENT_RULES_END_MARKER = "<!-- END:nextjs-agent-rules -->";
export type AgentFileAction = 'created' | 'updated' | 'unchanged' | 'skipped';
export interface AgentFilesResult {
    agentsMd: AgentFileAction;
    claudeMd: AgentFileAction;
}
/**
 * Returns true when `AGENTS.md` or `CLAUDE.md` at `dir` already
 * contains the current agent-rules block. A block from an earlier
 * Next.js version (older wording, legacy markers) returns false so
 * callers know to upsert the current one over it.
 */
export declare function hasCurrentAgentRules(dir: string): boolean;
/**
 * Write the agent-rules block into `projectDir`, respecting whichever
 * file the user already uses:
 *
 *   - A file already hosting the managed block → upsert into it, so
 *     upgrades rewrite the block in place instead of adding a copy.
 *   - `AGENTS.md` exists → upsert into it, leave `CLAUDE.md` alone.
 *   - `CLAUDE.md` exists (but not `AGENTS.md`) → upsert into it.
 *   - Neither exists → create both (`AGENTS.md` + `CLAUDE.md` with
 *     `@AGENTS.md` import), matching `create-next-app`.
 *
 * Idempotent: a file already containing the canonical block is
 * reported as `unchanged`.
 */
export declare function writeAgentFiles(projectDir: string): AgentFilesResult;
