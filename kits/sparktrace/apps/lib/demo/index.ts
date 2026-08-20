/**
 * SparkTrace demo mode — public entry point.
 *
 * Re-exports the three factories orchestrate.ts wires up when
 * `RunInvestigationInput.mode === "demo"`. Each returned implementation
 * satisfies the corresponding contracts.ts interface with the same
 * shapes/error-semantics as its live (AWS-backed) counterpart, so the
 * orchestrator itself stays mode-agnostic (see README.md's architecture
 * overview for the demo/live provider seam).
 */

export { makeDemoCatalog, DemoCatalogProvider } from "./demo-catalog";
export { makeDemoIngestor, DemoPipelineIngestor } from "./demo-ingestor";
export { makeDemoExecutor, DemoQueryExecutor } from "./demo-executor";
export { makeDemoReasoner } from "./demo-reasoner";
export { loadScenario, resolveScenarioDir } from "./scenario-paths";
export type { ScenarioJson, ScenarioTable, ScenarioColumn } from "./scenario-paths";
