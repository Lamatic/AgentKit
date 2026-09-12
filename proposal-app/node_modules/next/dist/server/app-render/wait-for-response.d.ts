import type { ServerResponse } from 'node:http';
/**
 * Waits for a Node response to finish normally. Returns false when the
 * connection closes before the response has finished.
 */
export declare function waitForResponseToFinish(response: ServerResponse): Promise<boolean>;
