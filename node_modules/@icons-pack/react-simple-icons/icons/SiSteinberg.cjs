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

const defaultColor = "#C90827";
const SiSteinberg = React__namespace.forwardRef(function SiSteinberg2({ title = "Steinberg", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M19.4807 12.6291c.6422-.371.6422-1.0092 0-1.3792L14.711 8.4954c-.6422-.371-1.1952-.052-1.1952.6901v5.508c0 .741.553 1.0601 1.1952.69zm-7.4812-9.9036c5.1219 0 9.2745 4.1526 9.2745 9.2745s-4.1526 9.2745-9.2745 9.2745S2.726 17.122 2.726 12s4.1516-9.2745 9.2735-9.2745m0-2.7255C5.3834 0 .0005 5.3829.0005 12s5.3829 12 12 12 11.999-5.3829 11.999-12-5.3829-12-12-12z" })
      ]
    }
  );
});

exports.default = SiSteinberg;
exports.defaultColor = defaultColor;
