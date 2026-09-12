import { webpack } from 'next/dist/compiled/webpack/webpack';
import type { NextConfigComplete } from '../../../server/config-shared';
interface DeferredEntriesPluginOptions {
    dev: boolean;
    config: NextConfigComplete;
    deferredEntrypoints?: webpack.EntryObject;
}
/**
 * A webpack plugin that handles deferred entries by:
 * 1. Accepting deferred entrypoints separately from the main config
 * 2. After non-deferred entries are compiled, calling the onBeforeDeferredEntries callback
 * 3. Then adding and compiling the deferred entries within the same compilation
 *
 * This approach avoids module ID conflicts that would occur with separate compilations.
 */
export declare class DeferredEntriesPlugin {
    private onBeforeDeferredEntries?;
    private deferredEntrypoints?;
    private callbackCalled;
    constructor(options: DeferredEntriesPluginOptions);
    apply(compiler: webpack.Compiler): void;
}
export {};
