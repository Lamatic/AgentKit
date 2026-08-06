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

const defaultColor = "#FF8282";
const SiScreencastify = React__namespace.forwardRef(function SiScreencastify2({ title = "Screencastify", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M7.898 2.347c-.472.008-.914.38-.914.891v4.278H1.1c-.541 0-1.1.437-1.1.978v7.02c0 .54.559.907 1.1.907h5.884V7.533h6.408c.542 0 .926.437.926.979v1.623l3.667-2.095v7.927l-3.667-2.095v1.676c0 .541-.384.908-.926.908H6.984v4.313c0 .68.786 1.1 1.38.768l9.638-5.535 5.553-3.195c.593-.402.593-1.257 0-1.59l-5.553-3.194L8.364 2.47a.886.886 0 00-.466-.123z" })
      ]
    }
  );
});

exports.default = SiScreencastify;
exports.defaultColor = defaultColor;
