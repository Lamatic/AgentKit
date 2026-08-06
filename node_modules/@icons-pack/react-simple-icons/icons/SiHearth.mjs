import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#A33035";
const SiHearth = React.forwardRef(function SiHearth2({ title = "Hearth", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M8.1958 10.318v9.576L.4531 24v-9.3298zm7.6591-4.162 7.692 4.1616v9.5736L15.8532 24v-9.3302l-7.6577-4.3522ZM8.196 0v9.576L.453 13.8027v-9.648Z" })
      ]
    }
  );
});

export { SiHearth as default, defaultColor };
