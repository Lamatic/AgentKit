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
var _eslintutils = require("@eslint-community/eslint-utils");
var url = 'https://nextjs.org/docs/messages/no-location-assign-relative-destination';
var _default = (0, _definerule.defineRule)({
    meta: {
        docs: {
            description: 'Prevent usage of `location.assign` or `location.href` assignment to navigate to internal Next.js pages.',
            recommended: true,
            url: url
        },
        type: 'problem',
        schema: [],
        messages: {
            noLocationAssign: "Do not use `{{expression}}` to navigate to internal Next.js pages. Use `redirect()` in the render phase, or `useRouter().push()` in Client Components' event handlers instead. See: " + url
        }
    },
    create: function create(context) {
        var sourceCode = context.sourceCode;
        var scopeManager = sourceCode.scopeManager;
        if (!scopeManager) return {};
        return {
            // location.assign(...) / location['assign'](...)
            // window.location.assign(...) / window.location['assign'](...)
            // globalThis.location.assign(...) / globalThis.location['assign'](...)
            CallExpression: function CallExpression(node) {
                var callee = node.callee, args = node.arguments;
                if (!isMemberExprWithNamedProperty(callee, 'assign')) return;
                var rootIdentifier = getLocationRootIdentifier(callee.object);
                if (!rootIdentifier) return;
                if (!isGlobalReference(sourceCode, rootIdentifier)) return;
                if (args.length < 1) return;
                var firstArg = args[0];
                if (firstArg.type === 'SpreadElement') return;
                var value = getStaticStringPrefix(firstArg, sourceCode);
                if (value !== null && isRelativeUrl(value)) {
                    context.report({
                        node: node,
                        messageId: 'noLocationAssign',
                        data: {
                            expression: sourceCode.getText(callee) + '()'
                        }
                    });
                }
            },
            // location.href = '/path'
            // window.location.href = '/path'
            // globalThis.location.href = '/path'
            AssignmentExpression: function AssignmentExpression(node) {
                var left = node.left, right = node.right;
                if (!isMemberExprWithNamedProperty(left, 'href')) return;
                var rootIdentifier = getLocationRootIdentifier(left.object);
                if (!rootIdentifier) return;
                if (!isGlobalReference(sourceCode, rootIdentifier)) return;
                var value = getStaticStringPrefix(right, sourceCode);
                if (value !== null && isRelativeUrl(value)) {
                    context.report({
                        node: node,
                        messageId: 'noLocationAssign',
                        data: {
                            expression: sourceCode.getText(left)
                        }
                    });
                }
            }
        };
    }
});
var ABSOLUTE_URL_RE = /^(?:[a-z][\d+.a-z-]*:|\/\/)/i;
var GLOBAL_PREFIXES = new Set([
    'window',
    'globalThis',
    'document',
    'self'
]);
function isMemberExprWithNamedProperty(expr, name) {
    if (expr.type !== 'MemberExpression') return false;
    return expr.computed ? expr.property.type === 'Literal' && expr.property.value === name : expr.property.type === 'Identifier' && expr.property.name === name;
}
function isRelativeUrl(value) {
    return !ABSOLUTE_URL_RE.test(value);
}
function getLocationRootIdentifier(node) {
    if (node.type === 'Identifier' && node.name === 'location') {
        return node;
    }
    if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && GLOBAL_PREFIXES.has(node.object.name) && isMemberExprWithNamedProperty(node, 'location')) {
        return node.object;
    }
    return null;
}
function isGlobalReference(sourceCode, node) {
    if (!node) return false;
    if (node.type !== 'Identifier') return false;
    var variable = sourceCode.scopeManager.scopes[0].set.get(node.name);
    if (!variable || variable.defs.length > 0) return false;
    return variable.references.some(function(param) {
        var identifier = param.identifier;
        return identifier === node;
    });
}
function getStaticStringPrefix(node, sourceCode) {
    var constantValue = (0, _eslintutils.getStringIfConstant)(node, sourceCode.getScope(node));
    if (constantValue !== null) {
        return constantValue;
    }
    if (node.type === 'TemplateLiteral' && node.quasis.length > 0) {
        var _node_quasis__value_cooked;
        return (_node_quasis__value_cooked = node.quasis[0].value.cooked) !== null && _node_quasis__value_cooked !== void 0 ? _node_quasis__value_cooked : node.quasis[0].value.raw;
    }
    if (node.type === 'BinaryExpression' && node.operator === '+') {
        return getStaticStringPrefix(node.left, sourceCode);
    }
    if (node.type === 'Identifier') {
        var variable = (0, _eslintutils.findVariable)(sourceCode.getScope(node), node);
        if (!variable || variable.defs.length < 1) return null;
        var def = variable.defs[variable.defs.length - 1];
        if (def.type !== 'Variable') return null;
        var readPos = node.range[0];
        var _def_node_init;
        var lastWriteExpr = (_def_node_init = def.node.init) !== null && _def_node_init !== void 0 ? _def_node_init : null;
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = variable.references[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var ref = _step.value;
                if (ref.identifier.range[0] >= readPos) break;
                if (ref.isWrite() && ref.writeExpr && ref.writeExpr !== def.node.init) {
                    lastWriteExpr = ref.writeExpr;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
        if (!lastWriteExpr) return null;
        return getStaticStringPrefix(lastWriteExpr, sourceCode);
    }
    return null;
}
