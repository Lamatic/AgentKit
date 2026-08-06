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

const defaultColor = "#EC1D24";
const SiR3 = React__namespace.forwardRef(function SiR32({ title = "R3", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M24 13.457c0 .841-.688 1.53-1.53 1.53-.842 0-1.53-.689-1.53-1.53a1.53 1.53 0 1 1 3.06 0zM6.147 2.853c-1.123 0-2.172.3-3.08.828v-.828H0v12.134h3.067V9a3.077 3.077 0 0 1 3.08-3.08l1.029-.007 2.105-3.06H6.147zm8.746 6.08 2.078-3.02v-3.06h-6.615l-2.104 3.06h4.99l-2.565 3.735 1.53 2.653a3.098 3.098 0 0 1 4.65 2.686c0 1.717-1.39 3.1-3.1 3.1-1.71 0-3.1-1.39-3.1-3.1h-3.06c0 3.4 2.76 6.16 6.154 6.16 3.4 0 6.16-2.76 6.16-6.16a6.162 6.162 0 0 0-5.018-6.054z" })
      ]
    }
  );
});

exports.default = SiR3;
exports.defaultColor = defaultColor;
