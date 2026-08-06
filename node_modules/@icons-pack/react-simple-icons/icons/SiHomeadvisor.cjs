'use strict';

Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: 'Module' } });

const jsxRuntime = require('react/jsx-runtime');
const React = require('react');

function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
  if (e) {
    for (const k in e) {
      if (k !== 'default') {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}

const React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const defaultColor = "#F68315";
const SiHomeadvisor = React__namespace.forwardRef(function SiHomeadvisor2({ title = "HomeAdvisor", color = "currentColor", size = 24, ...others }, ref) {
  if (color === "default") {
    color = defaultColor;
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
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
        /* @__PURE__ */ jsxRuntime.jsx("title", { children: title }),
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M15.98 2.442H8.02L0 10.46h2.275l6.882-6.88 6.881 6.881H24l-8.02-8.018m-.492 9.348L9.157 5.459 4.01 10.605v4.987a1.33 1.33 0 0 0 1.329 1.329h6.077l4.637 4.637v-4.637h2.598a1.33 1.33 0 0 0 1.33-1.33V11.79h-4.494Z" })
      ]
    }
  );
});

exports.default = SiHomeadvisor;
exports.defaultColor = defaultColor;
