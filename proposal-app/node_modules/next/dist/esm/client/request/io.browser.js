// A fulfilled thenable that React can unwrap synchronously via `use()` without
// ever suspending. Reusing a single instance avoids allocating on every call.
const resolvedIOPromise = Promise.resolve(undefined);
resolvedIOPromise.status = 'fulfilled';
resolvedIOPromise.value = undefined;
/**
 * Browser implementation of io(). On the client there is no
 * prerender context so we always resolve immediately.
 */ export function io() {
    return resolvedIOPromise;
}

//# sourceMappingURL=io.browser.js.map