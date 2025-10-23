import type React from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseInlineFormatting = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    let currentIndex = 0
    const regex = /(\*\*.*?\*\*|\*(?!\*).*?\*(?!\*)|`.*?`|\[.*?\]$$.*?$$)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        elements.push(text.substring(currentIndex, match.index))
      }

      const matched = match[0]

      if (matched.startsWith("**") && matched.endsWith("**")) {
        elements.push(
          <strong key={match.index} className="font-semibold text-orange-400">
            {matched.slice(2, -2)}
          </strong>,
        )
      } else if (matched.startsWith("*") && matched.endsWith("*") && !matched.startsWith("**")) {
        elements.push(
          <em key={match.index} className="italic">
            {matched.slice(1, -1)}
          </em>,
        )
      } else if (matched.startsWith("`") && matched.endsWith("`")) {
        elements.push(
          <code key={match.index} className="bg-slate-800 px-1.5 py-0.5 rounded text-orange-400 text-sm font-mono">
            {matched.slice(1, -1)}
          </code>,
        )
      } else if (matched.startsWith("[")) {
        const linkMatch = matched.match(/\[(.*?)\]$$(.*?)$$/)
        if (linkMatch) {
          elements.push(
            <a
              key={match.index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              {linkMatch[1]}
            </a>,
          )
        }
      }

      currentIndex = match.index + matched.length
    }

    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex))
    }

    return elements.length > 0 ? elements : [text]
  }

  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Headings
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-lg font-bold text-orange-300 mt-4 mb-2">
          {parseInlineFormatting(trimmed.substring(5))}
        </h4>,
      )
      i++
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-xl font-bold text-orange-400 mt-5 mb-2">
          {parseInlineFormatting(trimmed.substring(4))}
        </h3>,
      )
      i++
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-2xl font-bold text-yellow-400 mt-6 mb-3">
          {parseInlineFormatting(trimmed.substring(3))}
        </h2>,
      )
      i++
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-3xl font-bold text-yellow-400 mt-6 mb-3">
          {parseInlineFormatting(trimmed.substring(2))}
        </h1>,
      )
      i++
    }
    // Unordered lists
    else if (trimmed.match(/^[-*+]\s/)) {
      const listItems: React.ReactNode[] = []
      const startIndex = i
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s/)) {
        const content = lines[i].trim().substring(2)
        listItems.push(
          <li key={i} className="mb-1">
            {parseInlineFormatting(content)}
          </li>,
        )
        i++
      }
      elements.push(
        <ul key={startIndex} className="list-disc list-inside space-y-1 mb-3 text-gray-200">
          {listItems}
        </ul>,
      )
    }
    // Ordered lists
    else if (trimmed.match(/^\d+\.\s/)) {
      const listItems: React.ReactNode[] = []
      const startIndex = i
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        const content = lines[i].trim().replace(/^\d+\.\s/, "")
        listItems.push(
          <li key={i} className="mb-1">
            {parseInlineFormatting(content)}
          </li>,
        )
        i++
      }
      elements.push(
        <ol key={startIndex} className="list-decimal list-inside space-y-1 mb-3 text-gray-200">
          {listItems}
        </ol>,
      )
    }
    // Empty lines
    else if (trimmed === "") {
      i++
    }
    // Regular paragraphs
    else {
      elements.push(
        <p key={i} className="mb-3 text-gray-200 leading-relaxed">
          {parseInlineFormatting(trimmed)}
        </p>,
      )
      i++
    }
  }

  return <div className="prose prose-invert max-w-none">{elements}</div>
}
