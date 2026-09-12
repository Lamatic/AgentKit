import React, { PureComponent } from 'react';
import type { GlobalErrorState } from '../../../client/components/app-router-instance';
import { type AppRouterInstance } from '../../../shared/lib/app-router-context.shared-runtime';
type AppDevOverlayErrorBoundaryProps = {
    children: React.ReactNode;
    globalError: GlobalErrorState;
};
type AppDevOverlayErrorBoundaryState = {
    error: null | {
        thrownValue: unknown;
    };
};
export declare class AppDevOverlayErrorBoundary extends PureComponent<AppDevOverlayErrorBoundaryProps, AppDevOverlayErrorBoundaryState> {
    static contextType: React.Context<AppRouterInstance | null>;
    context: AppRouterInstance | null;
    state: AppDevOverlayErrorBoundaryState;
    static getDerivedStateFromError(thrownValue: Error): Partial<AppDevOverlayErrorBoundaryState>;
    componentDidCatch(err: unknown): void;
    retry: () => void;
    reset: () => void;
    render(): string | number | bigint | boolean | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | React.ReactPortal | Iterable<React.ReactNode> | null | undefined> | React.JSX.Element | null | undefined;
}
export {};
