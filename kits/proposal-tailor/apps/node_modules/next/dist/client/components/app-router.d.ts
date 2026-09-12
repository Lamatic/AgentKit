import React from 'react';
import { type AppRouterActionQueue, type GlobalErrorState } from './app-router-instance';
import type { StaticIndicatorState } from '../dev/hot-reloader/app/hot-reloader-app';
export default function AppRouter({ actionQueue, globalErrorState, webSocket, staticIndicatorState, }: {
    actionQueue: AppRouterActionQueue;
    globalErrorState: GlobalErrorState;
    webSocket?: WebSocket;
    staticIndicatorState?: StaticIndicatorState;
}): React.JSX.Element;
