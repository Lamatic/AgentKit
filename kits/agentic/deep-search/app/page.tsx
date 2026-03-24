"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowUp, ExternalLink, FileText, Github } from "lucide-react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import { orchestratePipelineStep } from "@/actions/orchestrate"
import { Typewriter } from "react-simple-typewriter"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Message {
  role: "user" | "assistant"
  message: string
  references?: string[]
  steps?: string
  isTyping?: boolean
  links?: string[]
  isProcessing?: boolean
}

interface FlowResponse {
  success: boolean
  flowId: string
  flowName: string
  data: Record<string, any>
  error?: string
  links?: string[]
}

const PERSONALITIES = [
  { name: "Elon Musk", emoji: "🚀" },
  { name: "Einstein", emoji: "🧠" },
  { name: "Shakespeare", emoji: "🎭" },
  { name: "Steve Jobs", emoji: "🍎" },
]

const getPersonalityEmoji = (name: string): string => {
  const match = PERSONALITIES.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  )
  return match ? match.emoji : "🌟"
}

const getPersonalitySuggestions = (name: string): string[] => {
  const lower = name.toLowerCase()
  if (lower.includes("elon") || lower.includes("musk")) {
    return [
      "What's your vision for colonising Mars?",
      "How do you think about first principles?",
      "What's the future of electric vehicles?",
    ]
  }
  if (lower.includes("einstein")) {
    return [
      "Can you explain the theory of relativity simply?",
      "What is the relationship between energy and mass?",
      "How do you approach unsolvable problems?",
    ]
  }
  if (lower.includes("shakespeare")) {
    return [
      "Write me a sonnet about modern technology",
      "What makes a truly tragic hero?",
      "How do you craft compelling dialogue?",
    ]
  }
  if (lower.includes("jobs") || lower.includes("steve")) {
    return [
      "How do you define great product design?",
      "What does it mean to think differently?",
      "How do you build a company culture of excellence?",
    ]
  }
  return [
    `What are your most important ideas?`,
    `What lessons from your life should everyone know?`,
    `How do you approach difficult decisions?`,
  ]
}

