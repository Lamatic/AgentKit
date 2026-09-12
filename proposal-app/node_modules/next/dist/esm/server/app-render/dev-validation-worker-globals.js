/**
 * Cross-module handoff for the dev validation worker (client-module warmup,
 * static-shell validation, and instant-config validation all run on it). A
 * symbol on `globalThis` decouples the dev-server entry point (which installs
 * the jest-worker pool) from the read site in `runDevValidationInBackground`
 * inside `app-render.tsx`, avoiding a direct import of dev-only pool code from
 * the render module. When the symbol is not set (e.g. because the feature flag
 * is disabled), `getDevValidationWorker()` returns undefined and the caller
 * runs validation in process instead.
 */ const SYMBOL = Symbol.for('next.dev.validationWorker');
export function setDevValidationWorker(fn) {
    ;
    globalThis[SYMBOL] = fn;
}
export function getDevValidationWorker() {
    return globalThis[SYMBOL];
}

//# sourceMappingURL=dev-validation-worker-globals.js.map