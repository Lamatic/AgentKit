import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#000000";
const SiPolestar = React.forwardRef(function SiPolestar2({ title = "Polestar", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "m12.549 0-.457.555v11.191h11.19l.554-.457-9.4-1.89zM.719 12.26l-.555.457L9.563 14.6l1.886 9.4.457-.555V12.26Z" })
      ]
    }
  );
});

export { SiPolestar as default, defaultColor };
