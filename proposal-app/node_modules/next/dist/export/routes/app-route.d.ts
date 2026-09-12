import type { ExportRouteResult } from '../types';
import type AppRouteRouteModule from '../../server/route-modules/app-route/module';
import type { IncrementalCache } from '../../server/lib/incremental-cache';
import type { MockedRequest, MockedResponse } from '../../server/lib/mock-request';
import type { ExperimentalConfig } from '../../server/config-shared';
import type { Params } from '../../server/request/params';
import type { MultiFileWriter } from '../../lib/multi-file-writer';
export declare const enum ExportedAppRouteFiles {
    BODY = "BODY",
    META = "META"
}
export declare function exportAppRoute(req: MockedRequest, res: MockedResponse, params: Params | undefined, page: string, module: AppRouteRouteModule, incrementalCache: IncrementalCache | undefined, cacheLifeProfiles: import('../../server/config-shared').ResolvedCacheLifeProfiles, htmlFilepath: string, fileWriter: MultiFileWriter, cacheComponents: boolean, staticPageGenerationTimeout: number, experimental: Required<Pick<ExperimentalConfig, 'authInterrupts' | 'useCacheTimeout'>>, buildId: string, deploymentId: string): Promise<ExportRouteResult>;
