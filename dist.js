#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import minify from "./minify.js";
import ROOT_DIR from "./sh/ROOT.js";
import { simpleGit } from "simple-git";

const main = async () => {
  await minify(ROOT_DIR);

  const pkg_path = join(ROOT_DIR, "package.json"),
    pkg = JSON.parse(readFileSync(pkg_path, "utf8")),
    current_version = pkg.version,
    version_parts = current_version.split("."),
    _next_patch = String(Number(version_parts[2]) + 1);

  version_parts[2] = _next_patch;
  const next_version = version_parts.join(".");
  pkg.version = next_version;
  writeFileSync(pkg_path, JSON.stringify(pkg, null, 2) + "\n");
  console.log("Version updated: " + current_version + " -> " + next_version);

  const git = simpleGit(ROOT_DIR),
    status = await git.status(),
    current_branch = status.current;
  console.log("Current branch: " + current_branch);

  await git.add("-A");
  await git.commit("v" + next_version);

  if (current_branch !== "main") {
    await git.push("origin", current_branch);
    await git.checkout("main");
    await git.pull("origin", "main");
    await git.merge([current_branch]);
    await git.push("origin", "main");
    await git.checkout(current_branch);
  } else {
    await git.push("origin", "main");
  }

  console.log("Successfully merged v" + next_version + " to main and pushed!");
};

export default main;

if (import.meta.main) {
  await main();
}
