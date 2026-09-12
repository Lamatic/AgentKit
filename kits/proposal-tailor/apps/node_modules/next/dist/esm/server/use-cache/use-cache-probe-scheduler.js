import { getUseCacheProbe } from './use-cache-probe-globals';
const PROBE_THRESHOLD_MS = 10000;
const MIN_PROBE_BUDGET_MS = 3000;
/**
 * Schedule an idle-deadline probe over a cache fill stream (dev-only).
 *
 * Fires the probe when the stream has been idle for `PROBE_THRESHOLD_MS`. The
 * probe re-runs the cache function in a fresh V8 isolate so module-scoped state
 * from the outer render — e.g. a top-level `Map<string, Promise>` deduping
 * fetches — can't poison the body. If the function completes in isolation, the
 * hang is attributable to that shared state and the caller surfaces a specific
 * error instead of waiting out the generic timeout.
 *
 * Returns the input stream unchanged when the scheduler should be skipped: no
 * probe hook installed, or the remaining time until `fillDeadlineAt` is too
 * short to leave room for both the idle threshold and a minimum probe budget.
 */ export function setupProbeScheduler(opts) {
    const { workStore, outerRequestStore, cacheContext, encodedArguments, fillDeadlineAt, stream, abortSignal, onProbeCompleted } = opts;
    if (fillDeadlineAt - performance.now() < PROBE_THRESHOLD_MS + MIN_PROBE_BUDGET_MS) {
        return stream;
    }
    const probe = getUseCacheProbe();
    if (!probe) {
        return stream;
    }
    let lastChunkAt = performance.now();
    let idleTimer;
    const startProbe = ()=>{
        if (abortSignal.aborted) {
            return;
        }
        const probeStartedAtChunk = lastChunkAt;
        // Computed when the probe is about to run so it gets the actual remaining
        // budget, not a stale value baked in at scheduler setup. Reserves a 1s
        // buffer so the probe's internal timeout fires before the outer render
        // timeout.
        const probeInternalTimeoutMs = fillDeadlineAt - performance.now() - 1000;
        probe({
            page: workStore.page,
            route: workStore.route,
            id: cacheContext.functionId,
            kind: cacheContext.handlerKind,
            encodedArguments,
            // Built lazily because most fills complete before the idle timer fires;
            // only worth assembling once we know the probe is running.
            request: {
                headers: Array.from(outerRequestStore.headers.entries()),
                cookieHeader: outerRequestStore.headers.get('cookie') ?? undefined,
                urlPathname: outerRequestStore.url.pathname,
                urlSearch: outerRequestStore.url.search,
                rootParams: outerRequestStore.rootParams ?? {},
                isDraftMode: workStore.isDraftMode ?? false,
                isHmrRefresh: outerRequestStore.isHmrRefresh ?? false,
                hmrRefreshHash: outerRequestStore.hmrRefreshHash,
                requestStartTime: workStore.requestStartTime
            },
            timeoutMs: probeInternalTimeoutMs
        }).then((completed)=>{
            // Mid-probe recovery: chunks arrived while the probe was running, so
            // the main stream is making progress. Discard the probe's result rather
            // than reporting a deadlock that no longer holds.
            if (lastChunkAt > probeStartedAtChunk) {
                return;
            }
            if (completed && !abortSignal.aborted) {
                onProbeCompleted();
            }
        }, ()=>{
        // Probe failures are inconclusive; fall back to the regular cache-fill
        // timeout.
        });
    };
    const scheduleAfterIdle = ()=>{
        if (idleTimer !== undefined || abortSignal.aborted) {
            return;
        }
        const now = performance.now();
        const idleFor = now - lastChunkAt;
        const wait = Math.max(0, PROBE_THRESHOLD_MS - idleFor);
        // Skip scheduling if the outer fill timeout will fire before the probe
        // could even start running with at least a minimum useful budget. Without
        // this check, a chunk arriving late in the fill could reschedule a probe
        // that the outer timeout would then abort — wasted worker spawn for a probe
        // that can't meaningfully complete.
        if (fillDeadlineAt - now < wait + MIN_PROBE_BUDGET_MS) {
            return;
        }
        idleTimer = setTimeout(()=>{
            idleTimer = undefined;
            if (abortSignal.aborted) {
                return;
            }
            const idleNow = performance.now() - lastChunkAt;
            if (idleNow < PROBE_THRESHOLD_MS) {
                // A chunk arrived since we set this timer; reschedule.
                scheduleAfterIdle();
                return;
            }
            startProbe();
        }, wait);
    };
    abortSignal.addEventListener('abort', ()=>{
        if (idleTimer !== undefined) {
            clearTimeout(idleTimer);
            idleTimer = undefined;
        }
    }, {
        once: true
    });
    scheduleAfterIdle();
    return stream.pipeThrough(new TransformStream({
        transform (chunk, controller) {
            lastChunkAt = performance.now();
            scheduleAfterIdle();
            controller.enqueue(chunk);
        }
    }));
}

//# sourceMappingURL=use-cache-probe-scheduler.js.map