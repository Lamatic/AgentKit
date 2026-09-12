"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "runTypeCheckCli", {
    enumerable: true,
    get: function() {
        return runTypeCheckCli;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _compileerror = require("../compile-error");
const _runTypeScriptCli = require("./runTypeScriptCli");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function runTypeCheckCli({ baseDir, tsConfigPath, tscPath, cacheDir, onFirstOutput }) {
    const configuration = await (0, _runTypeScriptCli.getTypeScriptConfigurationCli)({
        baseDir,
        tsConfigPath,
        tscPath
    });
    const incremental = Boolean(configuration.compilerOptions.incremental || configuration.compilerOptions.composite);
    const args = [
        '--project',
        tsConfigPath,
        '--noEmit',
        '--declarationMap',
        'false',
        '--emitDeclarationOnly',
        'false'
    ];
    if (incremental && cacheDir) {
        args.push('--tsBuildInfoFile', _nodepath.default.join(cacheDir, '.tsbuildinfo'));
    }
    const result = await (0, _runTypeScriptCli.runTypeScriptCli)({
        cwd: baseDir,
        tscPath,
        args,
        onFirstOutput
    });
    if (result.exitCode !== 0) {
        throw new _compileerror.CompileError();
    }
    return {
        hasWarnings: false,
        incremental
    };
}

//# sourceMappingURL=runTypeCheckCli.js.map