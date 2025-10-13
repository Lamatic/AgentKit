"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, AlertCircle } from "lucide-react"
import type { ColumnType, AISubcategory, Column, OutputFormat } from "@/lib/types"

interface AddColumnDialogProps {
  onAddColumn: (
    name: string,
    type: ColumnType,
    aiInstruction?: string,
    aiSubcategory?: AISubcategory,
    dependsOn?: string[],
    outputFormat?: OutputFormat,
  ) => void
  existingColumns: Column[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddColumnDialog({
  onAddColumn,
  existingColumns,
  open: externalOpen,
  onOpenChange,
}: AddColumnDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ColumnType>("Text")
  const [aiSubcategory, setAiSubcategory] = useState<AISubcategory>("generate")
  const [aiInstruction, setAiInstruction] = useState("")
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("text")

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const nonAIColumns = existingColumns.filter((col) => col.type !== "AI")

  const availableAISubcategories: AISubcategory[] =
    outputFormat === "image" ? ["generate"] : ["generate", "summarize", "categorize"]

  const handleSubmit = () => {
    if (name.trim()) {
      if (type === "AI" && selectedDependencies.length === 0) {
        return
      }

      console.log("[v0] AddColumnDialog - handleSubmit with outputFormat:", outputFormat)

      onAddColumn(
        name.trim(),
        type,
        type === "AI" ? aiInstruction.trim() : undefined,
        type === "AI" ? aiSubcategory : undefined,
        type === "AI" ? selectedDependencies : undefined,
        type === "AI" ? outputFormat : undefined,
      )
      setName("")
      setType("Text")
      setAiSubcategory("generate")
      setAiInstruction("")
      setSelectedDependencies([])
      setOutputFormat("text")
      setOpen(false)
    }
  }

  const toggleDependency = (columnId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    )
  }

  const isSubmitDisabled = !name.trim() || (type === "AI" && selectedDependencies.length === 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Column</DialogTitle>
          <DialogDescription>Create a new column for your spreadsheet.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="column-name">Column Name</Label>
            <Input
              id="column-name"
              placeholder="e.g., Description, Price, Category"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !isSubmitDisabled) {
                  handleSubmit()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column-type">Column Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ColumnType)}>
              <SelectTrigger id="column-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="Number">Number</SelectItem>
                <SelectItem value="Date">Date</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "AI" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="output-format">Output Format</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(value) => {
                    setOutputFormat(value as OutputFormat)
                    if (value === "image" && aiSubcategory !== "generate") {
                      setAiSubcategory("generate")
                    }
                  }}
                >
                  <SelectTrigger id="output-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose whether the AI should return text or generate an image.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-subcategory">AI Task Type</Label>
                <Select value={aiSubcategory} onValueChange={(value) => setAiSubcategory(value as AISubcategory)}>
                  <SelectTrigger id="ai-subcategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAISubcategories.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {outputFormat === "image"
                    ? "Only 'Generate' is available for image output."
                    : "Select the type of AI task to perform on this column."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-instruction">AI Instruction</Label>
                <Textarea
                  id="ai-instruction"
                  placeholder="e.g., summarize description, categorize feedback, generate headline"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Describe what you want the AI to do with the data in this row.
                </p>
                {aiSubcategory === "categorize" && (
                  <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-2.5 mt-2">
                    <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900">
                      <span className="font-medium">Tip:</span> Include the categories you want in your instruction
                      (e.g., "Categorize as: Positive, Negative, Neutral"). The AI will automatically understand and use
                      them.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-semibold">Column Dependencies</Label>
                    <p className="text-xs text-muted-foreground">
                      Select which columns this AI column should use as input. At least one column is required.
                    </p>
                  </div>
                </div>

                {nonAIColumns.length === 0 ? (
                  <div className="rounded-md bg-background p-3 text-center text-sm text-muted-foreground">
                    No columns available. Add at least one Text, Number, or Date column first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nonAIColumns.map((column) => (
                      <div key={column.id} className="flex items-center space-x-2 rounded-md bg-background p-2">
                        <Checkbox
                          id={`dep-${column.id}`}
                          checked={selectedDependencies.includes(column.id)}
                          onCheckedChange={() => toggleDependency(column.id)}
                        />
                        <label
                          htmlFor={`dep-${column.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {column.name}
                          <span className="ml-2 text-xs text-muted-foreground">({column.type})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDependencies.length > 0 && (
                  <p className="text-xs text-primary">
                    ✓ {selectedDependencies.length} {selectedDependencies.length === 1 ? "column" : "columns"} selected
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            Add Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
