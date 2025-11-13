"use client"

import { create } from "zustand"
import type { Workbook, Sheet, Column, Row, ColumnType, AISubcategory, OutputFormat } from "./types"
import { canAddRow, canAddColumn, canAddSheet, getLimitMessage, config } from "./config"

const generateId = (): string => {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16)
}

interface WorkbookState {
  workbook: Workbook

  // Sheet operations
  addSheet: () => { success: boolean; message?: string }
  deleteSheet: (sheetId: string) => void
  renameSheet: (sheetId: string, name: string) => void
  setActiveSheet: (sheetId: string) => void

  // Column operations
  addColumn: (
    sheetId: string,
    name: string,
    type: ColumnType,
    aiInstruction?: string,
    aiSubcategory?: AISubcategory,
    dependsOn?: string[],
    outputFormat?: OutputFormat,
  ) => { success: boolean; message?: string }
  deleteColumn: (sheetId: string, columnId: string) => void
  updateColumn: (sheetId: string, columnId: string, updates: Partial<Column>) => void

  // Row operations
  addRow: (sheetId: string) => { success: boolean; message?: string }
  deleteRow: (sheetId: string, rowId: string) => void
  updateCell: (sheetId: string, rowId: string, columnId: string, value: string) => void

  triggerAIProcessing: (sheetId: string, rowId: string, columnId: string) => Promise<void>

  updateCellFromWebhook: (sheetId: string, rowId: string, columnId: string, value: string) => void

  bulkImportData: (sheetId: string, columns: Column[], rows: Row[]) => void
}

const createEmptySheet = (name: string): Sheet => ({
  id: generateId(),
  name,
  columns: [],
  rows: [],
})

const createEmptyRow = (columns: Column[]): Row => ({
  id: generateId(),
  cells: columns.map((col) => ({
    columnId: col.id,
    value: "",
    status: "empty",
  })),
  isProcessing: false,
})

