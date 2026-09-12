/**
 * **PostCSS Plugin Warning**
 *
 * Loader wrapper for postcss plugin warnings (`root.messages`)
 *
 * @class Warning
 * @extends Error
 *
 * @param {Object} warning PostCSS Warning
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Warning;
    }
});
class Warning extends Error {
    constructor(warning){
        super(warning);
        Object.defineProperty(this, "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
        const { text, line, column, plugin } = warning;
        this.name = 'Warning';
        this.message = `${this.name}\n\n`;
        if (typeof line !== 'undefined') {
            this.message += `(${line}:${column}) `;
        }
        this.message += plugin ? `${plugin}: ` : '';
        this.message += text;
        this.stack = false;
    }
}

//# sourceMappingURL=Warning.js.map