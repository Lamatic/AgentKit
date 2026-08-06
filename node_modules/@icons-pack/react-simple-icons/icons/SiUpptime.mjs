import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#1ABC9C";
const SiUpptime = React.forwardRef(function SiUpptime2({ title = "Upptime", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M11.86 15.68c1.926 0 3.489 1.526 3.489 3.406 0 1.88-1.563 3.407-3.488 3.407-1.926 0-3.489-1.526-3.489-3.407 0-1.88 1.563-3.407 3.489-3.407ZM24 14.884 12 1.507 0 14.885l3.158 3.52L12 8.548l8.842 9.857L24 14.885Z" })
      ]
    }
  );
});

export { SiUpptime as default, defaultColor };
