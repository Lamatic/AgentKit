import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export interface ResultsTableProps {
  columns: string[];
  /** CompactResult.sampleRows — already capped to MAX_SAMPLE_ROWS (<=10), a head+tail sample */
  rows: Array<Record<string, unknown>>;
  /** show a truncation notice, e.g. from CompactResult.truncated */
  truncated?: boolean;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "∅"; // ∅
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Renders a CompactResult's columns/sampleRows as a monospace, horizontally-scrollable table. */
export function ResultsTable({ columns, rows, truncated }: ResultsTableProps) {
  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">No columns returned.</p>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Query returned 0 rows.</p>;
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="font-mono text-xs">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col} className="font-mono text-xs">
                  {formatCell(row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Sample of {rows.length} row{rows.length === 1 ? "" : "s"}
        {truncated ? " (full result set is larger — compacted for the analyst model)." : "."}
      </p>
    </div>
  );
}
