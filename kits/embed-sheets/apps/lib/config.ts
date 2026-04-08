// Helper function to parse limit values, supporting 'inf' for unlimited
const parseLimit = (value: string | undefined, defaultValue: string): number => {
  const val = value || defaultValue
  if (val.toLowerCase() === "inf" || val.toLowerCase() === "infinity") {
    return 0 // 0 means unlimited
  }
  return Number.parseInt(val, 10)
}

export const config = {
  maxRows: parseLimit(process.env.NEXT_PUBLIC_MAX_ROWS, "0"),
  maxCols: parseLimit(process.env.NEXT_PUBLIC_MAX_COLS, "0"),
  maxSheets: parseLimit(process.env.NEXT_PUBLIC_MAX_SHEETS, "0"),
  // Convert seconds to milliseconds (default 3 seconds)
  pollingInterval: Number.parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || "3", 10) * 1000,
}

// Helper functions to check limits (0 means unlimited)
export const canAddRow = (currentCount: number): boolean => {
  return config.maxRows === 0 || currentCount < config.maxRows
}

export const canAddColumn = (currentCount: number): boolean => {
  return config.maxCols === 0 || currentCount < config.maxCols
}

export const canAddSheet = (currentCount: number): boolean => {
  return config.maxSheets === 0 || currentCount < config.maxSheets
}

export const getLimitMessage = (type: "row" | "column" | "sheet"): string => {
  const limits = {
    row: config.maxRows,
    column: config.maxCols,
    sheet: config.maxSheets,
  }

  const limit = limits[type]
  const pluralType = type === "sheet" ? "sheets" : `${type}s`

  return limit === 0
    ? ""
    : `You've reached the maximum of ${limit} ${pluralType}. Download or fork this project to remove limits.`
}