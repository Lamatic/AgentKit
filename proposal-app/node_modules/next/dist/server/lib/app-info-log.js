"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    ensureAgentRulesForDev: null,
    getEnvInfo: null,
    logExperimentalInfo: null,
    logStartInfo: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ensureAgentRulesForDev: function() {
        return ensureAgentRulesForDev;
    },
    getEnvInfo: function() {
        return getEnvInfo;
    },
    logExperimentalInfo: function() {
        return logExperimentalInfo;
    },
    logStartInfo: function() {
        return logStartInfo;
    }
});
const _env = require("@next/env");
const _inspector = /*#__PURE__*/ _interop_require_wildcard(require("inspector"));
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../../build/output/log"));
const _picocolors = require("../../lib/picocolors");
const _configschema = require("../config-schema");
const _agentname = require("../../telemetry/agent-name");
const _bundler = require("../../lib/bundler");
const _generateagentfiles = require("./generate-agent-files");
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
function logStartInfo({ networkUrl, appUrl, envInfo, logBundler }) {
    const versionSuffix = logBundler ? ` (${(0, _bundler.bundlerName)((0, _bundler.getBundlerFromEnv)())})` : '';
    _log.bootstrap(`${(0, _picocolors.bold)((0, _picocolors.purple)(`${_log.prefixes.ready} Next.js ${"16.3.5"}`))}${versionSuffix}`);
    if (appUrl) {
        _log.bootstrap(`- Local:         ${appUrl}`);
    }
    if (networkUrl) {
        _log.bootstrap(`- Network:       ${networkUrl}`);
    }
    const inspectorUrl = _inspector.url();
    if (inspectorUrl) {
        // Could also parse this port from the inspector URL.
        // process.debugPort will always be defined even if the process is not being inspected.
        // The full URL seems noisy as far as I can tell.
        // Node.js will print the full URL anyway.
        const debugPort = process.debugPort;
        _log.bootstrap(`- Debugger port: ${debugPort}`);
    }
    if (envInfo == null ? void 0 : envInfo.length) _log.bootstrap(`- Environments: ${envInfo.join(', ')}`);
}
function logExperimentalInfo({ experimentalFeatures, cacheComponents, partialPrefetching }) {
    if (cacheComponents) {
        _log.bootstrap(`- Cache Components enabled`);
    }
    if (partialPrefetching) {
        const mode = partialPrefetching === 'unstable_eager' ? ' (unstable_eager)' : '';
        _log.bootstrap(`- Partial Prefetching enabled${mode}`);
    }
    if (experimentalFeatures == null ? void 0 : experimentalFeatures.length) {
        _log.bootstrap(`- Experiments (use with caution):`);
        for (const exp of experimentalFeatures){
            const isValid = Object.prototype.hasOwnProperty.call(_configschema.experimentalSchema, exp.key);
            if (isValid) {
                const symbol = typeof exp.value === 'boolean' ? exp.value === true ? (0, _picocolors.bold)('✓') : (0, _picocolors.bold)('⨯') : '·';
                const suffix = typeof exp.value === 'number' || typeof exp.value === 'string' ? `: ${JSON.stringify(exp.value)}` : '';
                const reason = exp.reason ? ` (${exp.reason})` : '';
                _log.bootstrap(`  ${symbol} ${exp.key}${suffix}${reason}`);
            } else {
                _log.bootstrap(`  ? ${(0, _picocolors.strikethrough)(exp.key)} (invalid experimental key)`);
            }
        }
    }
    // New line after the bootstrap info
    _log.info('');
}
async function ensureAgentRulesForDev(dir) {
    if (await (0, _agentname.getAgentName)() === null) return null;
    if ((0, _generateagentfiles.hasCurrentAgentRules)(dir)) return null;
    return (0, _generateagentfiles.writeAgentFiles)(dir);
}
function getEnvInfo(dir) {
    const { loadedEnvFiles } = (0, _env.loadEnvConfig)(dir, true, console, false);
    return loadedEnvFiles.map((f)=>f.path);
}

//# sourceMappingURL=app-info-log.js.map