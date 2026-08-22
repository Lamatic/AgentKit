"use client";

import type { Dossier } from "@/lib/dossier";

function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 text-xs text-emerald-700 underline underline-offset-2"
    >
      source
    </a>
  );
}

export function DossierCard({ d }: { d: Dossier }) {
  const confColor =
    d.confidence === "high"
      ? "bg-emerald-100 text-emerald-800"
      : d.confidence === "medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-zinc-100 text-zinc-700";

  const subline =
    [d.identity.role, d.identity.company, d.identity.location]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <div className="space-y-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            {d.identity.name || "Unknown person"}
          </h2>
          <p className="text-sm text-zinc-600">{subline}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${confColor}`}
        >
          {d.confidence} confidence
        </span>
      </header>

      {d.summary && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">
            Who they are
          </h3>
          <p className="text-sm leading-relaxed text-zinc-800">{d.summary}</p>
        </section>
      )}

      {d.outside_work.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">
            Outside work
          </h3>
          <ul className="space-y-2">
            {d.outside_work.map((o, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 text-sm text-zinc-800"
              >
                <span>{o.note}</span>
                <SourceLink url={o.source_url} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.talking_points.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">
            Talking points
          </h3>
          <ul className="space-y-3">
            {d.talking_points.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border border-black/5 bg-zinc-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-900">{t.point}</p>
                  <SourceLink url={t.source_url} />
                </div>
                {t.why_it_works && (
                  <p className="mt-1 text-xs text-zinc-600">{t.why_it_works}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.couldnt_confirm.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-amber-800">
            Couldn&apos;t confirm
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800/90">
            {d.couldnt_confirm.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-black/5 pt-3 text-xs text-zinc-500">
        Public information only. Verify before acting.
      </footer>
    </div>
  );
}
