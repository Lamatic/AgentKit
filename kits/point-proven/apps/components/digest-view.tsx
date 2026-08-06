"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DigestResult, SourceItem } from "@/actions/orchestrate";
import { ExternalLink } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["mark", "strong", "em", "a", "code", "b", "i"],
  ALLOWED_ATTR: ["href", "class"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|#source-\d+)/i,
};

/** Sanitize LLM HTML, then turn [n] / [n, m] citation markers into anchors. */
function linkCitations(html: string) {
  const sanitized = DOMPurify.sanitize(String(html), PURIFY_CONFIG);
  return sanitized.replace(/\[([0-9,\s]+)\]/g, (_m, inner: string) => {
    const ids = String(inner)
      .split(",")
      .map((p) => parseInt(p.trim(), 10))
      .filter((n) => !isNaN(n));
    if (!ids.length) return "";
    return (
      "[" +
      ids
        .map(
          (id) =>
            `<a href="#source-${id}" class="citation-link font-mono text-primary underline-offset-2 hover:underline">${id}</a>`
        )
        .join(", ") +
      "]"
    );
  });
}

/**
 * Rows for LLM-generated HTML. A div (not ul/li) keeps any block-level tags in
 * the injected markup from re-parenting the sections that follow.
 */
function HtmlRows({ items, gap }: { items: string[]; gap: "sm" | "md" }) {
  return (
    <div className={gap === "md" ? "space-y-3" : "space-y-2"}>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <span
            aria-hidden
            className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-muted-foreground/60"
          />
          <div
            className="min-w-0 flex-1 [&_mark]:rounded [&_mark]:bg-primary/15 [&_mark]:px-0.5 [&_mark]:text-foreground dark:[&_mark]:bg-primary/25"
            dangerouslySetInnerHTML={{ __html: linkCitations(item) }}
          />
        </div>
      ))}
    </div>
  );
}

function SourcesList({ items }: { items: SourceItem[] }) {
  return (
    <ol className="space-y-2 text-sm">
      {items.map((s) => (
        <li
          key={s.id}
          id={`source-${s.id}`}
          className="flex gap-2 scroll-mt-4"
        >
          <span className="font-mono text-muted-foreground shrink-0">
            [{s.id}]
          </span>
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
  const sourceItems = sourcesBlock?.items ?? [];

  if (briefStrings.length === 0) {
    console.warn(
      "[point-proven] Empty executive_brief. Check Studio API Response mapping and that the post-process Code node / LLM produced arrays (not empty strings)."
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Motion / question</p>
        <h2 className="text-xl font-medium">{digest.query}</h2>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Key claims</h3>
        {briefStrings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No brief content was returned. Try running the digest again.
          </p>
        ) : (
          <HtmlRows items={briefStrings} gap="md" />
        )}
      </section>

      {sourceItems.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cited sources</h3>
          <SourcesList items={sourceItems} />
        </section>
      )}

      {contradictions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Clash points</h3>
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
          <h3 className="text-lg font-semibold">Agreed points</h3>
          <div className="space-y-3">
            {consensus.map((c, i) => (
              <Card key={i} className="p-4 space-y-2">
                <p className="text-sm">{c.point}</p>
                <p className="text-xs text-muted-foreground">
                  Sources:{" "}
                  {(c.supporting_sources ?? [])
                    .map((id) => `[${id}]`)
                    .join(" ")}
                </p>
                {(c.excerpts ?? []).length > 0 && (
                  <ul className="mt-2 space-y-2 border-l-2 border-muted pl-3">
                    {(c.excerpts ?? []).map((ex, j) => (
                      <li
                        key={j}
                        className="text-xs text-muted-foreground italic leading-relaxed"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {themes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Themes</h3>
          <HtmlRows items={themes} gap="sm" />
        </section>
      )}

      {summaries.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Source briefs</h3>
          <div className="space-y-3">
            {summaries.map((a, i) => (
              <Card key={i} className="w-full p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 font-medium hover:underline"
                  >
                    [{a.source_id}] {a.title}
                  </a>
                  <Badge variant="outline" className="shrink-0">
                    {a.relevance}
                  </Badge>
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
