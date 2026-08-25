/**
 * SparkTrace — Glue Data Catalog Provider (live mode)
 * ------------------------------------------------------------------
 * Implements `CatalogProvider` against the AWS Glue Data Catalog,
 * which is what Athena reads its table/schema metadata from.
 *
 * Env vars read:
 *   - AWS_REGION       AWS region for the Glue client
 *   - GLUE_DATABASE    default Glue database `listTables()` enumerates
 */

import {
  GlueClient,
  GetTablesCommand,
  GetTableCommand,
  type Table,
  type Column,
} from "@aws-sdk/client-glue";

import type { CatalogProvider, ColumnRef, TableRef } from "../contracts";

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var ${name} for Glue live catalog.`);
  }
  return v;
}

function columnsFromGlueTable(table: Table | undefined): ColumnRef[] {
  const cols: Column[] = [
    ...(table?.StorageDescriptor?.Columns ?? []),
    // Partition keys are queryable columns in Athena too.
    ...(table?.PartitionKeys ?? []),
  ];
  return cols
    .filter((c) => !!c.Name)
    .map((c) => ({ name: c.Name as string, type: c.Type ?? "unknown" }));
}

function tableRefFromGlueTable(table: Table, fallbackDatabase: string): TableRef {
  return {
    database: table.DatabaseName ?? fallbackDatabase,
    name: table.Name ?? "",
    // Glue's catalog doesn't distinguish source/sink/intermediate;
    // callers (the reasoning layer / ingest matcher) reclassify based
    // on pipeline usage. "source" is the safest default since these
    // are catalog-registered, queryable tables.
    kind: "source",
    columns: columnsFromGlueTable(table),
    location: table.StorageDescriptor?.Location,
  };
}

export class GlueCatalogProvider implements CatalogProvider {
  readonly mode = "live" as const;

  private client: GlueClient;
  private database: string;

  constructor(opts?: { region?: string; database?: string }) {
    const region = opts?.region ?? readEnv("AWS_REGION");
    this.database = opts?.database ?? readEnv("GLUE_DATABASE");
    this.client = new GlueClient({ region });
  }

  async listTables(maxTables = 1000): Promise<TableRef[]> {
    const results: TableRef[] = [];
    let nextToken: string | undefined;

    do {
      const page = await this.client.send(
        new GetTablesCommand({ DatabaseName: this.database, NextToken: nextToken })
      );
      for (const table of page.TableList ?? []) {
        results.push(tableRefFromGlueTable(table, this.database));
      }
      if (results.length >= maxTables) return results.slice(0, maxTables);
      nextToken = page.NextToken;
    } while (nextToken);

    return results;
  }

  async describeTable(database: string, name: string): Promise<TableRef> {
    const res = await this.client.send(
      new GetTableCommand({ DatabaseName: database, Name: name })
    );
    if (!res.Table) {
      throw new Error(`Glue table not found: ${database}.${name}`);
    }
    return tableRefFromGlueTable(res.Table, database);
  }
}

/** Factory the orchestrator should import for live mode. */
export function makeGlueCatalog(opts?: { region?: string; database?: string }): CatalogProvider {
  return new GlueCatalogProvider(opts);
}
