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
const SiSonos = React__namespace.forwardRef(function SiSonos2({ title = "Sonos", color = "currentColor", size = 24, ...others }, ref) {
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
        /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12.988 12.36l-2.813-2.634v4.429h.837V11.7l2.813 2.633V9.905h-.837zM6.464 9.665A2.3 2.3 0 0 0 4.13 12c0 1.257 1.077 2.334 2.334 2.334A2.3 2.3 0 0 0 8.798 12a2.3 2.3 0 0 0-2.334-2.334m0 3.83A1.482 1.482 0 0 1 4.968 12c0-.838.658-1.496 1.496-1.496S7.96 11.162 7.96 12s-.658 1.496-1.496 1.496M2.694 12c-.24-.18-.54-.3-.958-.419-.838-.24-.838-.479-.838-.598 0-.24.299-.48.718-.48.36 0 .658.18.778.24l.06.06.658-.479-.06-.06s-.538-.598-1.436-.598c-.419 0-.838.12-1.137.359-.3.24-.479.598-.479.958s.18.718.479.957c.24.18.538.3.957.42.838.239.838.478.838.598 0 .239-.299.478-.718.478-.359 0-.658-.18-.778-.239l-.06-.06-.658.479.06.06s.538.598 1.436.598c.42 0 .838-.12 1.137-.359.3-.24.48-.598.48-.957 0-.36-.18-.659-.48-.958m14.843-2.334A2.3 2.3 0 0 0 15.202 12a2.337 2.337 0 0 0 2.334 2.334A2.3 2.3 0 0 0 19.87 12a2.337 2.337 0 0 0-2.334-2.334m0 3.83A1.482 1.482 0 0 1 16.04 12c0-.838.658-1.496 1.496-1.496s1.496.658 1.496 1.496-.718 1.496-1.496 1.496m3.77-1.556c.24.18.54.3.958.42.838.239.838.478.838.598 0 .239-.299.478-.718.478-.36 0-.658-.18-.778-.239h-.06l-.658.479.06.06s.538.598 1.436.598c.419 0 .838-.12 1.137-.359s.479-.598.479-.958-.18-.718-.479-.957c-.24-.18-.538-.3-.957-.42-.838-.239-.838-.478-.838-.598 0-.239.299-.478.718-.478.359 0 .658.18.778.239l.06.06.658-.479-.06-.06s-.538-.598-1.436-.598c-.42 0-.838.12-1.137.359-.3.24-.48.598-.48.957-.059.36.12.659.48.898" })
      ]
    }
  );
});

exports.default = SiSonos;
exports.defaultColor = defaultColor;
