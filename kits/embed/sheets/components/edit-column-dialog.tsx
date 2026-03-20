"use client"

import type React from "react"
import { AlertCircle } from "lucide-react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Column, ColumnType, AISubcategory, OutputFormat } from "@/lib/types"
import { Pencil } from "lucide-react"

interface EditColumnDialogProps {
  column: Column
  existingColumns: Column[]
  onUpdateColumn: (columnId: string, updates: Partial<Column>) => void
  trigger?: React.ReactNode
}

const AI_SUBCATEGORIES: AISubcategory[] = ["generate", "summarize", "categorize"]

export function EditColumnDialog({ column, existingColumns, onUpdateColumn, trigger }: EditColumnDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(column.name)
  const [type, setType] = useState<ColumnType>(column.type)
  const [aiInstruction, setAiInstruction] = useState(column.aiInstruction || "")
  const [aiSubcategory, setAiSubcategory] = useState<AISubcategory | undefined>(column.aiSubcategory)
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(column.dependsOn || [])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(column.outputFormat || "text")

  // Filter out AI columns and the current column from available dependencies
  const availableColumns = existingColumns.filter((col) => col.type !== "AI" && col.id !== column.id)

  const availableAISubcategories: AISubcategory[] =
    outputFormat === "image" ? ["generate"] : ["generate", "summarize", "categorize"]

  useEffect(() => {
    if (open) {
      console.log("[v0] Edit Column Dialog - Opening with column:", {
        columnId: column.id,
        columnName: column.name,
        outputFormat: column.outputFormat,
        fullColumn: column,
      })

      setName(column.name)
      setType(column.type)
      setAiInstruction(column.aiInstruction || "")
      setAiSubcategory(column.aiSubcategory)
      setSelectedDependencies(column.dependsOn || [])
      setOutputFormat(column.outputFormat || "text")

      console.log("[v0] Edit Column Dialog - State set to:", {
        outputFormat: column.outputFormat || "text",
      })
    }
  }, [open, column])

  const handleSubmit = () => {
    const updates: Partial<Column> = {
      name,
      type,
    }

    if (type === "AI") {
      updates.aiInstruction = aiInstruction
      updates.aiSubcategory = aiSubcategory
      updates.dependsOn = selectedDependencies
      updates.outputFormat = outputFormat

      console.log("[v0] Edit Column - Submitting updates:", {
        columnId: column.id,
        columnName: name,
        outputFormat,
        aiSubcategory,
        fullUpdates: updates,
      })
    } else {
      updates.aiInstruction = undefined
      updates.aiSubcategory = undefined
      updates.dependsOn = undefined
      updates.outputFormat = undefined
    }

    onUpdateColumn(column.id, updates)
    setOpen(false)
  }

  const toggleDependency = (columnId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    )
  }

  const isValid =
    name.trim() !== "" &&
    (type !== "AI" || (aiInstruction.trim() !== "" && aiSubcategory && selectedDependencies.length > 0))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Column
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
          <DialogDescription>Update the column properties.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-column-name">Column Name</Label>
            <Input
              id="edit-column-name"
              placeholder="e.g., Description, Price, Category"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-column-type">Column Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ColumnType)}>
              <SelectTrigger id="edit-column-type">
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
                <Label htmlFor="edit-output-format">Output Format</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(value) => {
                    console.log("[v0] Edit Column Dialog - Output format changed to:", value)
                    setOutputFormat(value as OutputFormat)
                    if (value === "image" && aiSubcategory !== "generate") {
                      setAiSubcategory("generate")
                    }
                  }}
                >
                  <SelectTrigger id="edit-output-format">
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
                <Label htmlFor="edit-ai-subcategory">AI Type</Label>
                <Select value={aiSubcategory} onValueChange={(value) => setAiSubcategory(value as AISubcategory)}>
                  <SelectTrigger id="edit-ai-subcategory">
                    <SelectValue placeholder="Select AI type" />
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
                    : "Select the type of AI task to perform."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ai-instruction">AI Instruction</Label>
                <Textarea
                  id="edit-ai-instruction"
                  placeholder="e.g., Summarize the description in 10 words"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  rows={3}
                />
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

              <div className="space-y-2">
                <Label>Dependencies (select at least one)</Label>
                {availableColumns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No non-AI columns available. Add at least one regular column first.
                  </p>
                ) : (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    {availableColumns.map((col) => (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-dep-${col.id}`}
                          checked={selectedDependencies.includes(col.id)}
                          onCheckedChange={() => toggleDependency(col.id)}
                        />
                        <label
                          htmlFor={`edit-dep-${col.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {col.name} ({col.type})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Update Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
