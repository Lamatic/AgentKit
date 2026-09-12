/**
 * Name of the directory at the project root where profiling output (CPU
 * profiles and Turbopack traces) is written when profiling is enabled (see the
 * `--experimental-cpu-prof` and `--internal-trace` CLI flags). It is a
 * fixed-name sibling of `distDir`, not configurable.
 *
 * Keep this in sync with `DIST_PROFILES_DIR_NAME` in
 * `crates/next-core/src/next_config.rs`.
 */
export declare const PROFILES_DIR_NAME = ".next-profiles";
/**
 * Create the `.next-profiles` directory under `dir` and return its absolute
 * path. This is the single place that creates the directory — the Rust trace
 * writer relies on it already existing.
 *
 * Also writes a `.gitignore` containing `*` (if one isn't already there) so the
 * potentially large profiling output is excluded from git and gitignore-aware
 * tools (Tailwind, Turborepo, ...) skip the subtree instead of reading it and
 * hanging/OOMing.
 */
export declare function ensureProfilesDir(dir: string): string;
