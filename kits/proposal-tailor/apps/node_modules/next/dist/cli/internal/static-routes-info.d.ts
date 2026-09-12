/**
 * `next internal static-routes-info` — analyzes a built Next.js app and
 * reports per-route bundle sizes statically (without running the app).
 *
 * The analysis is split into three steps so it's easy to swap in different
 * chunking strategies later:
 *
 *   1. Capture: for each route, collect a set of files that belong to it,
 *      partitioned into 6 disjoint categories.
 *   2. Deduplicate: per-route sets are already deduplicated (Set<>), and we
 *      union them across routes for project-wide totals.
 *   3. Measure: stat each unique file path to get { count, bytes }.
 *
 * Output is markdown by default, or JSON with `--json`. `--limit N` keeps
 * only the top N routes (totals always reflect all routes).
 */
export interface StaticRoutesInfoOptions {
    json?: boolean;
    limit?: number;
    sort?: string;
    files?: boolean;
}
export declare function staticRoutesInfoCli(options: StaticRoutesInfoOptions, directory: string | undefined): Promise<void>;
