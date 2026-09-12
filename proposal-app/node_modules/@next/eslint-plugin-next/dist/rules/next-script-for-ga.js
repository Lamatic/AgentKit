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
var _nodeattributes = /*#__PURE__*/ _interop_require_default(require("../utils/node-attributes"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var GOOGLE_ANALYTICS_URL = 'www.google-analytics.com/analytics.js';
var GOOGLE_TAG_MANAGER_URL = 'www.googletagmanager.com/gtag/js';
var GOOGLE_ANALYTICS_SRC = GOOGLE_ANALYTICS_URL;
var GOOGLE_TAG_MANAGER_SRC = 'www.googletagmanager.com/gtm.js';
var description = 'Prefer `@next/third-parties/google` when using the inline script for Google Analytics and Tag Manager.';
var url = 'https://nextjs.org/docs/messages/next-script-for-ga';
var ERROR_MSG_GOOGLE_ANALYTICS = "Prefer `GoogleAnalytics` component from `@next/third-parties/google` when using the inline script for Google Analytics. See: ".concat(url);
var ERROR_MSG_GOOGLE_TAG_MANAGER = "Prefer `GoogleTagManager` component from `@next/third-parties/google` when using the inline script for Google Tag Manager. See: ".concat(url);
var _default = (0, _definerule.defineRule)({
    meta: {
        docs: {
            description: description,
            recommended: true,
            url: url
        },
        type: 'problem',
        schema: []
    },
    create: function create(context) {
        return {
            JSXOpeningElement: function JSXOpeningElement(node) {
                if (node.name.name !== 'script') {
                    return;
                }
                if (node.attributes.length === 0) {
                    return;
                }
                var attributes = new _nodeattributes.default(node);
                var src = attributes.value('src');
                // Check if the Alternative async tag is being used to add GA.
                // https://developers.google.com/analytics/devguides/collection/analyticsjs#alternative_async_tag
                // https://developers.google.com/analytics/devguides/collection/gtagjs
                if (typeof src === 'string' && src.includes(GOOGLE_ANALYTICS_URL)) {
                    return context.report({
                        node: node,
                        message: ERROR_MSG_GOOGLE_ANALYTICS
                    });
                } else if (typeof src === 'string' && src.includes(GOOGLE_TAG_MANAGER_URL)) {
                    return context.report({
                        node: node,
                        message: ERROR_MSG_GOOGLE_TAG_MANAGER
                    });
                }
                var dangerouslySetInnerHTML = attributes.value('dangerouslySetInnerHTML');
                // Check if inline script is being used to add GA.
                // https://developers.google.com/analytics/devguides/collection/analyticsjs#the_google_analytics_tag
                // https://developers.google.com/tag-manager/quickstart
                if (dangerouslySetInnerHTML && dangerouslySetInnerHTML.length > 0) {
                    var _quasis__value, _quasis_;
                    var quasis = dangerouslySetInnerHTML[0].value.quasis;
                    var htmlContent = quasis === null || quasis === void 0 ? void 0 : (_quasis_ = quasis[0]) === null || _quasis_ === void 0 ? void 0 : (_quasis__value = _quasis_.value) === null || _quasis__value === void 0 ? void 0 : _quasis__value.raw;
                    if (htmlContent && htmlContent.includes(GOOGLE_ANALYTICS_SRC)) {
                        context.report({
                            node: node,
                            message: ERROR_MSG_GOOGLE_ANALYTICS
                        });
                    } else if (htmlContent && htmlContent.includes(GOOGLE_TAG_MANAGER_SRC)) {
                        context.report({
                            node: node,
                            message: ERROR_MSG_GOOGLE_TAG_MANAGER
                        });
                    }
                }
            }
        };
    }
});
