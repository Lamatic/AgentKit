import type { SegmentVaryPath } from './vary-path';
/**
 * Sentinel value indicating that no per-page dynamic stale time was provided.
 * When this is the dynamicStaleTime, the default DYNAMIC_STALETIME_MS is used.
 */
export declare const UnknownDynamicStaleTime = -1;
/**
 * Converts a dynamic stale time (in seconds, as sent by the server in the `d`
 * field of the Flight response) to an absolute staleAt timestamp. When the
 * value is unknown, falls back to the global DYNAMIC_STALETIME_MS.
 */
export declare function computeDynamicStaleAt(now: number, dynamicStaleTimeSeconds: number): number;
import { EntryStatus, type UnknownMapEntry } from './cache-map';
export type BFCacheEntry = {
    rsc: React.ReactNode | null;
    prefetchRsc: React.ReactNode | null;
    head: React.ReactNode | null;
    prefetchHead: React.ReactNode | null;
    bfcacheId: number;
    ref: UnknownMapEntry | null;
    size: number;
    navigatedAt: number;
    staleAt: number;
    version: number;
    status: EntryStatus.Fulfilled;
};
export declare function invalidateBfCache(): void;
export declare function writeToBFCache(now: number, varyPath: SegmentVaryPath, rsc: React.ReactNode, prefetchRsc: React.ReactNode, head: React.ReactNode, prefetchHead: React.ReactNode, dynamicStaleAt: number, bfcacheId: number): void;
export declare function writeHeadToBFCache(now: number, varyPath: SegmentVaryPath, head: React.ReactNode, prefetchHead: React.ReactNode, dynamicStaleAt: number, bfcacheId: number): void;
/**
 * Update the staleAt of an existing BFCache entry. Used after a dynamic
 * response arrives with a per-page stale time from `unstable_dynamicStaleTime`.
 * The per-page value is authoritative — it overrides whatever staleAt was set
 * by the default DYNAMIC_STALETIME_MS.
 */
export declare function updateBFCacheEntryStaleAt(varyPath: SegmentVaryPath, newStaleAt: number): void;
export declare function readFromBFCache(varyPath: SegmentVaryPath): BFCacheEntry | null;
export declare function readFromBFCacheDuringRegularNavigation(now: number, varyPath: SegmentVaryPath): BFCacheEntry | null;
