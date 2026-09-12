import type { InitialRSCPayload } from '../../../shared/lib/app-router-types';
import type { AppRouterState } from './router-reducer-types';
export interface InitialRouterStateParameters {
    navigatedAt: number;
    initialRSCPayload: InitialRSCPayload;
    initialFlightStreamForCache?: ReadableStream<Uint8Array> | null;
    location: Location | null;
}
export declare function createInitialRouterState({ navigatedAt, initialRSCPayload, initialFlightStreamForCache, location, }: InitialRouterStateParameters): AppRouterState;
