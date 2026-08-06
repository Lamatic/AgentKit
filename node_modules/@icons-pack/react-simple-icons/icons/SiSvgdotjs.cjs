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

const defaultColor = "#FF0066";
const SiSvgdotjs = React__namespace.forwardRef(function SiSvgdotjs2({ title = "SVG.js", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M24 12 12 0 0 12l12 12 12-12Zm-18.569-.554 4.665-4.665c.335-.601.841-1.258 1.565-1.982a.4798.4798 0 0 1 .678 0c.187.187.187.491 0 .678-1.254 1.254-1.786 2.24-1.836 3.093-.035.59.174 1.1.49 1.573.36.536.854 1.026 1.346 1.518 1.13 1.13 2.206 2.289 2.116 3.826-.015.256-.063.525-.149.808l4.002-4.002a.6147.6147 0 0 1-.073-.293c0-.346.281-.627.627-.627s.627.281.627.627-.281.627-.627.627a.6147.6147 0 0 1-.293-.073l-4.665 4.665c-.335.601-.841 1.258-1.565 1.982a.4798.4798 0 0 1-.678 0 .4798.4798 0 0 1 0-.678c1.254-1.254 1.786-2.24 1.836-3.093.035-.59-.174-1.1-.49-1.573-.36-.536-.854-1.026-1.346-1.518-1.13-1.13-2.206-2.289-2.116-3.826.015-.256.063-.525.149-.808l-4.002 4.002c.047.087.073.187.073.293 0 .346-.281.627-.627.627A.6274.6274 0 0 1 4.511 12c0-.346.281-.627.627-.627.106 0 .206.026.293.073Zm-.293.296c.143 0 .258.115.258.258 0 .143-.115.258-.258.258A.2573.2573 0 0 1 4.88 12c0-.143.115-.258.258-.258Zm13.724 0c.143 0 .258.115.258.258 0 .143-.115.258-.258.258a.2573.2573 0 0 1-.258-.258c0-.143.115-.258.258-.258Z" })
      ]
    }
  );
});

exports.default = SiSvgdotjs;
exports.defaultColor = defaultColor;
