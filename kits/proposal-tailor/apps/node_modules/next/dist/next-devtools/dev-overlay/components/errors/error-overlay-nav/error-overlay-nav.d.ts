import type { VersionInfo } from '../../../../../server/dev/parse-version-info';
import { type ErrorOverlayTabBarRenderer } from '../error-overlay-pagination/error-overlay-pagination';
import type { ReadyRuntimeError } from '../../../utils/get-error-by-type';
type ErrorOverlayNavProps = {
    runtimeErrors?: ReadyRuntimeError[];
    activeIdx?: number;
    setActiveIndex?: (index: number) => void;
    canGoPrevious?: boolean;
    canGoNext?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
    versionInfo?: VersionInfo;
    renderTabBar?: ErrorOverlayTabBarRenderer;
};
export declare function ErrorOverlayNav({ runtimeErrors, activeIdx, setActiveIndex, canGoPrevious, canGoNext, onPrevious, onNext, versionInfo, renderTabBar, }: ErrorOverlayNavProps): import("react").JSX.Element;
export declare const styles = "\n  [data-nextjs-error-overlay-nav] {\n    --stroke-color: var(--color-gray-400);\n    --background-color: var(--color-background-100);\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 8px;\n    flex-shrink: 0;\n\n    width: 100%;\n\n    position: relative;\n    z-index: 2;\n    outline: none;\n    translate: var(--next-dialog-border-width) var(--next-dialog-border-width);\n    max-width: var(--next-dialog-max-width);\n\n    .error-overlay-nav-item {\n      translate: calc(var(--next-dialog-border-width) * -1);\n      width: auto;\n      padding: 12px;\n      position: relative;\n\n      &[data-side='left'] {\n        padding-right: 0;\n      }\n\n      &[data-side='right'] {\n        padding-left: 0;\n      }\n    }\n  }\n\n  @media (max-width: 767px) {\n    [data-nextjs-error-overlay-nav] {\n      overflow-x: auto;\n      overflow-y: hidden;\n      scrollbar-width: none;\n      -ms-overflow-style: none;\n\n      &::-webkit-scrollbar {\n        display: none;\n      }\n    }\n  }\n\n";
export {};
