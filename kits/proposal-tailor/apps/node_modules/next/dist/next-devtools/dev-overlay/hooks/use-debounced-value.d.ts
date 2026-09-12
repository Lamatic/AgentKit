interface Options<T> {
    /**
     * Optional predicate evaluated when `value` changes. If it returns `true`
     * for the current transition, the new value is committed synchronously,
     * bypassing the debounce. Useful for "smooth subsequent updates but never
     * delay the first one" patterns.
     *
     * Should be a stable reference (module-level or `useCallback`-wrapped) to
     * avoid re-running the effect on every render.
     */
    leading?: (prev: T, next: T) => boolean;
}
/**
 * Returns a trailing-edge debounced version of `value`. When `value` changes,
 * the returned value is updated only after `ms` has elapsed without further
 * changes.
 *
 * The first value is committed synchronously. Subsequent changes are delayed
 * by `ms` unless `options.leading` returns `true` for the transition.
 */
export declare function useDebouncedValue<T>(value: T, ms: number, options?: Options<T>): T;
export {};
