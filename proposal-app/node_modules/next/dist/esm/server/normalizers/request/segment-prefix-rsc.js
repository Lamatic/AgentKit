import { RSC_SEGMENT_SUFFIX, RSC_SEGMENTS_DIR_SUFFIX } from '../../../lib/constants';
import { escapeStringRegexp } from '../../../shared/lib/escape-regexp';
const PATTERN = new RegExp(`^(/.*)${escapeStringRegexp(RSC_SEGMENTS_DIR_SUFFIX)}(/.*)${escapeStringRegexp(RSC_SEGMENT_SUFFIX)}$`);
export class SegmentPrefixRSCPathnameNormalizer {
    match(pathname) {
        return PATTERN.test(pathname);
    }
    extract(pathname) {
        const match = pathname.match(PATTERN);
        if (!match) return null;
        return {
            originalPathname: match[1],
            segmentPath: match[2]
        };
    }
    normalize(pathname) {
        const match = this.extract(pathname);
        if (!match) return pathname;
        return match.originalPathname;
    }
}

//# sourceMappingURL=segment-prefix-rsc.js.map