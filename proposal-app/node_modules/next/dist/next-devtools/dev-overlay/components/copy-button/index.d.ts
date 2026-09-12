import * as React from 'react';
type CopyButtonProps = React.HTMLProps<HTMLButtonElement> & {
    actionLabel: string;
    successLabel: string;
    icon?: React.ReactNode;
    /** When true, render the action/success label next to the icon. */
    showLabel?: boolean;
};
export declare function CopyButton(props: CopyButtonProps & {
    content?: string;
    getContent?: () => Promise<string>;
}): React.JSX.Element;
export declare function CopyIcon(props: React.SVGProps<SVGSVGElement>): React.JSX.Element;
export declare const COPY_BUTTON_STYLES = "\n  .nextjs-data-copy-button {\n    color: inherit;\n\n    svg {\n      width: var(--size-16);\n      height: var(--size-16);\n    }\n  }\n  .nextjs-data-copy-button[aria-disabled=\"true\"] {\n    background-color: var(--color-gray-100);\n    cursor: not-allowed;\n  }\n  .nextjs-data-copy-button[data-pending=\"true\"] {\n    cursor: wait;\n  }\n  .nextjs-data-copy-button--initial:hover:not([aria-disabled=\"true\"]) {\n    cursor: pointer;\n  }\n  .nextjs-data-copy-button--error:not([aria-disabled=\"true\"]),\n  .nextjs-data-copy-button--error:hover:not([aria-disabled=\"true\"]) {\n    color: var(--color-ansi-red);\n  }\n  .nextjs-data-copy-button--success:not([aria-disabled=\"true\"]) {\n    color: var(--color-gray-900);\n  }\n";
export {};
