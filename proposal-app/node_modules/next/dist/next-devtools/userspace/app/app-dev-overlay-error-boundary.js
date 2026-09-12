"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppDevOverlayErrorBoundary", {
    enumerable: true,
    get: function() {
        return AppDevOverlayErrorBoundary;
    }
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _interop_require_wildcard = require("@swc/helpers/_/_interop_require_wildcard");
const _jsxruntime = require("react/jsx-runtime");
const _react = /*#__PURE__*/ _interop_require_wildcard._(require("react"));
const _nextdevtools = require("next/dist/compiled/next-devtools");
const _runtimeerrorhandler = require("../../../client/dev/runtime-error-handler");
const _errorboundary = require("../../../client/components/error-boundary");
const _globalerror = /*#__PURE__*/ _interop_require_default._(require("../../../client/components/builtin/global-error"));
const _segmentexplorernode = require("./segment-explorer-node");
const _approutercontextsharedruntime = require("../../../shared/lib/app-router-context.shared-runtime");
const _iserror = /*#__PURE__*/ _interop_require_default._(require("../../../lib/is-error"));
function ErroredHtml({ globalError: [GlobalError, globalErrorStyles], thrownValue, reset, retry }) {
    return /*#__PURE__*/ (0, _jsxruntime.jsxs)(_errorboundary.ErrorBoundary, {
        errorComponent: _globalerror.default,
        children: [
            globalErrorStyles,
            /*#__PURE__*/ (0, _jsxruntime.jsx)(GlobalError, {
                error: thrownValue,
                reset: reset,
                retry: retry
            })
        ]
    });
}
class AppDevOverlayErrorBoundary extends _react.PureComponent {
    static{
        this.contextType = _approutercontextsharedruntime.AppRouterContext;
    }
    static getDerivedStateFromError(thrownValue) {
        _runtimeerrorhandler.RuntimeErrorHandler.hadRuntimeError = true;
        return {
            error: {
                thrownValue
            }
        };
    }
    componentDidCatch(err) {
        if (process.env.NODE_ENV === 'development' && (0, _iserror.default)(err) && err.message === _segmentexplorernode.SEGMENT_EXPLORER_SIMULATED_ERROR_MESSAGE) {
            return;
        }
        _nextdevtools.dispatcher.openErrorOverlay();
    }
    render() {
        const { children, globalError } = this.props;
        const { error } = this.state;
        if (error !== null) {
            const thrownValue = error.thrownValue;
            return /*#__PURE__*/ (0, _jsxruntime.jsx)(ErroredHtml, {
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
            (0, _react.startTransition)(()=>{
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

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-dev-overlay-error-boundary.js.map