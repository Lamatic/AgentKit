import type { ReadyRuntimeError } from '../../../utils/get-error-by-type';
export type ErrorOverlayPaginationControls = {
    previousButton: React.ReactNode;
    nextButton: React.ReactNode;
    createCount: (activeIdx: number, total: number, isActive?: boolean) => React.ReactNode;
};
export type ErrorOverlayTabBarRenderer = (controls: ErrorOverlayPaginationControls) => React.ReactNode;
type ErrorPaginationProps = {
    runtimeErrors: ReadyRuntimeError[];
    activeIdx: number;
    onActiveIndexChange: (index: number) => void;
    canGoPrevious?: boolean;
    canGoNext?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
    renderTabBar?: ErrorOverlayTabBarRenderer;
};
export declare function ErrorOverlayPagination({ runtimeErrors, activeIdx, onActiveIndexChange, canGoPrevious, canGoNext, onPrevious, onNext, renderTabBar, }: ErrorPaginationProps): import("react").JSX.Element;
export declare const styles = "\n  .error-overlay-pagination {\n    -webkit-font-smoothing: antialiased;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    gap: 6px;\n    width: fit-content;\n  }\n\n  @media (max-width: 575px) {\n    .error-overlay-pagination {\n      gap: 4px;\n    }\n  }\n\n  .error-overlay-pagination-count {\n    display: flex;\n    align-items: center;\n    color: inherit;\n    text-align: center;\n    font-size: var(--size-13);\n    font-family: var(--font-mono);\n    line-height: var(--size-16);\n    font-variant-numeric: tabular-nums;\n  }\n\n  .error-overlay-pagination-button {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n\n    width: var(--size-24);\n    height: var(--size-24);\n    background: none;\n    flex-shrink: 0;\n\n    border: none;\n    border-radius: var(--rounded-full);\n\n    svg {\n      width: var(--size-16);\n      height: var(--size-16);\n    }\n\n    &:focus-visible {\n      outline: var(--focus-ring);\n    }\n\n    &:not(:disabled):hover {\n      background: var(--color-gray-alpha-100);\n    }\n\n    &:not(:disabled):active {\n      background: var(--color-gray-alpha-200);\n    }\n\n    &:disabled {\n      opacity: 0.5;\n      cursor: not-allowed;\n    }\n  }\n\n  .error-overlay-pagination-button-icon {\n    color: var(--color-gray-1000);\n  }\n";
export {};
