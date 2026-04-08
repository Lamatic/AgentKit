"use client"

import { useState } from "react"
import type { CompanyProfile } from "@/actions/orchestrate"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Globe, Users, Building2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"

interface CompanyProfilesDisplayProps {
  profiles: CompanyProfile[]
  onBack: () => void
}

export function CompanyProfilesDisplay({ profiles, onBack }: CompanyProfilesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T"
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
    return num.toFixed(2)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Company Profiles</h2>
          <p className="text-muted-foreground mt-1">
            Detailed analysis of {profiles.length} selected {profiles.length === 1 ? "stock" : "stocks"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
        >
          ← Back to Selection
        </button>
      </div>

      <Card className="overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors border-b border-border"
        >
          <h3 className="font-semibold text-foreground">Company Details</h3>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="p-6">
            {/* Profiles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {profiles.map((profile) => (
                <Card key={profile.symbol} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Card Header with Image */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-b border-border flex items-center justify-center overflow-hidden">
                    {profile.image && !profile.defaultImage ? (
                      <Image
                        src={profile.image || "/placeholder.svg"}
                        alt={profile.companyName}
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                        {profile.symbol.substring(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-6">
                    {/* Company Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{profile.symbol}</h3>
                          <p className="text-sm text-muted-foreground">{profile.companyName}</p>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {profile.exchange}
                        </Badge>
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Current Price</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(profile.price)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Change</p>
                        <div
                          className={`flex items-center gap-1 text-lg font-semibold ${
                            profile.change >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {profile.change >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {formatCurrency(Math.abs(profile.change))} ({profile.changePercentage.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Market Cap</p>
                        <p className="text-lg font-semibold text-foreground">{formatNumber(profile.marketCap)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Beta</p>
                        <p className="text-lg font-semibold text-foreground">{profile.beta.toFixed(3)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">52-Week Range</p>
                        <p className="text-sm text-foreground">{profile.range}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Dividend</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(profile.lastDividend)}</p>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Volume
                        </p>
                        <p className="text-sm font-semibold text-foreground">{formatNumber(profile.volume)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Avg Volume</p>
                        <p className="text-sm font-semibold text-foreground">{formatNumber(profile.averageVolume)}</p>
                      </div>
                    </div>

                    {/* Company Info */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Sector
                          </p>
                          <p className="text-sm font-medium text-foreground">{profile.sector}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Industry</p>
                          <p className="text-sm font-medium text-foreground">{profile.industry}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          CEO
                        </p>
                        <p className="text-sm font-medium text-foreground">{profile.ceo}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Employees</p>
                        <p className="text-sm font-medium text-foreground">
                          {Number.parseInt(profile.fullTimeEmployees).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">IPO Date</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(profile.ipoDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Address & Contact */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Headquarters</p>
                        <p className="text-sm text-foreground">
                          {profile.address}, {profile.city}, {profile.state} {profile.zip}
                        </p>
                        <p className="text-sm text-foreground">{profile.country}</p>
                      </div>

                      <div className="flex gap-4">
                        {profile.phone && (
                          <a href={`tel:${profile.phone}`} className="text-sm text-blue-600 hover:underline">
                            {profile.phone}
                          </a>
                        )}
                        {profile.website && (
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium">About</p>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-4">{profile.description}</p>
                    </div>

                    {/* Financial Identifiers */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border text-xs">
                      <div>
                        <p className="text-muted-foreground">CIK</p>
                        <p className="font-mono text-foreground">{profile.cik}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ISIN</p>
                        <p className="font-mono text-foreground">{profile.isin}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CUSIP</p>
                        <p className="font-mono text-foreground">{profile.cusip}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Exchange</p>
                        <p className="font-mono text-foreground">{profile.exchangeFullName}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
