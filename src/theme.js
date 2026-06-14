export const THEME_DEFAULT = 0,
  THEME_MINT = 1,
  THEME_DARK = 2,
  THEMES = [
    ["#ffffff", "#f8fafc", "#e2e8f0", "#0f172a", "#64748b", "#2563eb", "#dbeafe"],
    ["#fbfffe", "#f0fdfa", "#99f6e4", "#134e4a", "#0f766e", "#14b8a6", "#ccfbf1"],
    ["#0f172a", "#111827", "#334155", "#e5e7eb", "#94a3b8", "#38bdf8", "#082f49"],
  ],
  theme = (id = THEME_DEFAULT) => THEMES[id] || THEMES[THEME_DEFAULT];
