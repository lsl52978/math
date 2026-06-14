const TYPE_FLOW = 1,
  TYPE_SEQUENCE = 2,
  TYPE_CLASS = 3,
  TYPE_STATE = 4,
  RE_EDGE = /^(.+?)\s*(-{1,3}(?:>|x|o)?|={2,}>?|\.{2,}>?)(?:\|([^|]+)\|)?\s*(.+)$/,
  RE_SEQ = /^([A-Za-z0-9_$.-]+)\s*(-{1,2}>>?|--x|--\))\s*([A-Za-z0-9_$.-]+)\s*:?\s*(.*)$/,
  RE_NODE = /^([A-Za-z0-9_$.*-]+)\s*(?:\[([^\]]+)\]|\(\(?([^)]+)\)?\)|\{([^}]+)\})?$/,
  clean = (line) => line.trim().replace(/\s+%%.*$/, ""),
  unq = (str = "") => {
    const s = str.trim();
    return (s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'")
      ? s.slice(1, -1)
      : s;
  },
  nodeByRaw = (raw) => {
    const txt = clean(raw),
      match = txt.match(RE_NODE);
    if (!match) return [txt, unq(txt), 0];
    const [, id, box, round, diamond] = match;
    return [id, unq(box || round || diamond || id), diamond ? 2 : round ? 1 : 0];
  },
  addNode = (map, raw) => {
    const [id, label, shape] = nodeByRaw(raw),
      old = map.get(id);
    if (old) {
      if (label !== id) old[1] = label;
      if (shape) old[2] = shape;
      return old;
    }
    const node = [id, label, shape];
    map.set(id, node);
    return node;
  },
  parseFlow = (lines, head) => {
    const nodes = new Map(),
      edges = [],
      dir_match = head.match(/\b(TD|TB|BT|LR|RL)\b/i),
      dir = (dir_match ? dir_match[1] : "TD").toUpperCase();
    lines.forEach((line) => {
      const row = clean(line);
      if (!row) return;
      const match = row.match(RE_EDGE);
      if (match) {
        const [, from_raw, arrow, label = "", to_raw] = match,
          from = addNode(nodes, from_raw),
          to = addNode(nodes, to_raw);
        edges.push([from[0], to[0], unq(label), arrow]);
      } else {
        addNode(nodes, row);
      }
    });
    return [TYPE_FLOW, dir, Array.from(nodes.values()), edges];
  },
  parseSequence = (lines) => {
    const names = new Map(),
      edges = [],
      notes = [],
      add = (name) => {
        if (!names.has(name)) names.set(name, [name, name]);
      };
    lines.forEach((line) => {
      const row = clean(line);
      if (!row) return;
      const note = row.match(/^Note\s+(?:over|right of|left of)\s+([^:]+):\s*(.+)$/i);
      if (note) {
        const target = note[1]
          .split(",")
          .map((i) => i.trim())
          .filter(Boolean);
        target.forEach(add);
        notes.push([target, note[2]]);
        return;
      }
      const match = row.match(RE_SEQ);
      if (match) {
        const [, from, arrow, to, label] = match;
        add(from);
        add(to);
        edges.push([from, to, unq(label), arrow]);
      }
    });
    return [TYPE_SEQUENCE, "TD", Array.from(names.values()), edges, notes];
  },
  parseClass = (lines) => {
    const nodes = new Map(),
      edges = [];
    lines.forEach((line) => {
      const row = clean(line);
      if (!row) return;
      const rel = row.match(
        /^([A-Za-z0-9_$.-]+)\s+([<|*o. -]+--[>|*o. -]+)\s+([A-Za-z0-9_$.-]+)(?:\s*:\s*(.+))?$/,
      );
      if (rel) {
        const [, from, arrow, to, label = ""] = rel;
        addNode(nodes, from);
        addNode(nodes, to);
        edges.push([from, to, unq(label), arrow]);
        return;
      }
      const member = row.match(/^([A-Za-z0-9_$.-]+)\s*:\s*(.+)$/);
      if (member) {
        const item = addNode(nodes, member[1]);
        if (!item[1].includes(member[2])) item[1] += " " + member[2];
        return;
      }
      const cls = row.match(/^class\s+([A-Za-z0-9_$.-]+)/);
      if (cls) addNode(nodes, cls[1]);
    });
    return [TYPE_CLASS, "TD", Array.from(nodes.values()), edges];
  },
  parseState = (lines) => {
    const nodes = new Map(),
      edges = [];
    lines.forEach((line) => {
      const row = clean(line);
      if (!row) return;
      const edge = row.match(/^(.+?)\s+-->\s+(.+?)(?:\s*:\s*(.+))?$/);
      if (edge) {
        const [, from_raw, to_raw, label = ""] = edge,
          from = addNode(nodes, from_raw),
          to = addNode(nodes, to_raw);
        edges.push([from[0], to[0], unq(label), "-->"]);
        return;
      }
      addNode(nodes, row.replace(/^state\s+/, ""));
    });
    return [TYPE_STATE, "TD", Array.from(nodes.values()), edges];
  };

export { TYPE_FLOW, TYPE_SEQUENCE, TYPE_CLASS, TYPE_STATE };

export default (code = "") => {
  const lines = String(code)
      .replace(/\r/g, "")
      .split("\n")
      .map(clean)
      .filter((line) => line && !line.startsWith("%%")),
    head = lines.shift() || "flowchart TD",
    low = head.toLowerCase();
  if (low.startsWith("sequencediagram")) return parseSequence(lines);
  if (low.startsWith("classdiagram")) return parseClass(lines);
  if (low.startsWith("statediagram")) return parseState(lines);
  return parseFlow(lines, head);
};
