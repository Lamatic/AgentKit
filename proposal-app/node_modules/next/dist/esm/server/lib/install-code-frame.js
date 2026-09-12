/**
 * Installs code frame rendering support by injecting the renderer into patch-error-inspect.
 * This uses dependency injection to avoid hard dependencies on native bindings in runtime code.
 *
 * Should be called early in dev/build initialization, after native bindings are loaded.
 */ export function installCodeFrameSupport() {
    const { setCodeFrameRenderer } = require('../patch-error-inspect');
    const { getOriginalCodeFrame } = require('../../next-devtools/server/shared');
    setCodeFrameRenderer(getOriginalCodeFrame);
}

//# sourceMappingURL=install-code-frame.js.map