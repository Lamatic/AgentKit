import type { BaseNextRequest, BaseNextResponse } from '../base-http';
import type { IncomingHttpHeaders } from 'http';
import type { RequestStore } from '../app-render/work-unit-async-storage.external';
import type { RenderOpts } from '../app-render/types';
import type { NextRequest } from '../web/spec-extension/request';
import type { __ApiPreviewProps } from '../api-utils';
import type { ServerComponentsHmrCache } from '../response-cache';
import type { ResumeDataCache } from '../resume-data-cache/resume-data-cache';
import type { Params } from '../request/params';
import type { ImplicitTags } from '../lib/implicit-tags';
import type { OpaqueFallbackRouteParams } from '../request/fallback-params';
export type WrapperRenderOpts = Partial<Pick<RenderOpts, 'onUpdateCookies'>> & {
    previewProps?: __ApiPreviewProps;
};
type RequestContext = RequestResponsePair & {
    /**
     * The URL of the request. This only specifies the pathname and the search
     * part of the URL. This is only undefined when generating static paths (ie,
     * there is no request in progress, nor do we know one).
     */
    url: {
        /**
         * The pathname of the requested URL.
         */
        pathname: string;
        /**
         * The search part of the requested URL. If the request did not provide a
         * search part, this will be an empty string.
         */
        search?: string;
    };
    phase: RequestStore['phase'];
    renderOpts?: WrapperRenderOpts;
    isHmrRefresh?: boolean;
    serverComponentsHmrCache?: ServerComponentsHmrCache;
    implicitTags: ImplicitTags;
};
type RequestResponsePair = {
    req: BaseNextRequest;
    res: BaseNextResponse;
} | {
    req: NextRequest;
    res: undefined;
};
/**
 * The fields the request store actually reads from `req` / `res`. Decoupling
 * the store's construction from `IncomingMessage` / `BaseNextRequest` /
 * `NextRequest` lets it be built without a real `req`/`res` (e.g. by the `'use
 * cache'` deadlock probe worker, which only has a serializable snapshot of the
 * outer request).
 */
export type RequestStoreInputs = {
    phase: RequestStore['phase'];
    /**
     * Raw headers, either as a Web `Headers` instance or Node's
     * `IncomingHttpHeaders`.
     */
    headers: Headers | IncomingHttpHeaders;
    /**
     * Called whenever userspace mutates cookies (via `cookies().set(...)` etc.).
     * Real renders wire this to `res.setHeader('Set-Cookie', cookies)`. Pass
     * `undefined` for callers without a response (e.g. probe workers). Cookie
     * writes during `'render'` are still gated by
     * `MutableRequestCookiesAdapter`'s phase guard, so leaving this off doesn't
     * silently accept writes that would otherwise be rejected.
     */
    onUpdateCookies: ((cookies: string[]) => void) | undefined;
    url: {
        pathname: string;
        search?: string;
    };
    rootParams: Params;
    implicitTags: ImplicitTags;
    resumeDataCache: ResumeDataCache | null;
    previewProps: WrapperRenderOpts['previewProps'];
    isHmrRefresh: boolean | undefined;
    serverComponentsHmrCache: ServerComponentsHmrCache | undefined;
    /**
     * The hash of the most recent server component change (dev only). Included in
     * `"use cache"` cache keys so that cached entries are revalidated after an
     * edit, for every client, regardless of whether it runs the HMR client.
     */
    hmrRefreshHash: string | undefined;
    fallbackParams: OpaqueFallbackRouteParams | null | undefined;
};
export declare function createRequestStoreForRender(req: RequestContext['req'], res: RequestContext['res'], url: RequestContext['url'], rootParams: Params, implicitTags: RequestContext['implicitTags'], onUpdateCookies: RenderOpts['onUpdateCookies'], previewProps: WrapperRenderOpts['previewProps'], isHmrRefresh: RequestContext['isHmrRefresh'], serverComponentsHmrCache: RequestContext['serverComponentsHmrCache'], resumeDataCache: ResumeDataCache | null, fallbackParams: OpaqueFallbackRouteParams | null, hmrRefreshHash: string | undefined): RequestStore;
export declare function createRequestStoreForAPI(req: RequestContext['req'], url: RequestContext['url'], implicitTags: RequestContext['implicitTags'], onUpdateCookies: RenderOpts['onUpdateCookies'], previewProps: WrapperRenderOpts['previewProps'], hmrRefreshHash: string | undefined): RequestStore;
/**
 * Build a `RequestStore` from a serializable, request-shaped input. Used
 * directly by the existing `createRequestStoreForRender` /
 * `createRequestStoreForAPI` wrappers, and by side-process consumers like the
 * `'use cache'` deadlock probe worker that don't have a real `req`/`res` pair
 * but do have a forwarded snapshot of the outer request's headers etc.
 */
export declare function createRequestStore(inputs: RequestStoreInputs): RequestStore;
export declare function synchronizeMutableCookies(store: RequestStore): void;
export {};
