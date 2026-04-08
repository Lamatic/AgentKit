"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SelectedStocksDisplayProps {
  stocks: string[] // Changed to store only symbol strings
  onRemove: (symbol: string) => void
  maxLimit: number
}

export function SelectedStocksDisplay({ stocks, onRemove, maxLimit }: SelectedStocksDisplayProps) {
  if (stocks.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Selected Stocks ({stocks.length}/{maxLimit === 0 ? "∞" : maxLimit})
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {stocks.map((symbol) => (
          <div
            key={symbol}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm"
          >
            <span className="font-semibold text-primary">{symbol}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-primary/20"
              onClick={() => onRemove(symbol)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
