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

const defaultColor = "#E64A19";
const SiOpenhab = React__namespace.forwardRef(function SiOpenhab2({ title = "openHAB", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "m12 9.103-9.76 9.768c-.376-.553-.725-1.123-.998-1.738l9.39-9.397L12 6.368l1.368 1.368 6.931 6.931-.01.035-.136.403-.156.393-.174.384-.192.374-.175.304L12 9.103zM12 0C5.39 0 0 5.39 0 12c0 1.306.211 2.563.6 3.741l.893-.893.668-.67A10.039 10.039 0 0 1 1.922 12C1.922 6.45 6.45 1.922 12 1.922S22.078 6.449 22.078 12c0 5.55-4.527 10.078-10.078 10.078a10.06 10.06 0 0 1-7.698-3.588l-.012.012-.309.309-.308.309-.308.308-.424.425C5.144 22.39 8.39 24 12.001 24 18.61 24 24 18.61 24 12S18.61 0 12 0z" })
      ]
    }
  );
});

exports.default = SiOpenhab;
exports.defaultColor = defaultColor;
