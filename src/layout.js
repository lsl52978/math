import { TYPE_FLOW, TYPE_CLASS, TYPE_STATE } from "./parse.js";

const NODE_W_MIN = 96,
  NODE_H = 48,
  GAP_X = 64,
  GAP_Y = 76,
  PAD = 32,
  size = (label) => [Math.max(NODE_W_MIN, label.length * 8 + 36), NODE_H],
  rankFlow = (nodes, edges) => {
    const ids = nodes.map((n) => n[0]),
      indeg = new Map(ids.map((id) => [id, 0])),
      out = new Map(ids.map((id) => [id, []]));
    edges.forEach(([from, to]) => {
      if (!indeg.has(from) || !indeg.has(to)) return;
      indeg.set(to, indeg.get(to) + 1);
      out.get(from).push(to);
    });
    const queue = ids.filter((id) => indeg.get(id) === 0),
      rank = new Map(ids.map((id) => [id, 0]));
    for (let i = 0; i < queue.length; ++i) {
      const from = queue[i],
        next_rank = rank.get(from) + 1;
      out.get(from).forEach((to) => {
        if (rank.get(to) < next_rank) rank.set(to, next_rank);
        indeg.set(to, indeg.get(to) - 1);
        if (indeg.get(to) === 0) queue.push(to);
      });
    }
    return rank;
  },
  layoutGraph = (diagram) => {
    const [type, dir, nodes, edges] = diagram,
      rank = rankFlow(nodes, edges),
      by_rank = new Map(),
      pos = new Map(),
      is_lr = dir === "LR" || dir === "RL";
    nodes.forEach((node) => {
      const r =
        type === TYPE_FLOW || type === TYPE_CLASS || type === TYPE_STATE
          ? rank.get(node[0]) || 0
          : 0;
      if (!by_rank.has(r)) by_rank.set(r, []);
      by_rank.get(r).push(node);
    });
    let max_w = 0,
      max_h = 0;
    Array.from(by_rank.entries()).forEach(([r, group]) => {
      group.forEach((node, idx) => {
        const [w, h] = size(node[1]),
          x = PAD + (is_lr ? r * (NODE_W_MIN + GAP_X + 64) : idx * (NODE_W_MIN + GAP_X + 64)),
          y = PAD + (is_lr ? idx * (NODE_H + GAP_Y) : r * (NODE_H + GAP_Y));
        pos.set(node[0], [x, y, w, h]);
        max_w = Math.max(max_w, x + w + PAD);
        max_h = Math.max(max_h, y + h + PAD);
      });
    });
    return [max_w || 240, max_h || 120, pos];
  },
  layoutSequence = (diagram) => {
    const nodes = diagram[2],
      edges = diagram[3],
      notes = diagram[4],
      pos = new Map(),
      gap = 150,
      top = 44,
      height = Math.max(180, 130 + (edges.length + notes.length) * 58);
    nodes.forEach(([id, label], idx) => {
      const x = PAD + idx * gap,
        w = Math.max(NODE_W_MIN, label.length * 8 + 36);
      pos.set(id, [x, top, w, NODE_H]);
    });
    return [Math.max(260, PAD * 2 + Math.max(1, nodes.length) * gap), height, pos];
  };

export default (diagram) => (diagram[0] === 2 ? layoutSequence(diagram) : layoutGraph(diagram));
