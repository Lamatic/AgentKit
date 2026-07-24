// app/loading.tsx
// Shown by Next.js during initial page load suspense boundary

/**
 * Next.js suspense boundary loading screen shown while the main page
 * segment is being streamed to the client on initial navigation.
 *
 * Renders a centred spinning indicator and a pulsing text label so users
 * receive immediate visual feedback before the page becomes interactive.
 *
 * @returns A full-viewport centred loading spinner with a text label.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-cyan)]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-cyan)] animate-spin" />
        </div>
        <p className="text-sm text-slate-400 animate-pulse">Loading TrustGuard AI…</p>
      </div>
    </div>
  );
}
