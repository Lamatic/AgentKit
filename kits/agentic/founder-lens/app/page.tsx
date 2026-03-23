"use client";

import { useState, useEffect } from "react";
import { IdeaForm } from "@/components/IdeaForm";
import { PhaseTracker } from "@/components/PhaseTracker";
import { BriefDisplay } from "@/components/BriefDisplay";
import { ChatInterface } from "@/components/ChatInterface";
import { analyzeIdea, chatWithBrief } from "@/actions/orchestrate";
import { generateUserId, generateSessionId } from "@/lib/utils";
import { Icons } from "@/components/Icons";
import { AuroraBackground } from "@/components/AuroraBackground";

type AppState = "idle" | "analyzing" | "ready" | "error";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [brief, setBrief] = useState("");
  const [decomposition, setDecomposition] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [currentIdea, setCurrentIdea] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("founder-lens-session");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.appState === "ready" || data.appState === "idle") {
          setAppState(data.appState);
        }
        if (data.brief) setBrief(data.brief);
        if (data.messages) setMessages(data.messages);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.currentIdea) setCurrentIdea(data.currentIdea);
        if (data.userId) {
          setUserId(data.userId);
        } else {
          setUserId(generateUserId());
        }
      } else {
        setUserId(generateUserId());
      }
    } catch {
      setUserId(generateUserId());
    }
    setHydrated(true);
  }, []);

  // Persist session to localStorage on every meaningful state change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "founder-lens-session",
        JSON.stringify({
          appState,
          brief,
          messages,
          sessionId,
          userId,
          currentIdea,
        })
      );
    } catch {
      // localStorage full or unavailable — gracefully ignore
    }
  }, [hydrated, appState, brief, messages, sessionId, userId, currentIdea]);

  const handleAnalyze = async (idea: string) => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setCurrentIdea(idea);
    setAppState("analyzing");
    setError("");
    setBrief("");
    setMessages([]);

    const result = await analyzeIdea(idea, userId, newSessionId);

    if (result.success && result.brief) {
      // Play completion chime
      try {
        const audio = new Audio('/ui-notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore auto-play strictness errors if user didn't explicitly interact recently enough
        });
      } catch (e) {
        // Ignore audio errors
      }

      setBrief(result.brief);
      if (result.decomposition) setDecomposition(result.decomposition);
      setAppState("ready");
    } else {
      setError(result.error ?? "Analysis failed. Please try again.");
      setAppState("error");
    }
  };

  const handleChatMessage = async (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatLoading(true);

    const result = await chatWithBrief(message, userId, sessionId);

    if (result.success && result.answer) {
      setMessages((prev) => [...prev, { role: "assistant", content: result.answer! }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${result.error ?? "Something went wrong."}` },
      ]);
    }
    setChatLoading(false);
  };

  const handleReset = () => {
    setAppState("idle");
    setBrief("");
    setDecomposition("");
    setMessages([]);
    setError("");
    setCurrentIdea("");
    localStorage.removeItem("founder-lens-session");
  };

  return (
    <AuroraBackground>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header — exactly like Stitch */}
        <header className="px-8 py-6 w-full max-w-[1400px] mx-auto flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2.5">
            <Icons.Logo className="w-7 h-7" />
            <span className="text-[18px] font-medium tracking-[-0.01em] text-white">
              Founder Lens
            </span>
          </div>
          {appState !== "idle" ? (
            <button
              onClick={handleReset}
              className="liquid-glass-pill px-5 py-2 text-[13px] font-medium text-white/80 hover:text-white"
            >
              New analysis
            </button>
          ) : (
            <button 
              onClick={() => document.getElementById('idea-input')?.focus()}
              className="bg-white text-black px-5 py-2 rounded-full text-[13px] font-medium hover:bg-white/90 transition-colors"
            >
              Try now
            </button>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center px-6 min-h-0 overflow-hidden">
          {/* IDLE STATE — Stitch-like hero */}
          {appState === "idle" && (
            <div className="flex flex-col items-center justify-center flex-1 -mt-16">
              {/* Giant Hero Text */}
              <div className="text-center mb-14 space-y-5">
                <h2 className="text-[clamp(2.5rem,8vw,5.5rem)] font-normal text-white tracking-[-0.04em] leading-[1.05]">
                  Validate ideas<br />instantly
                </h2>
                <p className="text-white/50 text-[clamp(1rem,2vw,1.25rem)] font-normal tracking-[-0.01em]">
                  Transform ideas into investor-grade startup briefs
                </p>
              </div>

              {/* Glass Input Card */}
              <div className="w-full max-w-[680px]">
                <IdeaForm onSubmit={handleAnalyze} />
              </div>
            </div>
          )}

          {/* ANALYZING STATE */}
          {appState === "analyzing" && (
            <div className="max-w-xl mx-auto w-full py-10 space-y-10 animate-in fade-in zoom-in-95 duration-700">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20 mb-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-white/10 border-t-white/80 animate-[spin_2s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-white/10 border-b-white/50 animate-[spin_3s_linear_infinite_reverse]" />
                  <Icons.Search className="w-6 h-6 text-white/80" />
                </div>
                <h2 className="text-[26px] font-medium text-white tracking-[-0.02em]">Synthesizing data...</h2>
                <p className="text-[15px] text-white/40 italic px-4 leading-relaxed">"{currentIdea}"</p>
              </div>
              <div className="liquid-glass p-8">
                <PhaseTracker />
              </div>
            </div>
          )}

          {/* READY STATE */}
          {appState === "ready" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 max-w-[1400px] mx-auto w-full h-full min-h-0 py-4 animate-in slide-in-from-bottom-8 duration-700">
              <div className="min-h-0 overflow-hidden">
                <BriefDisplay briefJson={brief} />
              </div>
              <div className="min-h-0 overflow-hidden">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleChatMessage}
                  loading={chatLoading}
                />
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {appState === "error" && (
            <div className="max-w-md mx-auto py-24 text-center space-y-8">
              <div className="w-20 h-20 rounded-full liquid-glass flex items-center justify-center mx-auto text-red-400 text-2xl">
                ⚠️
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-medium tracking-[-0.02em] text-white">Analysis failed</h2>
                <p className="text-[15px] text-white/50 px-6 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="liquid-glass-pill px-8 py-3 text-[14px] font-medium hover:text-white"
              >
                Go back
              </button>
            </div>
          )}
        </main>
      </div>
    </AuroraBackground>
  );
}
