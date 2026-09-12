export type LogMethod = 'log' | 'info' | 'debug' | 'table' | 'error' | 'assert' | 'dir' | 'dirxml' | 'group' | 'groupCollapsed' | 'groupEnd' | 'trace' | 'warn';
export type ConsoleEntry<T> = {
    kind: 'console';
    method: LogMethod;
    consoleMethodStack: string | null;
    args: Array<{
        kind: 'arg';
        data: T;
    } | {
        kind: 'formatted-error-arg';
        prefix: string;
        stack: string;
    }>;
};
export type ConsoleErrorEntry<T> = {
    kind: 'any-logged-error';
    method: 'error';
    consoleErrorStack: string;
    args: Array<{
        kind: 'arg';
        data: T;
        isRejectionMessage?: boolean;
    } | {
        kind: 'formatted-error-arg';
        prefix: string;
        stack: string | null;
    }>;
};
export type FormattedErrorEntry = {
    kind: 'formatted-error';
    prefix: string;
    stack: string;
    method: 'error';
};
export type ClientLogEntry = ConsoleEntry<unknown> | ConsoleErrorEntry<unknown> | FormattedErrorEntry;
export type ServerLogEntry = ConsoleEntry<string> | ConsoleErrorEntry<string> | FormattedErrorEntry;
export declare const UNDEFINED_MARKER = "__next_tagged_undefined";
/**
 * Marks an error that originated on the server and was already logged there.
 * Such errors are also sent to the browser, where they get logged to the
 * browser console and shown in the dev overlay. This marker lets the
 * browser-to-terminal log forwarding skip them, so they aren't replayed back to
 * the CLI as duplicates.
 */
export declare function markErrorAsAlreadyLoggedOnServer(error: object): void;
export declare function wasErrorAlreadyLoggedOnServer(value: unknown): boolean;
export declare function patchConsoleMethod<T extends keyof Console>(methodName: T, wrapper: (methodName: T, ...args: Console[T] extends (...args: infer P) => any ? P : never[]) => void): () => void;
