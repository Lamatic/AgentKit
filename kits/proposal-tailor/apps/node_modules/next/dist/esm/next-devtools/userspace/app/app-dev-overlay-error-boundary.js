import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { PureComponent, startTransition } from 'react';
import { dispatcher } from 'next/dist/compiled/next-devtools';
import { RuntimeErrorHandler } from '../../../client/dev/runtime-error-handler';
import { ErrorBoundary } from '../../../client/components/error-boundary';
import DefaultGlobalError from '../../../client/components/builtin/global-error';
import { SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE } from './segment-explorer-node';
import { AppRouterContext } from '../../../shared/lib/app-router-context.shared-runtime';
import isError from '../../../lib/is-error';
function ErroredHtml({ globalError: [GlobalError, globalErrorStyles], thrownValue, reset, retry }) {
    return /*#__PURE__*/ _jsxs(ErrorBoundary, {
        errorComponent: DefaultGlobalError,
        children: [
            globalErrorStyles,
            /*#__PURE__*/ _jsx(GlobalError, {
                error: thrownValue,
                reset: reset,
                retry: retry
            })
        ]
    });
}
export class AppDevOverlayErrorBoundary extends PureComponent {
    static{
        this.contextType = AppRouterContext;
    }
    static getDerivedStateFromError(thrownValue) {
        RuntimeErrorHandler.hadRuntimeError = true;
        return {
            error: {
                thrownValue
            }
        };
    }
    componentDidCatch(err) {
        if (process.env.NODE_ENV === 'development' && isError(err) && err.message === SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE) {
            return;
        }
        dispatcher.openErrorOverlay();
    }
    render() {
        const { children, globalError } = this.props;
        const { error } = this.state;
        if (error !== null) {
            const thrownValue = error.thrownValue;
            return /*#__PURE__*/ _jsx(ErroredHtml, {
                globalError: globalError,
                thrownValue: thrownValue,
                reset: this.reset,
                retry: this.retry
            });
        }
        return children;
    }
    constructor(...args){
        super(...args), this.state = {
            error: null
        }, this.retry = ()=>{
            startTransition(()=>{
                this.context?.refresh();
                this.reset();
            });
        }, this.reset = ()=>{
            this.setState({
                error: null
            });
        };
    }
}

//# sourceMappingURL=app-dev-overlay-error-boundary.js.map