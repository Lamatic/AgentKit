import type { FlightRouterState } from './app-router-types';
export type InstantNavCookieData = {
    state: 'pending';
} | {
    state: 'mpa';
} | {
    state: 'spa';
    fromTree: FlightRouterState;
    toTree: FlightRouterState | null;
};
export declare function parseInstantNavCookieValue(raw: string): InstantNavCookieData;
