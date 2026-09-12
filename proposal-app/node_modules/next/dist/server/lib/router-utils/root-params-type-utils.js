"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    generateRootParamsTypes: null,
    writeRootParamsTypes: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    generateRootParamsTypes: function() {
        return generateRootParamsTypes;
    },
    writeRootParamsTypes: function() {
        return writeRootParamsTypes;
    }
});
const _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
const _path = /*#__PURE__*/ _interop_require_default(require("path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ROOT_PARAM_VALUE_TYPES = [
    'string',
    'string[]',
    'undefined'
];
function generateRootParamsTypes(rootParams) {
    const exports1 = Array.from(rootParams.entries()).sort(([a], [b])=>a.localeCompare(b)).map(([paramName, info])=>`  export function ${paramName}(): ${getRootParamReturnType(info)}`);
    return `// Type definitions for Next.js root params (next/root-params)

declare module 'next/root-params' {
${exports1.join('\n')}
}
`;
}
function getRootParamReturnType(valueTypes) {
    const orderedValueTypes = ROOT_PARAM_VALUE_TYPES.filter((valueType)=>valueTypes.has(valueType));
    return `Promise<${orderedValueTypes.join(' | ')}>`;
}
async function writeRootParamsTypes(manifest, filePath) {
    const rootParams = manifest.rootParams;
    await _fs.default.promises.mkdir(_path.default.dirname(filePath), {
        recursive: true
    });
    if (!rootParams.size) {
        // Write an empty declaration so the import in next-env.d.ts resolves.
        await _fs.default.promises.writeFile(filePath, `// Type definitions for Next.js root params (next/root-params)\n// No root params detected.\nexport {}\n`);
        return;
    }
    await _fs.default.promises.writeFile(filePath, generateRootParamsTypes(rootParams));
}

//# sourceMappingURL=root-params-type-utils.js.map