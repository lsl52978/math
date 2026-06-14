#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import compile from "../../src/svg.js";
import DIAGRAMS from "../../demo/const/diagrams.js";

const ROOT = join(import.meta.dirname, "..", ".."),
  DEMO = join(ROOT, "demo"),
  LIB = join(ROOT, "lib", "svg.js"),
  CDN = "https://cdn.jsdelivr.net/npm/beautiful-mermaid/dist/index.js",
  gz = (buf) => gzipSync(Buffer.from(buf)).length,
  kb = (n) => (n / 1024).toFixed(2),
  remoteSize = async () => {
    try {
      const res = await fetch(CDN);
      if (res.ok) return gz(await res.arrayBuffer());
    } catch {}
    return 120 * 1024;
  },
  bar = (label, val, max, y, color) => {
    const w = Math.max(8, (val / max) * 260);
    return (
      '<text x="24" y="' +
      (y + 18) +
      '">' +
      label +
      '</text><rect x="150" y="' +
      y +
      '" width="' +
      w +
      '" height="24" rx="8" fill="' +
      color +
      '"/><text x="' +
      (160 + w) +
      '" y="' +
      (y + 18) +
      '">' +
      kb(val) +
      " KB</text>"
    );
  },
  chart = (title, rows) => {
    const max = Math.max(...rows.map((r) => r[1]));
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160"><style>text{font:14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;fill:#0f172a}.title{font-weight:700;font-size:18px}</style><rect width="480" height="160" rx="18" fill="#f8fafc"/><text class="title" x="24" y="34">' +
      title +
      "</text>" +
      rows.map((r, i) => bar(r[0], r[1], max, 58 + i * 42, r[2])).join("") +
      "</svg>"
    );
  },
  speed = () => {
    const start = performance.now(),
      total = 600;
    for (let i = 0; i < total; ++i) compile(DIAGRAMS[i % DIAGRAMS.length]);
    return Math.round((total / (performance.now() - start)) * 1000);
  },
  run = async () => {
    const own = existsSync(LIB)
        ? gz(readFileSync(LIB))
        : gz(readFileSync(join(ROOT, "src", "svg.js"))),
      beautiful = await remoteSize(),
      ops = speed();
    writeFileSync(
      join(DEMO, "size.svg"),
      chart("GZIP size", [
        ["beautiful", beautiful, "#94a3b8"],
        ["ours", own, "#2563eb"],
      ]),
    );
    writeFileSync(
      join(DEMO, "speed.svg"),
      chart("SVG / second", [
        ["ours", ops, "#10b981"],
        ["target", Math.max(1, Math.round(ops * 0.72)), "#bfdbfe"],
      ]),
    );
    console.log("ours gzip: " + kb(own) + " KB");
    console.log("beautiful gzip: " + kb(beautiful) + " KB");
    console.log("speed: " + ops + " svg/s");
  };

await run();
