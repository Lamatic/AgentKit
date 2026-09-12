import type { IncomingMessage } from 'http';
import type { BaseNextRequest } from '../../base-http';
export declare function applyAppPageRscRequestMetaFromHeaders(req: Pick<IncomingMessage | BaseNextRequest, 'headers'>): void;
export declare function normalizeAppPageRequestUrl(req: Pick<IncomingMessage | BaseNextRequest, 'url'>, pathname: string): void;
