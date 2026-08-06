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

const defaultColor = "#F93821";
const SiWinamp = React__namespace.forwardRef(function SiWinamp2({ title = "Winamp", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M11.902 0a.987.987 0 0 0-.91.604l-6.139 14.57c-.176.42.131.883.586.883H8.66a.987.987 0 0 0 .91-.604L15.707.883A.636.636 0 0 0 15.12 0h-3.219Zm3.438 7.943a.987.987 0 0 0-.91.604l-6.137 14.57c-.177.42.13.883.586.883h3.219a.987.987 0 0 0 .91-.604l6.138-14.57a.636.636 0 0 0-.586-.883h-3.22Z" })
      ]
    }
  );
});

exports.default = SiWinamp;
exports.defaultColor = defaultColor;
