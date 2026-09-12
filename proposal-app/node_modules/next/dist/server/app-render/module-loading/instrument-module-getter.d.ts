/**
 * Wraps a module getter from the generated loader tree code so that the
 * result of an async module (e.g. due to a top-level await) is tracked as a
 * pending import, which the cache warming phase of a prerender waits for.
 * Both bundlers emit this around every module getter in the loader tree.
 */
export declare function instrumentModuleGetter<TModule>(getter: () => TModule): () => TModule;
