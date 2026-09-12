/**
 * **PostCSS Syntax Error**
 *
 * Loader wrapper for postcss syntax errors
 *
 * @class SyntaxError
 * @extends Error
 *
 * @param {Object} err CssSyntaxError
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return PostCSSSyntaxError;
    }
});
class PostCSSSyntaxError extends Error {
    constructor(error){
        super(error);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
        const { line, column, reason, plugin, file } = error;
        this.name = 'SyntaxError';
        this.message = `${this.name}\n\n`;
        if (typeof line !== 'undefined') {
            this.message += `(${line}:${column}) `;
        }
        this.message += plugin ? `${plugin}: ` : '';
        this.message += file ? `${file} ` : '<css input> ';
        this.message += reason;
        const code = error.showSourceCode();
        if (code) {
            this.message += `\n\n${code}\n`;
        }
        this.stack = false;
    }
}

//# sourceMappingURL=Error.js.map