"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    interceptTestApis: null,
    wrapRequestHandlerNode: null,
    wrapRequestHandlerWorker: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    interceptTestApis: function() {
        return interceptTestApis;
    },
    wrapRequestHandlerNode: function() {
        return wrapRequestHandlerNode;
    },
    wrapRequestHandlerWorker: function() {
        return wrapRequestHandlerWorker;
    }
});
const _context = require("./context");
const _fetch = require("./fetch");
const _httpget = require("./httpget");
const reader = {
    url (req) {
        return req.url ?? '';
    },
    header (req, name) {
        const h = req.headers[name];
        if (h === undefined || h === null) {
            return null;
        }
        if (typeof h === 'string') {
            return h;
        }
        return h[0] ?? null;
    }
};
const interceptedSymbol = Symbol.for('next.testmode.intercepted');
function interceptTestApis() {
    // In development the render server runs in the same process as the router
    // server, so both call this function. @mswjs/interceptors throws when its
    // global replacements are applied a second time, so make repeated
    // interception within the same process a no-op.
    const globalState = globalThis;
    if (globalState[interceptedSymbol] === true) {
        return ()=>{};
    }
    globalState[interceptedSymbol] = true;
    const originalFetch = global.fetch;
    const restoreFetch = (0, _fetch.interceptFetch)(originalFetch);
    const restoreHttpGet = (0, _httpget.interceptHttpGet)(originalFetch);
    // Cleanup.
    return ()=>{
        globalState[interceptedSymbol] = false;
        restoreFetch();
        restoreHttpGet();
    };
}
function wrapRequestHandlerWorker(handler) {
    return (req, res)=>(0, _context.withRequest)(req, reader, ()=>handler(req, res));
}
function wrapRequestHandlerNode(handler) {
    return (req, res, parsedUrl)=>(0, _context.withRequest)(req, reader, ()=>handler(req, res, parsedUrl));
}

//# sourceMappingURL=server.js.map