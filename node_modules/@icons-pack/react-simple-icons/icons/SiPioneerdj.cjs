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

const defaultColor = "#1A1928";
const SiPioneerdj = React__namespace.forwardRef(function SiPioneerdj2({ title = "Pioneer DJ", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M15.46 5.569c1.474 1.144 1.715 2.695 1.107 4.319-.565 1.503-1.833 2.96-3.827 4.087-2.21 1.227-4.498 1.554-6.993 1.554H0L4.212 4.308h5.051c2.548 0 4.7.1 6.197 1.26zm-3.112 4.235c.33-.884.246-2.202-.34-2.906-.658-.782-1.673-.873-3.138-.873l-.716.016s-.616-.07-.866.49c-.153.35.064-.263-2.412 6.341-.326.876.452.919.452.919s2.794.17 5.132-1.448c.991-.685 1.577-1.705 1.888-2.539zm5.938-1.467L24 8.366l-2.892 7.731c-.944 2.518-2.896 3.595-6.812 3.595l-3.058-.04.731-1.746c4.427.21 5.225-1.76 5.365-2.139l1.846-4.966s.317-.884-.402-.884h-1.132Z" })
      ]
    }
  );
});

exports.default = SiPioneerdj;
exports.defaultColor = defaultColor;
