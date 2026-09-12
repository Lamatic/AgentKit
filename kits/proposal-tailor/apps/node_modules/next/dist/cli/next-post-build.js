#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nextPostBuild", {
    enumerable: true,
    get: function() {
        return nextPostBuild;
    }
});
const _fs = require("fs");
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _config = /*#__PURE__*/ _interop_require_default(require("../server/config"));
const _constants = require("../shared/lib/constants");
const _getprojectdir = require("../lib/get-project-dir");
const _utils = require("../server/lib/utils");
const _swc = require("../build/swc");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const nextPostBuild = async (_options, directory)=>{
    var _config_experimental, _config_experimental1;
    const dir = (0, _getprojectdir.getProjectDir)(directory);
    if (!(0, _fs.existsSync)(dir)) {
        (0, _utils.printAndExit)(`> No such directory exists as the project root: ${dir}`);
    }
    const config = await (0, _config.default)(_constants.PHASE_PRODUCTION_BUILD, dir);
    const persistentCaching = ((_config_experimental = config.experimental) == null ? void 0 : _config_experimental.turbopackFileSystemCacheForBuild) || false;
    if (!persistentCaching) {
        console.log('Persistent caching for build is not enabled. Nothing to do.');
        return;
    }
    const distDir = _path.default.join(dir, config.distDir);
    const cachePath = _path.default.join(distDir, 'cache', 'turbopack');
    if (!(0, _fs.existsSync)(cachePath)) {
        console.log('No Turbopack cache directory found. Nothing to do.');
        return;
    }
    const bindings = await (0, _swc.loadBindings)((_config_experimental1 = config.experimental) == null ? void 0 : _config_experimental1.useWasmBinary);
    await bindings.turbo.databaseCompact(cachePath, "16.3.5");
    console.log('Turbopack database compaction complete.');
};

//# sourceMappingURL=next-post-build.js.map