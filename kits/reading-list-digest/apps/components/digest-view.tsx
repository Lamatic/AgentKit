"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DigestResult, SourceItem } from "@/actions/orchestrate";
import { ExternalLink } from "lucide-react";

function renderInlineHtml(text: string) {
  return (
    <span
      className="[&_mark]:rounded [&_mark]:bg-primary/15 [&_mark]:px-0.5 [&_mark]:text-foreground dark:[&_mark]:bg-primary/25"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

function SourcesList({ items }: { items: SourceItem[] }) {
  return (
    <ol className="space-y-2 text-sm">
      {items.map((s) => (
        <li key={s.id} className="flex gap-2">
          <span className="font-mono text-muted-foreground">[{s.id}]</span>
          <div>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium hover:underline inline-flex items-center gap-1"
            >
              {s.title || s.domain}
              <ExternalLink className="size-3" />
            </a>
            <p className="text-xs text-muted-foreground">{s.url}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DigestView({ digest }: { digest: DigestResult }) {
  const brief = Array.isArray(digest.executive_brief)
    ? digest.executive_brief
    : [];
  const briefStrings = brief.filter(
    (item): item is string => typeof item === "string"
  );
  const sourcesBlock = brief.find(
    (item): item is { type: "sources"; items: SourceItem[] } =>
      typeof item === "object" && item !== null && item.type === "sources"
  );
  const contradictions = Array.isArray(digest.cross_source_contradictions)
    ? digest.cross_source_contradictions
    : [];
  const consensus = Array.isArray(digest.consensus_points)
    ? digest.consensus_points
    : [];
  const themes = Array.isArray(digest.cross_cutting_themes)
    ? digest.cross_cutting_themes
    : [];
  const summaries = Array.isArray(digest.article_summaries)
    ? digest.article_summaries
    : [];
  const warnings = Array.isArray(digest.warnings) ? digest.warnings : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Query</p>
        <h2 className="text-xl font-medium">{digest.query}</h2>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Executive brief</h3>
        {briefStrings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No brief content returned. Check Studio API Response mapping and that
            CodeNode128 / LLM produced arrays (not empty strings).
          </p>
        ) : (
          <ul className="space-y-3 list-disc pl-5 text-sm leading-relaxed">
            {briefStrings.map((bullet, i) => (
              <li key={i}>{renderInlineHtml(bullet)}</li>
            ))}
          </ul>
        )}
      </section>

      {sourcesBlock && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Sources</h3>
          <SourcesList items={sourcesBlock.items ?? []} />
        </section>
      )}

      {contradictions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cross-source contradictions</h3>
          <div className="grid gap-3">
            {contradictions.map((c, i) => (
              <Card key={i} className="p-4 space-y-2">
                <p className="font-medium">{c.topic}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      {c.source_a_host}
                    </Badge>
                    <p>{c.claim_a}</p>
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      {c.source_b_host}
                    </Badge>
                    <p>{c.claim_b}</p>
                  </div>
                </div>
                {c.note && (
                  <p className="text-xs text-muted-foreground">{c.note}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {consensus.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Consensus</h3>
          <div className="space-y-3">
            {consensus.map((c, i) => (
              <Card key={i} className="p-4">
                <p className="text-sm mb-2">{c.point}</p>
                <p className="text-xs text-muted-foreground">
                  Sources:{" "}
                  {(c.supporting_sources ?? [])
                    .map((id) => `[${id}]`)
                    .join(" ")}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {themes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cross-cutting themes</h3>
          <ul className="space-y-2 list-disc pl-5 text-sm">
            {themes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {summaries.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Article summaries</h3>
          <div className="grid gap-3">
            {summaries.map((a, i) => (
              <Card key={i} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    [{a.source_id}] {a.title}
                  </a>
                  <Badge variant="outline">{a.relevance}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.summary}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {warnings.length > 0 && (
        <section className="space-y-3">
          <Separator />
          <h3 className="text-sm font-medium text-amber-800/90 dark:text-amber-300/90">
            Warnings
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>
                {w.type}
                {w.raw ? ` — ${w.raw}` : ""}
                {w.context ? ` (${w.context})` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
