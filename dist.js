#!/usr/bin/env bun
import minify from "./minify.js";
import ROOT_DIR from "./sh/ROOT.js";
import runPublish from "@1-/dist/run.js";
import findgit from "@1-/findgit";

const main = async () => {
  await minify(ROOT_DIR);
  await runPublish(findgit(ROOT_DIR), ROOT_DIR, "lib");
};

export default main;

if (import.meta.main) {
  await main();
}
