import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[var(--foreground)] outline-none ring-[var(--ring)]/30 placeholder:text-[var(--muted)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
