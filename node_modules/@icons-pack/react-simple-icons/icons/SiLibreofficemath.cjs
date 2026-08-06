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

const defaultColor = "#C10018";
const SiLibreofficemath = React__namespace.forwardRef(function SiLibreofficemath2({ title = "LibreOffice Math", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M22 0v7l-7-7h7zm-9 0 9 9v12c0 1.662-1.338 3-3 3H5c-1.662 0-3-1.338-3-3V3c0-1.662 1.338-3 3-3h8zM8 17H6v1h2v-1zm5 0h-2v1h2v-1zm2.293-1.293a1 1 0 0 0 1.414-1.414l-.793-.793.793-.793a1 1 0 0 0-1.414-1.414l-.793.793-.793-.793a1 1 0 1 0-1.414 1.414l.793.793-.793.793a1 1 0 0 0 1.414 1.414l.793-.793.793.793zM18 17h-2v1h2v-1zm0-8H9.862L8 13.653 7.338 12H6v1h.662L8 16.347 10.539 10H18V9z" })
      ]
    }
  );
});

exports.default = SiLibreofficemath;
exports.defaultColor = defaultColor;
