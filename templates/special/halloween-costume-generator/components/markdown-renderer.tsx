interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderLine = (line: string, index: number) => {
    // Handle headings
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-2xl font-bold text-orange-400 mt-6 mb-3">
          {line.substring(4)}
        </h3>
      )
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-3xl font-bold text-yellow-400 mt-8 mb-4">
          {line.substring(3)}
        </h2>
      )
    }
    if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="text-4xl font-bold text-yellow-400 mt-8 mb-4">
          {line.substring(2)}
        </h1>
      )
    }

    // Handle empty lines
    if (line.trim() === "") {
      return <div key={index} className="h-4" />
    }

    // Handle bold text and other inline formatting
    const parts = line.split(/(\*\*.*?\*\*)/g)
    const formatted = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-orange-300">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return <span key={i}>{part}</span>
    })

    // Check if it's a list item
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <li key={index} className="ml-6 mb-2 text-gray-200">
          {formatted}
        </li>
      )
    }

    return (
      <p key={index} className="mb-3 text-gray-200 leading-relaxed">
        {formatted}
      </p>
    )
  }

  const lines = content.split("\n")
  return <div className="space-y-1">{lines.map((line, index) => renderLine(line, index))}</div>
}
