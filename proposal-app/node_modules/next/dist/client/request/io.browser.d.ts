/**
 * Browser implementation of io(). On the client there is no
 * prerender context so we always resolve immediately.
 */
export declare function io(): Promise<void>;
