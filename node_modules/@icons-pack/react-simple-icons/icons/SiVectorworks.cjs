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

const defaultColor = "#000000";
const SiVectorworks = React__namespace.forwardRef(function SiVectorworks2({ title = "Vectorworks", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22.725c-5.925 0-10.725-4.8-10.725-10.725S6.075 1.275 12 1.275 22.725 6.075 22.725 12 17.925 22.725 12 22.725zM8.775 7.5h-2.25c-.15 0-.208.086-.15.225l4.425 10.65c.04.098.15.225.3.225h1.95c.15 0 .206-.086.15-.225l-4.35-10.8c-.028-.07-.035-.075-.075-.075zm8.7 0h-2.25c-.075 0-.13.023-.15.075L13.35 11.85a.6.6 0 0 0 0 .375l1.05 2.55c.075.15.225.15.3 0l2.925-7.05c.057-.139 0-.225-.15-.225z" })
      ]
    }
  );
});

exports.default = SiVectorworks;
exports.defaultColor = defaultColor;
