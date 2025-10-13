"use client"

import { useWorkbookStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { FileText, Github } from "lucide-react"
import Image from "next/image"

export function WorkbookHeader() {
  const { workbook } = useWorkbookStore()

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center gap-3">
        <Image src="/lamatic-logo.png" alt="Lamatic" width={40} height={40} className="h-10 w-10" />
        <h1 className="text-xl font-semibold text-gray-900">
          Lamatic Sheets <span className="text-blue-600">Kit</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="default"
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => window.open("https://docs.lamatic.ai", "_blank")}
        >
          <FileText className="h-4 w-4" />
          Docs
        </Button>
        <Button
          size="default"
          className="gap-2 bg-gray-900 text-white hover:bg-gray-800"
          onClick={() => window.open("https://github.com/lamatic", "_blank")}
        >
          <Github className="h-4 w-4" />
          GitHub
        </Button>
      </div>
    </header>
  )
}
