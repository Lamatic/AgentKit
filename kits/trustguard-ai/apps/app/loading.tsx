// app/loading.tsx
// Shown by Next.js during initial page load suspense boundary

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400 animate-pulse">Loading TrustGuard AI…</p>
      </div>
    </div>
  );
}
