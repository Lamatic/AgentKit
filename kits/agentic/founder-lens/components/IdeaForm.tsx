"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface IdeaFormProps {
  onSubmit: (idea: string) => void;
  disabled?: boolean;
}

const EXAMPLE_IDEAS = [
  "Uber for private tutors",
  "AI that turns your Notion docs into a chatbot for your team",
  "A Duolingo for learning how to invest in stocks",
];

export function IdeaForm({ onSubmit, disabled }: IdeaFormProps) {
  const [idea, setIdea] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) onSubmit(idea.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (idea.trim()) onSubmit(idea.trim());
    }
  };

  // Auto-resize textarea (capped at 200px to prevent page stretch)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(200, Math.max(100, textareaRef.current.scrollHeight))}px`;
    }
  }, [idea]);

  // Typewriter effect
  useEffect(() => {
    if (idea.length > 0) return;

    let currentText = "";
    let isDeleting = false;
    let charIndex = 0;
    let typingSpeed = 60;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeWriter = () => {
      const fullText = EXAMPLE_IDEAS[exampleIndex];

      if (!isDeleting) {
        currentText = fullText.substring(0, charIndex + 1);
        charIndex++;
        if (currentText === fullText) {
          isDeleting = true;
          typingSpeed = 2000;
        } else {
          typingSpeed = 55 + Math.random() * 40;
        }
      } else {
        currentText = fullText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 25;
        if (currentText === "") {
          isDeleting = false;
          setExampleIndex((prev) => (prev + 1) % EXAMPLE_IDEAS.length);
          typingSpeed = 600;
        }
      }

      setTypedPlaceholder(currentText);
      timeoutId = setTimeout(typeWriter, typingSpeed);
    };

    timeoutId = setTimeout(typeWriter, 800);
    return () => clearTimeout(timeoutId);
  }, [idea, exampleIndex]);

  return (
    <form onSubmit={handleSubmit} className="liquid-glass flex flex-col w-full">
      {/* Input Area */}
      <div className="relative w-full">
        {!idea && (
          <div className="absolute top-0 left-0 w-full h-full flex items-start p-5 pointer-events-none">
            <span className="text-[16px] font-normal text-white/35 tracking-[-0.01em]">
              {typedPlaceholder}
              <span className="cursor-blink inline-block w-[1px] h-[1em] bg-white/40 ml-[1px] align-middle" />
            </span>
          </div>
        )}
        <textarea
          id="idea-input"
          ref={textareaRef}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent p-5 text-[16px] font-normal text-white resize-none outline-none custom-scrollbar tracking-[-0.01em] relative z-10 min-h-[100px] max-h-[200px] overflow-y-auto",
            !idea && "text-transparent caret-white"
          )}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-end px-4 pb-4 pt-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-white/25 tracking-wide hidden sm:block">
            ⌘+Enter
          </span>
          <button
            type="submit"
            disabled={!idea.trim() || disabled}
            className={cn(
              "w-8 h-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all duration-300 border border-white/15",
              "disabled:opacity-15 disabled:cursor-not-allowed"
            )}
          >
            <span className="text-[16px] leading-none">↑</span>
          </button>
        </div>
      </div>
    </form>
  );
}
