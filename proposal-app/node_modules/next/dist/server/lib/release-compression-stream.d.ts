import type { ServerResponse } from 'node:http';
/**
 * Destroys the zlib stream that the `compression` middleware left open on a
 * response that never finished.
 *
 * The middleware ends its stream only from its own `res.end()` wrapper, so a
 * client disconnect leaves it open, and an open zlib stream is pinned by its
 * native handle: it survives GC, permanently retaining ~256 KiB of deflate
 * state. Ending it rather than destroying it does not work -- its `data` handler
 * writes to the dead response, `res.write()` returns `false`, and the middleware
 * pauses the stream, so it never reaches `end`.
 *
 * `res.on('drain', …)` is forwarded to that stream and `EventEmitter#on` returns
 * the emitter, which is the only handle to it from outside. When compression is
 * inactive the call returns `res` itself.
 */
export declare function releaseCompressionStream(res: ServerResponse): void;
