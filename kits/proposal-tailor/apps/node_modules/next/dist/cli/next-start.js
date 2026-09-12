#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "nextStart", {
    enumerable: true,
    get: function() {
        return nextStart;
    }
});
const _cpuprofile = require("../server/lib/cpu-profile");
const _startserver = require("../server/lib/start-server");
const _utils = require("../server/lib/utils");
const _getprojectdir = require("../lib/get-project-dir");
const _getreservedport = require("../lib/helpers/get-reserved-port");
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
// Ensure NEXT_PRIVATE_START_TIME is set for accurate "Ready in" timing.
// This should already be set by bin/next.ts, but we set it here as a fallback
// in case the module is loaded through a different code path.
if (!process.env.NEXT_PRIVATE_START_TIME) {
    process.env.NEXT_PRIVATE_START_TIME = Date.now().toString();
}
/**
 * Start the Next.js server
 *
 * @param options The options for the start command
 * @param directory The directory to start the server in
 */ const nextStart = async (options, directory)=>{
    const dir = (0, _getprojectdir.getProjectDir)(directory);
    const hostname = options.hostname;
    const inspect = options.inspect;
    const port = options.port;
    const keepAliveTimeout = options.keepAliveTimeout;
    if ((0, _getreservedport.isPortIsReserved)(port)) {
        (0, _utils.printAndExit)((0, _getreservedport.getReservedPortExplanation)(port), 1);
    }
    if (inspect) {
        const inspector = await import('inspector');
        const isInspecting = inspector.url() !== undefined;
        if (isInspecting) {
            _log.warn(`The Node.js debugger port is already open at ${process.debugPort}. Ignoring '--inspect${inspect === true ? '' : `="${(0, _utils.formatDebugAddress)(inspect)}"`}'.`);
        } else {
            const inspectAddress = inspect === true ? (0, _utils.getParsedDebugAddress)(true) : inspect;
            // TODO: Implement --inspect-wait
            const wait = false;
            try {
                inspector.open(inspectAddress.port, inspectAddress.host, wait);
            } catch (error) {
                console.error(`Failed to start the Node.js inspector with --inspect="${(0, _utils.formatDebugAddress)(inspectAddress)}":`, error);
                return process.exit(1);
            }
        }
    }
    if (options.experimentalCpuProf) {
        _log.info(`CPU profiling enabled. Profile will be saved on exit (Ctrl+C).`);
        // Save CPU profile on shutdown signals, but let start-server.ts handle graceful exit
        process.on('SIGTERM', ()=>(0, _cpuprofile.saveCpuProfile)());
        process.on('SIGINT', ()=>(0, _cpuprofile.saveCpuProfile)());
    }
    await (0, _startserver.startServer)({
        dir,
        isDev: false,
        hostname,
        port,
        keepAliveTimeout
    });
};

//# sourceMappingURL=next-start.js.map