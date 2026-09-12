/**
 * Information about a running dev server, stored inside the lock file itself.
 * This is a common pattern in Unix applications (e.g., storing PID in a lockfile).
 */
export interface DevServerInfo {
    pid: number;
    port: number;
    hostname: string;
    appUrl: string;
    startedAt: number;
}
/**
 * Reads dev server info from a lockfile.
 * Returns undefined if the file doesn't exist or can't be parsed.
 *
 * Uses Node's fs.readFileSync which works on both Unix (with advisory flock)
 * and Windows (with FILE_SHARE_READ flag set by the lock holder).
 */
export declare function readLockfileContent(lockfilePath: string): string | undefined;
/**
 * Parses dev server info from lockfile content.
 */
export declare function parseDevServerInfo(content: string): DevServerInfo | undefined;
/**
 * A cross-platform on-disk best-effort advisory exclusive lockfile
 * implementation.
 *
 * On Windows, this opens a file in write mode with the `FILE_SHARE_WRITE` flag
 * unset, so it still allows reading the lockfile. This avoids breaking tools
 * that read the contents of `.next`.
 *
 * On POSIX platforms, this uses `flock()` via `std::fs::File::try_lock`:
 * https://doc.rust-lang.org/std/fs/struct.File.html#method.try_lock
 *
 * On WASM, a dummy implementation is used which always "succeeds" in acquiring
 * the lock.
 *
 * This provides a more idiomatic wrapper around the lockfile APIs exposed on
 * the native bindings object.
 *
 * If this lock is not explicitly closed with `unlock`, we will:
 * - If `unlockOnExit` is set (the default), it will make a best-effort attempt
 *   to unlock the lockfile using `process.on('exit', ...)`. This is preferrable
 *   on Windows where it may take some time after process exit for the operating
 *   system to clean up locks that are not explicitly released by the process.
 * - If we fail to ever release the lockfile, the operating system will clean up
 *   the lock and file descriptor upon process exit.
 */
export declare class Lockfile {
    /**
     * The underlying `Lockfile` object returned by the native bindings.
     *
     * This can be `undefined` on wasm, where we don't acquire a real lockfile.
     */
    private bindings;
    private nativeLockfile;
    private listener;
    private constructor();
    /**
     * Attempts to create or acquire an exclusive lockfile on disk. Lockfiles are
     * best-effort, depending on the platform.
     *
     * - If we fail to acquire the lock, we return `undefined`.
     * - If we're on wasm, this always returns a dummy `Lockfile` object.
     *
     * @param path - Path to the lock file
     * @param unlockOnExit - Whether to unlock the file on process exit
     * @param content - Optional content to write to the lockfile (e.g., JSON with server info)
     */
    static tryAcquire(path: string, unlockOnExit?: boolean, content?: string): Lockfile | undefined;
    /**
     * Attempts to create or acquire a lockfile using `Lockfile.tryAcquire`. If
     * that returns `undefined`, indicating that another process or caller has the
     * lockfile, then this will output an error message and exit the process with
     * a non-zero exit code.
     *
     * This will retry a small number of times. This can be useful when running
     * processes in a loop, e.g. if cleanup isn't fully synchronous due to child
     * parent/processes.
     *
     * @param path - Path to the lock file
     * @param processName - Name of the process for error messages (e.g., 'next dev')
     * @param unlockOnExit - Whether to unlock the file on process exit
     * @param content - Optional content to write to the lockfile (e.g., JSON with server info)
     * @param projectDir - Optional project directory for enhanced error messages
     * @param relativeDistDir - Optional relative dist directory path (e.g., '.next/dev')
     */
    static acquireWithRetriesOrExit(path: string, processName: string, unlockOnExit?: boolean, content?: string, projectDir?: string, relativeDistDir?: string): Promise<Lockfile>;
    /**
     * Releases the lockfile and closes the file descriptor.
     *
     * If this is not called, the lock will be released by the operating system
     * when the file handle is closed during process exit.
     */
    unlock(): Promise<void>;
    /**
     * A blocking version of `unlock`.
     */
    unlockSync(): void;
}
