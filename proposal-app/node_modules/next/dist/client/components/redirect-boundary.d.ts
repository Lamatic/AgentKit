import React from 'react';
import type { AppRouterInstance } from '../../shared/lib/app-router-context.shared-runtime';
import { type RedirectType } from './redirect-error';
interface RedirectBoundaryProps {
    router: AppRouterInstance;
    children: React.ReactNode;
}
export declare class RedirectErrorBoundary extends React.Component<RedirectBoundaryProps, {
    redirect: string | null;
    redirectType: RedirectType | null;
}> {
    constructor(props: RedirectBoundaryProps);
    static getDerivedStateFromError(error: unknown): {
        redirect: null;
        redirectType: null;
    } | {
        redirect: string;
        redirectType: RedirectType;
    };
    render(): React.ReactNode;
}
export declare function RedirectBoundary({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export {};
