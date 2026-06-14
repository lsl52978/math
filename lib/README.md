[English](#en) | [中文](#zh)

---

<a id="en"></a>

# mermaid-svg-renderer

Tiny and fast Mermaid to SVG renderer.

This project keeps a compact engineering style: small source files, zero runtime dependency for the renderer, extracted regression tests, a Vite demo site, multilingual UI, and simple size/performance checks.

## Features

- Converts a practical Mermaid subset directly to SVG strings.
- Supports `flowchart` / `graph`, basic `sequenceDiagram`, simple `classDiagram`, and simple `stateDiagram-v2`.
- Produces standalone SVG with embedded theme CSS.
- Includes light, mint, and dark themes inspired by beautiful Mermaid styles.
- Keeps the renderer independent from `mermaid`, D3, DOM, Canvas, or browser-only APIs.

## Usage

```javascript
import mermaidSvg from "mermaid-svg-renderer";

const svg = mermaidSvg("flowchart TD\n  A[Mermaid] --> B[SVG]");
```

The optional second parameter selects a theme:

```javascript
const svg = mermaidSvg(code, 1);
```

## Development

```bash
bun install
bun dev.js
```

The demo is served by Vite from `demo/` on port `9999`.

Build the library:

```bash
bun minify.js
```

Run the full local check:

```bash
./test.sh
```

## Test Extraction

`extract/run.js` scans these repositories and keeps only diagrams supported by this renderer:

- `probelabs/maid`
- `lukilabs/beautiful-mermaid`
- `mermaid-js/mermaid`

It writes generated cases to `test/*.yml`. Every generated case is expected to pass.

```bash
bun extract/run.js
bun minify.js
bun test test/compare.test.js
```

## Demo And Deployment

The demo page supports:

- Mermaid input and live SVG preview.
- Example cards for different diagram types.
- Theme switching.
- GZIP size comparison with beautiful-mermaid CDN code.
- Existing multilingual selector with 70+ languages.

Cloudflare Pages:

- GitHub repository: `https://github.com/lsl52978/math`
- Build command: `bun run pages:build`
- Output directory: `demo/dist`
- Manual deploy command: `bun run pages:deploy`

## AI Development Loop

`sh/ai/loop.js` shows how to use the OpenCode SDK as an automated development loop. It creates a session, asks the agent to run checks, make the smallest safe improvement, and summarize the result.

```bash
bun sh/ai/loop.js
```

The loop is intentionally a development tool only. The renderer itself does not depend on OpenCode.

---

<a id="zh"></a>

# mermaid-svg-renderer

最小最快的 Mermaid 转 SVG 渲染器。

本项目保持紧凑的工程风格：小体积源码、渲染器零运行时依赖、从外部项目抽取回归测试、Vite 演示站、多语言 UI，以及体积/性能检查。

## 功能

- 将实用 Mermaid 子集直接转换为 SVG 字符串。
- 支持 `flowchart` / `graph`、基础 `sequenceDiagram`、简单 `classDiagram` 和简单 `stateDiagram-v2`。
- 输出带内联主题 CSS 的独立 SVG。
- 提供 light、mint、dark 三种受 beautiful Mermaid 风格启发的主题。
- 渲染器不依赖 `mermaid`、D3、DOM、Canvas 或浏览器专用 API。

## 使用

```javascript
import mermaidSvg from "mermaid-svg-renderer";

const svg = mermaidSvg("flowchart TD\n  A[Mermaid] --> B[SVG]");
```

第二个参数可以切换主题：

```javascript
const svg = mermaidSvg(code, 1);
```

## 开发

```bash
bun install
bun dev.js
```

demo 由 Vite 启动，根目录是 `demo/`，端口是 `9999`。

构建库：

```bash
bun minify.js
```

完整本地检查：

```bash
./test.sh
```

## 测试抽取

`extract/run.js` 会扫描下面三个仓库，并只保留本渲染器支持的图表：

- `probelabs/maid`
- `lukilabs/beautiful-mermaid`
- `mermaid-js/mermaid`

抽取结果写入 `test/*.yml`，生成的用例都应该能跑通。

```bash
bun extract/run.js
bun minify.js
bun test test/compare.test.js
```

## Demo 与部署

页面支持：

- 输入 Mermaid 并实时预览 SVG。
- 展示不同类型的 Mermaid 示例图。
- 主题切换。
- 与 beautiful-mermaid CDN 代码做 GZIP 体积对比。
- 复用原项目 70 多种语言的国际化选择器。

Cloudflare Pages：

- GitHub 仓库：`https://github.com/lsl52978/math`
- 构建命令：`bun run pages:build`
- 输出目录：`demo/dist`
- 手动部署命令：`bun run pages:deploy`

## AI 自动开发循环

`sh/ai/loop.js` 演示如何使用 OpenCode SDK 做自动开发循环：创建 session，让 agent 运行检查、做最小安全改动，并总结结果。

```bash
bun sh/ai/loop.js
```

这个循环只用于开发阶段，渲染器本身不依赖 OpenCode。
