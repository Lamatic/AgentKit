import type { RequestMeta } from '../../server/request-meta';
import type { EdgeHandler } from '../../server/web/adapter';
export declare const ComponentMod: any;
declare const internalHandler: EdgeHandler;
export declare function handler(request: Request, ctx: {
    waitUntil?: (prom: Promise<void>) => void;
    signal?: AbortSignal;
    requestMeta?: RequestMeta;
}): Promise<Response>;
export default internalHandler;
