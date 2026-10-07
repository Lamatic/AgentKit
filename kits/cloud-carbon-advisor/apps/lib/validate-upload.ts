// Upload guards: size / row caps and CSV-injection neutralisation. A billing
// export is untrusted input — it can carry formula-injection payloads that
// trigger when the file is later opened in a spreadsheet, and it can be large
// enough to exhaust memory. Both are handled here, before anything else runs.

export class UploadValidationError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 100_000;
const CSV_INJECTION_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/** Neutralises CSV-injection payloads by prefixing a leading apostrophe. */
export function sanitizeCsvCell(cell: string): string {
  if (cell.length === 0) return cell;
  return CSV_INJECTION_PREFIXES.includes(cell[0]) ? `'${cell}` : cell;
}

export function validateUploadSize(bytes: number): void {
  if (bytes > MAX_BYTES) {
    throw new UploadValidationError(
      "file-too-large",
      `upload is ${bytes} bytes, exceeds the ${MAX_BYTES}-byte cap — split the export by period or account`,
    );
  }
}

export function validateRowCount(rowCount: number): void {
  if (rowCount > MAX_ROWS) {
    throw new UploadValidationError(
      "too-many-rows",
      `upload has ${rowCount} rows, exceeds the ${MAX_ROWS}-row cap`,
    );
  }
}
