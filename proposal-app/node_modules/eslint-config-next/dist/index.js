"use strict";
var _eslintpluginnext = /*#__PURE__*/ _interop_require_default(require("@next/eslint-plugin-next"));
var _eslintpluginreact = /*#__PURE__*/ _interop_require_default(require("eslint-plugin-react"));
var _eslintpluginreacthooks = /*#__PURE__*/ _interop_require_default(require("eslint-plugin-react-hooks"));
var _typescripteslint = /*#__PURE__*/ _interop_require_default(require("typescript-eslint"));
var _eslintpluginimport = /*#__PURE__*/ _interop_require_wildcard(require("eslint-plugin-import"));
var _eslintpluginjsxa11y = /*#__PURE__*/ _interop_require_wildcard(require("eslint-plugin-jsx-a11y"));
var _globals = /*#__PURE__*/ _interop_require_default(require("globals"));
var _parser = /*#__PURE__*/ _interop_require_default(require("./parser"));
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
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
var config = [
    {
        name: 'next',
        // Default files, users can overwrite this.
        files: [
            '**/*.{js,jsx,mjs,ts,tsx,mts,cts}'
        ],
        plugins: {
            react: _eslintpluginreact.default,
            'react-hooks': _eslintpluginreacthooks.default,
            import: _eslintpluginimport,
            'jsx-a11y': _eslintpluginjsxa11y,
            '@next/next': _eslintpluginnext.default
        },
        languageOptions: {
            parser: _parser.default,
            parserOptions: {
                requireConfigFile: false,
                sourceType: 'module',
                allowImportExportEverywhere: true,
                // TODO: Is this needed?
                babelOptions: {
                    presets: [
                        'next/babel'
                    ],
                    caller: {
                        // Eslint supports top level await when a parser for it is included. We enable the parser by default for Babel.
                        supportsTopLevelAwait: true
                    }
                }
            },
            globals: _object_spread({}, _globals.default.browser, _globals.default.node)
        },
        settings: {
            react: {
                version: 'detect'
            },
            'import/parsers': {
                '@typescript-eslint/parser': [
                    '.ts',
                    '.mts',
                    '.cts',
                    '.tsx',
                    '.d.ts'
                ]
            },
            'import/resolver': {
                node: {
                    extensions: [
                        '.js',
                        '.jsx',
                        '.ts',
                        '.tsx'
                    ]
                },
                typescript: {
                    alwaysTryTypes: true
                }
            }
        },
        rules: _object_spread_props(_object_spread({}, _eslintpluginreact.default.configs.recommended.rules, _eslintpluginreacthooks.default.configs.recommended.rules, _eslintpluginnext.default.configs.recommended.rules), {
            'import/no-anonymous-default-export': 'warn',
            'react/no-unknown-property': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'jsx-a11y/alt-text': [
                'warn',
                {
                    elements: [
                        'img'
                    ],
                    img: [
                        'Image'
                    ]
                }
            ],
            'jsx-a11y/aria-props': 'warn',
            'jsx-a11y/aria-proptypes': 'warn',
            'jsx-a11y/aria-unsupported-elements': 'warn',
            'jsx-a11y/role-has-required-aria-props': 'warn',
            'jsx-a11y/role-supports-aria-props': 'warn',
            'react/jsx-no-target-blank': 'off'
        })
    },
    {
        name: 'next/typescript',
        // Default files, users can overwrite this.
        files: [
            '**/*.ts',
            '**/*.tsx'
        ],
        plugins: {
            '@typescript-eslint': _typescripteslint.default.plugin
        },
        languageOptions: {
            parser: _typescripteslint.default.parser,
            parserOptions: {
                sourceType: 'module'
            }
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
];
module.exports = config;
