export declare const __next_app__: {
    require: (id: string | number) => unknown;
    loadChunk: (id: string | number) => Promise<unknown>;
};
export declare const routeModule: import("../../server/route-modules/app-page/module").AppPageRouteModule;
export declare const handler: (req: import("http").IncomingMessage, res: import("http").ServerResponse, ctx: {
    waitUntil?: (prom: Promise<void>) => void;
    requestMeta?: import("../../server/request-meta").RequestMeta;
}) => Promise<void | null>;
export * from '../../server/app-render/entry-base';
