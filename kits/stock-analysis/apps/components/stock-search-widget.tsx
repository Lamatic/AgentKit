"use client"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2 } from "lucide-react"
import { searchStocks } from "@/actions/orchestrate"

interface StockSuggestion {
  symbol: string
  name: string
  currency: string
  exchangeFullName: string
  exchange: string
}

interface StockSearchWidgetProps {
  onSelectStock: (stock: StockSuggestion) => void
  isSelectionDisabled: boolean
  selectedSymbols: string[]
}

export function StockSearchWidget({ onSelectStock, isSelectionDisabled, selectedSymbols }: StockSearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const groupedSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      const exchange = suggestion.exchange
      if (!acc[exchange]) {
        acc[exchange] = []
      }
      acc[exchange].push(suggestion)
      return acc
    },
    {} as Record<string, StockSuggestion[]>,
  )

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)

    try {
      const result = await searchStocks(query)
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectStock = (stock: StockSuggestion) => {
    if (!isSelectionDisabled && !selectedSymbols.includes(stock.symbol)) {
      onSelectStock(stock)
      setSearchQuery("")
      setSuggestions([])
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search stocks (min 3 characters)..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.length >= 3 && setIsOpen(true)}
          className="pl-10 pr-4 h-12 bg-card border-input rounded-lg"
          disabled={isSelectionDisabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-0 z-50 shadow-lg">
          <ScrollArea className="h-96">
            <div className="divide-y divide-border">
              {Object.entries(groupedSuggestions).map(([exchange, stocks]) => (
                <div key={exchange}>
                  <div className="sticky top-0 px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                    {exchange}
                  </div>
                  <div className="divide-y divide-border/50">
                    {stocks.map((stock) => {
                      const isSelected = selectedSymbols.includes(stock.symbol)
                      return (
                        <button
                          key={stock.symbol}
                          onClick={() => handleSelectStock(stock)}
                          disabled={isSelectionDisabled || isSelected}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-muted/30 opacity-50 cursor-not-allowed"
                              : isSelectionDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-accent/50 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-foreground">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{stock.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {stock.currency} • {stock.exchangeFullName}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="text-xs font-medium text-primary whitespace-nowrap">Selected</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {isOpen && isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching stocks...
          </div>
        </Card>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && searchQuery.length >= 3 && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 z-50 shadow-lg">
          <div className="text-sm text-muted-foreground text-center">No stocks found</div>
        </Card>
      )}
    </div>
  )
}
