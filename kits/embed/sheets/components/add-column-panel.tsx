"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Sparkles, Type, Hash, Calendar, AlertCircle, Plus } from "lucide-react"
import type { ColumnType, AISubcategory, Column, OutputFormat } from "@/lib/types"

interface AddColumnPanelProps {
  onAddColumn: (
    name: string,
    type: ColumnType,
    aiInstruction?: string,
    aiSubcategory?: AISubcategory,
    dependsOn?: string[],
    outputFormat?: OutputFormat,
  ) => void
  existingColumns: Column[]
  disabled?: boolean
}

export function AddColumnPanel({ onAddColumn, existingColumns, disabled }: AddColumnPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<ColumnType | null>(null)
  const [name, setName] = useState("")
  const [aiSubcategory, setAiSubcategory] = useState<AISubcategory>("generate")
  const [aiInstruction, setAiInstruction] = useState("")
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("text")

  const nonAIColumns = existingColumns.filter((col) => col.type !== "AI")

  const fieldTypes = [
    { type: "AI" as ColumnType, label: "AI Generated", icon: Sparkles, category: "AI Fields" },
    { type: "Text" as ColumnType, label: "Single line text", icon: Type, category: "Standard Fields" },
    { type: "Number" as ColumnType, label: "Number", icon: Hash, category: "Standard Fields" },
    { type: "Date" as ColumnType, label: "Date", icon: Calendar, category: "Standard Fields" },
  ]

  const filteredTypes = fieldTypes.filter((field) => field.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const aiFields = filteredTypes.filter((f) => f.category === "AI Fields")
  const standardFields = filteredTypes.filter((f) => f.category === "Standard Fields")

  const handleTypeSelect = (type: ColumnType) => {
    setSelectedType(type)
    if (type !== "AI") {
      setName("")
    }
  }

  const handleCreate = () => {
    if (!selectedType || !name.trim()) return

    if (selectedType === "AI" && selectedDependencies.length === 0) return

    onAddColumn(
      name.trim(),
      selectedType,
      selectedType === "AI" ? aiInstruction.trim() : undefined,
      selectedType === "AI" ? aiSubcategory : undefined,
      selectedType === "AI" ? selectedDependencies : undefined,
      selectedType === "AI" ? outputFormat : undefined,
    )

    // Reset form
    setSelectedType(null)
    setName("")
    setAiSubcategory("generate")
    setAiInstruction("")
    setSelectedDependencies([])
    setOutputFormat("text")
    setSearchQuery("")
    setIsOpen(false)
  }

  const handleBack = () => {
    setSelectedType(null)
    setName("")
    setAiSubcategory("generate")
    setAiInstruction("")
    setSelectedDependencies([])
    setOutputFormat("text")
  }

  const toggleDependency = (columnId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    )
  }

  const availableAISubcategories: AISubcategory[] =
    outputFormat === "image" ? ["generate"] : ["generate", "summarize", "categorize"]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start" side="bottom" sideOffset={4}>
        {!selectedType ? (
          <div className="flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Find a field type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 border-gray-300"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">
              {aiFields.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">AI Fields</h3>
                  <div className="space-y-1">
                    {aiFields.map((field) => {
                      const Icon = field.icon
                      return (
                        <button
                          key={field.type}
                          onClick={() => handleTypeSelect(field.type)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded bg-blue-100">
                            <Icon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {standardFields.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Standard Fields</h3>
                  <div className="space-y-1">
                    {standardFields.map((field) => {
                      const Icon = field.icon
                      return (
                        <button
                          key={field.type}
                          onClick={() => handleTypeSelect(field.type)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded bg-gray-100">
                            <Icon className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {filteredTypes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No field types found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[600px]">
            <div className="overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field-name" className="text-sm font-medium">
                  Field name
                </Label>
                <Input
                  id="field-name"
                  placeholder="e.g., Description, Price"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                  autoFocus
                />
              </div>

              {selectedType === "AI" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="output-format" className="text-sm font-medium">
                      Output Format
                    </Label>
                    <Select
                      value={outputFormat}
                      onValueChange={(value) => {
                        setOutputFormat(value as OutputFormat)
                        if (value === "image" && aiSubcategory !== "generate") {
                          setAiSubcategory("generate")
                        }
                      }}
                    >
                      <SelectTrigger id="output-format" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-task" className="text-sm font-medium">
                      AI Task Type
                    </Label>
                    <Select value={aiSubcategory} onValueChange={(value) => setAiSubcategory(value as AISubcategory)}>
                      <SelectTrigger id="ai-task" className="h-9">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-instruction" className="text-sm font-medium">
                      AI Instruction
                    </Label>
                    <Textarea
                      id="ai-instruction"
                      placeholder="e.g., summarize description"
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      rows={3}
                      className="resize-none text-sm"
                    />
                    {aiSubcategory === "categorize" && (
                      <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-2">
                        <AlertCircle className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900">
                          <span className="font-medium">Tip:</span> Include categories in your instruction (e.g.,
                          "Categorize as: Positive, Negative, Neutral").
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Label className="text-sm font-medium">Column Dependencies</Label>
                    <p className="text-xs text-gray-600">Select columns to use as input (at least one required).</p>

                    {nonAIColumns.length === 0 ? (
                      <div className="rounded-md bg-white p-2 text-center text-xs text-gray-500">
                        No columns available. Add a standard field first.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {nonAIColumns.map((column) => (
                          <div key={column.id} className="flex items-center space-x-2 rounded-md bg-white p-2">
                            <Checkbox
                              id={`dep-${column.id}`}
                              checked={selectedDependencies.includes(column.id)}
                              onCheckedChange={() => toggleDependency(column.id)}
                            />
                            <label
                              htmlFor={`dep-${column.id}`}
                              className="flex-1 cursor-pointer text-sm font-medium leading-none"
                            >
                              {column.name}
                              <span className="ml-1.5 text-xs text-gray-500">({column.type})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 p-3 flex items-center justify-between bg-gray-50">
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-9">
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || (selectedType === "AI" && selectedDependencies.length === 0)}
                size="sm"
                className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Create field
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
