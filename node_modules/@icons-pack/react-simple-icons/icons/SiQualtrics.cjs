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

const defaultColor = "#00B4EF";
const SiQualtrics = React__namespace.forwardRef(function SiQualtrics2({ title = "Qualtrics", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M20.14 5.518l-2.695 9.538h-.034l-2.89-9.538H8.125l-2.19 3.893-2.318-3.893H.368l3.78 6.116L0 18.486h2.993l2.66-4.534 2.755 4.534h4.906v-8.99h.034q.102.564.195.966.093.402.175.744c.057.228.118.445.184.65.065.206.132.43.2.677l1.926 5.949h2.523l1.942-5.95q.213-.718.398-1.385a14.544 14.544 0 0 0 .32-1.506h.035v8.845H24V5.514zM7.373 11.651l3.383-5.616v11.118z" })
      ]
    }
  );
});

exports.default = SiQualtrics;
exports.defaultColor = defaultColor;
