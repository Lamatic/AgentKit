"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DynamicHTMLPreludeState: null,
    DynamicState: null,
    getDynamicDataPostponedState: null,
    getDynamicHTMLPostponedState: null,
    getPostponedFromState: null,
    isEmptyHTMLPrelude: null,
    parsePostponedState: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DynamicHTMLPreludeState: function() {
        return DynamicHTMLPreludeState;
    },
    DynamicState: function() {
        return DynamicState;
    },
    getDynamicDataPostponedState: function() {
        return getDynamicDataPostponedState;
    },
    getDynamicHTMLPostponedState: function() {
        return getDynamicHTMLPostponedState;
    },
    getPostponedFromState: function() {
        return getPostponedFromState;
    },
    isEmptyHTMLPrelude: function() {
        return isEmptyHTMLPrelude;
    },
    parsePostponedState: function() {
        return parsePostponedState;
    }
});
const _getdynamicparam = require("../../shared/lib/router/utils/get-dynamic-param");
const _resumedatacache = require("../resume-data-cache/resume-data-cache");
var DynamicState = /*#__PURE__*/ function(DynamicState) {
    /**
   * The dynamic access occurred during the RSC render phase.
   */ DynamicState[DynamicState["DATA"] = 1] = "DATA";
    /**
   * The dynamic access occurred during the HTML shell render phase.
   */ DynamicState[DynamicState["HTML"] = 2] = "HTML";
    return DynamicState;
}({});
var DynamicHTMLPreludeState = /*#__PURE__*/ function(DynamicHTMLPreludeState) {
    DynamicHTMLPreludeState[DynamicHTMLPreludeState["Empty"] = 0] = "Empty";
    DynamicHTMLPreludeState[DynamicHTMLPreludeState["Full"] = 1] = "Full";
    return DynamicHTMLPreludeState;
}({});
async function getDynamicHTMLPostponedState(postponed, preludeState, fallbackRouteParams, resumeDataCache, isCacheComponentsEnabled) {
    const data = [
        preludeState,
        postponed
    ];
    const dataString = JSON.stringify(data);
    // If there are no fallback route params, we can just serialize the postponed
    // state as is.
    if (!fallbackRouteParams || fallbackRouteParams.size === 0) {
        // Serialized as `<postponedString.length>:<postponedString><renderResumeDataCache>`
        return `${dataString.length}:${dataString}${await (0, _resumedatacache.stringifyResumeDataCache)((0, _resumedatacache.createRenderResumeDataCache)(resumeDataCache), isCacheComponentsEnabled)}`;
    }
    const replacements = Array.from(fallbackRouteParams.entries());
    const replacementsString = JSON.stringify(replacements);
    // Serialized as `<replacements.length><replacements><data>`
    const postponedString = `${replacementsString.length}${replacementsString}${dataString}`;
    // Serialized as `<postponedString.length>:<postponedString><renderResumeDataCache>`
    return `${postponedString.length}:${postponedString}${await (0, _resumedatacache.stringifyResumeDataCache)(resumeDataCache, isCacheComponentsEnabled)}`;
}
async function getDynamicDataPostponedState(resumeDataCache, isCacheComponentsEnabled) {
    return `4:null${await (0, _resumedatacache.stringifyResumeDataCache)((0, _resumedatacache.createRenderResumeDataCache)(resumeDataCache), isCacheComponentsEnabled)}`;
}
function parsePostponedState(state, interpolatedParams, maxPostponedStateSizeBytes) {
    try {
        var _state_match;
        const postponedStringLengthMatch = (_state_match = state.match(/^([0-9]*):/)) == null ? void 0 : _state_match[1];
        if (!postponedStringLengthMatch) {
            // Do not include the raw state in the message: it can be large and may
            // contain sensitive serialized data.
            throw Object.defineProperty(new Error('Invariant: invalid postponed state: missing length prefix'), "__NEXT_ERROR_CODE", {
                value: "E1388",
                enumerable: false,
                configurable: true
            });
        }
        const postponedStringLength = parseInt(postponedStringLengthMatch);
        // We add a `:` to the end of the length as the first character of the
        // postponed string is the length of the replacement entries.
        const postponedString = state.slice(postponedStringLengthMatch.length + 1, postponedStringLengthMatch.length + postponedStringLength + 1);
        const renderResumeDataCache = (0, _resumedatacache.createRenderResumeDataCache)(state.slice(postponedStringLengthMatch.length + postponedStringLength + 1), maxPostponedStateSizeBytes);
        try {
            if (postponedString === 'null') {
                return {
                    type: 1,
                    renderResumeDataCache
                };
            }
            if (/^[0-9]/.test(postponedString)) {
                var _postponedString_match;
                const match = (_postponedString_match = postponedString.match(/^([0-9]*)/)) == null ? void 0 : _postponedString_match[1];
                if (!match) {
                    throw Object.defineProperty(new Error(`Invariant: invalid postponed state ${JSON.stringify(postponedString)}`), "__NEXT_ERROR_CODE", {
                        value: "E314",
                        enumerable: false,
                        configurable: true
                    });
                }
                // This is the length of the replacements entries.
                const length = parseInt(match);
                const replacements = JSON.parse(postponedString.slice(match.length, // We then go to the end of the string.
                match.length + length));
                let postponed = postponedString.slice(match.length + length);
                for (const [segmentKey, [searchValue, dynamicParamType]] of replacements){
                    const { treeSegment: [, // This is the same value that'll be used in the postponed state
                    // as it's part of the tree data. That's why we use it as the
                    // replacement value.
                    value] } = (0, _getdynamicparam.getDynamicParam)(interpolatedParams, segmentKey, dynamicParamType, null, null // staticSiblings not needed for postponed state
                    );
                    postponed = postponed.replaceAll(searchValue, value);
                }
                return {
                    type: 2,
                    data: JSON.parse(postponed),
                    renderResumeDataCache
                };
            }
            return {
                type: 2,
                data: JSON.parse(postponedString),
                renderResumeDataCache
            };
        } catch (err) {
            console.error('Failed to parse postponed state', describePostponedStateParseFailure(state, err));
            return {
                type: 1,
                renderResumeDataCache
            };
        }
    } catch (err) {
        console.error('Failed to parse postponed state', describePostponedStateParseFailure(state, err));
        return {
            type: 1,
            renderResumeDataCache: (0, _resumedatacache.createRenderResumeDataCache)((0, _resumedatacache.createPrerenderResumeDataCache)())
        };
    }
}
/**
 * Derives content-free diagnostics about a postponed state that failed to
 * parse, so the error log is actionable without exposing the (potentially
 * sensitive) serialized contents. Every field is a size, a structural flag, or
 * an error code, never the state bytes themselves.
 *
 * The serialized layout is `<N>:<postponedString><base64-deflate cache>`, so
 * these fields distinguish the failure shapes:
 * - `postponedStringComplete: false`: the declared length `N` exceeds what
 * actually arrived, i.e. the postponed string itself was truncated.
 * - `errorCode: 'Z_BUF_ERROR'` with an empty or short tail: the
 * resume-data-cache tail was truncated (ran out of input while inflating).
 * - `errorCode: 'Z_DATA_ERROR'`: the tail bytes are corrupt, not merely short.
 * - `hasLengthPrefix: false`: the body had no `<N>:` prefix at all (e.g. empty
 * or otherwise malformed input).
 */ function describePostponedStateParseFailure(state, error) {
    const errnoError = error;
    const diagnostics = {
        stateLength: state.length,
        errorName: error instanceof Error ? error.name : typeof error,
        errorCode: errnoError == null ? void 0 : errnoError.code
    };
    const prefixMatch = state.match(/^([0-9]+):/);
    if (!prefixMatch) {
        diagnostics.hasLengthPrefix = false;
        return diagnostics;
    }
    const declaredPostponedLength = parseInt(prefixMatch[1], 10);
    const tailStart = prefixMatch[0].length + declaredPostponedLength;
    const tail = state.slice(tailStart);
    diagnostics.hasLengthPrefix = true;
    diagnostics.declaredPostponedLength = declaredPostponedLength;
    diagnostics.postponedStringComplete = state.length >= tailStart;
    diagnostics.resumeDataCacheTailLength = tail.length;
    diagnostics.resumeDataCacheTailIsNull = tail === 'null';
    return diagnostics;
}
function getPostponedFromState(state) {
    const [preludeState, postponed] = state.data;
    return {
        preludeState,
        postponed
    };
}
function isEmptyHTMLPrelude(state) {
    try {
        var _state_match;
        const lengthMatch = (_state_match = state.match(/^([0-9]*):/)) == null ? void 0 : _state_match[1];
        if (!lengthMatch) {
            return false;
        }
        const length = parseInt(lengthMatch);
        let postponedString = state.slice(lengthMatch.length + 1, lengthMatch.length + 1 + length);
        // `null` is the dynamic-data case (a full shell was produced).
        if (postponedString === 'null') {
            return false;
        }
        // An optional `<n><replacements>` prefix carries fallback route param
        // replacements; skip it to reach the `[preludeState, postponed]` data.
        if (/^[0-9]/.test(postponedString)) {
            var _postponedString_match;
            const replacementsLengthMatch = (_postponedString_match = postponedString.match(/^([0-9]*)/)) == null ? void 0 : _postponedString_match[1];
            if (!replacementsLengthMatch) {
                return false;
            }
            const replacementsLength = parseInt(replacementsLengthMatch);
            postponedString = postponedString.slice(replacementsLengthMatch.length + replacementsLength);
        }
        const data = JSON.parse(postponedString);
        return Array.isArray(data) && data[0] === 0;
    } catch  {
        return false;
    }
}

//# sourceMappingURL=postponed-state.js.map