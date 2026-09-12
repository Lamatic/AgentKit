/**
 * Inert stand-in for `./navigation-testing-lock`.
 *
 * When the Instant Navigation Testing API is disabled (a production build
 * without `experimental.exposeTestingApiInProductionBuild`), the browser
 * bundle resolves `./navigation-testing-lock` to this module instead of the
 * real implementation, so none of the lock machinery ships. The alias is set
 * up in `create-compiler-aliases.ts` (webpack) and
 * `crates/next-core/src/next_import_map.rs` (Turbopack).
 *
 * Every export mirrors the real module's signature and returns the value the
 * real implementation produces when no lock is held.
 */ export function getPreLockFetch() {
    return null;
}
export function beginNavigationLockPrefetch() {
    return null;
}
export function getNavigationLockSegmentCacheMap() {
    return null;
}
export function resolveNavigationLockPrefetch(_prefetch) {}
export function startListeningForInstantNavigationCookie() {}
export function updateCapturedSPAToTree(_fromTree, _toTree) {}
export function isNavigationLocked() {
    return false;
}
export function beginLockedNavigation() {
    return null;
}
export function getCurrentNavigationGate() {
    return null;
}
export function resetNavigationLockToPending() {}
export function shouldRestrictNavigationToShell(_rootPrefetchHints, _linkFetchStrategy) {
    return false;
}

//# sourceMappingURL=navigation-testing-lock.disabled.js.map