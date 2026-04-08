import { SheetTabs } from "@/components/sheet-tabs"
import { SpreadsheetGrid } from "@/components/spreadsheet-grid"
import { WorkbookHeader } from "@/components/workbook-header"

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <WorkbookHeader />

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-hidden bg-background p-4">
            <SpreadsheetGrid />
          </div>

          <SheetTabs />
        </div>
      </main>
    </div>
  )
}
