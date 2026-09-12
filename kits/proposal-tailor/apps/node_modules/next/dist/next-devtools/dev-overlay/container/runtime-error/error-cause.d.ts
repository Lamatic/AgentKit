import React from 'react';
import type { ReadyErrorCause } from '../../utils/get-error-by-type';
type ErrorCauseProps = {
    cause: ReadyErrorCause;
    dialogResizerRef: React.RefObject<HTMLDivElement | null>;
};
export declare function ErrorCause({ cause, dialogResizerRef }: ErrorCauseProps): React.JSX.Element;
export declare const styles = "\n  [data-nextjs-error-cause] {\n    border-top: 1px solid var(--color-gray-400);\n    margin-top: 16px;\n    padding-top: 16px;\n  }\n\n  .error-cause-header {\n    display: flex;\n    align-items: center;\n    margin-bottom: 8px;\n  }\n\n  .error-cause-label {\n    padding: 2px 6px;\n    margin: 0;\n    border-radius: var(--rounded-md-2);\n    background: var(--color-red-100);\n    font-weight: 600;\n    font-size: var(--size-12);\n    color: var(--color-red-900);\n    font-family: var(--font-stack-monospace);\n    line-height: var(--size-20);\n  }\n\n  .error-cause-message {\n    margin: 0 0 16px 4px;\n    color: var(--color-red-900);\n    font-weight: 500;\n    font-size: var(--size-16);\n    letter-spacing: -0.32px;\n    line-height: var(--size-24);\n    overflow-wrap: break-word;\n    white-space: pre-wrap;\n  }\n";
export {};
