/** Resolve a promise that times out after given amount of milliseconds. */
export declare function resolvePromiseWithTimeout<T>(p: Promise<T>, err: Error, devPromise: Promise<void> | undefined): Promise<T>;
