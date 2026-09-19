const seen = new Map<string, boolean>();

export function idempotencyKey(
  bountyId: string,
  transition: string,
  attempt: number,
): string {
  return `bounty:${bountyId}:${transition}:${attempt}`;
}

export function checkIdempotency(key: string): boolean {
  if (seen.has(key)) return false;
  seen.set(key, true);
  return true;
}

export function resetIdempotency(): void {
  seen.clear();
}
