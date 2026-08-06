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

const defaultColor = "#82B816";
const SiGradleplaypublisher = React__namespace.forwardRef(function SiGradleplaypublisher2({ title = "Gradle Play Publisher", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M9.191 6.777a1.409 1.409 0 0 0-1.384 1.41v7.62a1.406 1.406 0 0 0 2.109 1.218l6.633-3.832a1.38 1.38 0 0 0 0-2.392L9.916 6.969a1.39 1.39 0 0 0-.725-.192zm.381 1.33a.895.895 0 0 1 .602.106l5.22 3.014a.896.896 0 0 1 0 1.546l-5.22 3.014a.894.894 0 0 1-1.342-.773V8.986a.895.895 0 0 1 .74-.878zM8.154.633C3.414 2.233 0 6.716 0 12c0 6.626 5.374 12 12 12 5.161 0 9.568-3.266 11.258-7.84l-3.838-.844-5.148 5.149-8.465-2.272-2.272-8.465 5.059-5.056zM12 0c-.471 0-.929.025-1.387.076l.412 3.801 7.168 1.924 1.91 7.101 3.774.832c.084-.567.123-1.14.123-1.734 0-6.626-5.374-12-12-12z" })
      ]
    }
  );
});

exports.default = SiGradleplaypublisher;
exports.defaultColor = defaultColor;