export const useWorkbookStore = create<WorkbookState>((set, get) => ({
  workbook: {
    id: generateId(),
    name: "My Workbook",
    sheets: [createEmptySheet("Sheet 1")],
    activeSheetId: "",
  },

  // Sheet operations
  addSheet: () => {
    const state = get()
    const currentSheetCount = state.workbook.sheets.length

    if (!canAddSheet(currentSheetCount)) {
      return { success: false, message: getLimitMessage("sheet") }
    }

    const newSheet = createEmptySheet(`Sheet ${currentSheetCount + 1}`)
    set({
      workbook: {
        ...state.workbook,
        sheets: [...state.workbook.sheets, newSheet],
        activeSheetId: newSheet.id,
      },
    })
    return { success: true }
  },

  deleteSheet: (sheetId: string) =>
    set((state) => {
      const sheets = state.workbook.sheets.filter((s) => s.id !== sheetId)
      if (sheets.length === 0) {
        sheets.push(createEmptySheet("Sheet 1"))
      }
      return {
        workbook: {
          ...state.workbook,
          sheets,
          activeSheetId: sheets[0].id,
        },
      }
    }),

  renameSheet: (sheetId: string, name: string) =>
    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((s) => (s.id === sheetId ? { ...s, name } : s)),
      },
    })),

  setActiveSheet: (sheetId: string) =>
    set((state) => ({
      workbook: {
        ...state.workbook,
        activeSheetId: sheetId,
      },
    })),

  // Column operations
  addColumn: (
    sheetId: string,
    name: string,
    type: ColumnType,
    aiInstruction?: string,
    aiSubcategory?: AISubcategory,
    dependsOn?: string[],
    outputFormat?: OutputFormat,
  ) => {
    console.log("[v0] addColumn called with:", {
      name,
      type,
      aiSubcategory,
      outputFormat,
      aiInstruction,
    })

    const state = get()
    const sheet = state.workbook.sheets.find((s) => s.id === sheetId)

    if (!sheet) {
      return { success: false, message: "Sheet not found" }
    }

    const currentColumnCount = sheet.columns.length

    if (!canAddColumn(currentColumnCount)) {
      return { success: false, message: getLimitMessage("column") }
    }

    const newColumnId = generateId()

    const finalOutputFormat = type === "AI" ? outputFormat || "text" : undefined

    console.log("[v0] Creating new column with outputFormat:", finalOutputFormat)

    set({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          const newColumn: Column = {
            id: newColumnId,
            name,
            type,
            aiInstruction: type === "AI" ? aiInstruction : undefined,
            aiSubcategory: type === "AI" ? aiSubcategory : undefined,
            dependsOn: type === "AI" ? dependsOn : undefined,
            outputFormat: finalOutputFormat,
          }

          console.log("[v0] New column created:", newColumn)

          return {
            ...sheet,
            columns: [...sheet.columns, newColumn],
            rows: sheet.rows.map((row) => ({
              ...row,
              cells: [
                ...row.cells,
                {
                  columnId: newColumn.id,
                  value: "",
                  status: "empty",
                },
              ],
            })),
          }
        }),
      },
    })

    if (type === "AI" && dependsOn && dependsOn.length > 0) {
      const updatedState = get()
      const updatedSheet = updatedState.workbook.sheets.find((s) => s.id === sheetId)

      if (updatedSheet) {
        updatedSheet.rows.forEach((row) => {
          const allDependenciesFilled = dependsOn.every((depColId) => {
            const depCell = row.cells.find((c) => c.columnId === depColId)
            return depCell && depCell.value && depCell.value.trim() !== ""
          })

          if (allDependenciesFilled) {
            console.log("[v0] Triggering AI processing for existing row:", row.id)
            get().triggerAIProcessing(sheetId, row.id, newColumnId)
          }
        })
      }
    }

    return { success: true }
  },

  deleteColumn: (sheetId: string, columnId: string) =>
    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            columns: sheet.columns.filter((c) => c.id !== columnId),
            rows: sheet.rows.map((row) => ({
              ...row,
              cells: row.cells.filter((c) => c.columnId !== columnId),
            })),
          }
        }),
      },
    })),

  updateColumn: (sheetId: string, columnId: string, updates: Partial<Column>) => {
    console.log("[v0] Store - updateColumn called:", {
      sheetId,
      columnId,
      updates,
      outputFormat: updates.outputFormat,
    })

    set((state) => {
      const updatedSheets = state.workbook.sheets.map((sheet) => {
        if (sheet.id !== sheetId) return sheet

        return {
          ...sheet,
          columns: sheet.columns.map((col) => {
            if (col.id === columnId) {
              const updatedCol = { ...col, ...updates }
              console.log("[v0] Store - Column after update:", {
                columnId: col.id,
                columnName: updatedCol.name,
                outputFormat: updatedCol.outputFormat,
                aiSubcategory: updatedCol.aiSubcategory,
                fullColumn: updatedCol,
              })
              return updatedCol
            }
            return col
          }),
        }
      })

      return {
        workbook: {
          ...state.workbook,
          sheets: updatedSheets,
        },
      }
    })
  },

  // Row operations
  addRow: (sheetId: string) => {
    const state = get()
    const sheet = state.workbook.sheets.find((s) => s.id === sheetId)

    if (!sheet) {
      return { success: false, message: "Sheet not found" }
    }

    const currentRowCount = sheet.rows.length

    if (!canAddRow(currentRowCount)) {
      return { success: false, message: getLimitMessage("row") }
    }

    set({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            rows: [...sheet.rows, createEmptyRow(sheet.columns)],
          }
        }),
      },
    })
    return { success: true }
  },

  deleteRow: (sheetId: string, rowId: string) =>
    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            rows: sheet.rows.filter((r) => r.id !== rowId),
          }
        }),
      },
    })),

  updateCell: (sheetId: string, rowId: string, columnId: string, value: string) => {
    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            rows: sheet.rows.map((row) => {
              if (row.id !== rowId) return row

              return {
                ...row,
                cells: row.cells.map((cell) =>
                  cell.columnId === columnId ? { ...cell, value, status: value ? "filled" : "empty" } : cell,
                ),
              }
            }),
          }
        }),
      },
    }))

    const state = get()
    const sheet = state.workbook.sheets.find((s) => s.id === sheetId)
    if (!sheet) return

    const row = sheet.rows.find((r) => r.id === rowId)
    if (!row) return

    const dependentAIColumns = sheet.columns.filter((col) => col.type === "AI" && col.dependsOn?.includes(columnId))

    dependentAIColumns.forEach((aiColumn) => {
      const allDependenciesFilled = aiColumn.dependsOn?.every((depColId) => {
        const depCell = row.cells.find((c) => c.columnId === depColId)
        return depCell && depCell.value && depCell.value.trim() !== ""
      })

      if (allDependenciesFilled) {
        console.log("[v0] All dependencies filled for AI column:", aiColumn.name)
        get().triggerAIProcessing(sheetId, rowId, aiColumn.id)
      }
    })
  },

  triggerAIProcessing: async (sheetId: string, rowId: string, columnId: string) => {
    const state = get()
    const sheet = state.workbook.sheets.find((s) => s.id === sheetId)
    if (!sheet) return

    const column = sheet.columns.find((c) => c.id === columnId)
    if (!column || column.type !== "AI") return

    console.log("[v0] triggerAIProcessing - Column state:", {
      columnId: column.id,
      columnName: column.name,
      outputFormat: column.outputFormat,
      aiSubcategory: column.aiSubcategory,
      aiInstruction: column.aiInstruction,
    })

    const row = sheet.rows.find((r) => r.id === rowId)
    if (!row) return

    const allDependenciesFilled = column.dependsOn?.every((depColId) => {
      const depCell = row.cells.find((c) => c.columnId === depColId)
      return depCell && depCell.value && depCell.value.trim() !== ""
    })

    if (!allDependenciesFilled) {
      console.log("[v0] Not all dependencies filled, skipping AI processing")
      return
    }

    const dependencyData = column.dependsOn
      ?.map((depColId) => {
        const depColumn = sheet.columns.find((c) => c.id === depColId)
        const depCell = row.cells.find((c) => c.columnId === depColId)
        if (!depColumn || !depCell) return null
        return `${depColumn.name}: ${depCell.value}`
      })
      .filter(Boolean)
      .join("; ")

    console.log("[v0] Dependency data:", dependencyData)

    set({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((s) => {
          if (s.id !== sheetId) return s

          return {
            ...s,
            rows: s.rows.map((r) => {
              if (r.id !== rowId) return r

              return {
                ...r,
                cells: r.cells.map((cell) => (cell.columnId === columnId ? { ...cell, status: "processing" } : cell)),
              }
            }),
          }
        }),
      },
    })

    try {
      const { executeAIProcessing } = await import("@/actions/orchestrate")

      const webhookUrl = `${window.location.origin}/api/webhook/ai-result`

      const payload = {
        sheetId,
        columnId,
        rowId,
        instruction: column.aiInstruction || "",
        aiType: column.aiSubcategory || "generate",
        data: dependencyData || "",
        outputFormat: column.outputFormat || "text",
        webhookUrl,
      }

      console.log("[v0] Triggering AI processing with payload:", payload)

      const result = await executeAIProcessing(payload)

      if (result.success && result.requestId) {
        set({
          workbook: {
            ...state.workbook,
            sheets: state.workbook.sheets.map((s) => {
              if (s.id !== sheetId) return s

              return {
                ...s,
                rows: s.rows.map((r) => {
                  if (r.id !== rowId) return r

                  return {
                    ...r,
                    cells: r.cells.map((cell) =>
                      cell.columnId === columnId
                        ? { ...cell, status: "processing", requestId: result.requestId }
                        : cell,
                    ),
                  }
                }),
              }
            }),
          },
        })

        console.log("[v0] AI processing initiated with requestId:", result.requestId)
      } else {
        set({
          workbook: {
            ...state.workbook,
            sheets: state.workbook.sheets.map((s) => {
              if (s.id !== sheetId) return s

              return {
                ...s,
                rows: s.rows.map((r) => {
                  if (r.id !== rowId) return r

                  return {
                    ...r,
                    cells: r.cells.map((cell) =>
                      cell.columnId === columnId ? { ...cell, value: `Error: ${result.error}`, status: "error" } : cell,
                    ),
                  }
                }),
              }
            }),
          },
        })

        console.error("[v0] AI processing failed:", result.error)
      }
    } catch (error) {
      console.error("[v0] Error triggering AI processing:", error)

      set({
        workbook: {
          ...state.workbook,
          sheets: state.workbook.sheets.map((s) => {
            if (s.id !== sheetId) return s

            return {
              ...s,
              rows: s.rows.map((r) => {
                if (r.id !== rowId) return r

                return {
                  ...r,
                  cells: r.cells.map((cell) =>
                    cell.columnId === columnId ? { ...cell, value: "Error: Failed to process", status: "error" } : cell,
                  ),
                }
              }),
            }
          }),
        },
      })
    }
  },

  updateCellFromWebhook: (sheetId: string, rowId: string, columnId: string, value: string) => {
    console.log("[v0] Updating cell from webhook:", { sheetId, rowId, columnId, value })

    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            rows: sheet.rows.map((row) => {
              if (row.id !== rowId) return row

              return {
                ...row,
                cells: row.cells.map((cell) =>
                  cell.columnId === columnId ? { ...cell, value, status: "filled" } : cell,
                ),
              }
            }),
          }
        }),
      },
    }))
  },

  bulkImportData: (sheetId: string, columns: Column[], rows: Row[]) => {
    set((state) => ({
      workbook: {
        ...state.workbook,
        sheets: state.workbook.sheets.map((sheet) => {
          if (sheet.id !== sheetId) return sheet

          return {
            ...sheet,
            columns: [...sheet.columns, ...columns],
            rows: rows,
          }
        }),
      },
    }))

    const updatedState = get()
    const updatedSheet = updatedState.workbook.sheets.find((s) => s.id === sheetId)

    if (updatedSheet) {
      const aiColumns = updatedSheet.columns.filter((col) => col.type === "AI")

      aiColumns.forEach((aiColumn) => {
        if (!aiColumn.dependsOn || aiColumn.dependsOn.length === 0) return

        updatedSheet.rows.forEach((row) => {
          const allDependenciesFilled = aiColumn.dependsOn!.every((depColId) => {
            const depCell = row.cells.find((c) => c.columnId === depColId)
            return depCell && depCell.value && depCell.value.trim() !== ""
          })

          if (allDependenciesFilled) {
            console.log("[v0] Triggering AI processing after CSV import for row:", row.id, "column:", aiColumn.name)
            get().triggerAIProcessing(sheetId, row.id, aiColumn.id)
          }
        })
      })
    }
  },
}))

// Initialize active sheet
if (typeof window !== "undefined") {
  const store = useWorkbookStore.getState()
  if (store.workbook.sheets.length > 0 && !store.workbook.activeSheetId) {
    store.setActiveSheet(store.workbook.sheets[0].id)
  }

  const pollInterval = config.pollingInterval

  setInterval(async () => {
    console.log("[v0] Polling for results...")

    try {
      const response = await fetch("/api/poll-results")
      const data = await response.json()

      console.log("[v0] Poll response:", data)

      if (data.success && data.results && data.results.length > 0) {
        console.log("[v0] Received webhook results:", data.results)

        const store = useWorkbookStore.getState()

        data.results.forEach((result: any) => {
          store.updateCellFromWebhook(result.sheetId, result.rowId, result.columnId, result.value)
        })
      } else {
        console.log("[v0] No results in poll response")
      }
    } catch (error) {
      console.error("[v0] Error polling for results:", error)
    }
  }, pollInterval)
}
