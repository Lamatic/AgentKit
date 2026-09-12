import type { ReactNode } from 'react';
type CodeFrameShellProps = {
    header: ReactNode;
    onOpen?: () => void;
    openLabel?: string;
    children: ReactNode;
};
export declare function CodeFrameShell({ header, onOpen, openLabel, children, }: CodeFrameShellProps): import("react").JSX.Element;
export {};
