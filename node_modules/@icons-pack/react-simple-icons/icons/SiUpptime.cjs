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

const defaultColor = "#1ABC9C";
const SiUpptime = React__namespace.forwardRef(function SiUpptime2({ title = "Upptime", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M11.86 15.68c1.926 0 3.489 1.526 3.489 3.406 0 1.88-1.563 3.407-3.488 3.407-1.926 0-3.489-1.526-3.489-3.407 0-1.88 1.563-3.407 3.489-3.407ZM24 14.884 12 1.507 0 14.885l3.158 3.52L12 8.548l8.842 9.857L24 14.885Z" })
      ]
    }
  );
});

exports.default = SiUpptime;
exports.defaultColor = defaultColor;
