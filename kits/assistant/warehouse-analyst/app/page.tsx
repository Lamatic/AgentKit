"use client";

import { useState, useEffect, useCallback } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatInput } from "@/components/chat/ChatInput";
import { INITIAL_MESSAGE } from "@/constants";
import { useAppStore } from "@/lib/store";
import type { Message } from "@/types";

const DEFAULT_STATS = {
  totalProducts: "—",
  totalStock: "—",
  warehouses: "—",
  pendingOrders: "—",
};

export default function WarehouseAnalyst() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);

  // Read connectionUrl from global Zustand store
  const connectionUrl = useAppStore((s) => s.connectionUrl);

  const addBotMessage = (content: string) =>
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-bot`, role: "bot", content },
    ]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionUrl ? { connectionUrl } : {}),
      });
      if (res.ok) setStats((await res.json()).stats);
    } catch { }
  }, [connectionUrl]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const context = [...messages, userMessage]
        .slice(-4)
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          context,
          ...(connectionUrl && { connectionUrl }),
        }),
      });

      const data = await res.json();
      addBotMessage(data.answer ?? data.error ?? "No response from AI.");
    } catch {
      addBotMessage("Could not connect to the AI. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col flex-1 h-screen overflow-hidden">
        <TopBar />
        <StatsPanel stats={stats} />
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ChatArea messages={messages} isLoading={isLoading} />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
