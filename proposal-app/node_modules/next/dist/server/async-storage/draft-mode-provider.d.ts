import type { IncomingHttpHeaders } from 'http';
import type { ReadonlyRequestCookies } from '../web/spec-extension/adapters/request-cookies';
import type { ResponseCookies } from '../web/spec-extension/cookies';
import type { __ApiPreviewProps } from '../api-utils';
export declare class DraftModeProvider {
    constructor(previewProps: __ApiPreviewProps | undefined, headers: Headers | IncomingHttpHeaders, cookies: ReadonlyRequestCookies, mutableCookies: ResponseCookies);
    get isEnabled(): boolean;
    enable(): void;
    disable(): void;
}
