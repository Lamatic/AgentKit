import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NextConfigRuntime } from '../../config-shared';
import type { UrlWithParsedQuery } from 'node:url';
import type { ServerCacheStatus } from '../../../next-devtools/dev-overlay/cache-indicator';
import type { AnyStream } from '../../app-render/stream-ops';
export type RevalidateFn = (config: {
    urlPath: string;
    headers: {
        [key: string]: string | string[];
    };
    opts: {
        unstable_onlyGenerated?: boolean;
    };
}) => Promise<void>;
export type RouterServerContext = Record<string, {
    hostname?: string;
    revalidate?: RevalidateFn;
    render404?: (req: IncomingMessage, res: ServerResponse, parsedUrl?: UrlWithParsedQuery, setHeaders?: boolean) => Promise<void>;
    nextConfig?: NextConfigRuntime;
    isCustomServer?: boolean;
    experimentalTestProxy?: boolean;
    logErrorWithOriginalStack?: (err: unknown, type: string) => void;
    setIsrStatus?: (key: string, value: boolean | undefined) => void;
    setReactDebugChannel?: (debugChannel: {
        readable: AnyStream;
    }, htmlRequestId: string, requestId: string) => void;
    setCacheStatus?: (status: ServerCacheStatus, htmlRequestId: string) => void;
    sendErrorsToBrowser?: (errorsRscStream: AnyStream, htmlRequestId: string) => void;
    isWrappedByNextServer?: boolean;
}>;
export declare const RouterServerContextSymbol: unique symbol;
export declare const routerServerGlobal: typeof globalThis & {
    [RouterServerContextSymbol]?: RouterServerContext;
};
