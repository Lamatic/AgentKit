import { getPendingDigests } from '../actions/orchestrate';
import { DigestCard } from '../components/DigestCard';

export const dynamic = 'force-dynamic';

/**
 * The main review dashboard — lists every digest currently awaiting
 * human approval before posting to Instagram.
 */
export default async function ReviewQueuePage() {
  const digests = await getPendingDigests();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 flex items-baseline justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Review queue</h1>
          <p className="font-mono text-xs text-inkMuted mt-1">
            drafted from arXiv, GitHub, Hacker News, and Gemini every 8 hours
          </p>
        </div>
        <span className="font-mono text-sm text-accent">
          {digests.length} pending
        </span>
      </header>

      {digests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg text-ink">Nothing waiting on you</p>
          <p className="mt-1 text-sm text-inkMuted">
            The next scheduled run will drop a new draft here, or nothing new
            surfaced worth posting since the last check.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {digests.map((digest) => (
            <DigestCard key={digest.id} digest={digest} />
          ))}
        </div>
      )}
    </main>
  );
}
