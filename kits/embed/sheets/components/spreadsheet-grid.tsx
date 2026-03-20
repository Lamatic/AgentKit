"use client"

import type React from "react"

import { useWorkbookStore } from "@/lib/store"
import { AddColumnPanel } from "./add-column-panel"
import { EditColumnDialog } from "./edit-column-dialog"
import { CSVUploadDialog } from "./csv-upload-dialog"
import { EditableCell } from "./editable-cell"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Sparkles, Plus, Pencil, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Column, Row } from "@/lib/types"
import { useEffect, useState } from "react"

export function SpreadsheetGrid() {
  const { workbook, addColumn, deleteColumn, updateColumn, addRow, deleteRow, updateCell, bulkImportData } =
    useWorkbookStore()
  const { toast } = useToast()
  const activeSheet = workbook.sheets.find((s) => s.id === workbook.activeSheetId)

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const maxRows = Number.parseInt(process.env.NEXT_PUBLIC_MAX_ROWS || "100", 10)
  const maxCols = Number.parseInt(process.env.NEXT_PUBLIC_MAX_COLS || "20", 10)

  const getColumnWidth = (column: Column): number => {
    if (column.width) return column.width
    // Calculate width based on column name length, with minimum of 120px
    const baseWidth = column.name.length * 8 + 80 // 8px per character + padding for icon and dropdown
    return Math.max(120, Math.min(baseWidth, 400)) // Min 120px, max 400px
  }

  const handleResizeStart = (e: React.MouseEvent, columnId: string, currentWidth: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    setResizeStartWidth(currentWidth)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none" // Prevent text selection during resize
  }

  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + diff) // Minimum 80px

      if (activeSheet) {
        updateColumn(activeSheet.id, resizingColumn, { width: newWidth })
      }
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth, activeSheet, updateColumn])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey

      if (modifierKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault()
        handleAddRow()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeSheet?.id])

  if (!activeSheet) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No active sheet</p>
      </div>
    )
  }

  const handleAddColumn = (
    name: string,
    type: any,
    aiInstruction?: string,
    aiSubcategory?: any,
    dependsOn?: string[],
    outputFormat?: any,
  ) => {
    const result = addColumn(activeSheet.id, name, type, aiInstruction, aiSubcategory, dependsOn, outputFormat)
    if (!result.success && result.message) {
      toast({
        title: "Column Limit Reached",
        description: result.message,
        variant: "destructive",
        duration: 5000,
      })
      return
    }
  }

  const handleUpdateColumn = (columnId: string, updates: any) => {
    updateColumn(activeSheet.id, columnId, updates)
  }

  const handleDeleteColumn = (columnId: string) => {
    deleteColumn(activeSheet.id, columnId)
  }

  const handleAddRow = () => {
    const result = addRow(activeSheet.id)
    if (!result.success && result.message) {
      toast({
        title: "Row Limit Reached",
        description: result.message,
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeleteRow = (rowId: string) => {
    deleteRow(activeSheet.id, rowId)
  }

  const handleUpdateCell = (rowId: string, columnId: string, value: string) => {
    updateCell(activeSheet.id, rowId, columnId, value)
  }

  const handleCSVImport = (columns: Column[], rows: Row[]) => {
    bulkImportData(activeSheet.id, columns, rows)
  }

  if (activeSheet.columns.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-white">
        <div className="text-center">
          <h3 className="text-base font-medium text-foreground">No columns yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add your first column to get started or import from CSV</p>
        </div>
        <div className="flex items-center gap-2">
          <AddColumnPanel onAddColumn={handleAddColumn} existingColumns={activeSheet.columns} />
          <CSVUploadDialog onImport={handleCSVImport} />
        </div>
      </div>
    )
  }

  const hasAIColumns = activeSheet.columns.some((col) => col.type === "AI")
  const canAddRow = activeSheet.rows.length < maxRows
  const canAddColumn = activeSheet.columns.length < maxCols

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {activeSheet.rows.length} {activeSheet.rows.length === 1 ? "record" : "records"}
          </span>
          {hasAIColumns && (
            <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
              <Sparkles className="h-3 w-3" />
              <span>AI processing enabled</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CSVUploadDialog onImport={handleCSVImport} />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50">
              {/* Row number column */}
              <th className="w-10 border-b border-r border-gray-200 bg-gray-50 p-0">
                <div className="flex h-10 items-center justify-center">
                  <span className="text-xs font-normal text-gray-400">#</span>
                </div>
              </th>

              {/* Data columns */}
              {activeSheet.columns.map((column) => {
                const columnWidth = getColumnWidth(column)

                return (
                  <th
                    key={column.id}
                    className="border-b border-r border-gray-200 bg-gray-50 p-0 text-left relative"
                    style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px`, maxWidth: `${columnWidth}px` }}
                  >
                    <div className="flex h-10 items-center justify-between gap-2 px-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {column.type === "AI" && <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
                        <span className="text-sm font-medium text-gray-900 truncate">{column.name}</span>
                        {column.type === "AI" && column.aiSubcategory && (
                          <span className="text-xs text-gray-500 capitalize flex-shrink-0">
                            • {column.aiSubcategory}
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-200 flex-shrink-0">
                            <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <EditColumnDialog
                            column={column}
                            existingColumns={activeSheet.columns}
                            onUpdateColumn={handleUpdateColumn}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit field
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete field
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, column.id, columnWidth)}
                    />
                  </th>
                )
              })}

              {canAddColumn && (
                <th className="w-12 border-b border-gray-200 bg-gray-50 p-0">
                  <div className="flex h-10 items-center justify-center">
                    <AddColumnPanel
                      onAddColumn={handleAddColumn}
                      existingColumns={activeSheet.columns}
                      disabled={!canAddColumn}
                    />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {activeSheet.rows.length === 0 ? (
              <tr>
                <td colSpan={activeSheet.columns.length + 2} className="p-12 text-center">
                  <p className="text-sm text-gray-500">
                    No records yet. Click the + button below to add a row or press{" "}
                    {navigator.platform.toUpperCase().indexOf("MAC") >= 0 ? "⌘" : "Ctrl"} + Shift + R
                  </p>
                </td>
              </tr>
            ) : (
              activeSheet.rows.map((row, rowIndex) => (
                <tr key={row.id} className="group hover:bg-gray-50/50">
                  {/* Row number */}
                  <td className="border-b border-r border-gray-200 bg-white p-0 group-hover:bg-gray-50/50">
                    <div className="flex h-9 items-center justify-center">
                      <span className="text-xs text-gray-400">{rowIndex + 1}</span>
                    </div>
                  </td>

                  {/* Data cells */}
                  {activeSheet.columns.map((column) => {
                    const cell = row.cells.find((c) => c.columnId === column.id)
                    if (!cell) return null

                    const columnWidth = getColumnWidth(column)

                    return (
                      <td
                        key={column.id}
                        className="border-b border-r border-gray-200 p-0 group-hover:bg-gray-50/50"
                        style={{
                          width: `${columnWidth}px`,
                          minWidth: `${columnWidth}px`,
                          maxWidth: `${columnWidth}px`,
                        }}
                      >
                        <div className="min-h-[36px] px-3 py-2">
                          <EditableCell
                            cell={cell}
                            column={column}
                            onUpdate={(value) => handleUpdateCell(row.id, column.id, value)}
                            isReadOnly={row.isProcessing}
                          />
                        </div>
                      </td>
                    )
                  })}

                  {/* Row actions */}
                  <td className="border-b border-gray-200 p-0 group-hover:bg-gray-50/50">
                    <div className="flex h-9 items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            )}

            {canAddRow && (
              <tr>
                <td colSpan={activeSheet.columns.length + 2} className="p-0 border-b border-gray-200">
                  <div className="flex h-9 items-center px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      onClick={handleAddRow}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-xs">Add record</span>
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
