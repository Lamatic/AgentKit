"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("./register-deployment-id-global");
const _appbootstrap = require("./app-bootstrap");
const _onrecoverableerror = require("./react-client-callbacks/on-recoverable-error");
window.next.turbopack = true;
self.__webpack_hash__ = '';
// eslint-disable-next-line @next/internal/typechecked-require
const instrumentationModules = require('../lib/require-instrumentation-client');
(0, _appbootstrap.appBootstrap)((assetPrefix)=>{
    const { hydrate } = require('./app-index');
    try {
        hydrate(instrumentationModules, assetPrefix);
    } finally{
        if (process.env.__NEXT_DEV_SERVER) {
            const enableCacheIndicator = process.env.__NEXT_CACHE_COMPONENTS;
            const { getOwnerStack } = require('../next-devtools/userspace/app/errors/stitched-error');
            const { renderAppDevOverlay } = require('next/dist/compiled/next-devtools');
            renderAppDevOverlay(getOwnerStack, _onrecoverableerror.isRecoverableError, enableCacheIndicator);
        }
    }
});

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-next-turbopack.js.map