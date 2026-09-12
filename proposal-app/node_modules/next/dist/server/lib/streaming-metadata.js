"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "shouldServeStreamingMetadata", {
    enumerable: true,
    get: function() {
        return shouldServeStreamingMetadata;
    }
});
const _isbot = require("../../shared/lib/router/utils/is-bot");
let cachedPattern;
let cachedRegex;
function shouldServeStreamingMetadata(userAgent, htmlLimitedBots) {
    const pattern = htmlLimitedBots || _isbot.HTML_LIMITED_BOT_UA_RE_STRING;
    if (cachedPattern !== pattern) {
        cachedPattern = pattern;
        cachedRegex = new RegExp(pattern, 'i');
    }
    // Only block metadata for HTML-limited bots
    if (userAgent && cachedRegex.test(userAgent)) {
        return false;
    }
    return true;
}

//# sourceMappingURL=streaming-metadata.js.map