import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#FAFAFA";
const SiTelegraph = React.forwardRef(function SiTelegraph2({ title = "Telegraph", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M0 0v24h24V0H0zm6 6h12v3h-4.5v9h-3V9H6V6Z" })
      ]
    }
  );
});

export { SiTelegraph as default, defaultColor };
