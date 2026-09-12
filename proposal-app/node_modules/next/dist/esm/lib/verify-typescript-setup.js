import { bold, cyan, red, yellow } from './picocolors';
import path from 'path';
import { hasNecessaryDependencies } from './has-necessary-dependencies';
import semver from 'next/dist/compiled/semver';
import { CompileError } from './compile-error';
import * as log from '../build/output/log';
import { getTypeScriptIntent } from './typescript/getTypeScriptIntent';
import { writeAppTypeDeclarations } from './typescript/writeAppTypeDeclarations';
import { writeConfigurationDefaults } from './typescript/writeConfigurationDefaults';
import { installDependencies } from './install-dependencies';
import { isCI } from '../server/ci-info';
import { missingDepsError } from './typescript/missingDependencyError';
import { getTypeScriptApiMissingError, getTypeScriptPackageInfo, hasNativeTypeScriptPreview } from './typescript/runTypeScriptCli';
const typescriptApiPackage = {
    file: 'typescript/lib/typescript.js',
    pkg: 'typescript',
    install: 'typescript@^6.0.0',
    exportsRestrict: true
};
const typescriptCliPackage = {
    // The CLI path is resolved from the package's bin metadata after this initial
    // package-presence check, since aliased TypeScript packages may rename it.
    file: 'typescript/package.json',
    pkg: 'typescript',
    exportsRestrict: true
};
const requiredTypePackages = [
    {
        file: '@types/react/index.d.ts',
        pkg: '@types/react',
        exportsRestrict: true
    },
    {
        file: '@types/node/index.d.ts',
        pkg: '@types/node',
        exportsRestrict: true
    }
];
export async function verifyAndRunTypeScript({ dir, distDir, cacheDir, strictRouteTypes, tsconfigPath, shouldRunTypeCheck, typedRoutes, disableStaticImages, hasAppDir, hasPagesDir, appDir, pagesDir, debugBuildPaths, useTypeScriptCli = false, onFirstCliOutput }) {
    const tsConfigFileName = tsconfigPath || 'tsconfig.json';
    const resolvedTsConfigPath = path.join(dir, tsConfigFileName);
    const typeCheckMode = useTypeScriptCli ? 'typescript-cli' : 'typescript-api';
    // Construct intentDirs from appDir and pagesDir for getTypeScriptIntent
    const intentDirs = [
        pagesDir,
        appDir
    ].filter(Boolean);
    try {
        var _deps_missing, _deps_missing1;
        // Check if the project uses TypeScript:
        const intent = await getTypeScriptIntent(dir, intentDirs, tsConfigFileName);
        if (!intent) {
            return {
                version: null,
                typeCheckMode
            };
        }
        // Check if @typescript/native-preview is installed as an alternative
        const hasNativePreview = hasNativeTypeScriptPreview(dir);
        const installedTypeScript = getTypeScriptPackageInfo(dir);
        if (!useTypeScriptCli && !hasNativePreview && installedTypeScript && !installedTypeScript.apiPath) {
            throw getTypeScriptApiMissingError(installedTypeScript.version);
        }
        const requiredPackages = [
            useTypeScriptCli ? typescriptCliPackage : typescriptApiPackage,
            ...requiredTypePackages
        ];
        // Ensure TypeScript and necessary `@types/*` are installed:
        let deps = hasNecessaryDependencies(dir, requiredPackages);
        // If @typescript/native-preview is installed and only the typescript package is missing,
        // we can skip auto-installing typescript since the native preview provides TS compilation.
        // However, we still need @types/react and @types/node for type checking.
        if (!useTypeScriptCli && hasNativePreview && ((_deps_missing = deps.missing) == null ? void 0 : _deps_missing.length) > 0) {
            const missingWithoutTypescript = deps.missing.filter((dep)=>dep.pkg !== 'typescript');
            const onlyTypescriptMissing = deps.missing.length === 1 && deps.missing[0].pkg === 'typescript';
            if (onlyTypescriptMissing) {
                // @typescript/native-preview is installed and only typescript is missing
                // Skip installation and return early - the project can use the native preview
                log.info(`Detected ${bold('@typescript/native-preview')} as TypeScript compiler. ` + `Some Next.js TypeScript features (like type checking during build) require the standard ${bold('typescript')} package.`);
                // Still write type declarations since they don't require the typescript package
                await writeAppTypeDeclarations({
                    baseDir: dir,
                    distDir,
                    imageImportsEnabled: !disableStaticImages,
                    hasPagesDir,
                    hasAppDir,
                    strictRouteTypes,
                    typedRoutes
                });
                return {
                    version: null,
                    typeCheckMode
                };
            }
            // If there are other missing deps besides typescript, only install those
            if (missingWithoutTypescript.length > 0 && missingWithoutTypescript.length < deps.missing.length) {
                deps.missing = missingWithoutTypescript;
            }
        }
        if (((_deps_missing1 = deps.missing) == null ? void 0 : _deps_missing1.length) > 0) {
            if (isCI) {
                // we don't attempt auto install in CI to avoid side-effects
                // and instead log the error for installing needed packages
                missingDepsError(dir, deps.missing);
            }
            console.log(bold(yellow(`It looks like you're trying to use TypeScript but do not have the required package(s) installed.`)) + '\n' + 'Installing dependencies' + '\n\n' + bold('If you are not trying to use TypeScript, please remove the ' + cyan('tsconfig.json') + ' file from your package root (and any TypeScript files in your app and pages directories).') + '\n');
            await installDependencies(dir, deps.missing, true).catch((err)=>{
                if (err && typeof err === 'object' && 'command' in err) {
                    console.error(`Failed to install required TypeScript dependencies, please install them manually to continue:\n` + err.command + '\n');
                }
                throw err;
            });
            deps = hasNecessaryDependencies(dir, requiredPackages);
        }
        const typeScriptPackage = getTypeScriptPackageInfo(dir);
        const typeScriptPath = useTypeScriptCli ? typeScriptPackage == null ? void 0 : typeScriptPackage.tscPath : typeScriptPackage == null ? void 0 : typeScriptPackage.apiPath;
        if (!typeScriptPackage || !typeScriptPath) {
            missingDepsError(dir, deps.missing.length > 0 ? deps.missing : [
                useTypeScriptCli ? typescriptCliPackage : typescriptApiPackage
            ]);
        }
        const typescriptVersion = typeScriptPackage.version;
        if (semver.lt(typescriptVersion, '5.1.0')) {
            log.warn(`Minimum recommended TypeScript version is v5.1.0, older versions can potentially be incompatible with Next.js. Detected: ${typescriptVersion}`);
        }
        // Reconfigure (or create) the user's `tsconfig.json` for them:
        await writeConfigurationDefaults(typescriptVersion, resolvedTsConfigPath, intent.firstTimeSetup, hasAppDir, distDir, hasPagesDir, strictRouteTypes);
        // Write out the necessary `next-env.d.ts` file to correctly register
        // Next.js' types:
        await writeAppTypeDeclarations({
            baseDir: dir,
            distDir,
            imageImportsEnabled: !disableStaticImages,
            hasPagesDir,
            hasAppDir,
            strictRouteTypes,
            typedRoutes
        });
        let result;
        if (shouldRunTypeCheck) {
            if (useTypeScriptCli) {
                if (debugBuildPaths) {
                    log.warn('`experimental.useTypeScriptCli` checks the complete TypeScript project; `--debug-build-paths` does not limit type checking.');
                }
                const { runTypeCheckCli } = require('./typescript/runTypeCheckCli');
                result = await runTypeCheckCli({
                    baseDir: dir,
                    tsConfigPath: resolvedTsConfigPath,
                    tscPath: typeScriptPath,
                    cacheDir,
                    onFirstOutput: onFirstCliOutput
                });
            } else {
                const { runTypeCheck } = require('./typescript/runTypeCheck');
                // Install native bindings so that code frame rendering works in the worker
                const { installBindings } = require('../build/swc/install-bindings');
                await installBindings();
                const typescript = await Promise.resolve(require(typeScriptPath));
                // Verify the project passes type-checking before we go to webpack phase:
                result = await runTypeCheck(typescript, dir, distDir, resolvedTsConfigPath, cacheDir, hasAppDir, {
                    app: appDir,
                    pages: pagesDir
                }, debugBuildPaths);
            }
        }
        return {
            result,
            version: typescriptVersion,
            typeCheckMode
        };
    } catch (err) {
        // Print the user-facing message here and rethrow. This function runs both
        // in-process (next dev / next test / next typegen, and the CLI type-check
        // during build) and inside a jest worker (the TypeScript-API type-check
        // during build). A thrown error does not survive the worker boundary — the
        // parent only sees `Call retries were exceeded` — so the message must be
        // printed on this side. The caller decides what to do with the throw (exit,
        // or tolerate it as `next dev` does on re-verification).
        if (err instanceof CompileError) {
            // The checker already printed its diagnostics.
            console.error(red('Failed to type check.\n'));
            if (err.message) {
                console.error(err.message);
            }
        } else if (err instanceof Error) {
            console.error(err.message);
        } else {
            console.error(err);
        }
        throw err;
    }
}
/**
 * Worker entrypoint used by `next build` for the TypeScript-API type-check.
 * `verifyAndRunTypeScript` has already printed any error, so on failure we exit
 * the worker directly rather than rethrowing: a thrown error would be retried by
 * jest-worker and surface in the parent as the unhelpful
 * `Jest worker encountered 1 child process exceptions, exceeding retry limit`.
 */ export async function verifyAndRunTypeScriptInWorker(options) {
    try {
        return await verifyAndRunTypeScript(options);
    } catch  {
        // The error was already printed by `verifyAndRunTypeScript`.
        // Kill the worker with a non-zero exit code.
        process.exit(1);
    }
}

//# sourceMappingURL=verify-typescript-setup.js.map