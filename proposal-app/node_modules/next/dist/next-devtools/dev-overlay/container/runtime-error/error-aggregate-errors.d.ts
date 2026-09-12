import React from 'react';
import type { ReadyErrorCause } from '../../utils/get-error-by-type';
interface ErrorAggregateErrorsProps {
    errors: ReadyErrorCause[];
    dialogResizerRef: React.RefObject<HTMLDivElement | null>;
}
export declare function ErrorAggregateErrors({ errors, dialogResizerRef, }: ErrorAggregateErrorsProps): React.JSX.Element;
export declare const styles = "\n  [data-nextjs-error-aggregate-error] {\n    border-top: 1px solid var(--color-gray-400);\n    margin-top: 16px;\n    padding-top: 16px;\n  }\n\n  .error-aggregate-error-header {\n    display: flex;\n    align-items: center;\n    margin-bottom: 8px;\n  }\n\n  .error-aggregate-error-label {\n    padding: 2px 6px;\n    margin: 0;\n    border-radius: var(--rounded-md-2);\n    background: var(--color-red-100);\n    font-weight: 600;\n    font-size: var(--size-12);\n    color: var(--color-red-900);\n    font-family: var(--font-stack-monospace);\n    line-height: var(--size-20);\n  }\n\n  .error-aggregate-error-message {\n    margin: 0;\n    margin-left: 4px;\n    color: var(--color-red-900);\n    font-weight: 500;\n    font-size: var(--size-16);\n    letter-spacing: -0.32px;\n    line-height: var(--size-24);\n    overflow-wrap: break-word;\n    white-space: pre-wrap;\n  }\n";
export {};
