import React from 'react';
export declare const errorStyles: {
    readonly container: {
        readonly fontFamily: "system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"";
        readonly height: "100vh";
        readonly display: "flex";
        readonly alignItems: "center";
        readonly justifyContent: "center";
    };
    readonly card: {
        readonly marginTop: "-32px";
        readonly maxWidth: "325px";
        readonly padding: "32px 28px";
        readonly textAlign: "left";
    };
    readonly icon: {
        readonly marginBottom: "24px";
    };
    readonly title: {
        readonly fontSize: "24px";
        readonly fontWeight: 500;
        readonly letterSpacing: "-0.02em";
        readonly lineHeight: "32px";
        readonly margin: "0 0 12px 0";
        readonly color: "var(--next-error-title)";
    };
    readonly message: {
        readonly fontSize: "14px";
        readonly fontWeight: 400;
        readonly lineHeight: "21px";
        readonly margin: "0 0 20px 0";
        readonly color: "var(--next-error-message)";
    };
    readonly form: {
        readonly margin: 0;
    };
    readonly buttonGroup: {
        readonly display: "flex";
        readonly gap: "8px";
        readonly alignItems: "center";
    };
    readonly button: {
        readonly display: "inline-flex";
        readonly alignItems: "center";
        readonly justifyContent: "center";
        readonly height: "32px";
        readonly padding: "0 12px";
        readonly fontSize: "14px";
        readonly fontWeight: 500;
        readonly lineHeight: "20px";
        readonly borderRadius: "6px";
        readonly cursor: "pointer";
        readonly color: "var(--next-error-btn-text)";
        readonly background: "var(--next-error-btn-bg)";
        readonly border: "var(--next-error-btn-border)";
    };
    readonly buttonSecondary: {
        readonly display: "inline-flex";
        readonly alignItems: "center";
        readonly justifyContent: "center";
        readonly height: "32px";
        readonly padding: "0 12px";
        readonly fontSize: "14px";
        readonly fontWeight: 500;
        readonly lineHeight: "20px";
        readonly borderRadius: "6px";
        readonly cursor: "pointer";
        readonly color: "var(--next-error-btn-secondary-text)";
        readonly background: "var(--next-error-btn-secondary-bg)";
        readonly border: "var(--next-error-btn-secondary-border)";
    };
    readonly digestFooter: {
        readonly position: "fixed";
        readonly bottom: "32px";
        readonly left: "0";
        readonly right: "0";
        readonly textAlign: "center";
        readonly fontFamily: "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,monospace";
        readonly fontSize: "12px";
        readonly lineHeight: "18px";
        readonly fontWeight: 400;
        readonly margin: "0";
        readonly color: "var(--next-error-digest)";
    };
};
export declare const errorThemeCss: string;
export declare function WarningIcon(): React.JSX.Element;
