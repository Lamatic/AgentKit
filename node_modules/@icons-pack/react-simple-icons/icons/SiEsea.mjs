import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#0E9648";
const SiEsea = React.forwardRef(function SiEsea2({ title = "ESEA", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M14.054 2.767L8.95 9.511 0 9.65l5.832 4.47L1.042 21l8.491-4.088 5.711 4.322V14.12L24 9.796l-17.255 4.02a12.575 12.575 0 001.589-1.955 5.475 5.475 0 00.617-1.786l5.593-.15z" })
      ]
    }
  );
});

export { SiEsea as default, defaultColor };
