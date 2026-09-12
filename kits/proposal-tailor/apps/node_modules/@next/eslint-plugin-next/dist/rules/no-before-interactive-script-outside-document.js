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
var _definerule = require("../utils/define-rule");
var _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
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
var url = 'https://nextjs.org/docs/messages/no-before-interactive-script-outside-document';
var convertToCorrectSeparator = function(str) {
    return str.replace(/[\\/]/g, _path.sep);
};
var _default = (0, _definerule.defineRule)({
    meta: {
        docs: {
            description: "Prevent usage of `next/script`'s `beforeInteractive` strategy outside of `pages/_document.js`.",
            recommended: true,
            url: url
        },
        type: 'problem',
        schema: []
    },
    create: function create(context) {
        var scriptImportName = null;
        return {
            'ImportDeclaration[source.value="next/script"] > ImportDefaultSpecifier': function(node) {
                scriptImportName = node.local.name;
            },
            JSXOpeningElement: function JSXOpeningElement(node) {
                var pathname = convertToCorrectSeparator(context.filename);
                var isInAppDir = pathname.includes("".concat(_path.sep, "app").concat(_path.sep));
                // This rule shouldn't fire in `app/`
                if (isInAppDir) {
                    return;
                }
                if (!scriptImportName) {
                    return;
                }
                if (node.name && node.name.name !== scriptImportName) {
                    return;
                }
                var strategy = node.attributes.find(function(child) {
                    return child.name && child.name.name === 'strategy';
                });
                if (!strategy || !strategy.value || strategy.value.value !== 'beforeInteractive') {
                    return;
                }
                var document = context.filename.split('pages', 2)[1];
                if (document && _path.parse(document).name.startsWith('_document')) {
                    return;
                }
                context.report({
                    node: node,
                    message: "`next/script`'s `beforeInteractive` strategy should not be used outside of `pages/_document.js`. See: ".concat(url)
                });
            }
        };
    }
});
