import './app-globals';
import type { ClientInstrumentationModules } from './router-transition-types';
type FlightSegment = [isBootStrap: 0] | [isNotBootstrap: 1, responsePartial: string] | [isFormState: 2, formState: any] | [isBinary: 3, responseBase64Partial: string];
type NextFlight = Omit<Array<FlightSegment>, 'push'> & {
    push: (seg: FlightSegment) => void;
};
declare global {
    interface Window {
        /**
         * request ID, dev-only
         */
        __next_r?: string;
        __next_f: NextFlight;
    }
}
export declare function hydrate(instrumentationModules: ClientInstrumentationModules, assetPrefix: string): Promise<void>;
export {};
