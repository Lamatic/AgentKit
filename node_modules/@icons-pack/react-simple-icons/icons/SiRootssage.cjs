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

const defaultColor = "#525DDC";
const SiRootssage = React__namespace.forwardRef(function SiRootssage2({ title = "Roots Sage", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M7.384 4.232l1.71 5.075-4.478-3.136L0 9.403l1.753 5.2.01.03H7.3L2.82 17.77l1.754 5.2.01.03h5.705L12 17.925l1.7 5.045.01.03h5.707l1.763-5.23-4.48-3.137h5.537L24 9.403l-4.616-3.232-4.479 3.136 1.711-5.075L12 1zm.105 10.342l1.723-5.111h5.576l1.723 5.111-4.51 3.16z" })
      ]
    }
  );
});

exports.default = SiRootssage;
exports.defaultColor = defaultColor;
