import parse, { TYPE_SEQUENCE } from "./parse.js";
import layout from "./layout.js";
import { theme } from "./theme.js";
import esc from "./escape.js";

const [BG, SURFACE, BORDER, TEXT, MUTED, ACCENT, ACCENT_SOFT] = [0, 1, 2, 3, 4, 5, 6],
  nodePath = (x, y, w, h, shape) =>
    shape === 2
      ? '<path d="M' +
        (x + w / 2) +
        " " +
        y +
        "L" +
        (x + w) +
        " " +
        (y + h / 2) +
        "L" +
        (x + w / 2) +
        " " +
        (y + h) +
        "L" +
        x +
        " " +
        (y + h / 2) +
        'Z"'
      : '<rect x="' +
        x +
        '" y="' +
        y +
        '" width="' +
        w +
        '" height="' +
        h +
        '" rx="' +
        (shape === 1 ? 24 : 14) +
        '"',
  text = (x, y, val, cls = "txt") =>
    '<text class="' + cls + '" x="' + x + '" y="' + y + '">' + esc(val) + "</text>",
  css = (t) =>
    "<style>" +
    ".bg{fill:" +
    t[BG] +
    "}.node{fill:" +
    t[SURFACE] +
    ";stroke:" +
    t[BORDER] +
    ";stroke-width:1.2}.edge{fill:none;stroke:" +
    t[ACCENT] +
    ";stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.dash{stroke-dasharray:6 6}.life{stroke:" +
    t[BORDER] +
    ";stroke-dasharray:5 7}.txt{fill:" +
    t[TEXT] +
    ";font:500 14px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;text-anchor:middle;dominant-baseline:middle}.small{fill:" +
    t[MUTED] +
    ";font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;text-anchor:middle}.label{fill:" +
    t[MUTED] +
    ";font:12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;text-anchor:middle;dominant-baseline:middle}.note{fill:" +
    t[ACCENT_SOFT] +
    ";stroke:" +
    t[ACCENT] +
    ";stroke-width:1}.arrow{fill:" +
    t[ACCENT] +
    "}" +
    "</style>",
  defs =
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>',
  node = (item, pos) => {
    const [id, label, shape] = item,
      [x, y, w, h] = pos.get(id);
    return nodePath(x, y, w, h, shape) + ' class="node"/>' + text(x + w / 2, y + h / 2, label);
  },
  edge = (item, pos) => {
    const [from, to, label, arrow] = item,
      a = pos.get(from),
      b = pos.get(to);
    if (!a || !b) return "";
    const ax = a[0] + a[2] / 2,
      ay = a[1] + a[3],
      bx = b[0] + b[2] / 2,
      by = b[1],
      mid_y = (ay + by) / 2,
      dashed = arrow.includes(".") ? " dash" : "",
      path =
        '<path class="edge' +
        dashed +
        '" marker-end="url(#arrow)" d="M' +
        ax +
        " " +
        ay +
        "C" +
        ax +
        " " +
        mid_y +
        " " +
        bx +
        " " +
        mid_y +
        " " +
        bx +
        " " +
        by +
        '"/>';
    return path + (label ? text((ax + bx) / 2, mid_y - 8, label, "label") : "");
  },
  flow = (diagram, pos) =>
    diagram[3].map((e) => edge(e, pos)).join("") + diagram[2].map((n) => node(n, pos)).join(""),
  seq = (diagram, pos, height) => {
    const nodes = diagram[2],
      edges = diagram[3],
      notes = diagram[4];
    let y = 118,
      out = nodes
        .map((n) => {
          const [x, top, w, h] = pos.get(n[0]),
            cx = x + w / 2;
          return (
            node([n[0], n[1], 1], pos) +
            '<path class="life" d="M' +
            cx +
            " " +
            (top + h + 12) +
            "L" +
            cx +
            " " +
            (height - 28) +
            '"/>'
          );
        })
        .join("");
    edges.forEach(([from, to, label, arrow]) => {
      const a = pos.get(from),
        b = pos.get(to);
      if (!a || !b) return;
      const ax = a[0] + a[2] / 2,
        bx = b[0] + b[2] / 2,
        cls = arrow.startsWith("--") ? "edge dash" : "edge";
      out +=
        '<path class="' +
        cls +
        '" marker-end="url(#arrow)" d="M' +
        ax +
        " " +
        y +
        "L" +
        bx +
        " " +
        y +
        '"/>' +
        text((ax + bx) / 2, y - 10, label, "label");
      y += 52;
    });
    notes.forEach(([targets, label]) => {
      const first = pos.get(targets[0]);
      if (!first) return;
      const x = first[0],
        w =
          targets[1] && pos.get(targets[1])
            ? pos.get(targets[1])[0] - x + pos.get(targets[1])[2]
            : 150;
      out +=
        '<rect class="note" x="' +
        x +
        '" y="' +
        (y - 22) +
        '" width="' +
        w +
        '" height="34" rx="10"/>' +
        text(x + w / 2, y - 5, label, "label");
      y += 52;
    });
    return out;
  };

export default (code, theme_id = 0) => {
  const diagram = parse(code),
    [width, height, pos] = layout(diagram),
    t = theme(theme_id),
    body = diagram[0] === TYPE_SEQUENCE ? seq(diagram, pos, height) : flow(diagram, pos);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 ' +
    width +
    " " +
    height +
    '">' +
    css(t) +
    defs +
    '<rect class="bg" width="100%" height="100%" rx="18"/>' +
    body +
    "</svg>"
  );
};
