import { getErrorSource } from '../../../shared/lib/error-source';
import { getIsTerminalLoggingEnabled } from './terminal-logging-config';
import { patchConsoleMethod, wasErrorAlreadyLoggedOnServer } from '../../shared/forward-logs-shared';
import { preLogSerializationClone, logStringify } from './forward-logs-utils';
import { getOwnerStack } from './errors/stitched-error';
const isTerminalLoggingEnabled = getIsTerminalLoggingEnabled();
const shouldForwardLogs = isTerminalLoggingEnabled || !!process.env.__NEXT_MCP_SERVER;
const methods = [
    'log',
    'info',
    'warn',
    'debug',
    'table',
    'assert',
    'dir',
    'dirxml',
    'group',
    'groupCollapsed',
    'groupEnd',
    'trace'
];
const afterThisFrame = (cb)=>{
    let timeout;
    const rafId = requestAnimationFrame(()=>{
        timeout = setTimeout(()=>{
            cb();
        });
    });
    return ()=>{
        cancelAnimationFrame(rafId);
        clearTimeout(timeout);
    };
};
let isPatched = false;
const serializeEntries = (entries)=>entries.map((clientEntry)=>{
        switch(clientEntry.kind){
            case 'any-logged-error':
            case 'console':
                {
                    return {
                        ...clientEntry,
                        args: clientEntry.args.map(stringifyUserArg)
                    };
                }
            case 'formatted-error':
                {
                    return clientEntry;
                }
            default:
                {
                    return null;
                }
        }
    });
