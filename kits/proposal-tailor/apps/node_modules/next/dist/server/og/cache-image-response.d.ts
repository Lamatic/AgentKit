type OgModule = typeof import('next/dist/compiled/@vercel/og');
type ImageResponseArgs = ConstructorParameters<OgModule['ImageResponse']>;
/**
 * Builds the body for a Cache Components `ImageResponse`. The rendered image is
 * cached in the Resume Data Cache during a prerender, so the prospective
 * prerender renders it once and the final prerender retrieves it from memory
 * within microtasks. This lets metadata image routes be statically prerendered
 * under Cache Components instead of being treated as dynamic.
 *
 * The cache boundary is drawn around only the deterministic rasterization of
 * the element tree into an image. The `ImageResponse` element tree is rendered
 * with React Flight once, inside the prerender work-unit store, so any
 * user-space I/O (e.g. `cookies()` or an uncached `fetch`) runs in the correct
 * scope and is subject to the normal Cache Components rules. If that tree
 * needs dynamic input the serialization can't complete, and the route falls
 * back to dynamic. Otherwise the fully resolved tree is handed to satori,
 * which never re-runs the user's components.
 *
 * Outside of a prerender (normal requests) this just renders.
 */
export declare function getCachedImageResponseBody(args: ImageResponseArgs): ReadableStream<Uint8Array>;
export {};
