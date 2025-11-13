export type ColumnType = "Text" | "Number" | "Date" | "AI"

export type AISubcategory = "generate" | "summarize" | "categorize"

export type OutputFormat = "text" | "image"

export type CellStatus = "empty" | "filled" | "processing" | "completed" | "error"

export interface Column {
  id: string
  name: string
  type: ColumnType
  aiInstruction?: string // Only for AI columns
  aiSubcategory?: AISubcategory // Only for AI columns
  dependsOn?: string[] // Array of column IDs this AI column depends on
  outputFormat?: OutputFormat // Added outputFormat for AI columns
  width?: number // Added width property for resizable columns
}

export interface Cell {
  columnId: string
  value: string
  status: CellStatus
  error?: string
  requestId?: string // Added requestId to track async AI requests
}

export interface Row {
  id: string
  cells: Cell[]
  isProcessing: boolean
}

export interface Sheet {
  id: string
  name: string
  columns: Column[]
  rows: Row[]
}

export interface Workbook {
  id: string
  name: string
  sheets: Sheet[]
  activeSheetId: string
}
