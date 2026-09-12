import React from 'react';
import type { DebugInfo } from '../../shared/types';
import { type ErrorOverlayLayoutProps } from '../components/errors/error-overlay-layout/error-overlay-layout';
import type { ReadyRuntimeError } from '../utils/get-error-by-type';
import type { ErrorBaseProps } from '../components/errors/error-overlay/error-overlay';
import type { HydrationErrorState } from '../../shared/hydration-error';
import { type GuidanceKind, type GuidanceVariant } from '../components/instant/instant-guidance';
interface ErrorsProps extends ErrorBaseProps {
    getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null;
    runtimeErrors: ReadyRuntimeError[];
    debugInfo: DebugInfo;
    onClose: () => void;
}
export declare function getErrorTypeLabel(error: Error, type: ReadyRuntimeError['type'], errorDetails: ErrorDetails): ErrorOverlayLayoutProps['errorType'];
type ErrorDetails = NoErrorDetails | HydrationErrorDetails | BlockingRouteErrorDetails | ClientHookErrorDetails | DynamicMetadataErrorDetails | DynamicViewportErrorDetails | SyncIOErrorDetails | SyncIOClientErrorDetails | UnrenderedSegmentErrorDetails | LinkPrefetchPartialErrorDetails;
type NoErrorDetails = {
    type: 'empty';
};
type HydrationErrorDetails = {
    type: 'hydration';
    warning: string | null;
    notes: string | null;
    reactOutputComponentDiff: string | null;
};
type BlockingRouteErrorDetails = {
    type: 'blocking-route';
    variant: GuidanceVariant;
    inNavigation: boolean;
};
type ClientHookErrorDetails = {
    type: 'client-hook';
    expression: string;
};
type DynamicMetadataErrorDetails = {
    type: 'dynamic-metadata';
    variant: GuidanceVariant;
};
type DynamicViewportErrorDetails = {
    type: 'dynamic-viewport';
    variant: GuidanceVariant;
};
type SyncIOErrorDetails = {
    type: 'sync-io';
    cause: string;
};
type SyncIOClientErrorDetails = {
    type: 'sync-io-client';
    cause: string;
};
type UnrenderedSegmentErrorDetails = {
    type: 'unrendered-segment';
    route: string;
    files: string[];
};
type LinkPrefetchPartialErrorDetails = {
    type: 'link-prefetch-partial';
    pathname: string;
};
export declare function useErrorDetails(error: Error | undefined, getSquashedHydrationErrorDetails: (error: Error) => HydrationErrorState | null): ErrorDetails;
export declare function deriveCauseFromCodeFrame(kind: GuidanceKind, variant: GuidanceVariant, codeFrame: string | null | undefined): 'connection' | undefined;
export declare function getGuidanceVariant(message: string): GuidanceVariant;
export declare function isSyncIOError(message: string): boolean;
export declare function isSyncIOClientError(message: string): boolean;
export declare function isBlockingRouteInNavError(message: string): boolean;
export declare function getBlockingRouteErrorDetails(error: Error): null | ErrorDetails;
export declare function getUnrenderedSegmentErrorDetails(error: Error): UnrenderedSegmentErrorDetails | null;
export declare function getLinkPrefetchPartialErrorDetails(error: Error): LinkPrefetchPartialErrorDetails | null;
export declare function isInstantNavigationError(error: Error): boolean;
export type ErrorTab = 'errors' | 'instant';
export declare function ErrorTabBar({ activeTab, onTabChange, errorCount, instantCount, errorActiveIdx, instantActiveIdx, previousButton, nextButton, createCount, }: {
    activeTab: ErrorTab;
    onTabChange: (tab: ErrorTab) => void;
    errorCount: number;
    instantCount: number;
    errorActiveIdx: number;
    instantActiveIdx: number;
    previousButton: React.ReactNode;
    nextButton: React.ReactNode;
    createCount: (activeIdx: number, total: number, isActive?: boolean) => React.ReactNode;
}): React.JSX.Element;
export declare function Errors({ getSquashedHydrationErrorDetails, runtimeErrors, debugInfo, onClose, ...props }: ErrorsProps): React.JSX.Element | null;
export declare const styles = "\n  .nextjs-error-with-static {\n    bottom: calc(16px * 4.5);\n  }\n  p.nextjs__container_errors__link {\n    font-size: var(--size-14);\n  }\n  p.nextjs__container_errors__notes {\n    color: var(--color-stack-notes);\n    font-size: var(--size-14);\n    line-height: 1.5;\n  }\n  .nextjs-container-errors-body > h2:not(:first-child) {\n    margin-top: calc(16px + 8px);\n  }\n  .nextjs-container-errors-body > h2 {\n    color: var(--color-title-color);\n    margin-bottom: 8px;\n    font-size: var(--size-20);\n  }\n  .nextjs-toast-errors-parent {\n    cursor: pointer;\n    transition: transform 0.2s ease;\n  }\n  .nextjs-toast-errors-parent:hover {\n    transform: scale(1.1);\n  }\n  .nextjs-toast-errors {\n    display: flex;\n    align-items: center;\n    justify-content: flex-start;\n  }\n  .nextjs-toast-errors > svg {\n    margin-right: 8px;\n  }\n  .nextjs-toast-hide-button {\n    margin-left: 24px;\n    border: none;\n    background: none;\n    color: var(--color-ansi-bright-white);\n    padding: 0;\n    transition: opacity 0.25s ease;\n    opacity: 0.7;\n  }\n  .nextjs-toast-hide-button:hover {\n    opacity: 1;\n  }\n  .nextjs__container_errors__error_title {\n    display: flex;\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 8px;\n    position: relative;\n  }\n  .nextjs__container_errors__error_title__row {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    flex-wrap: wrap;\n    gap: 8px;\n    width: 100%;\n  }\n  .error-overlay-notes-container {\n    margin: 8px 2px;\n  }\n  .error-overlay-notes-container p {\n    white-space: pre-wrap;\n  }\n  .external-link, .external-link:hover {\n    color:inherit;\n  }\n\n  .error-overlay-tab-bar {\n    display: flex;\n    gap: 6px;\n    translate: var(--next-dialog-border-width) 0;\n    max-width: var(--next-dialog-max-width);\n    width: 100%;\n    position: relative;\n    z-index: 1;\n  }\n\n  .error-overlay-tab {\n    display: flex;\n    align-items: center;\n    gap: 2px;\n    padding: 0 4px;\n    border: none;\n    background: none;\n    color: var(--color-gray-800);\n    font-size: var(--size-13);\n    font-family: var(--font-stack-sans);\n    cursor: pointer;\n    position: relative;\n    transition: color 0.15s ease;\n    border-radius: var(--rounded-md);\n\n    &:hover:not(:disabled) {\n      color: var(--color-gray-1000);\n    }\n\n    &[data-active='true'] {\n      color: var(--color-gray-1000);\n      font-weight: 500;\n    }\n\n    &:disabled {\n      opacity: 0.4;\n      cursor: default;\n    }\n\n    &:focus-visible {\n      outline: var(--focus-ring);\n      outline-offset: 2px;\n    }\n  }\n\n  .error-overlay-tab-count {\n    display: flex;\n    align-items: center;\n    color: inherit;\n\n    &[data-active='true'] {\n      .error-overlay-pagination-count {\n        font-weight: 500;\n      }\n    }\n  }\n\n";
export {};
