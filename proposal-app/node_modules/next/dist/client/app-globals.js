// imports polyfill from `@next/polyfill-module` after build.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("../build/polyfills/polyfill-module");
// Only set up devtools for the dev server.
if (process.env.__NEXT_DEV_SERVER) {
    require('../next-devtools/userspace/app/app-dev-overlay-setup');
}
// Start listening for the instant navigation test cookie. The test framework
// (e.g. Playwright) sets/clears this cookie to control the navigation lock.
// Browser-only.
if (process.env.__NEXT_EXPOSE_TESTING_API && typeof window !== 'undefined') {
    const { startListeningForInstantNavigationCookie } = // TODO(browser-variant): migrate to a .ts/.browser.ts split so the browser bundle drops the server branch; see scripts/generate-browser-variant-aliases.mjs
    // ast-grep-ignore: no-typeof-window-require
    require('./components/segment-cache/navigation-testing-lock');
    startListeningForInstantNavigationCookie();
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=app-globals.js.map