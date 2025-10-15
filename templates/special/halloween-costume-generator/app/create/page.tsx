"use client"

import { useEffect, useState } from "react"
import type { JSX } from "react/jsx-runtime"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useApp } from "../contexts/AppContext"
import { executeAIProcessing } from "@/actions/orchestrate"

const parseMarkdown = (markdown: string | null | undefined) => {
  if (!markdown) return []

  // Ensure markdown is a string
  const markdownString = typeof markdown === "string" ? markdown : String(markdown)

  const lines = markdownString.split("\n")
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listType: "ul" | null = null

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className="list-disc list-inside space-y-2 mb-4 text-gray-300 font-sans"
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
          ))}
        </ListTag>,
      )
      listItems = []
      listType = null
    }
  }

  const parseBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400 font-semibold">$1</strong>')
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      flushList()
      return
    }

    // Headers
    if (trimmedLine.startsWith("### ")) {
      flushList()
      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-2xl font-semibold mt-6 mb-3 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
        >
          {trimmedLine.substring(4)}
        </h3>,
      )
    } else if (trimmedLine.startsWith("## ")) {
      flushList()
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-3xl font-bold mt-8 mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
        >
          {trimmedLine.substring(3)}
        </h2>,
      )
    } else if (trimmedLine.startsWith("# ")) {
      flushList()
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
        >
          {trimmedLine.substring(2)}
        </h1>,
      )
    }
    // Bullet list
    else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      if (listType !== "ul") {
        flushList()
        listType = "ul"
      }
      listItems.push(trimmedLine.substring(2))
    }
    // Regular paragraph (including lines that start with numbers)
    else {
      flushList()
      elements.push(
        <p
          key={`p-${index}`}
          className="text-gray-300 leading-relaxed mb-4 font-sans"
          dangerouslySetInnerHTML={{ __html: parseBold(trimmedLine) }}
        />,
      )
    }
  })

  flushList()
  return elements
}

export default function CreatePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [markdownContent, setMarkdownContent] = useState<string>("")
  const [isFetchingProducts, setIsFetchingProducts] = useState(false)
  const router = useRouter()
  const { selectedImage } = useApp()

  useEffect(() => {
    if (selectedImage) {
      console.log("[v0] Selected image from context")
      setImageUrl(selectedImage)

      const cachedMarkdown = sessionStorage.getItem("cachedMarkdown")
      const cachedImageKey = sessionStorage.getItem("cachedMarkdownImageKey")

      if (cachedMarkdown && cachedImageKey === selectedImage) {
        // Use cached data
        setMarkdownContent(cachedMarkdown)
      } else {
        // Fetch new data
        fetchProducts(selectedImage)
      }
    }

    setIsLoading(false)
  }, [selectedImage])

  const fetchProducts = async (imageBase64: string) => {
    setIsFetchingProducts(true)

    const base64Only = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64

    try {
      console.log("[v0] Calling executeAIProcessing with Lamatic SDK")

      const result = await executeAIProcessing({
        image: base64Only,
        theme: "halloween",
      })

      console.log("[v0] Lamatic SDK result:", result)

      if (result.success && result.data) {
        const markdownData = result.data?.result?.products || result.data?.products || JSON.stringify(result.data)
        setMarkdownContent(markdownData)

        sessionStorage.setItem("cachedMarkdown", markdownData)
        sessionStorage.setItem("cachedMarkdownImageKey", imageBase64)
      } else if (result.error) {
        console.error("[v0] Lamatic SDK Error:", result.error)
      }
    } catch (error) {
      console.error("[v0] API Error:", error)
    } finally {
      setIsFetchingProducts(false)
    }
  }

  if (isLoading || isFetchingProducts) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="flex items-center justify-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-400 border-r-transparent"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
        </div>
        <p className="mt-4 text-lg text-white font-medium">Generating steps...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />

      <header className="relative z-10 flex items-center justify-between p-6 bg-black/30 backdrop-blur-sm border-b border-orange-500/20">
        <button
          onClick={() => router.push("/images")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-orange-500/20 hover:border-orange-500/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Link href="/">
          <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity">
            Spookify
          </h1>
        </Link>

        <div className="w-24" />
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl lg:text-6xl font-serif font-bold bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent leading-tight">
              Create Your Design
            </h2>
            <p className="text-gray-400 text-lg">Customize and bring your spooky vision to life</p>
          </div>

          {imageUrl && (
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300" />
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Selected image"
                  className="relative w-full max-w-2xl h-auto rounded-lg border border-orange-500/20 shadow-2xl"
                />
              </div>
            </div>
          )}

          {markdownContent && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-xl p-8 shadow-2xl">
                <div className="font-serif">{parseMarkdown(markdownContent)}</div>
              </div>
            </div>
          )}

          {!imageUrl && (
            <div className="flex justify-center">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg">No image selected</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
