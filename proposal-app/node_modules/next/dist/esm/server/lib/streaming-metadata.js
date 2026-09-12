import { HTML_LIMITED_BOT_UA_RE_STRING } from '../../shared/lib/router/utils/is-bot';
let cachedPattern;
let cachedRegex;
export function shouldServeStreamingMetadata(userAgent, htmlLimitedBots) {
    const pattern = htmlLimitedBots || HTML_LIMITED_BOT_UA_RE_STRING;
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