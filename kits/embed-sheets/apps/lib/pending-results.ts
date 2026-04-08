type PendingResult = {
  sheetId: string
  columnId: string
  rowId: string
  value: string
  timestamp: number
}

const pendingResults: PendingResult[] = []

export function addPendingResult(result: Omit<PendingResult, "timestamp">) {
  pendingResults.push({
    ...result,
    timestamp: Date.now(),
  })

  console.log("[v0] Added result to queue. Queue size:", pendingResults.length)
  console.log("[v0] Queue contents:", pendingResults)

  // Clean up old results (older than 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const validResults = pendingResults.filter((r) => r.timestamp > fiveMinutesAgo)
  pendingResults.length = 0
  pendingResults.push(...validResults)
}

export function getPendingResults(): PendingResult[] {
  console.log("[v0] Getting pending results. Queue size:", pendingResults.length)
  console.log("[v0] Returning results:", pendingResults)
  return [...pendingResults]
}

export function clearPendingResults() {
  pendingResults.length = 0
}
