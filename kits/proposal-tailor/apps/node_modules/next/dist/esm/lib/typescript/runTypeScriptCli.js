import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import spawn from 'next/dist/compiled/cross-spawn';
import { bold } from '../picocolors';
import { resolveFrom } from '../resolve-from';
export function getTypeScriptPackageInfo(baseDir) {
    var _packageJson_bin, _Object_entries_find;
    let packageJsonPath;
    try {
        packageJsonPath = resolveFrom(baseDir, 'typescript/package.json');
    } catch  {
        return null;
    }
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const packageDir = path.dirname(packageJsonPath);
    const apiPath = path.join(packageDir, 'lib', 'typescript.js');
    const tscBin = typeof packageJson.bin === 'string' ? packageJson.bin : ((_packageJson_bin = packageJson.bin) == null ? void 0 : _packageJson_bin.tsc) ?? ((_Object_entries_find = Object.entries(packageJson.bin ?? {}).find(([name])=>/^tsc\d+$/.test(name))) == null ? void 0 : _Object_entries_find[1]);
    const tscBinPath = tscBin ? path.resolve(packageDir, tscBin) : undefined;
    let tscPath = tscBinPath;
    if (tscBinPath && existsSync(tscBinPath) && packageJson.type === 'module' && path.extname(tscBinPath) === '') {
        // TypeScript 7's extensionless ESM bin wrapper cannot be used as Node's
        // main entry point on Node.js 20.9. Its imported JS entry is the same CLI
        // wrapper and works across all supported Node.js versions.
        const tscJsPath = path.join(packageDir, 'lib', 'tsc.js');
        if (existsSync(tscJsPath)) {
            tscPath = tscJsPath;
        }
    }
    return {
        packageJsonPath,
        packageDir,
        version: packageJson.version,
        apiPath: existsSync(apiPath) ? apiPath : undefined,
        tscPath: tscPath && existsSync(tscPath) ? tscPath : undefined
    };
}
export function hasNativeTypeScriptPreview(baseDir) {
    try {
        resolveFrom(baseDir, '@typescript/native-preview/package.json');
        return true;
    } catch  {
        return false;
    }
}
export function getTypeScriptApiMissingError(version) {
    return Object.defineProperty(new Error(`TypeScript ${version} does not provide the compiler API required by Next.js. ` + `Set ${bold('experimental.useTypeScriptCli')} back to true in your Next.js config to use the TypeScript CLI, ` + `or install TypeScript 6 instead.`), "__NEXT_ERROR_CODE", {
        value: "E1467",
        enumerable: false,
        configurable: true
    });
}
const terminationSignals = [
    'SIGINT',
    'SIGTERM',
    'SIGHUP'
];
export function runTypeScriptCli({ cwd, tscPath, args, captureOutput = false, onFirstOutput }) {
    return new Promise((resolve, reject)=>{
        var _child_stdout, _child_stderr;
        const child = spawn(process.execPath, [
            tscPath,
            ...args
        ], {
            cwd,
            // TypeScript 7's Node wrapper starts the native compiler synchronously
            // on older Node.js releases. A separate process group lets termination
            // reach both processes instead of orphaning the native compiler.
            detached: process.platform !== 'win32',
            shell: false,
            stdio: [
                'ignore',
                'pipe',
                'pipe'
            ],
            env: {
                ...process.env,
                // Piping stdio makes `tsc` disable colored/pretty diagnostics. Restore
                // them when we are forwarding output to a TTY (not capturing it for
                // parsing, e.g. `--showConfig`).
                ...!captureOutput && process.stdout.isTTY ? {
                    FORCE_COLOR: '1'
                } : undefined
            }
        });
        let stdout = '';
        let stderr = '';
        (_child_stdout = child.stdout) == null ? void 0 : _child_stdout.setEncoding('utf8');
        (_child_stderr = child.stderr) == null ? void 0 : _child_stderr.setEncoding('utf8');
        if (captureOutput) {
            var _child_stdout1, _child_stderr1;
            (_child_stdout1 = child.stdout) == null ? void 0 : _child_stdout1.on('data', (chunk)=>{
                stdout += chunk;
            });
            (_child_stderr1 = child.stderr) == null ? void 0 : _child_stderr1.on('data', (chunk)=>{
                stderr += chunk;
            });
        } else {
            var _child_stdout2, _child_stderr2;
            const forward = (dest, chunk)=>{
                onFirstOutput == null ? void 0 : onFirstOutput();
                onFirstOutput = undefined // ensure we don't call it again
                ;
                dest.write(chunk);
            };
            (_child_stdout2 = child.stdout) == null ? void 0 : _child_stdout2.on('data', (chunk)=>{
                forward(process.stdout, chunk);
            });
            (_child_stderr2 = child.stderr) == null ? void 0 : _child_stderr2.on('data', (chunk)=>{
                forward(process.stderr, chunk);
            });
        }
        let terminationRequested = false;
        const terminateChild = ()=>{
            if (terminationRequested || child.killed || child.pid === undefined) {
                return;
            }
            terminationRequested = true;
            // The native compiler ignores SIGTERM and SIGINT, so send a kill signal.
            // Target the whole process group so the signal reaches the native compiler whether
            // it is a grandchild or a direct child.
            // https://github.com/microsoft/typescript-go/pull/4592 should improve this in the long run
            if (process.platform === 'win32') {
                spawnSync('taskkill', [
                    '/pid',
                    String(child.pid),
                    '/T',
                    '/F'
                ], {
                    stdio: 'ignore',
                    windowsHide: true
                });
            } else {
                try {
                    // https://www.youtube.com/watch?v=Fow7iUaKrq4
                    process.kill(-child.pid, 'SIGKILL');
                } catch  {
                // The process may have exited between the lifecycle event and kill.
                }
            }
        };
        const terminateOnExit = ()=>terminateChild();
        process.once('exit', terminateOnExit);
        const handler = ()=>{
            terminateChild();
            process.exit(1);
        };
        for (const signal of terminationSignals){
            process.once(signal, handler);
        }
        const cleanup = ()=>{
            process.off('exit', terminateOnExit);
            for (const signal of terminationSignals){
                process.off(signal, handler);
            }
        };
        let settled = false;
        const finish = (settle)=>{
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            settle();
        };
        child.on('error', (error)=>{
            finish(()=>reject(error));
        });
        child.on('close', (code, signal)=>{
            finish(()=>{
                resolve({
                    exitCode: code ?? 1,
                    signal,
                    stdout,
                    stderr
                });
            });
        });
    });
}
export async function getTypeScriptConfigurationCli({ baseDir, tsConfigPath, tscPath }) {
    const result = await runTypeScriptCli({
        cwd: baseDir,
        tscPath,
        args: [
            '--showConfig',
            '--project',
            tsConfigPath,
            '--pretty',
            'false'
        ],
        captureOutput: true
    });
    if (result.exitCode !== 0) {
        throw Object.defineProperty(new Error([
            result.stdout,
            result.stderr
        ].filter(Boolean).join('\n').trim()), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
    }
    try {
        return JSON.parse(result.stdout);
    } catch (cause) {
        throw Object.defineProperty(new Error(`Could not parse output from TypeScript's --showConfig.`, {
            cause
        }), "__NEXT_ERROR_CODE", {
            value: "E1417",
            enumerable: false,
            configurable: true
        });
    }
}

//# sourceMappingURL=runTypeScriptCli.js.map