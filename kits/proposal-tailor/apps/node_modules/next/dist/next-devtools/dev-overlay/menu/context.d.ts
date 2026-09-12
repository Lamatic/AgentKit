import { type Dispatch, type SetStateAction } from 'react';
export type PanelStateKind = 'preferences' | 'route-type' | 'segment-explorer' | 'panel-selector' | 'instant-navs' | 'request-insights' | 'turbo-info' | 'cache-disabled' | 'cold-cache';
export declare const PanelRouterContext: import("react").Context<{
    panel: PanelStateKind | null;
    setPanel: Dispatch<SetStateAction<PanelStateKind | null>>;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    selectedIndex: number;
    setSelectedIndex: Dispatch<SetStateAction<number>>;
}>;
export declare const usePanelRouterContext: () => {
    panel: PanelStateKind | null;
    setPanel: Dispatch<SetStateAction<PanelStateKind | null>>;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    selectedIndex: number;
    setSelectedIndex: Dispatch<SetStateAction<number>>;
};
