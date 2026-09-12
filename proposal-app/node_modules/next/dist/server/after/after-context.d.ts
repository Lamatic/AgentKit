import type { RequestLifecycleOpts } from '../base-server';
import type { AfterTask } from './after';
import type { WorkUnitStore } from '../app-render/work-unit-async-storage.external';
export type AfterContextOpts = {
    waitUntil: RequestLifecycleOpts['waitUntil'] | undefined;
    onClose: RequestLifecycleOpts['onClose'];
    onTaskError: RequestLifecycleOpts['onAfterTaskError'] | undefined;
};
export declare class AfterContext {
    private waitUntil;
    private onClose;
    private onTaskError;
    private isRequestClosed;
    private initialOnCloseError;
    private runCallbacksOnClosePromise;
    private callbackQueue;
    private workUnitStores;
    constructor({ waitUntil, onClose, onTaskError }: AfterContextOpts);
    after(task: AfterTask, workUnitStore: WorkUnitStore): void;
    private addThenable;
    private addCallback;
    private runCallbacksOnClose;
    private runCallbacks;
    private reportTaskError;
}
