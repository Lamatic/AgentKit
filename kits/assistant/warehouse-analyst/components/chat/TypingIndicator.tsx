// Shows animated 3-dot typing indicator while bot is thinking
export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-primary-foreground text-xs">W</span>
      </div>
      <div className="rounded-xl px-4 py-3 bg-muted flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
