import type { IncomingMessage, ServerResponse } from 'node:http';
import { type RequestMeta } from '../../server/request-meta';
declare const _default: any;
export default _default;
export declare const config: any;
export declare function handler(req: IncomingMessage, res: ServerResponse, ctx: {
    waitUntil?: (prom: Promise<void>) => void;
    requestMeta?: RequestMeta;
}): Promise<void>;
