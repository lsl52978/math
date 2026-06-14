import DIAGRAMS from "./const/diagrams.js";
import LANG_CODES from "./webc/I18n/CODE.js";
import "./webc/Scroll.js";
import "./webc/I18n.js";
import { onLang } from "./webc/js/i18n.js";
import compile from "../lib/svg.js";

let current_translation,
  theme_id = 0;

const input = document.getElementById("diagram-input"),
  preview = document.getElementById("svg-preview"),
  grid = document.getElementById("diagrams-grid"),
  theme_buttons = document.querySelectorAll("[data-theme]"),
  adjustHeight = () => {
    const { style, scrollHeight } = input;
    style.height = "auto";
    style.height = scrollHeight + "px";
  },
  renderDiagram = (val) => {
    try {
      preview.innerHTML = compile(val, theme_id);
    } catch {
      preview.textContent = val;
    }
  },
  selectDiagram = (diagram) => {
    input.value = diagram;
    renderDiagram(diagram);
    adjustHeight();
    input.focus();
    input.setSelectionRange(diagram.length, diagram.length);
  },
  i18n_modules = import.meta.glob("./i18n/*.js"),
  loadLang = async (code) => {
    const path = "./i18n/" + code + ".js",
      load = i18n_modules[path] || i18n_modules["./i18n/en.js"],
      mod = await load();
    return mod.default();
  },
  layoutWaterfall = () => {
    const { clientWidth: container_width } = grid,
      gap = 24,
      cards = grid.querySelectorAll(".diagram-card");

    let num_cols = 1;
    if (container_width > 968) {
      num_cols = 3;
    } else if (container_width > 600) {
      num_cols = 2;
    }

    const card_width = (container_width - (num_cols - 1) * gap) / num_cols,
      col_heights = Array.from({ length: num_cols }, () => 0);

    cards.forEach((card) => {
      let min_col = 0;
      for (let i = 1; i < num_cols; ++i) {
        if (col_heights[i] < col_heights[min_col]) {
          min_col = i;
        }
      }

      const { style } = card;
      style.width = card_width + "px";
      style.left = min_col * (card_width + gap) + "px";
      style.top = col_heights[min_col] + "px";

      col_heights[min_col] += card.offsetHeight + gap;
    });

    grid.style.height = Math.max(...col_heights) + "px";
  },
  updateUI = () => {
    const {
        title,
        subtitle,
        diagrams_title,
        benchmark_size_title,
        benchmark_size_tip,
        benchmark_speed_title,
        benchmark_speed_tip,
        editor_title,
        editor_tip,
        usage_title,
        source_code,
        editor_placeholder,
        names,
        comment_import,
        comment_compile,
        usage_diagram,
      } = current_translation,
      usage_code =
        "// " +
        comment_compile +
        " (mermaid-svg-renderer)\n" +
        "import mermaidSvg from 'mermaid-svg-renderer';\n\n" +
        "// " +
        comment_import +
        "\n" +
        "const svg = mermaidSvg('" +
        usage_diagram.replace(/\\/g, "\\\\").replace(/\n/g, "\\n") +
        "');";

    [
      ["ui-title", title],
      ["ui-diagrams-title", diagrams_title],
      ["ui-editor-title", editor_title],
      ["ui-editor-tip", editor_tip],
      ["ui-usage-title", usage_title],
      ["ui-source-link", source_code],
      ["ui-usage-code", usage_code],
      ["ui-benchmark-size-title", benchmark_size_title],
      ["ui-benchmark-size-tip", benchmark_size_tip],
      ["ui-benchmark-speed-title", benchmark_speed_title],
      ["ui-benchmark-speed-tip", benchmark_speed_tip],
    ].forEach(([id, txt]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    });

    const subtitle_el = document.getElementById("ui-subtitle");
    if (subtitle_el) subtitle_el.innerHTML = subtitle;

    input.placeholder = editor_placeholder;

    const cards = DIAGRAMS.map((diagram, idx) => {
      const card = document.createElement("div"),
        h3 = document.createElement("h3"),
        code = document.createElement("div"),
        render_box = document.createElement("div");

      card.className = "diagram-card Lg";
      card.onclick = () => {
        selectDiagram(diagram);
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      h3.textContent = names[idx] || "Diagram " + (idx + 1);

      code.className = "diagram-code";
      code.textContent = diagram;

      render_box.className = "rendered-diagram rendered-svg";
      render_box.innerHTML = compile(diagram, theme_id);

      card.append(h3, code, render_box);
      return card;
    });

    grid.innerHTML = "";
    grid.append(...cards);
    ro.disconnect();
    cards.forEach((card) => ro.observe(card));
  },
  init = async () => {
    onLang(async (id) => {
      const code = LANG_CODES[id];
      if (code) {
        current_translation = await loadLang(code);
        updateUI();
        setTimeout(layoutWaterfall, 50);
      }
    });

    input.value = DIAGRAMS[0];
    renderDiagram(input.value);
    adjustHeight();
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            input.focus();
            obs.disconnect();
          }
        });
      },
      { threshold: 1.0 },
    );
    obs.observe(input);

    input.oninput = () => {
      renderDiagram(input.value);
      adjustHeight();
    };

    theme_buttons.forEach((btn) => {
      btn.onclick = () => {
        theme_id = Number(btn.dataset.theme);
        theme_buttons.forEach((item) => item.classList.toggle("active", item === btn));
        renderDiagram(input.value);
        updateUI();
        setTimeout(layoutWaterfall, 50);
      };
    });

    // SVG 尺寸会随主题与容器变化，预览渲染后重新布局卡片。
    setTimeout(layoutWaterfall, 50);
    setTimeout(layoutWaterfall, 300);

    window.addEventListener("resize", () => {
      layoutWaterfall();
    });
  };

const ro = new ResizeObserver(() => {
  layoutWaterfall();
});

init();
