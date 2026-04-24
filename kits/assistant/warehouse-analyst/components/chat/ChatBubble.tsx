// A single message bubble — style changes based on role
import type { Message } from "@/types";
import { Warehouse, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  message: Message;
};

export function ChatBubble({ message }: Props) {
  const isBot = message.role === "bot";

  return (
    <div className={`flex gap-3 ${isBot ? "flex-row" : "flex-row-reverse"}`}>
      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
        <AvatarFallback
          className={
            isBot
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }
        >
          {isBot ? (
            <Warehouse className="h-3.5 w-3.5" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
        </AvatarFallback>
      </Avatar>
      <div
        className={`rounded-xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed ${
          isBot
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
