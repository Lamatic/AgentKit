import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#15D1A0";
const SiCheckmk = React.forwardRef(function SiCheckmk2({ title = "Checkmk", color = "currentColor", size = 24, ...others }, ref) {
  if (color === "default") {
    color = defaultColor;
  }
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      fill: color,
      viewBox: "0 0 24 24",
      ref,
      ...others,
      children: [
        /* @__PURE__ */ jsx("title", { children: title }),
        /* @__PURE__ */ jsx("path", { d: "M5.187 8.738v3.985l4.883-3.157v8.217l1.925 1.111 1.926-1.111V9.57l4.882 3.158V8.742l-6.808-4.269-6.808 4.265zM12 0l10.375 5.999V18L12 24 1.625 18.006V6.003L12 0z" })
      ]
    }
  );
});

export { SiCheckmk as default, defaultColor };
