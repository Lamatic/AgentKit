"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    AppSegmentConfigSchemaKeys: null,
    parseAppSegmentConfig: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    AppSegmentConfigSchemaKeys: function() {
        return AppSegmentConfigSchemaKeys;
    },
    parseAppSegmentConfig: function() {
        return parseAppSegmentConfig;
    }
});
const _zod = require("next/dist/compiled/zod");
const _zod1 = require("../../../shared/lib/zod");
const CookieSchema = _zod.z.object({
    name: _zod.z.string(),
    value: _zod.z.string().or(_zod.z.null())
}).strict();
const RuntimeSampleSchema = _zod.z.object({
    cookies: _zod.z.array(CookieSchema).optional(),
    headers: _zod.z.array(_zod.z.tuple([
        _zod.z.string(),
        _zod.z.string().or(_zod.z.null())
    ])).optional(),
    params: _zod.z.record(_zod.z.union([
        _zod.z.string(),
        _zod.z.array(_zod.z.string())
    ])).optional(),
    searchParams: _zod.z.record(_zod.z.union([
        _zod.z.string(),
        _zod.z.array(_zod.z.string()),
        _zod.z.null()
    ])).optional()
}).strict();
const InstantConfigObjectSchema = _zod.z.object({
    level: _zod.z.enum([
        'warning',
        'experimental-error'
    ]).optional(),
    unstable_samples: _zod.z.array(RuntimeSampleSchema).min(1).optional(),
    unstable_from: _zod.z.array(_zod.z.string()).optional(),
    unstable_disableValidation: _zod.z.literal(true).optional(),
    unstable_disableDevValidation: _zod.z.literal(true).optional(),
    unstable_disableBuildValidation: _zod.z.literal(true).optional()
}).strict();
const InstantConfigSchema = _zod.z.union([
    InstantConfigObjectSchema,
    _zod.z.literal(true),
    _zod.z.literal(false)
]);
const PrefetchSchema = _zod.z.enum([
    'auto',
    'partial',
    'unstable_eager',
    'force-disabled'
]);
/**
 * The schema for configuration for a page.
 */ const AppSegmentConfigSchema = _zod.z.object({
    /**
   * The number of seconds to revalidate the page or false to disable revalidation.
   */ revalidate: _zod.z.union([
        _zod.z.number().int().nonnegative(),
        _zod.z.literal(false)
    ]).optional(),
    /**
   * Whether the page supports dynamic parameters.
   */ dynamicParams: _zod.z.boolean().optional(),
    /**
   * The dynamic behavior of the page.
   */ dynamic: _zod.z.enum([
        'auto',
        'error',
        'force-static',
        'force-dynamic'
    ]).optional(),
    /**
   * The caching behavior of the page.
   */ fetchCache: _zod.z.enum([
        'auto',
        'default-cache',
        'only-cache',
        'force-cache',
        'force-no-store',
        'default-no-store',
        'only-no-store'
    ]).optional(),
    /**
   * How this segment should be prefetched.
   */ instant: InstantConfigSchema.optional(),
    /**
   * Controls prefetching for this segment.
   * - 'auto' (default) is a noop.
   * - 'partial' enables Partial Prefetching. Only Cache Components are
   *   prefetched, not dynamic ones. When a static prefetch is insufficient,
   *   the segment may be prefetched with a runtime request instead.
   * - 'unstable_eager' behaves like 'partial' but, when App Shells are enabled,
   *   keeps eagerly prefetching the route's segments instead of relying on the
   *   shared app shell. Internal migration aid; not part of the public API.
   * - 'force-disabled' disables prefetching for the segment.
   */ prefetch: PrefetchSchema.optional(),
    /**
   * The stale time for dynamic responses in seconds.
   * Controls how long the client-side router cache retains dynamic page data.
   * Pages only — not allowed in layouts.
   */ unstable_dynamicStaleTime: _zod.z.number().int().nonnegative().optional(),
    /**
   * The preferred region for the page.
   */ preferredRegion: _zod.z.union([
        _zod.z.string(),
        _zod.z.array(_zod.z.string())
    ]).optional(),
    /**
   * The runtime to use for the page.
   */ runtime: _zod.z.enum([
        'edge',
        'nodejs'
    ]).optional(),
    /**
   * The maximum duration for the page in seconds.
   */ maxDuration: _zod.z.number().int().nonnegative().optional()
});
function parseAppSegmentConfig(data, route) {
    const parsed = AppSegmentConfigSchema.safeParse(data, {
        errorMap: (issue, ctx)=>{
            if (issue.path.length === 1) {
                switch(issue.path[0]){
                    case 'revalidate':
                        {
                            return {
                                message: `Invalid revalidate value ${JSON.stringify(ctx.data)} on "${route}", must be a non-negative number or false`
                            };
                        }
                    case 'instant':
                        {
                            return {
                                // @TODO replace this link with a link to the docs when they are written
                                message: `Invalid instant value ${JSON.stringify(ctx.data)} on "${route}", must be \`true\`, \`false\`, or an object. Read more at https://nextjs.org/docs/messages/invalid-instant-configuration`
                            };
                        }
                    case 'prefetch':
                        {
                            return {
                                message: `Invalid prefetch value ${JSON.stringify(ctx.data)} on "${route}", must be "auto", "partial", "unstable_eager", or "force-disabled".`
                            };
                        }
                    case 'unstable_dynamicStaleTime':
                        {
                            return {
                                message: `Invalid unstable_dynamicStaleTime value ${JSON.stringify(ctx.data)} on "${route}", must be a non-negative number`
                            };
                        }
                    default:
                }
            }
            return {
                message: ctx.defaultError
            };
        }
    });
    if (!parsed.success) {
        throw (0, _zod1.formatZodError)(`Invalid segment configuration options detected for "${route}". Read more at https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config`, parsed.error);
    }
    return parsed.data;
}
const AppSegmentConfigSchemaKeys = AppSegmentConfigSchema.keyof().options;

//# sourceMappingURL=app-segment-config.js.map