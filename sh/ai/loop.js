#!/usr/bin/env bun
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createOpencode } from "@opencode-ai/sdk";

const ROOT = join(import.meta.dirname, "..", ".."),
  LOG_DIR = join(ROOT, ".tmp"),
  LOG = join(LOG_DIR, "ai-loop.log"),
  MODEL = process.env.OPENCODE_MODEL || "anthropic/claude-3-5-sonnet-20241022",
  MAX_ROUNDS = Number(process.env.AI_LOOP_ROUNDS || 5),
  TEST_CMD = process.env.AI_LOOP_TEST || "./test.sh",
  FINAL_CMD = process.env.AI_LOOP_FINAL || "bun run pages:build",
  DECODER = new TextDecoder(),
  tail = (txt, max = 12000) => (txt.length > max ? txt.slice(txt.length - max) : txt),
  log = (txt) => {
    console.log(txt);
    appendFileSync(LOG, txt + "\n");
  },
  run = (cmd) => {
    const res = Bun.spawnSync(["bash", "-lc", cmd], {
        cwd: ROOT,
        stdout: "pipe",
        stderr: "pipe",
      }),
      out = DECODER.decode(res.stdout) + DECODER.decode(res.stderr);
    return [res.exitCode === 0, out, res.exitCode];
  },
  promptByFail = (round, cmd, code, out) =>
    "You are improving a tiny Mermaid to SVG renderer.\n" +
    "This is controller round " +
    round +
    " of " +
    MAX_ROUNDS +
    ".\n\n" +
    "The command `" +
    cmd +
    "` failed with exit code " +
    code +
    ". Fix the failure with the smallest safe code change.\n\n" +
    "Rules:\n" +
    "- Do not broaden Mermaid support unless the failing test requires it.\n" +
    "- Keep `lib/svg.js` small and fast.\n" +
    "- Prefer editing source/tests over generated files unless a build command regenerates them.\n" +
    "- After changes, summarize what changed and why.\n\n" +
    "Failure log tail:\n\n" +
    tail(out),
  main = async () => {
    mkdirSync(LOG_DIR, { recursive: true });
    log("AI loop model: " + MODEL);
    log("Test command: " + TEST_CMD);
    log("Max rounds: " + MAX_ROUNDS);

    let opencode,
      client,
      session,
      last_fail = "";

    for (let round = 1; round <= MAX_ROUNDS; ++round) {
      log("\n== Round " + round + " ==");
      const [ok, out, code] = run(TEST_CMD);
      let fail_cmd = TEST_CMD,
        fail_code = code;
      appendFileSync(LOG, out + "\n");

      if (ok) {
        log("Tests passed.");
        const [final_ok, final_out, final_code] = run(FINAL_CMD);
        appendFileSync(LOG, final_out + "\n");
        if (final_ok) {
          log("Final command passed: " + FINAL_CMD);
          opencode?.server.close();
          process.exit(0);
        }
        log("Final command failed with exit code " + final_code + ".");
        fail_cmd = FINAL_CMD;
        fail_code = final_code;
        last_fail = final_out;
      } else {
        log("Tests failed with exit code " + code + ".");
        last_fail = out;
      }

      if (!opencode) {
        opencode = await createOpencode({
          config: {
            model: MODEL,
          },
        });
        client = opencode.client;
        session = await client.session.create({
          body: { title: "mermaid-svg-auto-loop" },
        });
      }

      await client.session.prompt({
        path: { id: session.data.id },
        body: {
          parts: [
            {
              type: "text",
              text: promptByFail(round, fail_cmd, fail_code ?? 1, last_fail),
            },
          ],
        },
      });
    }

    opencode?.server.close();
    log("AI loop stopped after " + MAX_ROUNDS + " rounds without a clean pass.");
    process.exit(1);
  };

process.on("SIGINT", () => {
  log("AI loop interrupted.");
  process.exit(130);
});

await main();
