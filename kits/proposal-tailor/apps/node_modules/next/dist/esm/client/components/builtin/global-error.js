'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { handleISRError } from '../handle-isr-error';
import { errorStyles, errorThemeCss, WarningIcon } from './error-styles';
function DefaultGlobalError({ error }) {
    const digest = error?.digest;
    const isServerError = !!digest;
    const message = isServerError ? 'A server error occurred. Reload to try again.' : 'Reload to try again, or go back.';
    handleISRError({
        error
    });
    return /*#__PURE__*/ _jsxs("html", {
        id: "__next_error__",
        children: [
            /*#__PURE__*/ _jsx("head", {
                children: /*#__PURE__*/ _jsx("style", {
                    dangerouslySetInnerHTML: {
                        __html: errorThemeCss
                    }
                })
            }),
            /*#__PURE__*/ _jsxs("body", {
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        style: errorStyles.container,
                        children: /*#__PURE__*/ _jsxs("div", {
                            style: errorStyles.card,
                            children: [
                                /*#__PURE__*/ _jsx(WarningIcon, {}),
                                /*#__PURE__*/ _jsx("h1", {
                                    style: errorStyles.title,
                                    children: "This page couldn’t load"
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    style: errorStyles.message,
                                    children: message
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    style: errorStyles.buttonGroup,
                                    children: [
                                        /*#__PURE__*/ _jsx("form", {
                                            style: errorStyles.form,
                                            children: /*#__PURE__*/ _jsx("button", {
                                                type: "submit",
                                                style: errorStyles.button,
                                                children: "Reload"
                                            })
                                        }),
                                        !isServerError && /*#__PURE__*/ _jsx("button", {
                                            type: "button",
                                            style: errorStyles.buttonSecondary,
                                            onClick: ()=>{
                                                if (window.history.length > 1) {
                                                    window.history.back();
                                                } else {
                                                    window.location.href = '/';
                                                }
                                            },
                                            children: "Back"
                                        })
                                    ]
                                })
                            ]
                        })
                    }),
                    digest && /*#__PURE__*/ _jsxs("p", {
                        style: errorStyles.digestFooter,
                        children: [
                            "ERROR ",
                            digest
                        ]
                    })
                ]
            })
        ]
    });
}
// Exported so that the import signature in the loaders can be identical to user
// supplied custom global error signatures.
export default DefaultGlobalError;

//# sourceMappingURL=global-error.js.map