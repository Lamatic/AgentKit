"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, CheckCircle2, RotateCcw, Users, Plus, ArrowRight, Trash2, Code, BookOpen } from "lucide-react";
import clsx from "clsx";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  type: "text" | "options" | "done";
  text: string;
  options?: string[];
  person?: string;
  selectedOption?: string; // track which option was selected
};

const buildChatHistory = (chatLog: ChatMessage[]) => {
  return chatLog
    .filter((m) => m.id !== "welcome" && (m.role === "user" || m.type === "text" || m.type === "done"))
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
};

export default function ChatPage() {
  const [users, setUsers] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storedPerson, setStoredPerson] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load users on initial load
  useEffect(() => {
    const storedUsersStr = localStorage.getItem("excusebot_users");
    if (storedUsersStr) {
      try {
        const storedUsers = JSON.parse(storedUsersStr);
        setUsers(storedUsers);
      } catch (e) {
      }
    }

    // Check if we need to migrate old excusebot_sessionId to a default user
    const oldSessionId = localStorage.getItem("excusebot_sessionId");
    if (oldSessionId && !storedUsersStr) {
      const defaultUsers = { "Legacy User": oldSessionId };
      setUsers(defaultUsers);
      localStorage.setItem("excusebot_users", JSON.stringify(defaultUsers));
    }
  }, []);

  // Set welcome message when user is selected
  useEffect(() => {
    if (selectedUser) {
      setChatLog([
        {
          id: "welcome",
          role: "bot",
          type: "text",
          text: `Hi ${selectedUser}! I am the Excuse Generator Bot. Tell me what you need an excuse for!`,
          person: "Excuse Generator Bot",
        }
      ]);
    }
  }, [selectedUser]);

  // Auto-scroll to bottom when chatLog changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isLoading]);

  const handleSelectUser = (name: string) => {
    setSelectedUser(name);
    setSessionId(users[name]);
  };

  const handleDeleteUser = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    const updatedUsers = { ...users };
    delete updatedUsers[name];
    setUsers(updatedUsers);
    localStorage.setItem("excusebot_users", JSON.stringify(updatedUsers));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newUserName.trim();
    if (!name) return;

    if (users[name]) {
      // User already exists, just select them
      handleSelectUser(name);
      setNewUserName("");
      return;
    }

    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      throw new Error("Secure random UUID generation is not supported in this environment");
    }
    const newId = crypto.randomUUID();
    const updatedUsers = { ...users, [name]: newId };
    setUsers(updatedUsers);
    localStorage.setItem("excusebot_users", JSON.stringify(updatedUsers));

    setSelectedUser(name);
    setSessionId(newId);
    setNewUserName("");
  };

  const handleSwitchUser = () => {
    setSelectedUser(null);
    setSessionId("");
    setChatLog([]);
    setInputMessage("");
    setStoredPerson("");
    setOptionsVisible(false);
    setConversationEnded(false);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Input is disabled when loading, options are visible, or conversation has ended
  const inputDisabled = isLoading || optionsVisible || conversationEnded;

  const startNewConversation = () => {
    // Abort any in-flight API requests from the previous conversation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Keep the same sessionId — only cleared when user manually clears localStorage
    setChatLog([
      {
        id: "welcome",
        role: "bot",
        type: "text",
        text: `Hi ${selectedUser}! I am the Excuse Generator Bot. Tell me what you need an excuse for!`,
        person: "Excuse Generator Bot",
      }
    ]);
    setInputMessage("");
    setStoredPerson("");
    setOptionsVisible(false);
    setConversationEnded(false);
    setIsLoading(false);
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Build chatHistory as {role, content} objects for the Lamatic InstructorLLMNode
    const chatHistory = buildChatHistory(chatLog);

    // Append the current message to the end of the history so the LLM knows it's the latest turn
    chatHistory.push({
      role: "user",
      content: userMessage,
    });

    // Display user message immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      type: "text",
      text: userMessage,
    };

    const updatedLog = [...chatLog, userMsg];
    setChatLog(updatedLog);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          messageType: "chat",
          chatHistory,
          selectedExcuse: "",
          selectedPerson: "",
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();

      // Parse response from new API shape
      const response = data.response;

      if (response) {
        if (response.type === "options") {
          // Store person for later selection call
          setStoredPerson(response.person || "");
          setOptionsVisible(true);

          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            type: "options",
            text: response.message || "Please choose an option:",
            options: response.items || [],
            person: response.person || "Bot",
          };
          setChatLog((prev) => [...prev, botMsg]);
        } else if (response.type === "irrelevant") {
          // Hardcoded fallback for off-topic messages
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            type: "text",
            text: "I'm only able to help you generate excuses! Please tell me what situation you need an excuse for.",
            person: response.person || "Excuse Generator Bot",
          };
          setChatLog((prev) => [...prev, botMsg]);
        } else if (response.type === "question") {
          // Normal assistant chat bubble — input stays enabled
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "bot",
            type: "text",
            text: response.message || "Sorry, I didn't get that.",
            person: response.person || "Bot",
          };
          setChatLog((prev) => [...prev, botMsg]);
        }
      }
    } catch (err: any) {
      // Silently ignore aborted requests (user clicked New Chat)
      if (err?.name === "AbortError") return;
      setChatLog((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          type: "text",
          text: "Oops, something went wrong communicating with the server.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (selectedExcuse: string, msgId: string) => {
    // Immediately mark the selected option and disable all buttons
    setChatLog((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, selectedOption: selectedExcuse } : msg
      )
    );
    setOptionsVisible(false); // buttons are now disabled via selectedOption
    setIsLoading(true);

    try {
      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Build chatHistory as {role, content} objects for the Lamatic InstructorLLMNode
      const chatHistory = buildChatHistory(chatLog);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: "",
          messageType: "selection",
          chatHistory,
          selectedExcuse,
          selectedPerson: storedPerson,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();

      // Read selectionConfirmed.message and display it as the final assistant message
      const confirmMsg = data.selectionConfirmed?.message || data.response?.message || "Thank you!";

      const finalMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        type: "done",
        text: confirmMsg,
        person: "Excuse Generator Bot",
      };

      setChatLog((prev) => [...prev, finalMsg]);
      setConversationEnded(true);
    } catch (err: any) {
      // Silently ignore aborted requests (user clicked New Chat)
      if (err?.name === "AbortError") return;
      setChatLog((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          type: "text",
          text: "Oops, something went wrong processing your selection.",
        },
      ]);
      // Don't end conversation on error — let user retry
      setOptionsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800"
        >
          <div className="p-8 text-center bg-indigo-600">
            <div className="mx-auto h-16 w-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/20">
              <Bot size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Excuse Generator</h1>
            <p className="text-indigo-100 text-sm">Choose your profile to get started</p>
          </div>

          <div className="p-8">
            {Object.keys(users).length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  Select Profile
                </h2>
                <div className="grid gap-3">
                  {Object.keys(users).map((name) => (
                    <div
                      key={name}
                      onClick={() => handleSelectUser(name)}
                      className="flex items-center justify-between w-full p-2 pr-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 pl-2">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <User size={18} />
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-white">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteUser(e, name)}
                          className="p-2 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ArrowRight size={18} className="text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                {Object.keys(users).length > 0 ? "Or Create New" : "Create Profile"}
              </h2>
              <form onSubmit={handleCreateUser} className="relative">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full pl-4 pr-12 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!newUserName.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-indigo-500/30">

      {/* Header */}
      <header className="flex-none p-4 sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                Excuse Generator
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Powered by Lamatic.ai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://lamatic.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200"
              title="Docs"
            >
              <BookOpen size={16} />
            </a>
            <a
              href="https://github.com/Lamatic/AgentKit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200"
              title="GitHub"
            >
              <Code size={16} />
            </a>
            <button
              onClick={handleSwitchUser}
              title="Switch User"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all duration-200"
            >
              <Users size={16} />
            </button>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-all duration-200 active:scale-95"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-3xl mx-auto relative no-scrollbar">
        <div className="flex flex-col gap-6 pb-24">
          <AnimatePresence initial={false}>
            {chatLog.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={clsx(
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div className={clsx(
                  "flex gap-3 max-w-[85%] sm:max-w-[75%]",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  {/* Avatar */}
                  <div className={clsx(
                    "flex-none h-8 w-8 rounded-full flex items-center justify-center mt-auto mb-1",
                    msg.role === "user"
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                      : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                  )}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col gap-2 min-w-0">
                    {msg.person && msg.role === "bot" && (
                      <span className="text-[11px] font-semibold text-neutral-400 px-1 uppercase tracking-wider">
                        {msg.person}
                      </span>
                    )}

                    <div className={clsx(
                      "px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : msg.type === "done"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-bl-sm"
                          : "bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-sm"
                    )}>
                      {msg.type === "done" && (
                        <span className="inline-flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Complete</span>
                        </span>
                      )}
                      {msg.type === "done" ? <div>{msg.text}</div> : msg.text}
                    </div>

                    {/* Options Buttons */}
                    {msg.role === "bot" && msg.type === "options" && msg.options && msg.options.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2 w-full">
                        {msg.options.map((opt, idx) => {
                          const isSelected = msg.selectedOption === opt;
                          const hasSelection = !!msg.selectedOption;

                          return (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1, duration: 0.2 }}
                              key={`${msg.id}-opt-${idx}`}
                              onClick={() => handleOptionClick(opt, msg.id)}
                              disabled={hasSelection || isLoading}
                              className={clsx(
                                "group relative w-full text-left px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden",
                                isSelected
                                  ? "bg-indigo-600 border-2 border-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                  : hasSelection
                                    ? "bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 opacity-50 cursor-not-allowed"
                                    : "bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                              )}
                            >
                              <span className={clsx(
                                "relative z-10 font-medium text-sm",
                                isSelected
                                  ? "text-white"
                                  : hasSelection
                                    ? "text-neutral-400 dark:text-neutral-500"
                                    : "text-indigo-700 dark:text-indigo-300"
                              )}>
                                {isSelected && <CheckCircle2 size={14} className="inline mr-2 -mt-0.5" />}
                                {opt}
                              </span>
                              {!hasSelection && (
                                <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-none h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mt-auto mb-1">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      Typing...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} className="h-4" />
        </div>
      </main>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-white/0 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950/0 pb-6 pt-10 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inputDisabled) sendMessage(inputMessage);
            }}
            className={clsx(
              "relative flex items-end gap-2 p-2 rounded-3xl border shadow-xl transition-all duration-300",
              conversationEnded
                ? "bg-neutral-100 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 shadow-neutral-200/30 dark:shadow-black/30"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-neutral-200/50 dark:shadow-black/50"
            )}
          >
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                conversationEnded
                  ? "Conversation ended"
                  : optionsVisible
                    ? "Please select an option above"
                    : "Ask for an excuse..."
              }
              disabled={inputDisabled}
              className="flex-1 max-h-32 bg-transparent resize-none outline-none py-3 px-4 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || inputDisabled}
              className="flex-none h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <Send size={18} className={clsx(inputMessage.trim() && "ml-0.5")} />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-neutral-400 font-medium">
              Lamatic.ai Excuse Generator Proxy
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
