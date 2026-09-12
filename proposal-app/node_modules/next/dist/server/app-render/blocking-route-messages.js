"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createDynamicBodyError: null,
    createDynamicBodyErrorInNavigation: null,
    createDynamicMetadataError: null,
    createDynamicOrRuntimeBodyError: null,
    createDynamicOrRuntimeMetadataError: null,
    createDynamicOrRuntimeViewportError: null,
    createDynamicViewportError: null,
    createLinkBodyErrorInNavigation: null,
    createLinkMetadataError: null,
    createLinkViewportError: null,
    createRuntimeBodyError: null,
    createRuntimeBodyErrorInNavigation: null,
    createRuntimeMetadataError: null,
    createRuntimeViewportError: null,
    logBuildDebugHint: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createDynamicBodyError: function() {
        return createDynamicBodyError;
    },
    createDynamicBodyErrorInNavigation: function() {
        return createDynamicBodyErrorInNavigation;
    },
    createDynamicMetadataError: function() {
        return createDynamicMetadataError;
    },
    createDynamicOrRuntimeBodyError: function() {
        return createDynamicOrRuntimeBodyError;
    },
    createDynamicOrRuntimeMetadataError: function() {
        return createDynamicOrRuntimeMetadataError;
    },
    createDynamicOrRuntimeViewportError: function() {
        return createDynamicOrRuntimeViewportError;
    },
    createDynamicViewportError: function() {
        return createDynamicViewportError;
    },
    createLinkBodyErrorInNavigation: function() {
        return createLinkBodyErrorInNavigation;
    },
    createLinkMetadataError: function() {
        return createLinkMetadataError;
    },
    createLinkViewportError: function() {
        return createLinkViewportError;
    },
    createRuntimeBodyError: function() {
        return createRuntimeBodyError;
    },
    createRuntimeBodyErrorInNavigation: function() {
        return createRuntimeBodyErrorInNavigation;
    },
    createRuntimeMetadataError: function() {
        return createRuntimeMetadataError;
    },
    createRuntimeViewportError: function() {
        return createRuntimeViewportError;
    },
    logBuildDebugHint: function() {
        return logBuildDebugHint;
    }
});
function createRuntimeBodyError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data during prerendering.\n\n` + `\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1427",
        enumerable: false,
        configurable: true
    });
}
function createDynamicBodyError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data during prerendering.\n\n` + `\`fetch(...)\` or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [cache] Cache the data access with \`"use cache"\` (does not apply to \`connection()\`)\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1440",
        enumerable: false,
        configurable: true
    });
}
function createRuntimeBodyErrorInNavigation(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data during prerendering or a navigation.\n\n` + `\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed outside of \`<Suspense>\` prevents the route from being prerendered or the navigation from being instant, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1430",
        enumerable: false,
        configurable: true
    });
}
function createLinkBodyErrorInNavigation(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data during prerendering or a navigation.\n\n` + `\`params\` or \`searchParams\` accessed outside of \`<Suspense>\` may prevent the navigation from being instant, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/instant-shell-url-data`), "__NEXT_ERROR_CODE", {
        value: "E1439",
        enumerable: false,
        configurable: true
    });
}
function createDynamicBodyErrorInNavigation(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data during prerendering or a navigation.\n\n` + `\`fetch(...)\` or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered or the navigation from being instant, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [cache] Cache the data access with \`"use cache"\` (does not apply to \`connection()\`)\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1437",
        enumerable: false,
        configurable: true
    });
}
function createDynamicOrRuntimeBodyError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data during prerendering.\n\n` + `\`fetch(...)\`, \`cookies()\`, \`headers()\`, \`params\`, \`searchParams\`, or \`connection()\` accessed outside of \`<Suspense>\` prevents the route from being prerendered, blocking the page load and leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [stream] Provide a placeholder with \`<Suspense fallback={...}>\` around the data access\n` + `  - [cache] For uncached data (\`fetch\`, database calls): cache the access with \`"use cache"\` (does not apply to \`connection()\`)\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1428",
        enumerable: false,
        configurable: true
    });
}
function createLinkMetadataError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data in \`generateMetadata()\`.\n\n` + `This route's metadata is blocked, but the rest of its content can be prefetched. \`params\` or \`searchParams\` accessed in \`generateMetadata()\` prevent it from being prefetched.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static metadata export instead of \`generateMetadata()\`\n` + `  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1429",
        enumerable: false,
        configurable: true
    });
}
function createRuntimeMetadataError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data in \`generateMetadata()\`.\n\n` + `This route's metadata is blocked, but the rest of its content can be prerendered. \`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` accessed in \`generateMetadata()\` cause it to run dynamically.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static metadata export instead of \`generateMetadata()\`\n` + `  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1423",
        enumerable: false,
        configurable: true
    });
}
function createDynamicMetadataError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data in \`generateMetadata()\`.\n\n` + `This route's metadata is blocked, but the rest of its content can be prerendered. \`fetch(...)\` or \`connection()\` accessed in \`generateMetadata()\` cause it to run dynamically.\n\n` + `Ways to fix this:\n` + `  - [cache] Cache the metadata with \`"use cache"\` in \`generateMetadata()\` (does not apply to \`connection()\`)\n` + `  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1425",
        enumerable: false,
        configurable: true
    });
}
function createLinkViewportError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered URL data in \`generateViewport()\`.\n\n` + `\`params\` or \`searchParams\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static viewport export instead of \`generateViewport()\`\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1431",
        enumerable: false,
        configurable: true
    });
}
function createRuntimeViewportError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered runtime data in \`generateViewport()\`.\n\n` + `\`cookies()\`, \`headers()\`, \`params\`, or \`searchParams\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static viewport export instead of \`generateViewport()\`\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1424",
        enumerable: false,
        configurable: true
    });
}
function createDynamicViewportError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached data in \`generateViewport()\`.\n\n` + `\`fetch(...)\` or \`connection()\` in \`generateViewport()\` prevents the page from being prerendered, leading to a slower user experience.\n\n` + `Ways to fix this:\n` + `  - [cache] Cache the viewport data with \`"use cache"\` in \`generateViewport()\` (does not apply to \`connection()\`)\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-dynamic`), "__NEXT_ERROR_CODE", {
        value: "E1438",
        enumerable: false,
        configurable: true
    });
}
function createDynamicOrRuntimeViewportError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data in \`generateViewport()\`.\n\n` + `This prevents the page from being prerendered, leading to a slower user experience. Unlike metadata, viewport cannot be streamed behind \`<Suspense>\` because it affects the initial page load.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static viewport export instead of \`generateViewport()\`\n` + `  - [cache] For uncached data (\`fetch\`, database calls): cache the viewport with \`"use cache"\` in \`generateViewport()\` (does not apply to \`connection()\`)\n` + `  - [block] Set \`export const instant = false\` to allow a blocking route\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-viewport-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1436",
        enumerable: false,
        configurable: true
    });
}
function createDynamicOrRuntimeMetadataError(route) {
    return Object.defineProperty(new Error(`Route "${route}": Next.js encountered uncached or runtime data in \`generateMetadata()\`.\n\n` + `This route's metadata is blocked, but the rest of its content can be prerendered.\n\n` + `Ways to fix this:\n` + `  - [static] Use a static metadata export instead of \`generateMetadata()\`\n` + `  - [cache] Cache the metadata with \`"use cache"\` in \`generateMetadata()\` (does not apply to \`connection()\`)\n` + `  - [dynamic] Render a marker component that calls \`await connection()\` inside \`<Suspense>\` on the page\n\n` + `Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime`), "__NEXT_ERROR_CODE", {
        value: "E1426",
        enumerable: false,
        configurable: true
    });
}
function logBuildDebugHint(route) {
    if (process.env.NODE_ENV !== 'development') {
        console.error(`To get a more detailed stack trace and pinpoint the issue, try one of the following:\n` + `  - Start the app in development mode by running \`next dev\`, then open "${route}" in your browser to investigate the error.\n` + `  - Rerun the production build with \`next build --debug-prerender\` to generate better stack traces.`);
    } else if (!process.env.__NEXT_DEV_SERVER) {
        console.error(`To debug the issue, start the app in development mode by running \`next dev\`, then open "${route}" in your browser to investigate the error.`);
    }
}

//# sourceMappingURL=blocking-route-messages.js.map