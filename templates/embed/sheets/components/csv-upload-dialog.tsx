"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { config } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import type { Column, Row, ColumnType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CSVUploadDialogProps {
  onImport: (columns: Column[], rows: Row[]) => void
}

const generateId = (): string => {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16)
}

export function CSVUploadDialog({ onImport }: CSVUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnType>>({})
  const [step, setStep] = useState<"upload" | "mapping">("upload")
  const { toast } = useToast()

  const maxRowsText = config.maxRows === 0 ? "Unlimited" : config.maxRows
  const maxColsText = config.maxCols === 0 ? "Unlimited" : config.maxCols

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      })
    }
  }

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim())
    const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim()))
    return { headers, rows }
  }

  const handleUpload = async () => {
    if (!file) return

    const text = await file.text()
    const parsed = parseCSV(text)

    // Validate against limits
    if (config.maxCols > 0 && parsed.headers.length > config.maxCols) {
      toast({
        title: "Column Limit Exceeded",
        description: `Your CSV has ${parsed.headers.length} columns, but the limit is ${config.maxCols}. Please reduce the number of columns.`,
        variant: "destructive",
        duration: 7000,
      })
      return
    }

    if (config.maxRows > 0 && parsed.rows.length > config.maxRows) {
      toast({
        title: "Row Limit Exceeded",
        description: `Your CSV has ${parsed.rows.length} rows, but the limit is ${config.maxRows}. Please reduce the number of rows.`,
        variant: "destructive",
        duration: 7000,
      })
      return
    }

    // Initialize default mappings (all as Text)
    const defaultMappings: Record<string, ColumnType> = {}
    parsed.headers.forEach((header) => {
      defaultMappings[header] = "Text"
    })

    setParsedData(parsed)
    setColumnMappings(defaultMappings)
    setStep("mapping")
  }

  const handleImport = () => {
    if (!parsedData) return

    // Create columns with UUIDs
    const columns: Column[] = parsedData.headers.map((header) => ({
      id: generateId(),
      name: header,
      type: columnMappings[header] || "Text",
    }))

    // Create rows with UUIDs
    const rows: Row[] = parsedData.rows.map((rowData) => ({
      id: generateId(),
      cells: columns.map((col, idx) => ({
        columnId: col.id,
        value: rowData[idx] || "",
        status: rowData[idx] ? "filled" : "empty",
      })),
      isProcessing: false,
    }))

    onImport(columns, rows)

    toast({
      title: "Import Successful",
      description: `Imported ${columns.length} columns and ${rows.length} rows.`,
    })

    // Reset state
    setOpen(false)
    setFile(null)
    setParsedData(null)
    setColumnMappings({})
    setStep("upload")
  }

  const handleCancel = () => {
    setOpen(false)
    setFile(null)
    setParsedData(null)
    setColumnMappings({})
    setStep("upload")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file to import data into your spreadsheet.</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-foreground">Supported Column Types:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <strong>Text:</strong> Any text content
                    </li>
                    <li>
                      <strong>Number:</strong> Numeric values only
                    </li>
                    <li>
                      <strong>Date:</strong> Date values (YYYY-MM-DD format)
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    <strong>Note:</strong> AI columns must be configured manually after import.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">Current Limits:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      Maximum Columns: <strong>{maxColsText}</strong>
                    </li>
                    <li>
                      Maximum Rows: <strong>{maxRowsText}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="cursor-pointer" />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file}>
                Continue to Mapping
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && parsedData && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Review and adjust column types before importing. You can change these later if needed.
              </p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {parsedData.headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{header}</Label>
                    <p className="text-xs text-muted-foreground mt-1">Sample: {parsedData.rows[0]?.[idx] || "N/A"}</p>
                  </div>
                  <Select
                    value={columnMappings[header]}
                    onValueChange={(value) => setColumnMappings((prev) => ({ ...prev, [header]: value as ColumnType }))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Text">Text</SelectItem>
                      <SelectItem value="Number">Number</SelectItem>
                      <SelectItem value="Date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport}>Import {parsedData.rows.length} Rows</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
