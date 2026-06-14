export const THEME_DEFAULT = 0,
  THEME_MINT = 1,
  THEME_DARK = 2,
  THEME_SOLARIZED = 3,
  THEMES = [
    ["#ffffff", "#f8fafc", "#e2e8f0", "#0f172a", "#64748b", "#2563eb", "#dbeafe"],
    ["#fbfffe", "#f0fdfa", "#99f6e4", "#134e4a", "#0f766e", "#14b8a6", "#ccfbf1"],
    ["#282a36", "#1f2130", "#44475a", "#f8f8f2", "#bd93f9", "#ff79c6", "#3b3054"],
    ["#fdf6e3", "#eee8d5", "#d6cdb4", "#073642", "#657b83", "#268bd2", "#e5dec8"],
  ],
  theme = (id = THEME_DEFAULT) => THEMES[id] || THEMES[THEME_DEFAULT];
