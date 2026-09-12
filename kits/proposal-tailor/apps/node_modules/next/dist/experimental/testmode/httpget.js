"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "interceptHttpGet", {
    enumerable: true,
    get: function() {
        return interceptHttpGet;
    }
});
const _ClientRequest = require("next/dist/compiled/@mswjs/interceptors/ClientRequest");
const _fetch = require("./fetch");
function interceptHttpGet(originalFetch) {
    const clientRequestInterceptor = new _ClientRequest.ClientRequestInterceptor();
    clientRequestInterceptor.on('request', async ({ request, controller })=>{
        if (request.headers.get('next-test-internal') === '1') {
            // A request that's part of the test proxy protocol itself, sent by
            // `handleFetch` from within this listener. Not responding lets the
            // interceptor perform it against the real server. Handling it here
            // instead would recurse indefinitely.
            return;
        }
        const response = await (0, _fetch.handleFetch)(originalFetch, request);
        controller.respondWith(response);
    });
    clientRequestInterceptor.apply();
    // Cleanup.
    return ()=>{
        clientRequestInterceptor.dispose();
    };
}

//# sourceMappingURL=httpget.js.map