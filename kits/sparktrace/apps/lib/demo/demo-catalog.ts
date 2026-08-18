/**
 * SparkTrace demo mode — CatalogProvider backed by the bundled
 * assets/sample-scenario/scenario.json `tables` array. No AWS/Glue calls;
 * safe for CI and graders with zero external services.
 */

import type { CatalogProvider, TableRef, ExecutionMode } from "../contracts";
import { loadScenario, type ScenarioTable } from "./scenario-paths";

function toTableRef(table: ScenarioTable): TableRef {
  return {
    database: table.database,
    name: table.name,
    kind: table.kind,
    columns: table.columns,
    location: table.location,
  };
}

export class DemoCatalogProvider implements CatalogProvider {
  readonly mode: ExecutionMode = "demo";

  async listTables(): Promise<TableRef[]> {
    const { scenario } = loadScenario();
    return scenario.tables.map(toTableRef);
  }

  async describeTable(database: string, name: string): Promise<TableRef> {
    const { scenario } = loadScenario();
    const table = scenario.tables.find(
      (t) => t.database === database && t.name === name
    );
    if (!table) {
      // Mirrors Glue's EntityNotFoundException behavior for live mode:
      // describing an unknown table rejects rather than returning null.
      throw new Error(
        `SparkTrace demo catalog: unknown table "${database}.${name}". ` +
          `Known tables: ${scenario.tables.map((t) => `${t.database}.${t.name}`).join(", ")}`
      );
    }
    return toTableRef(table);
  }
}

export function makeDemoCatalog(): CatalogProvider {
  return new DemoCatalogProvider();
}
