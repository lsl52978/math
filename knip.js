export default {
  entry: [
    "dev.js",
    "minify.js",
    "extract/run.js",
    "sh/check.js",
    "test/compare.test.js",
    "sh/compile_i18n.js",
    "sh/ai/loop.js",
    "sh/bench/mermaid.js",
  ],
  ignore: ["demo/**", "lib/**", "./conf/**"],
  ignoreDependencies: ["oxfmt", "oxlint", "@1-/mdimg2cdn"],
};
