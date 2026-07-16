// components/LoadingSpinner.tsx
"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  readonly size?: number;
  readonly className?: string;
}

export default function LoadingSpinner({
  size = 18,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <Loader2
      width={size}
      height={size}
      className={`animate-spin ${className}`}
      aria-label="Loading"
    />
  );
}
