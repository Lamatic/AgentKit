import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';

const defaultColor = "#59666C";
const SiHibernate = React.forwardRef(function SiHibernate2({ title = "Hibernate", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsx("path", { d: "M5.365 0L9.98 7.994h8.95L14.31 0H5.366zm-.431.248L.46 7.994l4.613 8.008L9.55 8.24 4.934.248zm13.992 7.75l-4.475 7.76 4.617 7.992 4.471-7.744-4.613-8.008zm-4.905 8.006l-8.95.002L9.688 24h8.946l-4.615-7.994.001-.002Z" })
      ]
    }
  );
});

export { SiHibernate as default, defaultColor };
