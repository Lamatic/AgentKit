import type { EdgeHandler } from '../../server/web/adapter';
import '../adapter/setup-node-env.external';
import '../../server/web/globals';
import type { RequestMeta } from '../../server/request-meta';
declare const internalHandler: EdgeHandler;
export declare function handler(request: Request, ctx: {
    waitUntil?: (prom: Promise<void>) => void;
    signal?: AbortSignal;
    requestMeta?: RequestMeta;
}): Promise<Response>;
export default internalHandler;
