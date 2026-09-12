import { type NextIncomingMessage } from '../request-meta';
declare const PATCHED_SET_HEADER: unique symbol;
type PatchableResponse = {
    setHeader(key: string, value: string | string[]): PatchableResponse;
    headersSent?: boolean;
    [PATCHED_SET_HEADER]?: true;
};
/**
 * Ensure cookies set in middleware are merged and not overridden by API
 * routes/getServerSideProps.
 *
 * @param req Incoming request
 * @param res Outgoing response
 */
export declare function patchSetHeaderWithCookieSupport(req: NextIncomingMessage, res: PatchableResponse): void;
export {};
