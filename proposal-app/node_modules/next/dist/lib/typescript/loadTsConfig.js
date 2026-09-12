"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "loadTsConfigOptions", {
    enumerable: true,
    get: function() {
        return loadTsConfigOptions;
    }
});
const _nodefs = require("node:fs");
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _commentjson = /*#__PURE__*/ _interop_require_wildcard(require("next/dist/compiled/comment-json"));
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
function resolveConfigDirValue(value, configDir, rootConfigDir) {
    return _nodepath.default.resolve(configDir, value.replace(/\$\{configDir\}/g, rootConfigDir));
}
function resolveConfigFile(candidate) {
    for (const configPath of [
        candidate,
        candidate.endsWith('.json') ? undefined : candidate + '.json'
    ]){
        if (configPath && (0, _nodefs.existsSync)(configPath) && (0, _nodefs.statSync)(configPath).isFile()) {
            return configPath;
        }
    }
}
function resolvePackageTsConfig(extendsPath, currentConfigDir) {
    const parts = extendsPath.split('/');
    const isPackageRoot = extendsPath.startsWith('@') ? parts.length === 2 : parts.length === 1;
    if (!isPackageRoot) {
        return undefined;
    }
    try {
        const packageJsonPath = require.resolve(extendsPath + '/package.json', {
            paths: [
                currentConfigDir
            ]
        });
        const packageJson = JSON.parse((0, _nodefs.readFileSync)(packageJsonPath, 'utf8'));
        if (packageJson.exports !== undefined) {
            try {
                const exportedConfig = require.resolve(extendsPath, {
                    paths: [
                        currentConfigDir
                    ]
                });
                if (_nodepath.default.extname(exportedConfig) === '.json') {
                    return exportedConfig;
                }
            } catch  {}
        }
        if (typeof packageJson.tsconfig === 'string') {
            return resolveConfigFile(_nodepath.default.resolve(_nodepath.default.dirname(packageJsonPath), packageJson.tsconfig));
        }
        return resolveConfigFile(_nodepath.default.join(_nodepath.default.dirname(packageJsonPath), 'tsconfig'));
    } catch  {}
}
function resolveExtends(extendsPath, currentConfigDir) {
    if (extendsPath.startsWith('./') || extendsPath.startsWith('../') || _nodepath.default.isAbsolute(extendsPath)) {
        const resolved = _nodepath.default.resolve(currentConfigDir, extendsPath);
        if ((0, _nodefs.existsSync)(resolved)) {
            return resolved;
        }
        if (!resolved.endsWith('.json') && (0, _nodefs.existsSync)(resolved + '.json')) {
            return resolved + '.json';
        }
        return resolved;
    }
    const packageConfigPath = resolvePackageTsConfig(extendsPath, currentConfigDir);
    if (packageConfigPath) {
        return packageConfigPath;
    }
    try {
        const resolved = require.resolve(extendsPath, {
            paths: [
                currentConfigDir
            ]
        });
        if (_nodepath.default.extname(resolved) === '.json') {
            return resolved;
        }
    } catch  {}
    try {
        return require.resolve(extendsPath + '/tsconfig.json', {
            paths: [
                currentConfigDir
            ]
        });
    } catch  {
        return _nodepath.default.resolve(currentConfigDir, extendsPath);
    }
}
function loadTsConfigOptionsRecursive(configPath, visited, rootConfigDir) {
    const resolvedPath = _nodepath.default.resolve(configPath);
    if (visited.has(resolvedPath) || !(0, _nodefs.existsSync)(resolvedPath)) {
        return {};
    }
    const nextVisited = new Set(visited);
    nextVisited.add(resolvedPath);
    const configContent = (0, _nodefs.readFileSync)(resolvedPath, 'utf8');
    const config = _commentjson.parse(configContent);
    const configDir = _nodepath.default.dirname(resolvedPath);
    let mergedOptions = {};
    if (config.extends) {
        const extendsList = Array.isArray(config.extends) ? config.extends : [
            config.extends
        ];
        for (const extendsPath of extendsList){
            const parentConfigPath = resolveExtends(extendsPath, configDir);
            const parentOptions = loadTsConfigOptionsRecursive(parentConfigPath, nextVisited, rootConfigDir);
            mergedOptions = {
                ...mergedOptions,
                ...parentOptions
            };
        }
    }
    const currentOptions = config.compilerOptions ?? {};
    if (Object.hasOwn(currentOptions, 'paths')) {
        mergedOptions.paths = currentOptions.paths;
        mergedOptions.pathsBasePath = configDir;
    }
    if (Object.hasOwn(currentOptions, 'baseUrl') && typeof currentOptions.baseUrl === 'string') {
        mergedOptions.baseUrl = resolveConfigDirValue(currentOptions.baseUrl, configDir, rootConfigDir);
    }
    if (mergedOptions.baseUrl) {
        mergedOptions.pathsBasePath = undefined;
    }
    return mergedOptions;
}
function loadTsConfigOptions(configPath) {
    const resolvedPath = _nodepath.default.resolve(configPath);
    return loadTsConfigOptionsRecursive(resolvedPath, new Set(), _nodepath.default.dirname(resolvedPath));
}

//# sourceMappingURL=loadTsConfig.js.map