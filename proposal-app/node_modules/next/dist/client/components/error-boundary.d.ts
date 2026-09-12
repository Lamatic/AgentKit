import React, { type JSX } from 'react';
import { type AppRouterInstance } from '../../shared/lib/app-router-context.shared-runtime';
export type ErrorInfo = {
    error: unknown;
    reset: () => void;
    retry: () => void;
};
export type ErrorComponent = React.ComponentType<ErrorInfo>;
export interface ErrorBoundaryProps {
    children?: React.ReactNode;
    errorComponent: ErrorComponent | undefined;
    errorStyles?: React.ReactNode | undefined;
    errorScripts?: React.ReactNode | undefined;
}
interface ErrorBoundaryHandlerProps extends ErrorBoundaryProps {
    pathname: string | null;
    errorComponent: ErrorComponent;
}
interface ErrorBoundaryHandlerState {
    error: null | {
        thrownValue: unknown;
    };
    previousPathname: string | null;
}
export declare class ErrorBoundaryHandler extends React.Component<ErrorBoundaryHandlerProps, ErrorBoundaryHandlerState> {
    static contextType: React.Context<AppRouterInstance | null>;
    context: AppRouterInstance | null;
    constructor(props: ErrorBoundaryHandlerProps);
    static getDerivedStateFromError(thrownValue: unknown): Partial<ErrorBoundaryHandlerState>;
    static getDerivedStateFromProps(props: ErrorBoundaryHandlerProps, state: ErrorBoundaryHandlerState): ErrorBoundaryHandlerState | null;
    reset: () => void;
    retry: () => void;
    render(): React.ReactNode;
}
/**
 * Handles errors through `getDerivedStateFromError`.
 * Renders the provided error component and provides a way to `reset` the error boundary state.
 */
/**
 * Renders error boundary with the provided "errorComponent" property as the fallback.
 * If no "errorComponent" property is provided it renders the children without an error boundary.
 */
export declare function ErrorBoundary({ errorComponent, errorStyles, errorScripts, children, }: ErrorBoundaryProps & {
    children: React.ReactNode;
}): JSX.Element;
export {};
