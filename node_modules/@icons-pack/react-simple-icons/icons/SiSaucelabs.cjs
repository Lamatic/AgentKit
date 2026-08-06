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

const defaultColor = "#3DDC91";
const SiSaucelabs = React__namespace.forwardRef(function SiSaucelabs2({ title = "Sauce Labs", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M23.4337 7.344c-.5641-.7664-1.469-1.2197-2.4343-1.2197H13.999L11.9993 12h4.8377l-1.9998 5.8755H9.9995l-1.9997 5.8755h9.0001c1.2912 0 2.438-.8086 2.8466-2.0088L23.846 9.9922c.3049-.8957.1518-1.8807-.4123-2.647Zm-13.434 4.655H7.1618l1.9997-5.8756h4.8378l2.001-5.8743H7c-1.2912 0-2.438.8086-2.8466 2.0089L.154 14.0079c-.3049.8956-.1518 1.8807.4123 2.647.5641.7663 1.469 1.2196 2.4343 1.2196h7.0004l1.9998-5.8755H10.001z" })
      ]
    }
  );
});

exports.default = SiSaucelabs;
exports.defaultColor = defaultColor;
