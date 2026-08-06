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

const defaultColor = "#073B5A";
const SiOpenbadges = React__namespace.forwardRef(function SiOpenbadges2({ title = "Open Badges", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M18.43 18.584l-8.265-4.749 1.078-.641.719-.411.719.41 1.796 1.027 1.437.821 1.797 1.027 1.438.822 1.078.616zm-3.234 1.873l-8.24-4.774 1.797-1.027 8.24 4.75-1.797 1.051zm-3.209 1.848l-8.24-4.748 1.797-1.027 8.24 4.749zM3.03 14.246l8.24-4.748v2.079l-.719.41-1.797 1.027-1.438.821-1.796 1.027-1.437.822-1.053.615v-2.054zm0-3.722l8.24-4.749v2.08l-8.24 4.723v-2.054zm0-3.722l8.24-4.749v2.054L3.03 8.856V6.802zm9.677-4.749l1.797 1.027v9.523l-1.078-.616-.719-.41V2.052zm3.209 1.848l1.796 1.027v9.523l-1.797-1.027V3.901zm3.234 1.875l1.796 1.026v9.523l-1.796-1.027V5.775zm3.26.205l-1.49-.822-1.796-1.026-1.412-.847-1.797-1.027-1.437-.822L12.68.411 11.962 0l-.719.411-9.651 5.57v12.012l.718.41L11.987 24l1.438-.822 1.797-1.026 1.437-.821 1.797-1.027 1.437-.821 1.797-1.027.718-.411Z" })
      ]
    }
  );
});

exports.default = SiOpenbadges;
exports.defaultColor = defaultColor;
