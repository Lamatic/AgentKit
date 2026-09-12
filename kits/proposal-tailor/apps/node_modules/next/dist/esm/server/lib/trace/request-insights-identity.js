import { createAsyncLocalStorage } from '../../app-render/async-local-storage';
// This storage covers the part of BaseServer request handling that runs before
// App Render creates workAsyncStorage. Once available, workStore remains the
// primary identity source for locally recorded spans.
const REQUEST_INSIGHTS_IDENTITY_STORAGE_KEY = Symbol.for('@next/request-insights-identity-storage');
function getRequestInsightsIdentityStorage() {
    const globalStore = globalThis;
    return globalStore[REQUEST_INSIGHTS_IDENTITY_STORAGE_KEY] ??= createAsyncLocalStorage();
}
export function runWithRequestInsightsIdentity(identity, fn) {
    return getRequestInsightsIdentityStorage().run(identity, fn);
}
export function getRequestInsightsIdentity() {
    return getRequestInsightsIdentityStorage().getStore();
}

//# sourceMappingURL=request-insights-identity.js.map