import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#2450B2";
const SiVega = React.forwardRef(function SiVega2({ title = "Vega", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M19.39 8.693H24l-3.123-6.68ZM6.68 1.987H0L7.098 22.03h.008l2.86-10.73zm14.197-.016-7.098 20.042h-6.68L14.195 1.97" })
      ]
    }
  );
});

export { SiVega as default, defaultColor };
