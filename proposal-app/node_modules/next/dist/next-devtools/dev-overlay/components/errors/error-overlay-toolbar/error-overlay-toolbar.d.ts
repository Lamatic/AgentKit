import type { DebugInfo } from '../../../../shared/types';
type ErrorOverlayToolbarProps = {
    error: Error;
    debugInfo: DebugInfo | undefined;
    feedbackButton?: React.ReactNode;
    generateErrorInfo: () => Promise<string>;
};
export declare function ErrorOverlayToolbar({ error, debugInfo, feedbackButton, generateErrorInfo, }: ErrorOverlayToolbarProps): import("react").JSX.Element;
export declare const styles = "\n  .error-overlay-toolbar {\n    display: flex;\n    gap: 6px;\n  }\n\n  @media (max-width: 575px) {\n    .error-overlay-toolbar {\n      gap: 4px;\n    }\n  }\n\n  .nodejs-inspector-button,\n  .copy-error-button,\n  .docs-link-button {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n\n    width: var(--size-24);\n    height: var(--size-24);\n    background: none;\n    border: none;\n    border-radius: var(--rounded-full);\n\n    svg {\n      width: var(--size-14);\n      height: var(--size-14);\n    }\n\n    &:focus {\n      outline: var(--focus-ring);\n    }\n\n    &:not(:disabled):hover {\n      background: var(--color-gray-alpha-100);\n    }\n\n    &:not(:disabled):active {\n      background: var(--color-gray-alpha-200);\n    }\n\n    &:disabled {\n      opacity: 0.5;\n      cursor: not-allowed;\n    }\n  }\n\n  .nodejs-inspector-button[data-pending='true'] {\n    cursor: wait;\n  }\n\n  .error-overlay-toolbar-button-icon {\n    color: var(--color-gray-900);\n  }\n";
export {};
