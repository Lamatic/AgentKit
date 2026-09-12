import { Transform } from 'node:stream';
/**
 * Node.js `Transform` that coalesces chunks written in the same microtask into
 * a single `Uint8Array` before pushing downstream, flushing synchronously once
 * the buffer reaches `maxBufferByteLength` (default: never, i.e.
 * microtask-only).
 *
 * This lives in its own module, separate from `stream-ops.node`, so that
 * consumers outside the render layer (e.g. the dev server's React debug
 * channel) can batch Node streams without pulling in `stream-ops.node`'s
 * `react-dom/server` and `react-dom/static` imports. Those resolve to the
 * vendored React only inside aliased app bundles; loaded from the unaliased
 * dev-server runtime they resolve to the app's installed React, which on React
 * 18 has no `react-dom/static` export.
 */
export declare function createNodeBufferedTransformStream(maxBufferByteLength?: number): Transform;
