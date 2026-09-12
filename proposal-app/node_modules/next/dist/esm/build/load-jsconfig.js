import path from 'path';
import fs from 'fs';
import * as Log from './output/log';
import { getTypeScriptConfiguration } from '../lib/typescript/getTypeScriptConfiguration';
import { readFileSync } from 'fs';
import isError from '../lib/is-error';
import { codeFrameColumns } from '../shared/lib/errors/code-frame';
import { getTypeScriptApiMissingError, getTypeScriptConfigurationCli, getTypeScriptPackageInfo, hasNativeTypeScriptPreview } from '../lib/typescript/runTypeScriptCli';
import { loadTsConfigOptions } from '../lib/typescript/loadTsConfig';
let TSCONFIG_WARNED = false;
export function parseJsonFile(filePath) {
    const JSON5 = require('next/dist/compiled/json5');
    const contents = readFileSync(filePath, 'utf8');
    // Special case an empty file
    if (contents.trim() === '') {
        return {};
    }
    try {
        return JSON5.parse(contents);
    } catch (err) {
        if (!isError(err)) throw err;
        const codeFrame = codeFrameColumns(String(contents), {
            start: {
                line: err.lineNumber || 1,
                column: err.columnNumber || undefined
            }
        }, {
            message: err.message,
            color: true
        });
        throw Object.defineProperty(new Error(`Failed to parse "${filePath}":\n${codeFrame ?? err.message}`), "__NEXT_ERROR_CODE", {
            value: "E1087",
            enumerable: false,
            configurable: true
        });
    }
}
export default async function loadJsConfig(dir, config) {
    var _jsConfig_compilerOptions;
    const useTypeScriptCli = Boolean(config.experimental.useTypeScriptCli);
    const typeScriptPackage = getTypeScriptPackageInfo(dir);
    const typeScriptPath = useTypeScriptCli ? typeScriptPackage == null ? void 0 : typeScriptPackage.tscPath : typeScriptPackage == null ? void 0 : typeScriptPackage.apiPath;
    const tsConfigFileName = config.typescript.tsconfigPath || 'tsconfig.json';
    const tsConfigPath = path.join(dir, tsConfigFileName);
    if (!useTypeScriptCli && typeScriptPackage && !typeScriptPackage.apiPath && !hasNativeTypeScriptPreview(dir) && fs.existsSync(tsConfigPath)) {
        throw getTypeScriptApiMissingError(typeScriptPackage.version);
    }
    const useTypeScript = Boolean(typeScriptPath && fs.existsSync(tsConfigPath));
    let implicitBaseurl;
    let jsConfig;
    // jsconfig is a subset of tsconfig
    if (useTypeScript) {
        if (tsConfigFileName !== 'tsconfig.json' && TSCONFIG_WARNED === false) {
            TSCONFIG_WARNED = true;
            Log.info(`Using tsconfig file: ${tsConfigFileName}`);
        }
        if (useTypeScriptCli) {
            const tsConfig = await getTypeScriptConfigurationCli({
                baseDir: dir,
                tsConfigPath,
                tscPath: typeScriptPath
            });
            const configOrigins = loadTsConfigOptions(tsConfigPath);
            jsConfig = {
                compilerOptions: {
                    ...tsConfig.compilerOptions,
                    pathsBasePath: configOrigins.pathsBasePath
                }
            };
        } else {
            const ts = await Promise.resolve(require(typeScriptPath));
            const tsConfig = await getTypeScriptConfiguration(ts, tsConfigPath, true);
            jsConfig = {
                compilerOptions: tsConfig.options
            };
        }
        implicitBaseurl = path.dirname(tsConfigPath);
    }
    const jsConfigPath = path.join(dir, 'jsconfig.json');
    if (!useTypeScript && fs.existsSync(jsConfigPath)) {
        jsConfig = parseJsonFile(jsConfigPath);
        implicitBaseurl = path.dirname(jsConfigPath);
    }
    let resolvedBaseUrl;
    if (jsConfig == null ? void 0 : (_jsConfig_compilerOptions = jsConfig.compilerOptions) == null ? void 0 : _jsConfig_compilerOptions.baseUrl) {
        resolvedBaseUrl = {
            baseUrl: path.resolve(implicitBaseurl ?? dir, jsConfig.compilerOptions.baseUrl),
            isImplicit: false
        };
    } else {
        var _jsConfig_compilerOptions1;
        // TypeScript 5.0+: `pathsBasePath` is the directory of the tsconfig that
        // defines `paths`. For paths inherited from an extended base tsconfig (e.g.
        // a workspace-root tsconfig.base.json for nx monorepo), this is the base
        // config's directory — not the app tsconfig dir. Using it ensures JsConfigPathsPlugin
        // joins path-mapping values against the correct base so `baseUrl` is not required
        // for path aliases to work in webpack.
        const pathsBasePath = jsConfig == null ? void 0 : (_jsConfig_compilerOptions1 = jsConfig.compilerOptions) == null ? void 0 : _jsConfig_compilerOptions1.pathsBasePath;
        const effectiveBaseUrl = pathsBasePath ?? implicitBaseurl;
        if (effectiveBaseUrl) {
            resolvedBaseUrl = {
                baseUrl: effectiveBaseUrl,
                isImplicit: true
            };
        }
    }
    return {
        useTypeScript,
        jsConfig,
        resolvedBaseUrl,
        jsConfigPath: useTypeScript ? tsConfigPath : fs.existsSync(jsConfigPath) ? jsConfigPath : undefined
    };
}

//# sourceMappingURL=load-jsconfig.js.map