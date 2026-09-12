module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/proposal-app/postcss.config.mjs { CONFIG => \"[project]/proposal-app/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/1pv6_11mj17x._.js",
  "chunks/[root-of-the-server]__0hgkz50._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/proposal-app/postcss.config.mjs { CONFIG => \"[project]/proposal-app/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];