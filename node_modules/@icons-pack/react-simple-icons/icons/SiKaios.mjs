import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#6F02B5";
const SiKaios = React.forwardRef(function SiKaios2({ title = "KaiOS", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M17.3419.0001a3.6735 3.6735 0 0 0-3.647 3.6735 3.6727 3.6727 0 0 0 3.6735 3.6734 3.6735 3.6735 0 1 0-.0265-7.3469zM4.6233.16a2.7459 2.7459 0 0 0-2.7475 2.7473v18.167a2.7474 2.7474 0 1 0 5.4942 0V2.9071A2.749 2.749 0 0 0 4.6233.16zm6.9494 7.2078a2.729 2.729 0 0 0-2.237 4.2947l7.8107 11.1541a2.729 2.729 0 1 0 4.4706-3.1307L13.8062 8.5311a2.729 2.729 0 0 0-2.2335-1.1634z" })
      ]
    }
  );
});

export { SiKaios as default, defaultColor };
