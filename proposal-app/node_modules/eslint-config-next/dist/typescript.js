"use strict";
var _typescripteslint = /*#__PURE__*/ _interop_require_default(require("typescript-eslint"));
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var config = _to_consumable_array(_typescripteslint.default.configs.recommended).concat([
    {
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-unused-expressions': 'warn'
        }
    },
    // Global ignores, users can add more `ignores` or overwrite this by `!<ignore>`.
    {
        ignores: [
            // node_modules/ and .git/ are ignored by default.
            // https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
            '.next/**',
            'out/**',
            'build/**',
            'next-env.d.ts'
        ]
    }
]);
module.exports = config;
