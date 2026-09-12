"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    formatDynamicImportPath: null,
    resolveCacheHandlerPathToFilesystem: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    formatDynamicImportPath: function() {
        return formatDynamicImportPath;
    },
    resolveCacheHandlerPathToFilesystem: function() {
        return resolveCacheHandlerPathToFilesystem;
    }
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _url = require("url");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function resolveCacheHandlerPathToFilesystem(filePath) {
    if (filePath.startsWith('file://')) {
        return (0, _url.fileURLToPath)(filePath);
    }
    return filePath;
}
const formatDynamicImportPath = (dir, filePath)=>{
    const resolvedFilePath = resolveCacheHandlerPathToFilesystem(filePath);
    const absoluteFilePath = _path.default.isAbsolute(resolvedFilePath) ? resolvedFilePath : _path.default.join(dir, resolvedFilePath);
    const formattedFilePath = (0, _url.pathToFileURL)(absoluteFilePath).toString();
    return formattedFilePath;
};

//# sourceMappingURL=format-dynamic-import-path.js.map