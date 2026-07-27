// components/LoadingSpinner.tsx
"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  readonly size?: number;
  readonly className?: string;
}

/**
 * Inline spinning indicator used inside buttons and other interactive
 * elements to signal that an async operation is in progress.
 *
 * Wraps the Lucide `Loader2` icon with the Tailwind `animate-spin` class
 * so it rotates continuously until unmounted.
 *
 * @param size      - Icon width and height in pixels (default `18`).
 * @param className - Additional Tailwind classes applied to the icon element,
 *   typically used to set the text colour (e.g. `"text-white"`).
 * @returns An animated `<svg>` spinner icon.
 */
export default function LoadingSpinner({
  size = 18,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      <Loader2
        width={size}
        height={size}
        className={`animate-spin ${className}`}
        aria-label="Loading"
      />
    </span>
  );
}
