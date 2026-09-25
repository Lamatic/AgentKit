import * as React from "react";

import { cn } from "@/lib/utils";

/** Renders a bordered surface for grouped content. */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border border-border bg-card text-card-foreground", className)} {...props} />
));
Card.displayName = "Card";

/** Renders padded content inside a card. */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardContent };
