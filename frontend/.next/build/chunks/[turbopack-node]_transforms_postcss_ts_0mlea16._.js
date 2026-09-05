module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/frontend/postcss.config.js { CONFIG => \"[project]/frontend/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/_1v1fj5l._.js",
  "chunks/[root-of-the-server]__1-wh8e4._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/frontend/postcss.config.js { CONFIG => \"[project]/frontend/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];