const SYNC_IO_DOCS = {
    time: 'https://nextjs.org/docs/messages/blocking-prerender-current-time',
    random: 'https://nextjs.org/docs/messages/blocking-prerender-random',
    crypto: 'https://nextjs.org/docs/messages/blocking-prerender-crypto'
};
const SYNC_IO_CLIENT_DOCS = {
    time: 'https://nextjs.org/docs/messages/blocking-prerender-current-time-client',
    random: 'https://nextjs.org/docs/messages/blocking-prerender-random-client',
    crypto: 'https://nextjs.org/docs/messages/blocking-prerender-crypto-client'
};
const SYNC_IO_RUNTIME_DOCS = {
    time: 'https://nextjs.org/docs/messages/blocking-prerender-current-time',
    random: 'https://nextjs.org/docs/messages/blocking-prerender-random',
    crypto: 'https://nextjs.org/docs/messages/blocking-prerender-crypto'
};
function elapsedTimeBullet(type) {
    return type === 'time' ? `\n  - [measure] If the value is for telemetry, use a timing API such as \`performance.now()\`` : '';
}
function createSyncIOErrorImpl(route, expression, type, docsUrl) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered the unstable value ${expression} while prerendering.\n\n` + `This value can change between renders, so it must be either prerendered or computed later.\n\n` + `Ways to fix this:\n` + `  - [dynamic] Render at request time by adding a dynamic data access (e.g. \`await connection()\`) before this call\n` + `  - [cache] Prerender and cache the value with \`"use cache"\`\n` + `  - [client] Render the value on the client with \`"use client"\`` + elapsedTimeBullet(type) + `\n\nLearn more: ${docsUrl}`), "__NEXT_ERROR_CODE", {
        value: "E1432",
        enumerable: false,
        configurable: true
    });
}
export function createSyncIOError(route, expression, type) {
    return createSyncIOErrorImpl(route, expression, type, SYNC_IO_DOCS[type]);
}
export function createSyncIORuntimeError(route, expression, type) {
    return createSyncIOErrorImpl(route, expression, type, SYNC_IO_RUNTIME_DOCS[type]);
}
export function createSyncIOClientError(route, expression, type) {
    const docsUrl = SYNC_IO_CLIENT_DOCS[type];
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered the unstable value ${expression} in a Client Component.\n\n` + `This value would be evaluated during the prerender, instead of recomputed on each visit.\n\n` + `Ways to fix this:\n` + `  - [stream] Wrap the Client Component in \`<Suspense fallback={...}>\`\n` + `  - [defer] Move the read into a \`useEffect\` or event handler` + elapsedTimeBullet(type) + `\n\nLearn more: ${docsUrl}`), "__NEXT_ERROR_CODE", {
        value: "E1434",
        enumerable: false,
        configurable: true
    });
}

//# sourceMappingURL=sync-io-messages.js.map