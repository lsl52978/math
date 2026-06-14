import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import compile from "../lib/svg.js";

export const normalize = (svg) => svg.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

const verifyCase = (code, expected) => {
    const out = compile(code);
    if (!out.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')) {
      return [false, "Output is not SVG"];
    }
    if (!out.includes("viewBox=")) {
      return [false, "Missing viewBox"];
    }
    if (out.includes("\n") || out.includes("\r")) {
      return [false, "Output contains newlines"];
    }
    if (Array.isArray(expected)) {
      for (const item of expected) {
        if (!out.includes(item)) {
          return [false, "Missing expected fragment: " + item + "\nGot:\n" + out];
        }
      }
      return [true];
    }
    const got = normalize(out),
      exp = normalize(expected);
    return got === exp ? [true] : [false, "Expected:\n" + exp + "\nGot:\n" + got];
  },
  cases = function* () {
    const dir_path = import.meta.dirname,
      files = readdirSync(dir_path);

    for (const file of files) {
      if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        const file_path = join(dir_path, file),
          content = readFileSync(file_path, "utf8"),
          yaml_cases = load(content) || [];
        for (let i = 0; i < yaml_cases.length; ++i) {
          const [md, expected] = yaml_cases[i],
            name = file + " - Case " + i;

          yield {
            name,
            fn: () => {
              const [ok, msg] = verifyCase(md, expected);
              if (!ok) {
                throw new Error(msg);
              }
            },
          };
        }
      }
    }
  };

export default cases;
