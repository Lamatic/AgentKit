"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Give me a full summary of my analysis",
  "Which competitor should I fear most and why?",
  "What's the single most dangerous assumption in my plan?",
  "How do I get my first 100 customers?",
];

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith("## ")) {
      return <h2 key={i} className="text-[14px] font-medium mt-5 mb-2 text-white">{line.slice(3)}</h2>;
    }
    if (line.startsWith("# ")) {
      return <h1 key={i} className="text-[16px] font-medium mt-5 mb-2 text-white">{line.slice(2)}</h1>;
    }
    // Bold
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = boldParts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold text-white/90">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return <p key={i} className="text-[13px] font-medium leading-[1.8] text-white/70 mb-3">{rendered}</p>;
  });
}

export function ChatInterface({ messages, onSendMessage, loading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea (capped to prevent screen stretch)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(150, Math.max(52, textareaRef.current.scrollHeight))}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <h2 className="text-[15px] font-medium text-white tracking-tight">AI Analyst</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col relative w-full min-h-0">
        {messages.length === 0 ? (
          <div className="m-auto w-full max-w-[320px] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
              <p className="text-[15px] font-medium text-white tracking-tight">
                Any questions?
              </p>
              <p className="text-[13px] font-medium text-white/50 leading-relaxed px-4">
                Ask about the analysis or request strategies based on the findings.
              </p>
            </div>
            <div className="w-full space-y-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => !loading && onSendMessage(q)}
                  className="w-full text-left p-3.5 rounded-xl text-[12px] font-medium text-white/70 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-white text-black font-medium text-[13px] leading-relaxed shadow-lg">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] px-5 py-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5">
                    {renderMarkdown(msg.content)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5">
                  <div className="flex gap-2.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[bounce_1s_infinite_0ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[bounce_1s_infinite_150ms]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-[bounce_1s_infinite_300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Modern Input Area */}
      <div className="p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex relative items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Follow up on the research..."
            disabled={loading}
            className="w-full pl-5 pr-14 py-[15px] rounded-3xl bg-white/5 border border-white/10 text-[13px] font-medium text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all duration-300 resize-none custom-scrollbar min-h-[52px] max-h-[150px] overflow-y-auto"
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 px-3 py-2 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-20 transition-transform active:scale-95 disabled:active:scale-100"
          >
            <span className="text-[16px] leading-[14px]">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}
