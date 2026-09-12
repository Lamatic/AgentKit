"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "transpileConfig", {
    enumerable: true,
    get: function() {
        return transpileConfig;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _nodefs = require("node:fs");
const _nodeurl = require("node:url");
const _requirehook = require("./require-hook");
const _log = require("../output/log");
const _utils = require("../../server/lib/utils");
const _loadTsConfig = require("../../lib/typescript/loadTsConfig");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function resolveSWCOptions(cwd, compilerOptions) {
    var _process_versions, _process;
    return {
        jsc: {
            parser: {
                syntax: 'typescript'
            },
            ...compilerOptions.paths ? {
                paths: compilerOptions.paths
            } : {},
            ...compilerOptions.baseUrl ? {
                baseUrl: _nodepath.default.resolve(cwd, compilerOptions.baseUrl)
            } : compilerOptions.paths ? {
                baseUrl: compilerOptions.pathsBasePath ?? cwd
            } : {}
        },
        module: {
            type: 'commonjs'
        },
        isModule: 'unknown',
        env: {
            targets: {
                // Setting the Node.js version can reduce unnecessary code generation.
                node: ((_process = process) == null ? void 0 : (_process_versions = _process.versions) == null ? void 0 : _process_versions.node) ?? '20.19.0'
            }
        }
    };
}
async function loadTsConfig(dir) {
    // NOTE: This doesn't fully cover the edge case for setting
    // "typescript.tsconfigPath" in next config which is currently
    // a restriction.
    // It's a chicken-and-egg problem since we need to transpile
    // the next config to get that value.
    const resolvedTsConfigPath = _nodepath.default.join(dir, 'tsconfig.json');
    if (!(0, _nodefs.existsSync)(resolvedTsConfigPath)) {
        return {};
    }
    return (0, _loadTsConfig.loadTsConfigOptions)(resolvedTsConfigPath);
}
async function transpileConfig({ nextConfigPath, dir }) {
    try {
        // envs are passed to the workers and preserve the flag
        if (process.env.__NEXT_NODE_NATIVE_TS_LOADER_ENABLED === 'true') {
            try {
                // Node.js v22.10.0+
                // Value is 'strip' or 'transform' based on how the feature is enabled.
                // https://nodejs.org/api/process.html#processfeaturestypescript
                // TODO: Remove `as any` once we bump @types/node to v22.10.0+
                if (process.features.typescript) {
                    // Run import() here to catch errors and fallback to legacy resolution.
                    return (await import((0, _nodeurl.pathToFileURL)(nextConfigPath).href)).default;
                }
                if ((0, _utils.getNodeOptionsArgs)().includes('--no-experimental-strip-types') || process.execArgv.includes('--no-experimental-strip-types')) {
                    (0, _log.warnOnce)(`Skipped resolving "${_nodepath.default.basename(nextConfigPath)}" using Node.js native TypeScript resolution because it was disabled by the "--no-experimental-strip-types" flag.` + ' Falling back to legacy resolution.' + ' Learn more: https://nextjs.org/docs/app/api-reference/config/typescript#using-nodejs-native-typescript-resolver-for-nextconfigts');
                }
                // Feature is not enabled, fallback to legacy resolution for current session.
                process.env.__NEXT_NODE_NATIVE_TS_LOADER_ENABLED = 'false';
            } catch (cause) {
                (0, _log.warnOnce)(`Failed to import "${_nodepath.default.basename(nextConfigPath)}" using Node.js native TypeScript resolution.` + ' Falling back to legacy resolution.' + ' Learn more: https://nextjs.org/docs/app/api-reference/config/typescript#using-nodejs-native-typescript-resolver-for-nextconfigts', {
                    cause
                });
                // Once failed, fallback to legacy resolution for current session.
                process.env.__NEXT_NODE_NATIVE_TS_LOADER_ENABLED = 'false';
            }
        }
        const compilerOptions = await loadTsConfig(dir);
        return handleCJS({
            dir,
            nextConfigPath,
            compilerOptions
        });
    } catch (cause) {
        throw Object.defineProperty(new Error(`Failed to transpile "${_nodepath.default.basename(nextConfigPath)}".`, {
            cause
        }), "__NEXT_ERROR_CODE", {
            value: "E797",
            enumerable: false,
            configurable: true
        });
    }
}
async function handleCJS({ dir, nextConfigPath, compilerOptions }) {
    const swcOptions = resolveSWCOptions(dir, compilerOptions);
    let hasRequire = false;
    try {
        var _config_experimental;
        const nextConfigString = (0, _nodefs.readFileSync)(nextConfigPath, 'utf8');
        // lazy require swc since it loads React before even setting NODE_ENV
        // resulting loading Development React on Production
        const { loadBindings } = require('../swc');
        const bindings = await loadBindings();
        const { code } = await bindings.transform(nextConfigString, swcOptions);
        // register require hook only if require exists
        if (code.includes('require(')) {
            (0, _requirehook.registerHook)(swcOptions);
            hasRequire = true;
        }
        // filename & extension don't matter here
        const config = (0, _requirehook.requireFromString)(code, _nodepath.default.resolve(dir, 'next.config.compiled.js'));
        // At this point we have already loaded the bindings without this configuration setting due to the `transform` call above.
        // Possibly we fell back to wasm in which case, it all works out but if not we need to warn
        // that the configuration was ignored.
        if ((config == null ? void 0 : (_config_experimental = config.experimental) == null ? void 0 : _config_experimental.useWasmBinary) && !bindings.isWasm) {
            (0, _log.warn)('Using a next.config.ts file is incompatible with `experimental.useWasmBinary` unless ' + '`--experimental-next-config-strip-types` is also passed.\nSetting `useWasmBinary` to `false');
            config.experimental.useWasmBinary = false;
        }
        return config;
    } catch (error) {
        throw error;
    } finally{
        if (hasRequire) {
            (0, _requirehook.deregisterHook)();
        }
    }
}

//# sourceMappingURL=transpile-config.js.map