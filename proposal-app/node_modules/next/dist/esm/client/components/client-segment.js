'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { LayoutRouterContext } from '../../shared/lib/app-router-context.shared-runtime';
import { use } from 'react';
import { createClientParams } from './client-boundary-params';
/**
 * When the Page is a client component we send the params to this client wrapper
 * where they are turned into dynamically tracked values before being passed to the actual Segment component.
 *
 * additionally we may send a promise representing params. We don't ever use this passed
 * value but it can be necessary for the sender to send a Promise that doesn't resolve in certain situations
 * such as when cacheComponents is enabled. It is up to the caller to decide if the promises are needed.
 */ export function ClientSegmentRoot({ Component, slots, serverProvidedParams }) {
    let params;
    if (serverProvidedParams !== null) {
        params = serverProvidedParams.params;
    } else {
        // When Cache Components is enabled, the server does not pass the params
        // as props; they are parsed on the client and passed via context.
        const layoutRouterContext = use(LayoutRouterContext);
        params = layoutRouterContext !== null ? layoutRouterContext.parentParams : {};
    }
    const clientParams = createClientParams(params);
    return /*#__PURE__*/ _jsx(Component, {
        ...slots,
        params: clientParams
    });
}

//# sourceMappingURL=client-segment.js.map