#!/usr/bin/env bun
import { createOpencode } from "@opencode-ai/sdk";

const TASK =
    "You are improving a tiny Mermaid to SVG renderer. Run ./test.sh, inspect failures, make the smallest safe improvement, keep bundle size small, then summarize what changed.",
  main = async () => {
    const opencode = await createOpencode({
        config: {
          model: process.env.OPENCODE_MODEL || "anthropic/claude-3-5-sonnet-20241022",
        },
      }),
      { client } = opencode,
      session = await client.session.create({
        body: { title: "mermaid-svg-auto-loop" },
      });

    await client.session.prompt({
      path: { id: session.data.id },
      body: {
        parts: [
          {
            type: "text",
            text: TASK,
          },
        ],
      },
    });

    opencode.server.close();
  };

await main();
