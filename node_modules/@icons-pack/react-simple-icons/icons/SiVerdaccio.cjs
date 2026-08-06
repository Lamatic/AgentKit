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

const defaultColor = "#4B5E40";
const SiVerdaccio = React__namespace.forwardRef(function SiVerdaccio2({ title = "Verdaccio", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M17.376 9.84L18.72 7.2h-4.8v.566h.864l-.192.377H12.96v.566h1.344l-.288.565H12v.566h1.728zm-4.255 8.64l3.68-7.265h-3.68l-1.064 2.103L8.959 7.2H5.28l5.712 11.28zM8.88 0h6.24A8.86 8.86 0 0124 8.88v6.24A8.86 8.86 0 0115.12 24H8.88A8.86 8.86 0 010 15.12V8.88A8.86 8.86 0 018.88 0z" })
      ]
    }
  );
});

exports.default = SiVerdaccio;
exports.defaultColor = defaultColor;
