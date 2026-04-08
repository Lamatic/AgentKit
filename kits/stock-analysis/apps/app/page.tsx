"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Github, Loader2 } from "lucide-react"
import Link from "next/link"
import { StockSearchWidget } from "@/components/stock-search-widget"
import { SelectedStocksDisplay } from "@/components/selected-stocks-display"
import { CompanyProfilesDisplay } from "@/components/company-profiles-display"
import { AnalysisLoadingSkeleton } from "@/components/analysis-loading-skeleton"
import { ComparativeAnalysisDisplay } from "@/components/comparative-analysis-display"
import { useToast } from "@/hooks/use-toast"
import { getCompanyProfiles, type CompanyProfile } from "@/actions/orchestrate"
import { getComparativeAnalysis, type ChartData } from "@/actions/orchestrate"

const MAX_STOCK_SELECTION_LIMIT = Number.parseInt(process.env.NEXT_PUBLIC_MAX_STOCKS_SELECTION_LIMIT || "5")

export default function FinanceKit() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([])
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[] | null>(null)
  const [comparativeAnalysis, setComparativeAnalysis] = useState<{
    analysis: string
    charts: ChartData[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isSelectionDisabled = MAX_STOCK_SELECTION_LIMIT > 0 && selectedStocks.length >= MAX_STOCK_SELECTION_LIMIT

  const handleSelectStock = (stock: any) => {
    if (MAX_STOCK_SELECTION_LIMIT > 0 && selectedStocks.length >= MAX_STOCK_SELECTION_LIMIT) {
      toast({
        title: "Selection Limit Reached",
        description: `You can select a maximum of ${MAX_STOCK_SELECTION_LIMIT} stocks.`,
        variant: "destructive",
      })
      return
    }

    setSelectedStocks((prev) => [...prev, stock.symbol])
    toast({
      title: "Stock Added",
      description: `${stock.symbol} has been added to your selection.`,
    })
  }

  const handleRemoveStock = (symbol: string) => {
    setSelectedStocks((prev) => prev.filter((s) => s !== symbol))
    toast({
      title: "Stock Removed",
      description: `${symbol} has been removed from your selection.`,
    })
  }

  const handleAnalyzeStocks = async () => {
    if (selectedStocks.length === 0) {
      toast({
        title: "No Stocks Selected",
        description: "Please select at least one stock to analyze.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const profilesResult = await getCompanyProfiles(selectedStocks)

      if (profilesResult.success && profilesResult.profiles) {
        setCompanyProfiles(profilesResult.profiles)

        const analysisResult = await getComparativeAnalysis(selectedStocks)

        if (analysisResult.success && analysisResult.analysis) {
          setComparativeAnalysis({
            analysis: analysisResult.analysis,
            charts: analysisResult.charts || [],
          })
        } else {
          toast({
            title: "Warning",
            description: "Company profiles loaded but comparative analysis failed",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: profilesResult.error || "Failed to fetch company profiles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error analyzing stocks:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (companyProfiles) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Link href="/" passHref>
              <h1 className="text-2xl font-bold tracking-tight select-none">
                <span className="text-black dark:text-white">Agent Kit</span>
                <span className="text-blue-600"> Finance</span>
              </h1>
            </Link>
            <div className="flex gap-4">
              <Link
                href="https://lamatic.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Docs
              </Link>
              <Link
                href="https://github.com/Lamatic/AgentKit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 px-6 py-12">
          <div className="max-w-7xl mx-auto space-y-8">
            {!comparativeAnalysis && (
              <div className="text-center">
                <Button
                  onClick={() => {
                    const element = document.getElementById("comparative-analysis-section")
                    element?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2"
                >
                  View Comparative Analysis ↓
                </Button>
              </div>
            )}

            {/* Company Profiles */}
            <CompanyProfilesDisplay
              profiles={companyProfiles}
              onBack={() => {
                setCompanyProfiles(null)
                setComparativeAnalysis(null)
              }}
            />

            {isLoading && (
              <div id="comparative-analysis-section">
                <h2 className="text-2xl font-bold text-foreground mb-4">Analysis</h2>
                <AnalysisLoadingSkeleton />
              </div>
            )}

            {comparativeAnalysis && !isLoading && (
              <div id="comparative-analysis-section">
                <h2 className="text-2xl font-bold text-foreground mb-4">Comparative Analysis</h2>
                <ComparativeAnalysisDisplay
                  analysis={comparativeAnalysis.analysis}
                  charts={comparativeAnalysis.charts}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" passHref>
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-black dark:text-white">Agent Kit</span>
              <span className="text-blue-600"> Finance</span>
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Docs
            </Link>
            <Link
              href="https://github.com/Lamatic/AgentKit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="space-y-8">
            {/* Title Section */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold text-balance">Stock Portfolio Analyzer</h1>
              <p className="text-lg text-muted-foreground">
                {MAX_STOCK_SELECTION_LIMIT > 0
                  ? `Select up to ${MAX_STOCK_SELECTION_LIMIT} stocks to analyze and compare`
                  : "Select stocks to analyze and compare"}
              </p>
            </div>

            {/* Card Container */}
            <Card className="p-8 space-y-6">
              {/* Selected Stocks Display */}
              {selectedStocks.length > 0 && (
                <div className="pb-6 border-b border-border">
                  <SelectedStocksDisplay
                    stocks={selectedStocks}
                    onRemove={handleRemoveStock}
                    maxLimit={MAX_STOCK_SELECTION_LIMIT}
                  />
                </div>
              )}

              {/* Stock Search Widget */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Search Stocks</label>
                <StockSearchWidget
                  onSelectStock={handleSelectStock}
                  isSelectionDisabled={isSelectionDisabled}
                  selectedSymbols={selectedStocks}
                />
              </div>

              {/* Info Text */}
              <div className="pt-4 text-xs text-muted-foreground space-y-2">
                <p>• Type at least 3 characters to search for stocks</p>
                <p>• Results are grouped by exchange for easy browsing</p>
                {MAX_STOCK_SELECTION_LIMIT > 0 && (
                  <p>• You can select up to {MAX_STOCK_SELECTION_LIMIT} stocks for analysis</p>
                )}
              </div>

              {/* Action Button */}
              {selectedStocks.length > 0 && (
                <Button
                  onClick={handleAnalyzeStocks}
                  disabled={isLoading || selectedStocks.length === 0}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Stocks...
                    </>
                  ) : (
                    `Analyze Selected Stocks (${selectedStocks.length})`
                  )}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
