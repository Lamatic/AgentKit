import type { LoaderTree } from '../../server/lib/app-dir-module';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppPageRouteModule } from '../../server/route-modules/app-page/module.compiled';
import type { RequestMeta } from '../../server/request-meta';
export declare function createAppPageEntrypoint({ tree, page, pathname, require: __next_app_require__, loadChunk: __next_app_load_chunk__, interopDefault, }: {
    tree: LoaderTree;
    page: string;
    pathname: string;
    require: (id: string | number) => unknown;
    loadChunk: (id: string | number) => Promise<unknown>;
    interopDefault: typeof import('../../server/app-render/interop-default').interopDefault;
}): {
    __next_app__: {
        require: (id: string | number) => unknown;
        loadChunk: (id: string | number) => Promise<unknown>;
    };
    routeModule: AppPageRouteModule;
    handler: (req: IncomingMessage, res: ServerResponse, ctx: {
        waitUntil?: (prom: Promise<void>) => void;
        requestMeta?: RequestMeta;
    }) => Promise<void | null>;
};
