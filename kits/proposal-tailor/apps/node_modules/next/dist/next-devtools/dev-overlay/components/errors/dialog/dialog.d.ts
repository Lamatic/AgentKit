type ErrorOverlayDialogProps = {
    children?: React.ReactNode;
    onClose?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;
export declare function ErrorOverlayDialog({ children, onClose, ...props }: ErrorOverlayDialogProps): import("react").JSX.Element;
export declare const DIALOG_STYLES = "\n  .error-overlay-dialog-container {\n    display: flex;\n    flex-direction: column;\n    background: var(--color-background-100);\n    background-clip: padding-box;\n    border-radius: var(--next-dialog-radius);\n    box-shadow: var(--shadow-menu);\n    position: relative;\n    overflow: hidden;\n  }\n\n  .error-overlay-dialog-scroll {\n    overflow-y: auto;\n    scrollbar-gutter: stable;\n    height: 100%;\n  }\n";
export {};
