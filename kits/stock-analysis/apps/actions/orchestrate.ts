"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_FINANCE, "base64").toString("utf8"));

interface StockSuggestion {
  symbol: string
  name: string
  currency: string
  exchangeFullName: string
  exchange: string
}

interface StockSearchResult {
  success: boolean
  suggestions?: StockSuggestion[]
  error?: string
}

export async function searchStocks(searchQuery: string): Promise<StockSearchResult> {
  try {
    if (!searchQuery || searchQuery.length < 3) {
      return {
        success: true,
        suggestions: [],
      }
    }

    console.log("[v0] Searching stocks with query:", searchQuery)

    const flow = config.flows.stock_finder
    const inputs = {
      searchQuery: searchQuery,
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Stock search response:", resData)

    const suggestions = resData?.result?.suggestions || []

    return {
      success: true,
      suggestions: suggestions,
    }
  } catch (error) {
    console.error("[v0] Error searching stocks:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search stocks",
      suggestions: [],
    }
  }
}

export interface CompanyProfile {
  symbol: string
  price: number
  marketCap: number
  beta: number
  lastDividend: number
  range: string
  change: number
  changePercentage: number
  volume: number
  averageVolume: number
  companyName: string
  currency: string
  cik: string
  isin: string
  cusip: string
  exchangeFullName: string
  exchange: string
  industry: string
  website: string
  description: string
  ceo: string
  sector: string
  country: string
  fullTimeEmployees: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  image: string
  ipoDate: string
  defaultImage: boolean
  isEtf: boolean
  isActivelyTrading: boolean
  isAdr: boolean
  isFund: boolean
}

interface CompanyProfilerResult {
  success: boolean
  profiles?: CompanyProfile[]
  error?: string
}

export async function getCompanyProfiles(symbols: string[]): Promise<CompanyProfilerResult> {
  try {
    if (!symbols || symbols.length === 0) {
      return {
        success: false,
        error: "No symbols provided",
      }
    }

    console.log("[v0] Fetching company profiles for symbols:", symbols)

    const flow = config.flows.company_profiler
    const inputs = {
      companies: symbols,
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Company profiler response:", resData)

    const profiles = resData?.result?.profiles || []

    return {
      success: true,
      profiles: profiles,
    }
  } catch (error) {
    console.error("[v0] Error fetching company profiles:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch company profiles",
    }
  }
}


export interface ChartData {
  title: string
  description: string
  code: string
}

export interface ComparativeAnalysisResult {
  success: boolean
  analysis?: string
  charts?: ChartData[]
  error?: string
}

export async function getComparativeAnalysis(symbols: string[]): Promise<ComparativeAnalysisResult> {
  try {
    if (!symbols || symbols.length === 0) {
      return {
        success: false,
        error: "No symbols provided",
      }
    }

    console.log("[v0] Fetching comparative analysis for symbols:", symbols)
    console.log("[v0] Flow config:", config.flows.comparitive_analysis)

    const flow = config.flows.comparitive_analysis
    const inputs = {
      companies: symbols,
    }

    console.log("[v0] Sending payload to comparitive_analysis:", JSON.stringify(inputs))

    let resData
    try {
      resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    } catch (flowError) {
      console.error("[v0] Flow execution error:", flowError)
      console.error("[v0] Flow error details:", JSON.stringify(flowError, null, 2))
      throw flowError
    }

    console.log("[v0] Comparative analysis response received:", JSON.stringify(resData, null, 2))

    const analysis = resData?.result?.comparitive_analysis || ""
    const charts = resData?.result?.charts || []

    return {
      success: true,
      analysis,
      charts,
    }
  } catch (error) {
    console.error("[v0] Error fetching comparative analysis:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch comparative analysis"
    console.error("[v0] Full error object:", JSON.stringify(error, null, 2))
    return {
      success: false,
      error: errorMessage,
    }
  }
}
