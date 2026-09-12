export class InvariantError extends Error {
    constructor(message, options){
        super(`Invariant: ${message.endsWith('.') ? message : message + '.'} This is a bug in Next.js.`, options);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E1179",
            enumerable: false,
            configurable: true
        });
        this.name = 'InvariantError';
    }
}

//# sourceMappingURL=invariant-error.js.map