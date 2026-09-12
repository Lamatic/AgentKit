"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _definerule = require("../utils/define-rule");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var url = 'https://nextjs.org/docs/messages/no-head-element';
var _default = (0, _definerule.defineRule)({
    meta: {
        docs: {
            description: 'Prevent usage of `<head>` element.',
            category: 'HTML',
            recommended: true,
            url: url
        },
        type: 'problem',
        schema: []
    },
    create: function create(context) {
        return {
            JSXOpeningElement: function JSXOpeningElement(node) {
                var paths = context.filename;
                var isInAppDir = function() {
                    return paths.includes("app".concat(_path.default.sep)) || paths.includes("app".concat(_path.default.posix.sep));
                };
                // Only lint the <head> element in pages directory
                if (node.name.name !== 'head' || isInAppDir()) {
                    return;
                }
                context.report({
                    node: node,
                    message: "Do not use `<head>` element. Use `<Head />` from `next/head` instead. See: ".concat(url)
                });
            }
        };
    }
});
