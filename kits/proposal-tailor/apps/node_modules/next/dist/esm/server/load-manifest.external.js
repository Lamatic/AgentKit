import { join } from 'path';
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';
import { deepFreeze } from '../shared/lib/deep-freeze';
const sharedCache = new Map();
export function loadManifest(path, shouldCache = true, cache = sharedCache, skipParse = false, handleMissing) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let manifest;
    if (handleMissing) {
        try {
            manifest = readFileSync(/* turbopackIgnore: true */ path, 'utf8');
        } catch (err) {
            let result = {};
            cache.set(path, result);
            return result;
        }
    } else {
        manifest = readFileSync(/* turbopackIgnore: true */ path, 'utf8');
    }
    if (!skipParse) {
        manifest = JSON.parse(manifest);
        // Freeze the manifest so it cannot be modified if we're caching it.
        if (shouldCache) {
            manifest = deepFreeze(manifest);
        }
    }
    if (shouldCache) {
        cache.set(path, manifest);
    }
    return manifest;
}
export function evalManifest(path, shouldCache = true, cache = sharedCache, handleMissing) {
    const cached = shouldCache && cache.get(path);
    if (cached) {
        return cached;
    }
    let content;
    if (handleMissing) {
        try {
            content = readFileSync(/* turbopackIgnore: true */ path, 'utf8');
        } catch (err) {
            let result = {};
            cache.set(path, result);
            return result;
        }
    } else {
        content = readFileSync(/* turbopackIgnore: true */ path, 'utf8');
    }
    if (content.length === 0) {
        throw Object.defineProperty(new Error('Manifest file is empty'), "__NEXT_ERROR_CODE", {
            value: "E328",
            enumerable: false,
            configurable: true
        });
    }
    let contextObject = {
        process: {
            env: {
                NEXT_DEPLOYMENT_ID: process.env.NEXT_DEPLOYMENT_ID
            }
        }
    };
    runInNewContext(content, contextObject);
    // Freeze the context object so it cannot be modified if we're caching it.
    if (shouldCache) {
        contextObject = deepFreeze(contextObject);
    }
    if (shouldCache) {
        cache.set(path, contextObject);
    }
    return contextObject;
}
export function loadManifestFromRelativePath({ projectDir, distDir, manifest, shouldCache, cache, skipParse, handleMissing, useEval }) {
    const manifestPath = join(/* turbopackIgnore: true */ projectDir, distDir, manifest);
    if (useEval) {
        return evalManifest(manifestPath, shouldCache, cache, handleMissing);
    }
    return loadManifest(manifestPath, shouldCache, cache, skipParse, handleMissing);
}
export function clearManifestCache(path, cache = sharedCache) {
    return cache.delete(path);
}

//# sourceMappingURL=load-manifest.external.js.map