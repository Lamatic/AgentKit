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

const defaultColor = "#76D04B";
const SiNodemon = React__namespace.forwardRef(function SiNodemon2({ title = "Nodemon", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M22.33 7.851l-.716-.398c1.101-1.569 1.758-3.927.934-7.453 0 0-1.857 5.029-5.59 4.863l-4.37-2.431a1.171 1.171 0 0 0-.536-.15h-.101a1.183 1.183 0 0 0-.538.15L7.042 4.863C3.309 5.03 1.452 0 1.452 0c-.825 3.526-.166 5.884.934 7.453l-.716.398a1.133 1.133 0 0 0-.589.988l.022 14.591c0 .203.109.392.294.491a.58.58 0 0 0 .584 0l5.79-3.204c.366-.211.589-.582.589-.987v-6.817c0-.406.223-.783.588-.984l2.465-1.372a1.19 1.19 0 0 1 .59-.154c.2 0 .407.05.585.154l2.465 1.372c.365.201.588.578.588.984v6.817c0 .405.226.779.59.987l5.788 3.204a.59.59 0 0 0 .589 0 .564.564 0 0 0 .292-.491l.019-14.591a1.129 1.129 0 0 0-.589-.988z" })
      ]
    }
  );
});

exports.default = SiNodemon;
exports.defaultColor = defaultColor;
