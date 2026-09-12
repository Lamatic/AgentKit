"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    parseJsonFile: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    default: function() {
        return loadJsConfig;
    },
    parseJsonFile: function() {
        return parseJsonFile;
    }
});
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
const _log = /*#__PURE__*/ _interop_require_wildcard(require("./output/log"));
const _getTypeScriptConfiguration = require("../lib/typescript/getTypeScriptConfiguration");
const _iserror = /*#__PURE__*/ _interop_require_default(require("../lib/is-error"));
const _codeframe = require("../shared/lib/errors/code-frame");
const _runTypeScriptCli = require("../lib/typescript/runTypeScriptCli");
const _loadTsConfig = require("../lib/typescript/loadTsConfig");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
let TSCONFIG_WARNED = false;
function parseJsonFile(filePath) {
    const JSON5 = require('next/dist/compiled/json5');
    const contents = (0, _fs.readFileSync)(filePath, 'utf8');
    // Special case an empty file
    if (contents.trim() === '') {
        return {};
    }
    try {
        return JSON5.parse(contents);
    } catch (err) {
        if (!(0, _iserror.default)(err)) throw err;
        const codeFrame = (0, _codeframe.codeFrameColumns)(String(contents), {
            start: {
                line: err.lineNumber || 1,
                column: err.columnNumber || undefined
            }
        }, {
            message: err.message,
            color: true
        });
        throw Object.defineProperty(new Error(`Failed to parse "${filePath}":\n${codeFrame ?? err.message}`), "__NEXT_ERROR_CODE", {
            value: "E1087",
            enumerable: false,
            configurable: true
        });
    }
}
async function loadJsConfig(dir, config) {
    var _jsConfig_compilerOptions;
    const useTypeScriptCli = Boolean(config.experimental.useTypeScriptCli);
    const typeScriptPackage = (0, _runTypeScriptCli.getTypeScriptPackageInfo)(dir);
    const typeScriptPath = useTypeScriptCli ? typeScriptPackage == null ? void 0 : typeScriptPackage.tscPath : typeScriptPackage == null ? void 0 : typeScriptPackage.apiPath;
    const tsConfigFileName = config.typescript.tsconfigPath || 'tsconfig.json';
    const tsConfigPath = _path.default.join(dir, tsConfigFileName);
    if (!useTypeScriptCli && typeScriptPackage && !typeScriptPackage.apiPath && !(0, _runTypeScriptCli.hasNativeTypeScriptPreview)(dir) && _fs.default.existsSync(tsConfigPath)) {
        throw (0, _runTypeScriptCli.getTypeScriptApiMissingError)(typeScriptPackage.version);
    }
    const useTypeScript = Boolean(typeScriptPath && _fs.default.existsSync(tsConfigPath));
    let implicitBaseurl;
    let jsConfig;
    // jsconfig is a subset of tsconfig
    if (useTypeScript) {
        if (tsConfigFileName !== 'tsconfig.json' && TSCONFIG_WARNED === false) {
            TSCONFIG_WARNED = true;
            _log.info(`Using tsconfig file: ${tsConfigFileName}`);
        }
        if (useTypeScriptCli) {
            const tsConfig = await (0, _runTypeScriptCli.getTypeScriptConfigurationCli)({
                baseDir: dir,
                tsConfigPath,
                tscPath: typeScriptPath
            });
            const configOrigins = (0, _loadTsConfig.loadTsConfigOptions)(tsConfigPath);
            jsConfig = {
                compilerOptions: {
                    ...tsConfig.compilerOptions,
                    pathsBasePath: configOrigins.pathsBasePath
                }
            };
        } else {
            const ts = await Promise.resolve(require(typeScriptPath));
            const tsConfig = await (0, _getTypeScriptConfiguration.getTypeScriptConfiguration)(ts, tsConfigPath, true);
            jsConfig = {
                compilerOptions: tsConfig.options
            };
        }
        implicitBaseurl = _path.default.dirname(tsConfigPath);
    }
    const jsConfigPath = _path.default.join(dir, 'jsconfig.json');
    if (!useTypeScript && _fs.default.existsSync(jsConfigPath)) {
        jsConfig = parseJsonFile(jsConfigPath);
        implicitBaseurl = _path.default.dirname(jsConfigPath);
    }
    let resolvedBaseUrl;
    if (jsConfig == null ? void 0 : (_jsConfig_compilerOptions = jsConfig.compilerOptions) == null ? void 0 : _jsConfig_compilerOptions.baseUrl) {
        resolvedBaseUrl = {
            baseUrl: _path.default.resolve(implicitBaseurl ?? dir, jsConfig.compilerOptions.baseUrl),
            isImplicit: false
        };
    } else {
        var _jsConfig_compilerOptions1;
        // TypeScript 5.0+: `pathsBasePath` is the directory of the tsconfig that
        // defines `paths`. For paths inherited from an extended base tsconfig (e.g.
        // a workspace-root tsconfig.base.json for nx monorepo), this is the base
        // config's directory — not the app tsconfig dir. Using it ensures JsConfigPathsPlugin
        // joins path-mapping values against the correct base so `baseUrl` is not required
        // for path aliases to work in webpack.
        const pathsBasePath = jsConfig == null ? void 0 : (_jsConfig_compilerOptions1 = jsConfig.compilerOptions) == null ? void 0 : _jsConfig_compilerOptions1.pathsBasePath;
        const effectiveBaseUrl = pathsBasePath ?? implicitBaseurl;
        if (effectiveBaseUrl) {
            resolvedBaseUrl = {
                baseUrl: effectiveBaseUrl,
                isImplicit: true
            };
        }
    }
    return {
        useTypeScript,
        jsConfig,
        resolvedBaseUrl,
        jsConfigPath: useTypeScript ? tsConfigPath : _fs.default.existsSync(jsConfigPath) ? jsConfigPath : undefined
    };
}

//# sourceMappingURL=load-jsconfig.js.map