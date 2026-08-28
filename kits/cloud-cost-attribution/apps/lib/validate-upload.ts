export class UploadValidationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 50_000;
const CSV_INJECTION_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/** Neutralizes CSV-injection payloads by prefixing a leading apostrophe. */
export function sanitizeCsvCell(cell: string): string {
  if (cell.length === 0) return cell;
  return CSV_INJECTION_PREFIXES.includes(cell[0]) ? `'${cell}` : cell;
}

export function validateUploadSize(bytes: number): void {
  if (bytes > MAX_BYTES) {
    throw new UploadValidationError(
      "file-too-large",
      `upload is ${bytes} bytes, exceeds ${MAX_BYTES} byte cap`,
    );
  }
}

export function validateRowCount(rowCount: number): void {
  if (rowCount > MAX_ROWS) {
    throw new UploadValidationError(
      "too-many-rows",
      `upload has ${rowCount} rows, exceeds ${MAX_ROWS} row cap`,
    );
  }
}
