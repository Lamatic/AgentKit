"use client"

import { useState, useEffect } from "react"
import { useWorkbookStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Pencil, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export function SheetTabs() {
  const { workbook, addSheet, deleteSheet, renameSheet, setActiveSheet } = useWorkbookStore()
  const { toast } = useToast()
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey

      if (modifierKey && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleAddSheet()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleStartRename = (sheetId: string, currentName: string) => {
    setEditingSheetId(sheetId)
    setEditingName(currentName)
  }

  const handleFinishRename = (sheetId: string) => {
    if (editingName.trim()) {
      renameSheet(sheetId, editingName.trim())
    }
    setEditingSheetId(null)
    setEditingName("")
  }

  const handleDeleteSheet = (sheetId: string) => {
    if (workbook.sheets.length > 1) {
      deleteSheet(sheetId)
    }
  }

  const handleAddSheet = () => {
    console.log("[v0] Attempting to add sheet")
    const result = addSheet()
    console.log("[v0] Add sheet result:", result)
    if (!result.success && result.message) {
      console.log("[v0] Showing toast for sheet limit")
      toast({
        title: "Sheet Limit Reached",
        description: result.message,
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0
  const modKey = isMac ? "⌘" : "Ctrl"

  return (
    <div className="flex items-center justify-between gap-1 border-t border-border bg-card px-4 py-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {workbook.sheets.map((sheet) => (
          <div key={sheet.id} className="flex items-center gap-1">
            {editingSheetId === sheet.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleFinishRename(sheet.id)
                    } else if (e.key === "Escape") {
                      setEditingSheetId(null)
                    }
                  }}
                  className="h-8 w-32 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleFinishRename(sheet.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={workbook.activeSheetId === sheet.id ? "secondary" : "ghost"}
                    className="h-8 px-3 text-sm font-medium"
                    onClick={(e) => {
                      if (e.detail === 1) {
                        setActiveSheet(sheet.id)
                      }
                    }}
                  >
                    {sheet.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleStartRename(sheet.id, sheet.name)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {workbook.sheets.length > 1 && (
                    <DropdownMenuItem
                      onClick={() => handleDeleteSheet(sheet.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleAddSheet}>
          <Plus className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground border-l border-border pl-4">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">
              {modKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">⇧</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">R</kbd>
            <span className="ml-1">Add row</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">
              {modKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">⇧</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">C</kbd>
            <span className="ml-1">Add column</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">
              {modKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">⇧</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-300 font-mono text-[10px]">N</kbd>
            <span className="ml-1">New sheet</span>
          </div>
        </div>
      </div>
    </div>
  )
}
