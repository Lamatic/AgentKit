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

const defaultColor = "#00D287";
const SiZilch = React__namespace.forwardRef(function SiZilch2({ title = "Zilch", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.421 6.149c3.292-2.011 6.584-4.036 9.862-6.046a.702.702 0 0 1 .83.073c1.312 1.18 2.637 2.36 3.948 3.54a.694.694 0 0 1 .175.815 1737.248 1737.248 0 0 1-4.341 9.338.61.61 0 0 0 .408.845c1.427.335 2.855.656 4.283.991a.546.546 0 0 1 .204.976c-3.234 2.375-6.483 4.749-9.717 7.124a.986.986 0 0 1-1.136.029l-4.633-3.016a.691.691 0 0 1-.248-.888c1.326-2.812 2.666-5.623 3.992-8.421a.78.78 0 0 0-.146-.859 802.196 802.196 0 0 0-3.583-3.569c-.277-.262-.219-.729.102-.932Z" })
      ]
    }
  );
});

exports.default = SiZilch;
exports.defaultColor = defaultColor;
