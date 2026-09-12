export declare function fillStaticMetadataSegment(segment: string, lastSegment: string): string;
/**
 * Returns the pathname used when prerendering static metadata files. Dynamic
 * segments are replaced with "-" placeholders so the file is exported once.
 */
export declare function getStaticMetadataPrerenderPathname(pathname: string): string | null;
/**
 * Fill the dynamic segment in the metadata route
 *
 * Example:
 * fillMetadataSegment('/a/[slug]', { params: { slug: 'b' } }, 'open-graph', false) -> '/a/b/open-graph'
 *
 * When isStatic is true, all dynamic segments are filled with "-" placeholder
 * since static metadata files have consistent responses regardless of params.
 * Example:
 * fillMetadataSegment('/a/[slug]', {}, 'icon.png', true) -> '/a/-/icon.png'
 *
 */
export declare function fillMetadataSegment(segment: string, params: any, lastSegment: string, isStatic: boolean): string;
/**
 * Map metadata page key to the corresponding route
 *
 * static file page key:    /app/robots.txt -> /robots.xml -> /robots.txt/route
 * dynamic route page key:  /app/robots.tsx -> /robots -> /robots.txt/route
 *
 * @param page
 * @returns
 */
export declare function normalizeMetadataRoute(page: string): string;
export declare function normalizeMetadataPageToRoute(page: string, isDynamic: boolean): string;
