'use client';

import { useState, useTransition } from 'react';
import type { Digest } from '../actions/orchestrate';
import { markDigestStatus } from '../actions/orchestrate';
import { SlidePreview } from './SlidePreview';

/**
 * Renders one pending digest: its slides, caption, and hashtags, with
 * actions to copy the caption or mark the digest posted/skipped.
 */
export function DigestCard({ digest }: { digest: Digest }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleAction = (status: 'posted' | 'skipped') => {
    startTransition(() => {
      markDigestStatus(digest.id, status);
    });
  };

  const handleCopyCaption = () => {
    const fullCaption = `${digest.caption}\n\n${digest.hashtags.map((h) => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] text-inkMuted">
            {new Date(digest.publishedAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
            {' · '}{digest.sourceType}
            {digest.corroborated && <span className="text-accent"> · corroborated</span>}
          </span>
          <h2 className="font-display text-xl font-bold text-ink mt-1">{digest.title}</h2>
          {digest.org && <p className="font-mono text-xs text-accentDim mt-0.5">{digest.org}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-pending/10 px-3 py-1 font-mono text-[11px] text-pending">
          pending review
        </span>
      </div>

      <p className="mt-3 text-sm text-inkMuted leading-relaxed">{digest.justification}</p>

      <div className="mt-4">
        <SlidePreview digestId={digest.id} slides={digest.slides} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surfaceHigh p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink leading-relaxed">{digest.caption}</p>
            <p className="mt-2 font-mono text-xs text-accentDim">
              {digest.hashtags.map((h) => `#${h}`).join(' ')}
            </p>
          </div>
          <button
            onClick={handleCopyCaption}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-inkMuted transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleAction('posted')}
          disabled={isPending}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_18px_-12px_rgba(124,92,255,0.9)] transition hover:-translate-y-0.5 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mark as posted
        </button>
        <button
          onClick={() => handleAction('skipped')}
          disabled={isPending}
          className="rounded-full border border-border bg-white/5 px-4 py-2.5 text-sm font-medium text-inkMuted transition hover:border-white/15 hover:bg-white/8 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip this one
        </button>
        {digest.link && (
          <a
            href={digest.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center rounded-full border border-border bg-white/5 px-3.5 py-2 text-xs font-medium text-inkMuted transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
          >
            View source
          </a>
        )}
      </div>
    </article>
  );
}
