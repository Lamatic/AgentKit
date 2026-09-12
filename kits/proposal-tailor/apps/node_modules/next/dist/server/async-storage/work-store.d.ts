import type { WorkStore } from '../app-render/work-async-storage.external';
import type { IncrementalCache } from '../lib/incremental-cache';
import type { RenderOpts } from '../app-render/types';
import type { FetchMetric } from '../base-http';
import type { RequestLifecycleOpts } from '../base-server';
import type { AppSegmentConfig } from '../../build/segment-config/app/app-segment-config';
import type { ValidationLevel, ResolvedCacheLifeProfiles } from '../config-shared';
export type WorkStoreContext = {
    /**
     * The page that is being rendered. This relates to the path to the page file.
     */
    page: string;
    isPrefetchRequest?: boolean;
    nonce?: string;
    renderOpts: {
        cacheLifeProfiles: ResolvedCacheLifeProfiles;
        staticPageGenerationTimeout: number;
        incrementalCache?: IncrementalCache;
        /**
         * The hash of the most recent server component change (dev only). Included
         * in `"use cache"` cache keys so that cached entries are revalidated after
         * an edit, for every client, regardless of whether it runs the HMR client.
         */
        hmrRefreshHash?: string;
        isOnDemandRevalidate?: boolean;
        cacheComponents: boolean;
        validationLevel: ValidationLevel;
        fetchCache?: AppSegmentConfig['fetchCache'];
        isPossibleServerAction?: boolean;
        pendingWaitUntil?: Promise<any>;
        experimental: Pick<RenderOpts['experimental'], 'isRoutePPREnabled' | 'authInterrupts' | 'useCacheTimeout'>;
        /**
         * Fetch metrics attached in patch-fetch.ts
         **/
        fetchMetrics?: FetchMetric[];
    } & Pick<RenderOpts, 'assetPrefix' | 'supportsDynamicResponse' | 'isBuildTimePrerendering' | 'isDraftMode' | 'isDebugDynamicAccesses'> & RequestLifecycleOpts & Partial<Pick<RenderOpts, 'reactLoadableManifest'>>;
    /**
     * The deployment ID of the current build.
     */
    deploymentId: string;
    /**
     * The build ID of the current build.
     */
    buildId: string;
    previouslyRevalidatedTags: string[];
};
export declare function createWorkStore({ page, renderOpts, isPrefetchRequest, buildId, deploymentId, previouslyRevalidatedTags, nonce, }: WorkStoreContext): WorkStore;
