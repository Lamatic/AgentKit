export class UsageError extends Error {
    constructor(message, docUrl){
        super(`${message}\n\nLearn more: ${docUrl}`);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E1175",
            enumerable: false,
            configurable: true
        });
        this.name = 'UsageError';
        // This error is meant to interrupt the server start/build process
        // but the stack trace isn't meaningful, as it points to internal code.
        this.stack = undefined;
    }
}

//# sourceMappingURL=usage-error.js.map