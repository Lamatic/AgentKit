export type SyncIOApiType = 'time' | 'random' | 'crypto';
export declare function createSyncIOError(route: string, expression: string, type: SyncIOApiType): Error;
export declare function createSyncIORuntimeError(route: string, expression: string, type: SyncIOApiType): Error;
export declare function createSyncIOClientError(route: string, expression: string, type: SyncIOApiType): Error;
