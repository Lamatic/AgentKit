"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DEVTOOLS_CODE_FRAME_MAX_WIDTH: null,
    getOriginalCodeFrame: null,
    ignoreListAnonymousStackFramesIfSandwiched: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DEVTOOLS_CODE_FRAME_MAX_WIDTH: function() {
        return DEVTOOLS_CODE_FRAME_MAX_WIDTH;
    },
    getOriginalCodeFrame: function() {
        return getOriginalCodeFrame;
    },
    ignoreListAnonymousStackFramesIfSandwiched: function() {
        return ignoreListAnonymousStackFramesIfSandwiched;
    }
});
const _codeframe = require("../../shared/lib/errors/code-frame");
const _sourcemaps = require("../../server/lib/source-maps");
const DEVTOOLS_CODE_FRAME_MAX_WIDTH = 1000;
function ignoreListAnonymousStackFramesIfSandwiched(responses) {
    (0, _sourcemaps.ignoreListAnonymousStackFramesIfSandwiched)(responses, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null && response.value.originalStackFrame.file === '<anonymous>';
    }, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null && response.value.originalStackFrame.ignored === true;
    }, (response)=>{
        return response.status === 'fulfilled' && response.value.originalStackFrame !== null ? response.value.originalStackFrame.methodName : '';
    }, (response)=>{
        ;
        response.value.originalStackFrame.ignored = true;
    });
}
function getOriginalCodeFrame(frame, source, colorsOrOptions = process.stdout?.isTTY ?? false) {
    if (!source || frame.line1 == null) {
        return null;
    }
    const { colors, maxWidth } = typeof colorsOrOptions === 'boolean' ? {
        colors: colorsOrOptions,
        maxWidth: undefined
    } : {
        colors: colorsOrOptions.colors ?? process.stdout?.isTTY ?? false,
        maxWidth: colorsOrOptions.maxWidth
    };
    return (0, _codeframe.codeFrameColumns)(source, {
        start: {
            line: frame.line1,
            column: frame.column1 ?? undefined
        }
    }, {
        color: colors,
        maxWidth
    }) ?? null;
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=shared.js.map