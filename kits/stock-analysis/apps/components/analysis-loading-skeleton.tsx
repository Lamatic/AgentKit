"use client"

import { Card } from "@/components/ui/card"

export function AnalysisLoadingSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded-md w-32 animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-48 animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-5/6 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-4/5 animate-pulse" />
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-5/6 animate-pulse" />
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <div className="h-64 bg-muted rounded-md animate-pulse" />
        </div>
      </Card>
    </div>
  )
}
