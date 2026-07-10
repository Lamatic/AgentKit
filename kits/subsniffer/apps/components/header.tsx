/**
 * Top navigation bar showing the SubSniffer brand and tagline.
 */
export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          S
        </div>
        <span className="text-lg font-semibold text-slate-900">SubSniffer</span>
        <span className="ml-2 text-xs text-slate-500">Subscription Audit</span>
      </div>
    </header>
  );
}
