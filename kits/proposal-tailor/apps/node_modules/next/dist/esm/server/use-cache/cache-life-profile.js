import { INFINITE_CACHE } from '../../lib/constants';
function normalizeCacheLifeValue(key, value, context) {
    if (value === undefined) {
        return undefined;
    }
    if (value === false) {
        if (key === 'stale') {
            throw Object.defineProperty(new Error('Pass `Infinity` instead of `false` if you want to cache on the client forever ' + 'without checking with the server.'), "__NEXT_ERROR_CODE", {
                value: "E407",
                enumerable: false,
                configurable: true
            });
        } else if (key === 'revalidate') {
            throw Object.defineProperty(new Error('Pass `Infinity` instead of `false` if you do not want to revalidate by time.'), "__NEXT_ERROR_CODE", {
                value: "E104",
                enumerable: false,
                configurable: true
            });
        } else {
            throw Object.defineProperty(new Error('Pass `Infinity` instead of `false` if you want to cache on the server forever ' + 'without checking with the origin.'), "__NEXT_ERROR_CODE", {
                value: "E658",
                enumerable: false,
                configurable: true
            });
        }
    }
    if (typeof value !== 'number') {
        throw Object.defineProperty(new Error(`The ${key} option must be a number of seconds.`), "__NEXT_ERROR_CODE", {
            value: "E1414",
            enumerable: false,
            configurable: true
        });
    }
    if (value === Infinity) {
        // Infinity means "never", but turns into null when serialized as JSON
        // (e.g. for build workers or cache handlers), unlike INFINITE_CACHE.
        return INFINITE_CACHE;
    }
    if (!Number.isFinite(value)) {
        throw Object.defineProperty(new Error(context.kind === 'config' ? `Invalid "cacheLife.${context.profileName}.${key}" provided, expected a finite number of seconds or Infinity, received ${value}` : `Invalid \`cacheLife()\` option "${key}" provided, expected a finite number of seconds or Infinity, received ${value}.`), "__NEXT_ERROR_CODE", {
            value: "E394",
            enumerable: false,
            configurable: true
        });
    }
    return value;
}
export function validateAndNormalizeCacheLifeProfile(profile, context) {
    // Don't mutate the profile; it may be shared, e.g. as part of the user's
    // config object.
    const normalizedProfile = {
        ...profile
    };
    for (const key of [
        'stale',
        'revalidate',
        'expire'
    ]){
        const value = normalizeCacheLifeValue(key, profile[key], context);
        if (value !== undefined) {
            normalizedProfile[key] = value;
        }
    }
    if (normalizedProfile.revalidate !== undefined && normalizedProfile.expire !== undefined && normalizedProfile.revalidate > normalizedProfile.expire) {
        throw Object.defineProperty(new Error('If providing both the revalidate and expire options, ' + 'the expire option must be greater than the revalidate option. ' + 'The expire option indicates how many seconds from the start ' + 'until it can no longer be used.'), "__NEXT_ERROR_CODE", {
            value: "E656",
            enumerable: false,
            configurable: true
        });
    }
    return normalizedProfile;
}

//# sourceMappingURL=cache-life-profile.js.map