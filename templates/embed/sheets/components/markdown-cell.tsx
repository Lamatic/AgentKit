"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MarkdownCellProps {
  content: string
}

export function MarkdownCell({ content }: MarkdownCellProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const safeContent = typeof content === "string" ? content : String(content || "")

  const renderMarkdown = (text: string) => {
    if (typeof text !== "string") {
      return String(text || "")
    }

    let html = text

    // Headings: # H1, ## H2, ### H3, etc.
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>')
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>')

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>")

    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")
    html = html.replace(/_(.*?)_/g, "<em>$1</em>")

    // Code: `code`
    html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')

    // Line breaks
    html = html.replace(/\n/g, "<br />")

    return html
  }

  const handleCopy = async () => {
    try {
      // Copy the raw content (original markdown from Lamatic with line breaks preserved)
      await navigator.clipboard.writeText(safeContent)
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Raw markdown content has been copied.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy content to clipboard.",
        variant: "destructive",
      })
    }
  }

  const truncatedText = safeContent.length > 20 ? safeContent.substring(0, 20) + "..." : safeContent
  const needsTruncation = safeContent.length > 20

  return (
    <div className="group relative rounded px-2 py-1">
      {isExpanded ? (
        <div
          className="text-sm text-foreground break-words whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(safeContent) }}
        />
      ) : (
        <div className="text-sm text-foreground h-[32px] flex items-center overflow-hidden">
          <span className="truncate">{truncatedText}</span>
        </div>
      )}

      <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded px-1">
        {/* Copy button */}
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0" title="Copy raw markdown">
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
        </Button>

        {/* Expand/Collapse button - only show if content needs truncation */}
        {needsTruncation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </div>
  )
}