export default function LamaticThinkMode() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState("")
  const [currentStep, setCurrentStep] = useState<"steps" | "research" | "write" | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchLinks, setSearchLinks] = useState<string[]>([])
  const [isTypewriterDone, setIsTypewriterDone] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingQuery, setPendingQuery] = useState<string>("")
  const hasTrackedRef = useRef(false)

  const [selectedPersonality, setSelectedPersonality] = useState<string>("")
  const [personalityInput, setPersonalityInput] = useState<string>("")
  const [personalityConfirmed, setPersonalityConfirmed] = useState(false)

  const KIT_ID = "reasoning"

  const suggestions = personalityConfirmed
    ? getPersonalitySuggestions(selectedPersonality)
    : [
        "Help me pack for my trip to Jaipur next week",
        "Compare leather sofas vs fabric sofas",
        "How to identify if the pashmina shawl I am buying is genuine?",
      ]

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }, 100)
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    const autostart = url.searchParams.get("autostart")
    const q = url.searchParams.get("query")
    if (autostart === "1" && q && !isLoading && messages.length === 0) {
      handleSubmit(q)
      url.searchParams.delete("autostart")
      url.searchParams.delete("query")
      window.history.replaceState({}, "", url.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePersonalityConfirm = (name?: string) => {
    const finalName = name ?? personalityInput.trim()
    if (!finalName) return
    setSelectedPersonality(finalName)
    setPersonalityConfirmed(true)
  }

  const handlePersonalityReset = () => {
    setSelectedPersonality("")
    setPersonalityInput("")
    setPersonalityConfirmed(false)
    setMessages([])
    setInput("")
  }

  const buildPersonalityPrefix = (): string => {
    if (!personalityConfirmed || !selectedPersonality) return ""
    return `You are ${selectedPersonality}. Respond exactly as ${selectedPersonality} would — use their tone, vocabulary, philosophy, and mannerisms. Stay fully in character throughout. `
  }

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return

    setInput("")
    setCurrentQuery(query)
    setIsSearching(false)
    setSearchLinks([])
    setIsTypewriterDone(false)

    const userMessage: Message = { role: "user", message: query }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setCurrentStep("steps")

    setTimeout(scrollToBottom, 100)

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        message: msg.message,
      }))

      const personalityPrefix = buildPersonalityPrefix()
      const augmentedQuery = personalityPrefix ? `${personalityPrefix}\n\nUser asks: ${query}` : query

      const assistantMessage: Message = {
        role: "assistant",
        message: "",
        isProcessing: true,
      }

      setMessages((prev) => [...prev, assistantMessage])

      const results: Record<string, any> = {}

      const step1Result = await orchestratePipelineStep(augmentedQuery, history, "step1")

      if (!step1Result.success) {
        throw new Error(step1Result.error || "Failed to execute step1")
      }

      if (step1Result.data?.steps) {
        results.step1 = step1Result.data
        setMessages((prev) => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              steps: step1Result.data.steps,
              isProcessing: true,
            }
          }
          return updated
        })
        setCurrentStep("research")

        setTimeout(() => {
          setIsSearching(true)
        }, 500)
      }

      const allLinks: string[] = []

      const step2AResult = await orchestratePipelineStep(augmentedQuery, history, "step2A", results)
      if (step2AResult.success && step2AResult.data && Object.keys(step2AResult.data).length > 0) {
        results.step2A = step2AResult.data
        if (step2AResult.data?.links) allLinks.push(...step2AResult.data.links)
      }

      const step2BResult = await orchestratePipelineStep(augmentedQuery, history, "step2B", results)
      if (step2BResult.success && step2BResult.data && Object.keys(step2BResult.data).length > 0) {
        results.step2B = step2BResult.data
        if (step2BResult.data?.links) allLinks.push(...step2BResult.data.links)
      }

      const step2CResult = await orchestratePipelineStep(augmentedQuery, history, "step2C", results)
      if (step2CResult.success && step2CResult.data && Object.keys(step2CResult.data).length > 0) {
        results.step2C = step2CResult.data
        if (step2CResult.data?.links) allLinks.push(...step2CResult.data.links)
      }

      setSearchLinks(allLinks)
      setCurrentStep("write")

      setMessages((prev) => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]?.role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            links: allLinks,
            isProcessing: true,
          }
        }
        return updated
      })

      setTimeout(() => {
        setIsSearching(false)
      }, 1000)

      const step3Result = await orchestratePipelineStep(augmentedQuery, history, "step3", results)

      if (!step3Result.success) {
        throw new Error(step3Result.error || "Failed to execute step3")
      }

      if (step3Result.data?.answer) {
        setMessages((prev) => {
          const updated = [...prev]
          const lastIndex = updated.length - 1
          if (updated[lastIndex]?.role === "assistant") {
            updated[lastIndex] = {
              role: "assistant",
              message: step3Result.data.answer,
              references: updated[lastIndex].links || allLinks,
              steps: undefined,
              isTyping: false,
              isProcessing: false,
            }
          }
          return updated
        })
        setCurrentStep(null)
      }
    } catch (error) {
      console.error("Error in step-by-step orchestration:", error)
      setMessages((prev) => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (updated[lastIndex]?.role === "assistant") {
          updated[lastIndex] = {
            role: "assistant",
            message: "Sorry, I encountered an error while processing your request. Please try again.",
            isProcessing: false,
          }
        }
        return updated
      })
      setCurrentStep(null)
      setIsSearching(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(input)
  }

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).origin
      return `${domain}/favicon.ico`
    } catch {
      return "/placeholder.svg?height=16&width=16"
    }
  }

  const showPersonalityPicker = !personalityConfirmed
  const showInitialInterface = personalityConfirmed && messages.length === 0 && !isLoading

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --obsidian: #0a0a0c;
          --ink: #111114;
          --surface: #161619;
          --raised: #1e1e23;
          --border: #2a2a32;
          --border-glow: #c9a84c33;
          --gold: #c9a84c;
          --gold-dim: #9a7a35;
          --gold-pale: #f0d98a;
          --text-primary: #f0ece4;
          --text-secondary: #9b9490;
          --text-muted: #5a5650;
          --crimson: #c0392b;
          --crimson-dim: #922b21;
        }

        .elite-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--obsidian);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* Noise texture overlay */
        .elite-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        /* Ambient top glow */
        .elite-root::after {
          content: '';
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(ellipse, #c9a84c18 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .elite-content { position: relative; z-index: 1; }

        /* Header */
        .elite-header {
          border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, #0e0e11 0%, transparent 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .elite-logo-main { color: var(--text-primary); letter-spacing: -0.02em; }
        .elite-logo-accent { color: var(--gold); }

        .elite-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .elite-nav-docs {
          background: transparent;
          border: 1px solid var(--gold-dim);
          color: var(--gold);
        }
        .elite-nav-docs:hover {
          background: var(--gold);
          color: var(--obsidian);
          border-color: var(--gold);
        }

        .elite-nav-github {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .elite-nav-github:hover {
          background: var(--raised);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        /* Personality badge */
        .personality-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px 5px 10px;
          background: linear-gradient(135deg, #1a1508 0%, #1e1a0a 100%);
          border: 1px solid var(--gold-dim);
          border-radius: 100px;
          position: relative;
          overflow: hidden;
        }
        .personality-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, #c9a84c0a, transparent);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        .personality-badge-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--gold-pale);
          letter-spacing: 0.04em;
        }
        .personality-badge-close {
          color: var(--gold-dim);
          font-size: 0.65rem;
          cursor: pointer;
          margin-left: 2px;
          transition: color 0.15s;
          background: none;
          border: none;
          padding: 0;
          line-height: 1;
        }
        .personality-badge-close:hover { color: var(--gold); }

        /* ── Personality Picker ── */
        .picker-stage {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .picker-inner { max-width: 560px; width: 100%; text-align: center; }

        .picker-icon {
          font-size: 5rem;
          line-height: 1;
          margin-bottom: 1.5rem;
          display: block;
          filter: drop-shadow(0 0 32px #c9a84c44);
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .picker-title {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 300;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .picker-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
          font-weight: 300;
        }

        /* Input field */
        .elite-input-wrap { position: relative; margin-bottom: 1.5rem; }

        .elite-input {
          width: 100%;
          height: 58px;
          padding: 0 58px 0 24px;
          font-size: 1rem;
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .elite-input::placeholder { color: var(--text-muted); }
        .elite-input:focus {
          border-color: var(--gold-dim);
          box-shadow: 0 0 0 3px #c9a84c14, 0 4px 20px #00000040;
        }

        .elite-submit-btn {
          position: absolute;
          right: 8px;
          top: 8px;
          width: 42px;
          height: 42px;
          border-radius: 3px;
          background: var(--gold);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--obsidian);
          transition: background 0.2s, transform 0.1s;
        }
        .elite-submit-btn:hover { background: var(--gold-pale); }
        .elite-submit-btn:active { transform: scale(0.96); }
        .elite-submit-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; }

        /* Quick pick chips */
        .chip-label {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }

        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }

        .personality-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 1px solid var(--border);
          border-radius: 3px;
          background: var(--surface);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .personality-chip::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #c9a84c08, transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .personality-chip:hover {
          border-color: var(--gold-dim);
          color: var(--gold-pale);
          background: var(--raised);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px #00000060;
        }
        .personality-chip:hover::before { opacity: 1; }
        .personality-chip-emoji { font-size: 1.2rem; }

        /* ── Initial Chat Interface ── */
        .chat-welcome {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .welcome-emoji {
          font-size: 6rem;
          display: block;
          filter: drop-shadow(0 0 48px #c9a84c55);
          animation: float 4s ease-in-out infinite;
          margin-bottom: 1.5rem;
        }

        .welcome-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .welcome-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          font-weight: 300;
          margin-bottom: 2.5rem;
        }

        .suggestion-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          max-width: 560px;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-secondary);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .suggestion-btn:hover {
          border-color: var(--gold-dim);
          color: var(--text-primary);
          background: var(--raised);
          transform: translateX(4px);
        }
        .suggestion-btn:disabled { opacity: 0.4; pointer-events: none; }
        .suggestion-arrow { color: var(--gold-dim); font-size: 0.85rem; flex-shrink: 0; }

        /* ── Active Chat ── */
        .chat-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

        .message-block { padding: 2.5rem 0; border-bottom: 1px solid var(--border); }
        .message-block:last-child { border-bottom: none; }

        .user-query {
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 300;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .query-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          margin-top: 0.75rem;
        }

        /* Thinking indicator */
        .thinking-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 8px 0;
        }
        .thinking-dots {
          display: flex;
          gap: 4px;
        }
        .thinking-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--gold);
          animation: pulse-dot 1.4s ease-in-out infinite;
        }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        /* Answer layout */
        .answer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .answer-grid { grid-template-columns: 2fr 1fr; }
        }

        /* Personality byline */
        .personality-byline {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .byline-emoji { font-size: 1.3rem; }
        .byline-name {
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
        }

        /* Processing panel */
        .processing-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 3px solid var(--gold-dim);
          border-radius: 4px;
          padding: 20px 24px;
          margin-bottom: 1.5rem;
        }
        .processing-steps {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
        }
        .searching-label {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gold-dim);
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          animation: pulse-dot 1s ease-in-out infinite;
        }

        /* Link pills */
        .link-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .link-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          background: var(--raised);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 0.72rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
        }
        .link-pill:hover { border-color: var(--gold-dim); color: var(--gold-pale); }
        .link-pill img { width: 12px; height: 12px; border-radius: 2px; }

        /* Prose (answer) */
        .answer-prose {
          font-size: 1rem;
          line-height: 1.8;
          color: var(--text-primary);
        }
        .answer-prose h1 { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 400; margin: 1.5rem 0 0.75rem; color: var(--text-primary); letter-spacing: -0.01em; }
        .answer-prose h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 400; margin: 1.25rem 0 0.5rem; color: var(--text-primary); }
        .answer-prose h3 { font-size: 1rem; font-weight: 500; margin: 1rem 0 0.4rem; color: var(--text-primary); letter-spacing: 0.03em; text-transform: uppercase; font-size: 0.8rem; }
        .answer-prose p { margin-bottom: 1rem; color: var(--text-primary); }
        .answer-prose ul { margin: 0.75rem 0 1rem 1.25rem; }
        .answer-prose li { margin-bottom: 0.4rem; color: var(--text-secondary); }
        .answer-prose li::marker { color: var(--gold-dim); }
        .answer-prose strong { color: var(--gold-pale); font-weight: 500; }
        .answer-prose a { color: var(--gold); text-decoration: none; border-bottom: 1px solid #c9a84c44; transition: border-color 0.15s; }
        .answer-prose a:hover { border-color: var(--gold); }

        /* References sidebar */
        .refs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .refs-label {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .refs-count {
          font-size: 0.7rem;
          color: var(--gold-dim);
          font-variant-numeric: tabular-nums;
        }

        .ref-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 12px 14px;
          margin-bottom: 8px;
          transition: all 0.15s;
          text-decoration: none;
          display: block;
        }
        .ref-card:hover {
          border-color: var(--gold-dim);
          background: var(--raised);
          transform: translateX(2px);
        }
        .ref-domain {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--gold);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }
        .ref-url {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Bottom input bar */
        .input-bar-wrapper {
          flex-shrink: 0;
          background: linear-gradient(0deg, var(--ink) 60%, transparent 100%);
          border-top: 1px solid var(--border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .input-bar-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 1.75rem;
        }
      `}</style>

      <div className="elite-root">
        <div className="elite-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* ── Header ── */}
          <header className="elite-header" style={{ padding: '14px 28px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link href="/" passHref>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 400, letterSpacing: '-0.02em', cursor: 'pointer', margin: 0, fontFamily: "'Cormorant Garamond', serif" }}>
                    <span className="elite-logo-main">Neuro</span>
                    <span className="elite-logo-accent"> Persona</span>
                  </h1>
                </Link>

                {personalityConfirmed && (
                  <div className="personality-badge">
                    <span style={{ fontSize: '1rem' }}>{getPersonalityEmoji(selectedPersonality)}</span>
                    <span className="personality-badge-name">{selectedPersonality}</span>
                    <button className="personality-badge-close" onClick={handlePersonalityReset} title="Change personality">✕</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="https://lamatic.ai/docs" target="_blank" rel="noopener noreferrer" className="elite-nav-btn elite-nav-docs">
                  <FileText style={{ width: 13, height: 13 }} />
                  Docs
                </Link>
                <Link href="https://github.com/Lamatic/AgentKit" target="_blank" rel="noopener noreferrer" className="elite-nav-btn elite-nav-github">
                  <Github style={{ width: 13, height: 13 }} />
                  GitHub
                </Link>
              </div>
            </div>
          </header>

          {/* ── Personality Picker ── */}
          {showPersonalityPicker && (
            <div className="picker-stage">
              <div className="picker-inner">
                <span className="picker-icon">🎭</span>
                <h1 className="picker-title serif">Who would you like<br />to speak with?</h1>
                <p className="picker-subtitle">Type any famous personality's name and converse with them</p>

                <div className="elite-input-wrap">
                  <form onSubmit={(e) => { e.preventDefault(); handlePersonalityConfirm(); }}>
                    <input
                      value={personalityInput}
                      onChange={(e) => setPersonalityInput(e.target.value)}
                      placeholder="e.g. Albert Einstein, Cleopatra, Tesla…"
                      className="elite-input"
                      autoFocus
                    />
                    <button type="submit" className="elite-submit-btn" disabled={!personalityInput.trim()}>
                      <ArrowUp style={{ width: 16, height: 16 }} />
                    </button>
                  </form>
                </div>

                <p className="chip-label">Or choose one</p>
                <div className="chip-grid">
                  {PERSONALITIES.map((p) => (
                    <button key={p.name} onClick={() => handlePersonalityConfirm(p.name)} className="personality-chip">
                      <span className="personality-chip-emoji">{p.emoji}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Initial Chat Interface ── */}
          {showInitialInterface && (
            <div className="chat-welcome">
              <div style={{ maxWidth: 640, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="welcome-emoji">{getPersonalityEmoji(selectedPersonality)}</span>
                <h1 className="welcome-title serif">Chat with {selectedPersonality}</h1>
                <p className="welcome-subtitle">Ask anything — they'll answer in their own words</p>

                <div style={{ width: '100%', maxWidth: 560, marginBottom: '1.5rem' }}>
                  <form onSubmit={handleFormSubmit} style={{ position: 'relative' }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask ${selectedPersonality} anything…`}
                      className="elite-input"
                      disabled={isLoading}
                    />
                    <button type="submit" className="elite-submit-btn" disabled={!input.trim() || isLoading}>
                      <ArrowUp style={{ width: 16, height: 16 }} />
                    </button>
                  </form>
                </div>

                <div className="suggestion-row">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isLoading}
                    >
                      <span className="suggestion-arrow">↗</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Active Chat ── */}
          {personalityConfirmed && (messages.length > 0 || isLoading) && (
            <div className="chat-area">
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ScrollArea ref={scrollAreaRef} style={{ height: '100%' }}>
                  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem 2rem' }}>
                    {messages.map((message, index) => {
                      const nextMessage = messages[index + 1]
                      const isLastUserMessage =
                        index === messages.length - 1 ||
                        (index === messages.length - 2 && messages[index + 1]?.role === "assistant")

                      return (
                        <div key={index} className="message-block">
                          {/* User query */}
                          {message.role === "user" && (
                            <div>
                              <h2 className="user-query serif">{message.message}</h2>
                              <div className="query-divider" />
                            </div>
                          )}

                          {/* Thinking indicator */}
                          {isLastUserMessage && isLoading && !nextMessage && (
                            <div className="thinking-bar" style={{ marginTop: '1.5rem' }}>
                              <div className="thinking-dots">
                                <div className="thinking-dot" />
                                <div className="thinking-dot" />
                                <div className="thinking-dot" />
                              </div>
                              <span>{getPersonalityEmoji(selectedPersonality)} {selectedPersonality} is contemplating…</span>
                            </div>
                          )}

                          {/* Answer + References */}
                          {nextMessage && nextMessage.role === "assistant" && (
                            <div className="answer-grid" style={{ marginTop: '1.5rem' }}>
                              {/* Answer Column */}
                              <div>
                                {!nextMessage.isProcessing && nextMessage.message && (
                                  <div className="personality-byline">
                                    <span className="byline-emoji">{getPersonalityEmoji(selectedPersonality)}</span>
                                    <span className="byline-name">{selectedPersonality}</span>
                                  </div>
                                )}

                                {nextMessage.isProcessing && nextMessage.steps && (
                                  <div className="processing-panel">
                                    <div className="processing-steps">
                                      {!isTypewriterDone ? (
                                        <Typewriter
                                          words={[nextMessage.steps]}
                                          loop={1}
                                          cursor={false}
                                          typeSpeed={40}
                                          onLoopDone={() => setIsTypewriterDone(true)}
                                        />
                                      ) : nextMessage.steps}
                                    </div>

                                    {isSearching && (
                                      <div className="searching-label">
                                        <div className="search-pulse" />
                                        Searching the archives…
                                      </div>
                                    )}

                                    {searchLinks.length > 0 && (
                                      <div style={{ marginTop: '12px' }}>
                                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Consulting</div>
                                        <div className="link-pills">
                                          {searchLinks.map((link, li) => (
                                            <button
                                              key={li}
                                              onClick={() => window.open(link, "_blank")}
                                              className="link-pill"
                                            >
                                              <img
                                                src={getFaviconUrl(link) || "/placeholder.svg"}
                                                alt=""
                                                onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=12&width=12" }}
                                              />
                                              <span style={{ maxWidth: '96px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {extractDomain(link)}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!nextMessage.isProcessing && nextMessage.message && (
                                  <div className="answer-prose">
                                    <ReactMarkdown
                                      components={{
                                        a: ({ href, children }) => (
                                          <a href={href} target="_blank" rel="noopener noreferrer">
                                            {children}
                                            <ExternalLink style={{ display: 'inline', width: 11, height: 11, marginLeft: 2, verticalAlign: 'middle' }} />
                                          </a>
                                        ),
                                        h1: ({ children }) => <h1>{children}</h1>,
                                        h2: ({ children }) => <h2>{children}</h2>,
                                        h3: ({ children }) => <h3>{children}</h3>,
                                        p: ({ children }) => <p>{children}</p>,
                                        ul: ({ children }) => <ul>{children}</ul>,
                                        li: ({ children }) => <li>{children}</li>,
                                        strong: ({ children }) => <strong>{children}</strong>,
                                      }}
                                    >
                                      {nextMessage.message}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>

                              {/* References Column */}
                              <div>
                                {!nextMessage.isProcessing && nextMessage.references && nextMessage.references.length > 0 && (
                                  <div>
                                    <div className="refs-header">
                                      <span className="refs-label">Sources</span>
                                      <span className="refs-count">{nextMessage.references.length} references</span>
                                    </div>
                                    <ScrollArea style={{ height: '380px' }}>
                                      <div style={{ paddingRight: '8px' }}>
                                        {nextMessage.references.map((ref, ri) => (
                                          <a key={ri} href={ref} target="_blank" rel="noopener noreferrer" className="ref-card">
                                            <div className="ref-domain">
                                              <img
                                                src={getFaviconUrl(ref) || "/placeholder.svg"}
                                                alt=""
                                                style={{ width: 13, height: 13 }}
                                                onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=13&width=13" }}
                                              />
                                              {extractDomain(ref)}
                                            </div>
                                            <div className="ref-url">{ref}</div>
                                          </a>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Fixed Input Bar */}
              <div className="input-bar-wrapper">
                <div className="input-bar-inner">
                  <form onSubmit={handleFormSubmit} style={{ position: 'relative' }}>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask ${selectedPersonality} anything…`}
                      className="elite-input"
                      disabled={isLoading}
                    />
                    <button type="submit" className="elite-submit-btn" disabled={!input.trim() || isLoading}>
                      <Send style={{ width: 15, height: 15 }} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
