export declare class LazyModule<TModule> {
    private readonly load;
    private readonly onLoad;
    private state;
    constructor(load: () => TModule | Promise<TModule>, onLoad: (module: TModule) => void);
    loadIfNeeded(): void;
    waitUntilLoaded(): Promise<void>;
    assertLoaded(): TModule;
}
