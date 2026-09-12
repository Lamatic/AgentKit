import React from 'react';
interface DevToolsHeaderProps {
    title: React.ReactNode;
    children?: React.ReactNode;
    onClose?: () => void;
}
export declare function DevToolsHeader({ title, children, onClose, ref, }: DevToolsHeaderProps & {
    ref?: React.Ref<HTMLDivElement>;
}): React.JSX.Element;
export {};
