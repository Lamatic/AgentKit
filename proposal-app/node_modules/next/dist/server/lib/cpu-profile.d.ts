/**
 * Save the CPU profile to disk.
 *
 * This is synchronous despite the callback-based API because inspector's
 * session.post() executes its callback synchronously when connected to
 * the same process (via session.connect()).
 */
export declare function saveCpuProfile(): void;
