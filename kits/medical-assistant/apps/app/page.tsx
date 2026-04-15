"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
    Loader2, Send, Stethoscope, Copy, Check, User, Bot,
    Plus, MessageSquare, PanelLeftClose, PanelLeft, FileText, Github
} from "lucide-react"
import { sendMedicalQuery } from "@/actions/orchestrate"
import ReactMarkdown from "react-markdown"
import { Disclaimer, MiniDisclaimer } from "@/components/disclaimer"
import Link from "next/link"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

interface Session {
    id: string
    title: string
    messages: ChatMessage[]
    createdAt: Date
}

export default function MedicalAssistantPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const activeSession = sessions.find((s) => s.id === activeSessionId)
    const messages = activeSession?.messages || []

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    const createNewSession = () => {
        const newSession: Session = {
            id: `session-${Date.now()}`,
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
        }
        setSessions((prev) => [newSession, ...prev])
        setActiveSessionId(newSession.id)
        setInput("")
    }

    const handleSend = async () => {
        const query = input.trim()
        if (!query || isLoading) return

        let currentSessionId = activeSessionId
        if (!currentSessionId) {
            const newSession: Session = {
                id: `session-${Date.now()}`,
                title: query.length > 40 ? query.slice(0, 40) + "..." : query,
                messages: [],
                createdAt: new Date(),
            }
            setSessions((prev) => [newSession, ...prev])
            setActiveSessionId(newSession.id)
            currentSessionId = newSession.id
        }

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: query,
            timestamp: new Date(),
        }

        setSessions((prev) =>
            prev.map((s) => {
                if (s.id === currentSessionId) {
                    const isFirst = s.messages.length === 0
                    return {
                        ...s,
                        title: isFirst
                            ? query.length > 40
                                ? query.slice(0, 40) + "..."
                                : query
                            : s.title,
                        messages: [...s.messages, userMessage],
                    }
                }
                return s
            })
        )

        setInput("")
        setIsLoading(true)

        try {
            const response = await sendMedicalQuery(query)
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: response.success
                    ? response.data
                    : `I'm sorry, I encountered an error: ${response.error || "Unknown error"}. Please try again.`,
                timestamp: new Date(),
            }
            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === currentSessionId) {
                        return { ...s, messages: [...s.messages, assistantMessage] }
                    }
                    return s
                })
            )
        } catch {
            const errorMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: "I'm sorry, something went wrong. Please try again later.",
                timestamp: new Date(),
            }
            setSessions((prev) =>
                prev.map((s) => {
                    if (s.id === currentSessionId) {
                        return { ...s, messages: [...s.messages, errorMessage] }
                    }
                    return s
                })
            )
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleCopy = async (id: string, content: string) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#fafafa' }}>
            {/* ── Sidebar ── */}
            {sidebarOpen && (
                <aside
                    className="w-72 flex flex-col overflow-hidden flex-shrink-0"
                    style={{ background: '#fff', borderRight: '1px solid #e2e8f0' }}
                >
                    {/* Brand */}
                    <div className="h-14 flex items-center gap-2 px-5 flex-shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <Stethoscope className="w-5 h-5" style={{ color: '#f43f5e' }} />
                        <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                            <span style={{ color: '#0f172a' }}>Medical</span>{" "}
                            <span style={{ color: '#f43f5e' }}>Assistant</span>
                        </span>
                    </div>

                    {/* New Session */}
                    <div className="p-3 flex-shrink-0">
                        <button
                            onClick={createNewSession}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                            style={{ background: '#f43f5e', color: '#fff' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#e11d48')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#f43f5e')}
                        >
                            <Plus className="w-4 h-4" />
                            New Session
                        </button>
                    </div>

                    {/* Session List */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3">
                        <div className="flex flex-col gap-1">
                            {sessions.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: '#94a3b8' }}>No sessions yet</p>
                            ) : (
                                sessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => setActiveSessionId(session.id)}
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5"
                                        style={{
                                            background: session.id === activeSessionId ? '#f1f5f9' : 'transparent',
                                            color: session.id === activeSessionId ? '#0f172a' : '#475569',
                                            fontWeight: session.id === activeSessionId ? 500 : 400,
                                        }}
                                    >
                                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{session.title}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
 
                    {/* Sidebar Footer Links */}
                    <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <div className="flex flex-col gap-1">
                            <Link
                                href="https://lamatic.ai/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{ color: '#475569' }}
                            >
                                <FileText className="w-4 h-4" style={{ color: '#94a3b8' }} />
                                Documentation
                            </Link>
                            <Link
                                href="https://github.com/Lamatic/AgentKit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                                style={{ color: '#475569' }}
                            >
                                <Github className="w-4 h-4" style={{ color: '#94a3b8' }} />
                                GitHub
                            </Link>
                        </div>
                    </div>
                </aside>
            )}

            {/* ── Main Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <div
                    className="h-14 flex items-center gap-3 px-4 flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9' }}
                >
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#64748b' }}
                        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {sidebarOpen ? (
                            <PanelLeftClose className="w-5 h-5" />
                        ) : (
                            <PanelLeft className="w-5 h-5" />
                        )}
                    </button>
                    {activeSession && (
                        <h2 className="text-sm font-medium truncate" style={{ color: '#475569' }}>
                            {activeSession.title}
                        </h2>
                    )}
                </div>

                {messages.length === 0 ? (
                    /* ── Welcome State ── */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
                        <div className="max-w-3xl w-full text-center mb-12">
                            <div className="flex flex-col items-center gap-8">
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                                    style={{ background: '#fff0f2', color: '#e11d48', border: '1px solid #ffe4e6' }}
                                >
                                    ✦ NEXT-GEN HEALTH COMPANION
                                </div>

                                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: '#0f172a' }}>
                                    Understand your health.
                                    <br />
                                    <span style={{ color: '#f43f5e' }}>Instantly.</span>
                                </h1>
                            </div>
                        </div>

                        {/* Welcome Input Card */}
                        <div
                            className="w-full max-w-[42rem] mx-auto rounded-2xl shadow-sm p-6"
                            style={{ background: '#fff', border: '1px solid #f1f5f9' }}
                        >
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label
                                        htmlFor="medical-query-input"
                                        className="flex items-center gap-2 text-[13px] font-semibold mb-2.5"
                                        style={{ color: '#334155' }}
                                    >
                                        <Stethoscope className="w-4 h-4" style={{ color: '#f43f5e' }} />
                                        Medical Query or Symptom
                                    </label>
                                    <textarea
                                        id="medical-query-input"
                                        ref={inputRef}
                                        placeholder="e.g. What are the common symptoms of the flu?"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading}
                                        rows={3}
                                        className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                                        style={{ border: '2px solid #e2e8f0', color: '#1e293b', background: '#fff' }}
                                    />
                                </div>

                                <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                    <h4 className="text-[13px] font-semibold flex items-center gap-2 mb-2" style={{ color: '#334155' }}>
                                        <span style={{ color: '#f43f5e' }}>✦</span> Example Instructions
                                    </h4>
                                    <p className="text-[13px]" style={{ color: '#64748b' }}>
                                        Describe your symptoms clearly, include any relevant timeline or
                                        severity, and ask specific questions. Note that this is not medical
                                        advice.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="w-full font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    style={{ background: '#f43f5e', color: '#fff' }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Ask Query
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[11px]" style={{ color: '#94a3b8' }}>
                                    Medical Assistant may provide inaccurate information. Always consult a
                                    healthcare professional.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Chat State ── */
                    <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                        {/* Disclaimer */}
                        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 flex-shrink-0">
                            <Disclaimer />
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            <div className="max-w-3xl mx-auto flex flex-col gap-6">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 chat-message-enter ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"
                                            style={msg.role === "assistant"
                                                ? { background: '#fff', border: '1px solid #e2e8f0' }
                                                : { background: '#0f172a', border: '1px solid #0f172a' }
                                            }
                                        >
                                            {msg.role === "assistant" ? (
                                                <Bot className="w-4 h-4" style={{ color: '#f43f5e' }} />
                                            ) : (
                                                <User className="w-4 h-4" style={{ color: '#fff' }} />
                                            )}
                                        </div>

                                        {/* Bubble */}
                                        <div
                                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                                            style={{ maxWidth: '80%', minWidth: 0 }}
                                        >
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-sm font-semibold" style={{ color: '#334155' }}>
                                                    {msg.role === "assistant" ? "Medical Assistant" : "You"}
                                                </span>
                                                <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>

                                            <div
                                                className="relative group px-4 py-3 shadow-sm"
                                                style={msg.role === "user"
                                                    ? { background: '#0f172a', color: '#ffffff', borderRadius: '1rem 0.125rem 1rem 1rem' }
                                                    : { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.125rem 1rem 1rem 1rem' }
                                                }
                                            >
                                                {msg.role === "assistant" ? (
                                                    <div>
                                                        <div className="prose prose-sm max-w-none" style={{ color: '#334155' }}>
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        </div>
                                                        <MiniDisclaimer />
                                                        <button
                                                            onClick={() => handleCopy(msg.id, msg.content)}
                                                            className="absolute top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg"
                                                            style={{ right: '-2.5rem', color: '#94a3b8' }}
                                                            title="Copy response"
                                                            aria-label={copiedId === msg.id ? "Copied" : "Copy response"}
                                                        >
                                                            {copiedId === msg.id ? (
                                                                <Check className="w-4 h-4" style={{ color: '#059669' }} />
                                                            ) : (
                                                                <Copy className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ wordBreak: 'break-word', color: '#ffffff' }}>
                                                        {msg.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3 flex-row chat-message-enter">
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm"
                                            style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                                        >
                                            <Bot className="w-4 h-4" style={{ color: '#f43f5e' }} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-sm font-semibold" style={{ color: '#334155' }}>
                                                    Medical Assistant
                                                </span>
                                            </div>
                                            <div
                                                className="px-4 py-3 shadow-sm"
                                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.125rem 1rem 1rem 1rem' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#f43f5e' }} />
                                                    <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                                                        Analyzing symptoms...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Sticky Chat Input */}
                        <div
                            className="flex-shrink-0 px-4 py-4"
                            style={{ borderTop: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)' }}
                        >
                            <div className="max-w-3xl mx-auto">
                                <div
                                    className="relative"
                                    aria-label="Chat composer"
                                >
                                    <textarea
                                        id="medical-assistant-composer"
                                        ref={inputRef}
                                        aria-label="Message"
                                        placeholder="Describe your symptoms or ask a question..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isLoading}
                                        rows={1}
                                        className="w-full resize-none rounded-xl px-4 py-3 pr-14 text-sm focus:outline-none transition-colors"
                                        style={{ border: '2px solid #e2e8f0', color: '#1e293b', background: '#fff', minHeight: '48px', maxHeight: '140px' }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement
                                            target.style.height = "48px"
                                            target.style.height =
                                                Math.min(target.scrollHeight, 140) + "px"
                                        }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2.5 bottom-2.5 p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: '#f43f5e', color: '#fff' }}
                                        aria-label={isLoading ? "Sending message" : "Send message"}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-center text-[11px] mt-2" style={{ color: '#94a3b8' }}>
                                    Medical Assistant may provide inaccurate information. Always consult
                                    a healthcare professional.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
