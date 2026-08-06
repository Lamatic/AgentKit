import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#4E5EE4";
const SiOpenzeppelin = React.forwardRef(function SiOpenzeppelin2({ title = "OpenZeppelin", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M22.783 24H9.317l2.196-3.69a5.23 5.23 0 0 1 4.494-2.558h6.775ZM1.217 0h21.566l-3.718 6.247H1.217ZM9.76 9.763a5.73 5.73 0 0 1 4.92-2.795h4.01L8.498 24h-7.26Z" })
      ]
    }
  );
});

export { SiOpenzeppelin as default, defaultColor };
