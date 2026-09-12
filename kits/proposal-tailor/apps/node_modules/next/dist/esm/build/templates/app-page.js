import { createAppPageEntrypoint } from './app-page-runtime';
import { interopDefault } from '../../server/app-render/interop-default' with {
    'turbopack-transition': 'next-server-utility'
};
// INJECT:tree
// INJECT:__next_app_require__
// INJECT:__next_app_load_chunk__
const entrypoint = createAppPageEntrypoint({
    tree,
    page: 'VAR_DEFINITION_PAGE',
    pathname: 'VAR_DEFINITION_PATHNAME',
    require: __next_app_require__,
    loadChunk: __next_app_load_chunk__,
    interopDefault
});
export const __next_app__ = entrypoint.__next_app__;
export const routeModule = entrypoint.routeModule;
export const handler = entrypoint.handler;
export * from '../../server/app-render/entry-base' with {
    'turbopack-transition': 'next-server-utility'
};

//# sourceMappingURL=app-page.js.map