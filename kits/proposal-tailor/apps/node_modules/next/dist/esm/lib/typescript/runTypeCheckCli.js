import path from 'node:path';
import { CompileError } from '../compile-error';
import { getTypeScriptConfigurationCli, runTypeScriptCli } from './runTypeScriptCli';
export async function runTypeCheckCli({ baseDir, tsConfigPath, tscPath, cacheDir, onFirstOutput }) {
    const configuration = await getTypeScriptConfigurationCli({
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
        args.push('--tsBuildInfoFile', path.join(cacheDir, '.tsbuildinfo'));
    }
    const result = await runTypeScriptCli({
        cwd: baseDir,
        tscPath,
        args,
        onFirstOutput
    });
    if (result.exitCode !== 0) {
        throw new CompileError();
    }
    return {
        hasWarnings: false,
        incremental
    };
}

//# sourceMappingURL=runTypeCheckCli.js.map