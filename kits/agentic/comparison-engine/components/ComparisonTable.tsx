import type React from "react"
import { Card } from "@/components/ui/card"
import { Check, X, Minus } from "lucide-react"

interface ComparisonRow {
  feature: string
  entity1Value: string | boolean | number
  entity2Value: string | boolean | number
  winner?: 1 | 2 | 0 // 0 for draw
}

interface ComparisonTableProps {
  entity1Name: string
  entity2Name: string
  rows: ComparisonRow[]
}

const renderValue = (value: string | boolean | number) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-red-500 mx-auto" />
    )
  }
  if (value === undefined || value === null || value === "") {
    return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
  }
  return <span className="text-sm font-medium">{value}</span>
}

export const ComparisonTable = ({
  entity1Name,
  entity2Name,
  rows,
}: ComparisonTableProps) => {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="p-4 text-left font-semibold text-sm text-foreground w-[40%]">
                Feature / Metric
              </th>
              <th className="p-4 text-center font-bold text-sm text-foreground w-[30%] border-l border-border bg-primary/5">
                {entity1Name}
              </th>
              <th className="p-4 text-center font-bold text-sm text-foreground w-[30%] border-l border-border bg-red-500/5">
                {entity2Name}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className={`hover:bg-accent/50 transition-colors ${
                  row.winner === 1 ? 'bg-green-50/20' : row.winner === 2 ? 'bg-red-50/20' : ''
                }`}
              >
                <td className="p-4 text-sm font-medium text-foreground">
                  {row.feature}
                </td>
                <td className={`p-4 text-center border-l border-border ${row.winner === 1 ? 'font-bold' : ''}`}>
                  {renderValue(row.entity1Value)}
                </td>
                <td className={`p-4 text-center border-l border-border ${row.winner === 2 ? 'font-bold' : ''}`}>
                  {renderValue(row.entity2Value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
