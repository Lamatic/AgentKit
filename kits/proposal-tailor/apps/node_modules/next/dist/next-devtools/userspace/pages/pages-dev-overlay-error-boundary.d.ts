import React from 'react';
type PagesDevOverlayErrorBoundaryProps = {
    children?: React.ReactNode;
};
type PagesDevOverlayErrorBoundaryState = {
    hasError: boolean;
};
export declare class PagesDevOverlayErrorBoundary extends React.PureComponent<PagesDevOverlayErrorBoundaryProps, PagesDevOverlayErrorBoundaryState> {
    state: {
        hasError: boolean;
    };
    static getDerivedStateFromError(_: unknown): Partial<PagesDevOverlayErrorBoundaryState>;
    render(): React.ReactNode;
}
export {};
