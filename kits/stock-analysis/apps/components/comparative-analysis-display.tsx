"use client"

import React, { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChartData } from "@/actions/orchestrate"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface ComparativeAnalysisDisplayProps {
  analysis: string
  charts: ChartData[]
}

// 🔹 Dynamic Chart Renderer
function ChartRenderer({ chartData }: { chartData: ChartData }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const ChartComponent = useMemo(() => {
    try {
      const componentFactory = new Function(
        "React",
        "Recharts",
        `
          const { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } = Recharts;
          const exports = {};
          const module = { exports };

          // Wrap user chart code in a function-safe environment
          (function() {
            ${chartData.code}
          })();

          const Comp = module.exports?.default || module.exports || exports.default || Object.values(exports)[0];

          return typeof Comp === "function"
            ? Comp
            : () => React.createElement('div', { className: 'text-red-600' }, '⚠️ Chart missing valid export');
        `
      )

      const Comp = componentFactory(React, {
        BarChart,
        Bar,
        LineChart,
        Line,
        AreaChart,
        Area,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
        ResponsiveContainer,
        Radar,
        RadarChart,
        PolarGrid,
        PolarAngleAxis,
        PolarRadiusAxis,
      })

      return Comp
    } catch (err) {
      console.error("❌ Chart render error:", err)
      return () => (
        <div className="text-red-600 text-sm">
          ⚠️ Error rendering chart.  
          <pre className="text-xs whitespace-pre-wrap mt-2">{String(err)}</pre>
          <pre className="bg-muted p-2 mt-2 rounded text-xs overflow-x-auto">{chartData.code}</pre>
        </div>
      )
    }
  }, [chartData.code])

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors border-b border-border"
      >
        <div className="text-left">
          <h3 className="font-semibold text-foreground">{chartData.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{chartData.description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 bg-background">
          <ChartComponent />
        </div>
      )}
    </Card>
  )
}

// 🔹 Main Component
export function ComparativeAnalysisDisplay({ analysis, charts }: ComparativeAnalysisDisplayProps) {
  return (
    <div className="w-full space-y-6">
      {/* Markdown Section */}
      <Card className="p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ ...props }) => <h1 className="text-4xl font-bold mt-8 mb-4 text-foreground" {...props} />,
            h2: ({ ...props }) => (
              <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground border-b border-border pb-2" {...props} />
            ),
            h3: ({ ...props }) => <h3 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props} />,
            p: ({ ...props }) => <p className="text-foreground leading-relaxed mb-4" {...props} />,
            code: ({ inline, ...props }) =>
              inline ? (
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground" {...props} />
              ) : (
                <pre className="bg-muted p-4 rounded text-sm font-mono text-foreground overflow-x-auto my-4" {...props} />
              ),
          }}
        >
          {analysis}
        </ReactMarkdown>
      </Card>

      {/* Charts Section */}
      {charts && charts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Analysis Charts</h2>
          <div className="space-y-4">
            {charts.map((chart, index) => (
              <ChartRenderer key={index} chartData={chart} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
