"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    configs: function() {
        return configs;
    },
    default: function() {
        return _default;
    },
    rules: function() {
        return rules;
    }
});
var _googlefontdisplay = /*#__PURE__*/ _interop_require_default(require("./rules/google-font-display"));
var _googlefontpreconnect = /*#__PURE__*/ _interop_require_default(require("./rules/google-font-preconnect"));
var _inlinescriptid = /*#__PURE__*/ _interop_require_default(require("./rules/inline-script-id"));
var _nextscriptforga = /*#__PURE__*/ _interop_require_default(require("./rules/next-script-for-ga"));
var _noassignmodulevariable = /*#__PURE__*/ _interop_require_default(require("./rules/no-assign-module-variable"));
var _noasyncclientcomponent = /*#__PURE__*/ _interop_require_default(require("./rules/no-async-client-component"));
var _nobeforeinteractivescriptoutsidedocument = /*#__PURE__*/ _interop_require_default(require("./rules/no-before-interactive-script-outside-document"));
var _nocsstags = /*#__PURE__*/ _interop_require_default(require("./rules/no-css-tags"));
var _nodocumentimportinpage = /*#__PURE__*/ _interop_require_default(require("./rules/no-document-import-in-page"));
var _noduplicatehead = /*#__PURE__*/ _interop_require_default(require("./rules/no-duplicate-head"));
var _noheadelement = /*#__PURE__*/ _interop_require_default(require("./rules/no-head-element"));
var _noheadimportindocument = /*#__PURE__*/ _interop_require_default(require("./rules/no-head-import-in-document"));
var _nohtmllinkforpages = /*#__PURE__*/ _interop_require_default(require("./rules/no-html-link-for-pages"));
var _noimgelement = /*#__PURE__*/ _interop_require_default(require("./rules/no-img-element"));
var _nolocationassignrelativedestination = /*#__PURE__*/ _interop_require_default(require("./rules/no-location-assign-relative-destination"));
var _nopagecustomfont = /*#__PURE__*/ _interop_require_default(require("./rules/no-page-custom-font"));
var _noscriptcomponentinhead = /*#__PURE__*/ _interop_require_default(require("./rules/no-script-component-in-head"));
var _nostyledjsxindocument = /*#__PURE__*/ _interop_require_default(require("./rules/no-styled-jsx-in-document"));
var _nosyncscripts = /*#__PURE__*/ _interop_require_default(require("./rules/no-sync-scripts"));
var _notitleindocumenthead = /*#__PURE__*/ _interop_require_default(require("./rules/no-title-in-document-head"));
var _notypos = /*#__PURE__*/ _interop_require_default(require("./rules/no-typos"));
var _nounwantedpolyfillio = /*#__PURE__*/ _interop_require_default(require("./rules/no-unwanted-polyfillio"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
var recommendedRules = {
    // warnings
    '@next/next/google-font-display': 'warn',
    '@next/next/google-font-preconnect': 'warn',
    '@next/next/next-script-for-ga': 'warn',
    '@next/next/no-async-client-component': 'warn',
    '@next/next/no-before-interactive-script-outside-document': 'warn',
    '@next/next/no-css-tags': 'warn',
    '@next/next/no-head-element': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    '@next/next/no-img-element': 'warn',
    '@next/next/no-location-assign-relative-destination': 'warn',
    '@next/next/no-page-custom-font': 'warn',
    '@next/next/no-styled-jsx-in-document': 'warn',
    '@next/next/no-sync-scripts': 'warn',
    '@next/next/no-title-in-document-head': 'warn',
    '@next/next/no-typos': 'warn',
    '@next/next/no-unwanted-polyfillio': 'warn',
    // errors
    '@next/next/inline-script-id': 'error',
    '@next/next/no-assign-module-variable': 'error',
    '@next/next/no-document-import-in-page': 'error',
    '@next/next/no-duplicate-head': 'error',
    '@next/next/no-head-import-in-document': 'error',
    '@next/next/no-script-component-in-head': 'error'
};
var coreWebVitalsRules = {
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-sync-scripts': 'error'
};
var plugin = {
    meta: {
        name: '@next/eslint-plugin-next'
    },
    rules: {
        'google-font-display': _googlefontdisplay.default,
        'google-font-preconnect': _googlefontpreconnect.default,
        'inline-script-id': _inlinescriptid.default,
        'next-script-for-ga': _nextscriptforga.default,
        'no-assign-module-variable': _noassignmodulevariable.default,
        'no-async-client-component': _noasyncclientcomponent.default,
        'no-before-interactive-script-outside-document': _nobeforeinteractivescriptoutsidedocument.default,
        'no-css-tags': _nocsstags.default,
        'no-document-import-in-page': _nodocumentimportinpage.default,
        'no-duplicate-head': _noduplicatehead.default,
        'no-head-element': _noheadelement.default,
        'no-head-import-in-document': _noheadimportindocument.default,
        'no-html-link-for-pages': _nohtmllinkforpages.default,
        'no-img-element': _noimgelement.default,
        'no-location-assign-relative-destination': _nolocationassignrelativedestination.default,
        'no-page-custom-font': _nopagecustomfont.default,
        'no-script-component-in-head': _noscriptcomponentinhead.default,
        'no-styled-jsx-in-document': _nostyledjsxindocument.default,
        'no-sync-scripts': _nosyncscripts.default,
        'no-title-in-document-head': _notitleindocumenthead.default,
        'no-typos': _notypos.default,
        'no-unwanted-polyfillio': _nounwantedpolyfillio.default
    },
    configs: {}
};
Object.assign(plugin.configs, {
    'recommended-legacy': {
        plugins: [
            '@next/next'
        ],
        rules: recommendedRules
    },
    'core-web-vitals-legacy': {
        plugins: [
            '@next/next'
        ],
        extends: [
            'plugin:@next/next/recommended-legacy'
        ],
        rules: coreWebVitalsRules
    },
    recommended: {
        name: 'next/recommended',
        plugins: {
            '@next/next': plugin
        },
        rules: recommendedRules
    },
    'core-web-vitals': {
        name: 'next/core-web-vitals',
        plugins: {
            '@next/next': plugin
        },
        rules: _object_spread({}, recommendedRules, coreWebVitalsRules)
    }
});
var _default = plugin;
var rules = plugin.rules, configs = plugin.configs;
