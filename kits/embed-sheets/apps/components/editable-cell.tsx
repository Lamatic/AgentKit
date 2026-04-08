"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import type { Column, Cell } from "@/lib/types"
import { MarkdownCell } from "./markdown-cell"
import { ImageCell } from "./image-cell"

interface EditableCellProps {
  cell: Cell
  column: Column
  onUpdate: (value: string) => void
  isReadOnly?: boolean
}

export function EditableCell({ cell, column, onUpdate, isReadOnly }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(cell.value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(cell.value)
  }, [cell.value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (value !== cell.value) {
      onUpdate(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur()
    } else if (e.key === "Escape") {
      setValue(cell.value)
      setIsEditing(false)
    }
  }

  if (isReadOnly || column.type === "AI") {
    if (cell.value && cell.status !== "processing") {
      // Check if this is an image output
      if (column.outputFormat === "image") {
        return <ImageCell imageUrl={cell.value} />
      }

      // Otherwise render as markdown (text output)
      return <MarkdownCell content={cell.value} />
    }

    return (
      <div className="flex items-center">
        {cell.status === "processing" ? (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50">
            Processing...
          </span>
        ) : cell.status === "error" ? (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50">
            Error
          </span>
        ) : (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100">
            Ready
          </span>
        )}
      </div>
    )
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={column.type === "Number" ? "number" : column.type === "Date" ? "date" : "text"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 border-blue-500 text-sm px-2 py-1 focus-visible:ring-1 focus-visible:ring-blue-500"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="min-h-[28px] cursor-text rounded text-sm text-gray-900 hover:bg-gray-100/50 px-1 py-0.5 -mx-1"
    >
      {value || <span className="text-gray-400">Empty</span>}
    </div>
  )
}
