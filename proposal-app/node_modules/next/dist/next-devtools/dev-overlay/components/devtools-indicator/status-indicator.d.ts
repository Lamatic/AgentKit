import type { CacheIndicatorState } from '../../cache-indicator';
export declare enum Status {
    None = "none",
    Rendering = "rendering",
    RenderingColdCache = "rendering-cold-cache",
    RenderingCacheDisabled = "rendering-cache-disabled",
    Compiling = "compiling"
}
export declare function getCurrentStatus(buildingIndicator: boolean, renderingIndicator: boolean, cacheIndicator: CacheIndicatorState): Status;
interface StatusIndicatorProps {
    status: Status;
    onClick?: () => void;
}
export declare function StatusIndicator({ status, onClick }: StatusIndicatorProps): import("react").JSX.Element | null;
export {};
