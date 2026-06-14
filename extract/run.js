#!/usr/bin/env bun
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump } from "js-yaml";
import { $ } from "zx";
import compile from "../src/svg.js";

const REPO = [
    ["maid", "https://github.com/probelabs/maid.git"],
    ["beautiful-mermaid", "https://github.com/lukilabs/beautiful-mermaid.git"],
    ["mermaid", "https://github.com/mermaid-js/mermaid.git"],
  ],
  SEED = [
    "flowchart TD\n  A[Input Mermaid] --> B[Parse]\n  B --> C[Layout]\n  C --> D[SVG]",
    "graph LR\n  Start((Start)) --> Check{Fast?}\n  Check -->|yes| Ship[Ship SVG]\n  Check -->|no| Tune[Optimize]",
    "sequenceDiagram\n  User->>Renderer: type mermaid\n  Renderer-->>User: svg\n  Note over User,Renderer: tiny runtime",
    "classDiagram\n  Diagram <|-- Flowchart\n  Diagram : +render()\n  Flowchart : +layout()",
    "stateDiagram-v2\n  [*] --> Draft\n  Draft --> Tested: bun test\n  Tested --> Shipped",
  ],
  ROOT = join(import.meta.dirname, ".."),
  CACHE = join(tmpdir(), "webc-mermaid-extract"),
  TEST = join(ROOT, "test"),
  clone = async (name, url) => {
    const dir = join(CACHE, name),
      tpl = join(CACHE, "git-template");
    if (!existsSync(dir)) {
      mkdirSync(CACHE, { recursive: true });
      mkdirSync(tpl, { recursive: true });
      try {
        await $`git clone --depth=1 --template=${tpl} ${url} ${dir}`;
      } catch (err) {
        rmSync(dir, { recursive: true, force: true });
        throw err;
      }
    }
    return dir;
  },
  walk = (dir, out = []) => {
    let list = [];
    try {
      list = readdirSync(dir);
    } catch {
      return out;
    }
    list.forEach((name) => {
      const path = join(dir, name);
      let stat;
      try {
        stat = statSync(path);
      } catch {
        return;
      }
      if (stat.isDirectory()) {
        if (!name.startsWith(".") && name !== "node_modules") walk(path, out);
      } else if (/\.(mmd|md|markdown|js|ts|tsx|json)$/.test(name)) {
        out.push(path);
      }
    });
    return out;
  },
  fences = (txt) => {
    const out = [],
      re = /```(?:mermaid|mmd)?\s*([\s\S]*?)```/gi;
    let m;
    while ((m = re.exec(txt))) out.push(m[1].trim());
    return out;
  },
  literals = (txt) => {
    const out = [],
      re =
        /["'`]((?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram-v2)(?:\\n|[^"'`]){0,900})["'`]/g;
    let m;
    while ((m = re.exec(txt))) out.push(m[1].replace(/\\n/g, "\n").trim());
    return out;
  },
  supported = (code) => {
    const line = code.trim().split(/\n/)[0].trim().toLowerCase();
    if (!/^(flowchart|graph|sequencediagram|classdiagram|statediagram|statediagram-v2)/.test(line))
      return false;
    if (code.length > 1200 || /%%\{|\bsubgraph\b|\bclick\b|\bstyle\b|\bclassDef\b/.test(code))
      return false;
    if (
      line.startsWith("statediagram") &&
      /[{}]|\n\s*---|\bNote\b|\bdirection\b|\bas\s+[A-Za-z]/.test(code)
    )
      return false;
    if (line.startsWith("classdiagram") && /[{}]|\bnote\b|\bnamespace\b|\bcallback\b/.test(code))
      return false;
    try {
      const svg = compile(code);
      return svg.includes("<svg") && svg.includes("<text");
    } catch {
      return false;
    }
  },
  classify = (code) => {
    const head = code.trim().split(/\n/)[0].toLowerCase();
    if (head.startsWith("sequencediagram")) return "sequence";
    if (head.startsWith("classdiagram")) return "class";
    if (head.startsWith("statediagram")) return "state";
    return "flowchart";
  },
  fragments = (code) => {
    const set = new Set(),
      svg = compile(code),
      re = /<text[^>]*>(.*?)<\/text>/g;
    let m;
    while ((m = re.exec(svg))) {
      const txt = m[1].trim();
      if (txt) set.add(txt);
    }
    return Array.from(set).slice(0, 8);
  },
  collect = async () => {
    const all = new Set(SEED);
    for (const [name, url] of REPO) {
      try {
        const dir = await clone(name, url);
        walk(dir).forEach((file) => {
          let txt = "";
          try {
            txt = readFileSync(file, "utf8");
          } catch {
            return;
          }
          [...fences(txt), ...literals(txt)].forEach((code) => {
            if (supported(code)) all.add(code);
          });
        });
      } catch (err) {
        console.log("Skip " + name + ": " + err.message);
      }
    }
    return Array.from(all).filter(supported);
  },
  run = async () => {
    const bucket = {
      flowchart: [],
      sequence: [],
      class: [],
      state: [],
    };
    (await collect()).forEach((code) => {
      bucket[classify(code)].push([code, fragments(code)]);
    });
    for (const [name, cases] of Object.entries(bucket)) {
      if (cases.length) {
        writeFileSync(join(TEST, name + ".yml"), dump(cases), "utf8");
        console.log("Generated " + cases.length + " " + name + " cases");
      }
    }
  };

await run();
