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

const defaultColor = "#94399E";
const SiGocd = React__namespace.forwardRef(function SiGocd2({ title = "GoCD", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18.043 13.237l-8.907 5.935a1.47 1.47 0 01-.823.25 1.449 1.449 0 01-.696-.173 1.48 1.48 0 01-.784-1.308V12a1.482 1.482 0 112.957 0v3.163L14.537 12 7.478 7.304A1.49 1.49 0 119.13 4.823l8.913 5.94a1.492 1.492 0 010 2.474M12 0a12 12 0 1012 12A12.012 12.012 0 0012 0" })
      ]
    }
  );
});

exports.default = SiGocd;
exports.defaultColor = defaultColor;
