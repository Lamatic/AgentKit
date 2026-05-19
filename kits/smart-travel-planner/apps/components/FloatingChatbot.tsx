"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi 👋 I’m your Travel AI. Ask me anything about destinations, food, budget, culture, visas, or travel planning.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      const reply =
        data?.reply ||
        data?.result ||
        "Sorry, I could not understand that. Please try again.";

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Travel Chatbot"
      >
        {isOpen ? "×" : "💬"}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <h3>Travel AI</h3>
              <p>Ask anything about travel</p>
            </div>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
              
  key={index}
  className={`chat-bubble ${
    msg.role === "user" ? "user-bubble" : "bot-bubble"
  }`}
  style={{ whiteSpace: "pre-line" }}
>
  {msg.text}
</div>
            ))}

            {loading && <div className="chat-bubble bot-bubble">Typing...</div>}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              placeholder="Type your travel question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}