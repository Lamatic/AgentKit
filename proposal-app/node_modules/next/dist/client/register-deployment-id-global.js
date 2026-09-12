"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _deploymentid = require("../shared/lib/deployment-id");
const deploymentId = (0, _deploymentid.getDeploymentId)();
globalThis.NEXT_DEPLOYMENT_ID = deploymentId;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=register-deployment-id-global.js.map