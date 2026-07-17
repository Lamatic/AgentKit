"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DigestResult, SourceItem } from "@/actions/orchestrate";
import { ExternalLink } from "lucide-react";

function renderInlineHtml(text: string) {
  return (
    <span
      className="[&_mark]:rounded [&_mark]:bg-amber-200/80 [&_mark]:px-0.5 [&_mark]:text-foreground dark:[&_mark]:bg-amber-500/30"
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
  const briefStrings = digest.executive_brief.filter(
    (item): item is string => typeof item === "string"
  );
  const sourcesBlock = digest.executive_brief.find(
    (item): item is { type: "sources"; items: SourceItem[] } =>
      typeof item === "object" && item !== null && item.type === "sources"
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Query</p>
        <h2 className="text-xl font-medium">{digest.query}</h2>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Executive brief</h3>
        <ul className="space-y-3 list-disc pl-5 text-sm leading-relaxed">
          {briefStrings.map((bullet, i) => (
            <li key={i}>{renderInlineHtml(bullet)}</li>
          ))}
        </ul>
      </section>

      {sourcesBlock && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Sources</h3>
          <SourcesList items={sourcesBlock.items} />
        </section>
      )}

      {digest.cross_source_contradictions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cross-source contradictions</h3>
          <div className="grid gap-3">
            {digest.cross_source_contradictions.map((c, i) => (
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

      {digest.consensus_points.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Consensus</h3>
          <div className="space-y-3">
            {digest.consensus_points.map((c, i) => (
              <Card key={i} className="p-4">
                <p className="text-sm mb-2">{c.point}</p>
                <p className="text-xs text-muted-foreground">
                  Sources: {c.supporting_sources.map((id) => `[${id}]`).join(" ")}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {digest.cross_cutting_themes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cross-cutting themes</h3>
          <ul className="space-y-2 list-disc pl-5 text-sm">
            {digest.cross_cutting_themes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {digest.article_summaries.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Article summaries</h3>
          <div className="grid gap-3">
            {digest.article_summaries.map((a, i) => (
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

      {digest.warnings.length > 0 && (
        <section className="space-y-3">
          <Separator />
          <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Warnings
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            {digest.warnings.map((w, i) => (
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
