import { InvariantError } from '../../shared/lib/invariant-error';
export class LazyModule {
    constructor(load, onLoad){
        this.load = load;
        this.onLoad = onLoad;
        this.state = {
            status: 'uninitialized'
        };
    }
    loadIfNeeded() {
        if (this.state.status !== 'uninitialized') {
            return;
        }
        const result = this.load();
        if (!(result instanceof Promise)) {
            this.onLoad(result);
            this.state = {
                status: 'resolved',
                module: result
            };
            return;
        }
        this.state = {
            status: 'pending',
            promise: result.then((module)=>{
                this.onLoad(module);
                const resolved = {
                    status: 'resolved',
                    module
                };
                this.state = resolved;
                return resolved;
            }).catch((reason)=>{
                const rejected = {
                    status: 'rejected',
                    reason
                };
                this.state = rejected;
                return rejected;
            })
        };
    }
    async waitUntilLoaded() {
        this.loadIfNeeded();
        let state = this.state;
        if (state.status === 'pending') {
            state = await state.promise;
        }
        if (state.status === 'rejected') {
            throw state.reason;
        }
    }
    assertLoaded() {
        this.loadIfNeeded();
        const state = this.state;
        if (state.status === 'resolved') {
            return state.module;
        }
        if (state.status === 'rejected') {
            throw state.reason;
        }
        throw Object.defineProperty(new InvariantError('The lazy module is still loading. It must be awaited with `waitUntilLoaded()` before it can be accessed.'), "__NEXT_ERROR_CODE", {
            value: "E1421",
            enumerable: false,
            configurable: true
        });
    }
}

//# sourceMappingURL=lazy-module.js.map