const flushBufferedEntries = (socket)=>{
    if (logQueue.entries.length === 0) {
        return;
    }
    const payload = JSON.stringify({
        event: 'browser-logs',
        entries: serializeEntries(logQueue.entries),
        router: logQueue.router,
        // needed for source mapping, we just assign the sourceType from the last error for the whole batch
        sourceType: logQueue.sourceType
    });
    socket.send(payload);
    logQueue.entries = [];
    logQueue.sourceType = undefined;
};
// Combined state and public API
export const logQueue = {
    entries: [],
    flushScheduled: false,
    cancelFlush: null,
    socket: null,
    sourceType: undefined,
    router: null,
    scheduleLogSend: (entry)=>{
        logQueue.entries.push(entry);
        if (logQueue.flushScheduled) {
            return;
        }
        // safe to deref and use in setTimeout closure since we cancel on new socket
        const socket = logQueue.socket;
        if (!socket) {
            return;
        }
        // we probably dont need this
        logQueue.flushScheduled = true;
        // non blocking log flush, runs at most once per frame
        logQueue.cancelFlush = afterThisFrame(()=>{
            logQueue.flushScheduled = false;
            // just incase
            try {
                flushBufferedEntries(socket);
            } catch  {
            // error (make sure u don't infinite loop)
            /* noop */ }
        });
    },
    onSocketReady: (socket)=>{
        // When MCP or terminal logging is enabled, we enable the socket connection,
        // otherwise it will not proceed.
        if (!shouldForwardLogs) {
            return;
        }
        if (socket.readyState !== WebSocket.OPEN) {
            // invariant
            return;
        }
        // incase an existing timeout was going to run with a stale socket
        logQueue.cancelFlush?.();
        logQueue.socket = socket;
        try {
            flushBufferedEntries(socket);
        } catch  {
        /** noop just incase */ }
    }
};
const stringifyUserArg = (arg)=>{
    if (arg.kind !== 'arg') {
        return arg;
    }
    return {
        ...arg,
        data: logStringify(arg.data)
    };
};
const createErrorArg = (error)=>{
    return {
        kind: 'formatted-error-arg',
        prefix: error.message ? `${error.name}: ${error.message}` : `${error.name}`,
        stack: getErrorStackWithOwnerStack(error)
    };
};
const createLogEntry = (level, args)=>{
    if (!shouldForwardLogs) {
        return;
    }
    // do not abstract this, it implicitly relies on which functions call it. forcing the inlined implementation makes you think about callers
    // error capture stack trace maybe
    const stack = getErrorStack(new Error());
    const stackLines = stack?.split('\n');
    const cleanStack = stackLines?.slice(3).join('\n') // this is probably ignored anyways
    ;
    const entry = {
        kind: 'console',
        consoleMethodStack: cleanStack ?? null,
        method: level,
        args: args.map((arg)=>{
            if (arg instanceof Error) {
                return createErrorArg(arg);
            }
            return {
                kind: 'arg',
                data: preLogSerializationClone(arg)
            };
        })
    };
    logQueue.scheduleLogSend(entry);
};
export const forwardErrorLog = (args)=>{
    // Skip React server replayed logs - they were already logged on the server
    if (isReactServerReplayedLog(args)) {
        return;
    }
    if (!shouldForwardLogs) {
        return;
    }
    const errorObjects = args.filter((arg)=>arg instanceof Error);
    const first = errorObjects.at(0);
    // Skip errors that originated on the server and were already logged there
    // (e.g. Cache Components validation errors that are also sent to the browser
    // to show in the dev overlay). Forwarding them back would duplicate them in
    // the terminal.
    if (first && wasErrorAlreadyLoggedOnServer(first)) {
        return;
    }
    if (first) {
        const source = getErrorSource(first);
        if (source) {
            logQueue.sourceType = source;
        }
    }
    /**
   * browser shows stack regardless of type of data passed to console.error, so we should do the same
   *
   * do not abstract this, it implicitly relies on which functions call it. forcing the inlined implementation makes you think about callers
   */ const stack = getErrorStack(new Error());
    const stackLines = stack?.split('\n');
    const cleanStack = stackLines?.slice(3).join('\n');
    const entry = {
        kind: 'any-logged-error',
        method: 'error',
        consoleErrorStack: cleanStack ?? '',
        args: args.map((arg)=>{
            if (arg instanceof Error) {
                return createErrorArg(arg);
            }
            return {
                kind: 'arg',
                data: preLogSerializationClone(arg)
            };
        })
    };
    logQueue.scheduleLogSend(entry);
};
const createUncaughtErrorEntry = (errorName, errorMessage, fullStack)=>{
    const entry = {
        kind: 'formatted-error',
        prefix: `Uncaught ${errorName}: ${errorMessage}`,
        stack: fullStack,
        method: 'error'
    };
    logQueue.scheduleLogSend(entry);
};
const getErrorStack = (error)=>{
    return error.stack || '';
};
// Get error stack with owner stack appended for source mapping on the server
const getErrorStackWithOwnerStack = (error)=>{
    const errorStack = getErrorStack(error);
    const ownerStack = getOwnerStack(error);
    return ownerStack ? `${errorStack}\n${ownerStack}` : errorStack;
};
export function logUnhandledRejection(reason) {
    if (!shouldForwardLogs) {
        return;
    }
    if (reason instanceof Error) {
        createUnhandledRejectionErrorEntry(reason, getErrorStackWithOwnerStack(reason));
        return;
    }
    createUnhandledRejectionNonErrorEntry(reason);
}
const createUnhandledRejectionErrorEntry = (error, fullStack)=>{
    const source = getErrorSource(error);
    if (source) {
        logQueue.sourceType = source;
    }
    const entry = {
        kind: 'formatted-error',
        prefix: `⨯ unhandledRejection: ${error.name}: ${error.message}`,
        stack: fullStack,
        method: 'error'
    };
    logQueue.scheduleLogSend(entry);
};
const createUnhandledRejectionNonErrorEntry = (reason)=>{
    const entry = {
        kind: 'any-logged-error',
        // we can't access the stack since the event is dispatched async and creating an inline error would be meaningless
        consoleErrorStack: '',
        method: 'error',
        args: [
            {
                kind: 'arg',
                data: `⨯ unhandledRejection:`,
                isRejectionMessage: true
            },
            {
                kind: 'arg',
                data: preLogSerializationClone(reason)
            }
        ]
    };
    logQueue.scheduleLogSend(entry);
};
const isHMR = (args)=>{
    const firstArg = args[0];
    if (typeof firstArg !== 'string') {
        return false;
    }
    if (firstArg.startsWith('[Fast Refresh]')) {
        return true;
    }
    if (firstArg.startsWith('[HMR]')) {
        return true;
    }
    return false;
};
/**
 * Matches the format of logs arguments React replayed from the RSC.
 */ const isReactServerReplayedLog = (args)=>{
    if (args.length < 3) {
        return false;
    }
    const [format, styles, label] = args;
    if (typeof format !== 'string' || typeof styles !== 'string' || typeof label !== 'string') {
        return false;
    }
    return format.startsWith('%c%s%c') && styles.includes('background:');
};
export function forwardUnhandledError(error) {
    if (!shouldForwardLogs) {
        return;
    }
    createUncaughtErrorEntry(error.name, error.message, getErrorStackWithOwnerStack(error));
}
// TODO: this router check is brittle, we need to update based on the current router the user is using
export const initializeDebugLogForwarding = (router)=>{
    // probably don't need this
    if (isPatched) {
        return;
    }
    // TODO(rob): why does this break rendering on server, important to know incase the same bug appears in browser
    if (typeof window === 'undefined') {
        return;
    }
    // better to be safe than sorry
    try {
        methods.forEach((method)=>patchConsoleMethod(method, (_, ...args)=>{
                if (isHMR(args)) {
                    return;
                }
                if (isReactServerReplayedLog(args)) {
                    return;
                }
                createLogEntry(method, args);
            }));
    } catch  {}
    logQueue.router = router;
    isPatched = true;
};

//# sourceMappingURL=forward-logs.js.map