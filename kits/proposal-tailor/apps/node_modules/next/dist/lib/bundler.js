"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    Bundler: null,
    bundlerName: null,
    finalizeBundlerFromConfig: null,
    getBundlerFromEnv: null,
    parseBundlerArgs: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    Bundler: function() {
        return Bundler;
    },
    bundlerName: function() {
        return bundlerName;
    },
    finalizeBundlerFromConfig: function() {
        return finalizeBundlerFromConfig;
    },
    getBundlerFromEnv: function() {
        return getBundlerFromEnv;
    },
    parseBundlerArgs: function() {
        return parseBundlerArgs;
    }
});
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../build/output/log"));
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
var Bundler = /*#__PURE__*/ function(Bundler) {
    Bundler[Bundler["Turbopack"] = 0] = "Turbopack";
    Bundler[Bundler["Webpack"] = 1] = "Webpack";
    Bundler[Bundler["Rspack"] = 2] = "Rspack";
    return Bundler;
}({});
function bundlerName(bundler) {
    switch(bundler){
        case 0:
            return 'Turbopack';
        case 1:
            return 'webpack';
        case 2:
            return 'Rspack';
    }
}
function getBundlerFromEnv() {
    if (process.env.NEXT_RSPACK) {
        return 2;
    }
    if (process.env.TURBOPACK) {
        return 0;
    }
    return 1;
}
function parseBundlerArgs(options) {
    const bundlerFlags = new Map();
    const setBundlerFlag = (bundler, flag)=>{
        bundlerFlags.set(bundler, (bundlerFlags.get(bundler) ?? []).concat(flag));
    };
    // What turbo flag was set? We allow multiple to be set, which is silly but not ambiguous, just pick the most relevant one.
    if (options.turbopack) {
        setBundlerFlag(0, '--turbopack');
    }
    if (options.turbo) {
        setBundlerFlag(0, '--turbo');
    } else if (process.env.TURBOPACK) {
        // We don't really want to support this but it is trivial and not really confusing.
        // If we don't support it and someone sets it, we would have inconsistent behavior
        // since some parts of next would read the return value of this function and other
        // parts will read the env variable.
        setBundlerFlag(0, `TURBOPACK=${process.env.TURBOPACK}`);
    } else if (process.env.IS_TURBOPACK_TEST) {
        setBundlerFlag(0, `IS_TURBOPACK_TEST=${process.env.IS_TURBOPACK_TEST}`);
    }
    if (options.webpack) {
        setBundlerFlag(1, '--webpack');
    }
    if (process.env.IS_WEBPACK_TEST) {
        setBundlerFlag(1, `IS_WEBPACK_TEST=${process.env.IS_WEBPACK_TEST}`);
    }
    // Mostly this is set via the NextConfig but it can also be set via the command line which is
    // common for testing.
    if (process.env.NEXT_RSPACK) {
        setBundlerFlag(2, `NEXT_RSPACK=${process.env.NEXT_RSPACK}`);
    }
    if (process.env.NEXT_TEST_USE_RSPACK) {
        setBundlerFlag(2, `NEXT_TEST_USE_RSPACK=${process.env.NEXT_TEST_USE_RSPACK}`);
    }
    if (bundlerFlags.size > 1) {
        console.error(`Multiple bundler flags set: ${Array.from(bundlerFlags.values()).flat().join(', ')}.

Edit your command or your package.json script to configure only one bundler.`);
        process.exit(1);
    }
    // The default is turbopack when nothing is configured.
    if (bundlerFlags.size === 0) {
        process.env.TURBOPACK = 'auto';
        return 0;
    }
    if (bundlerFlags.has(0)) {
        // Only conditionally assign to the environment variable, preserving already set values.
        // If it was set to 'auto' because no flag was set and this function is called a second time we
        // would upgrade to '1' but we don't really want that.
        process.env.TURBOPACK ??= '1';
        return 0;
    }
    // Otherwise it is one of rspack or webpack. At this point there must be exactly one key in the map.
    return bundlerFlags.keys().next().value;
}
function finalizeBundlerFromConfig(fromOptions) {
    // Reading the next config can set NEXT_RSPACK environment variables.
    if (process.env.NEXT_RSPACK) {
        if (fromOptions !== 2) {
            _log.event(`Switching bundler from ${bundlerName(fromOptions)} to Rspack based on config`);
        }
        return 2;
    }
    return fromOptions;
}

//# sourceMappingURL=bundler.js.map