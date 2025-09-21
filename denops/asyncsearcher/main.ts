// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2025/09/21 20:53:09.
// =============================================================================

import * as _ from "@es-toolkit/es-toolkit";
import * as fn from "@denops/std/function";
import * as fs from "@std/fs";
import * as path from "@std/path";
import * as toml from "@std/toml";
import * as vars from "@denops/std/variable";
import type { Denops, Entrypoint } from "@denops/std";
import { TextLineStream } from "@std/streams";
import { abortable } from "@std/async/abortable";
import { batch } from "@denops/std/batch";
import { echo, input } from "@denops/std/helper";
import { parseArgs } from "@std/cli";
import { z } from "zod";

const ToolSchema = z.object({
  name: z.string(),
  cmd: z.string(),
  arg: z.array(z.string()),
});

async function* iterLine(r: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const lines = r
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of lines) {
    const l = z.string().parse(line);
    if (l.length) {
      yield l;
    }
  }
}

export const main: Entrypoint = async (denops: Denops) => {
  // debug.
  const debug = await vars.g.get(denops, "asyncsearcher_debug", false);
  // deno-lint-ignore no-explicit-any
  const clog = (...data: any[]): void => {
    if (debug) {
      console.log(...data);
    }
  };

  const pathname = new URL(".", import.meta.url);
  const dir = path.fromFileUrl(pathname);
  const config = path.join(dir, "config.toml");
  let cfg = toml.parse(await Deno.readTextFile(config));
  clog({ cfg });

  // User config.
  const userToml = z.string().parse(
    await fn.expand(
      denops,
      await vars.g.get(denops, "asyncsearcher_cfg_path", "~/.asyncsearcher.toml"),
    ),
  );
  clog(`g:asyncsearcher_cfg_path = ${userToml}`);
  if (await fs.exists(userToml)) {
    clog(`Use user config: ${userToml}`);
    cfg = toml.parse(await Deno.readTextFile(userToml));
  }

  clog({ cfg });

  const tools = ToolSchema.array().parse(cfg.tool);
  clog({ tools });

  // Set default tool name.
  const executable = tools.find(async (x) => await fn.executable(denops, x.cmd));
  const def = tools.find((x) => x.name === "default") ?? executable;
  clog({ def });

  let p: Deno.ChildProcess;
  let abortController = new AbortController();

  denops.dispatcher = {
    async asyncsearch(...args: unknown[]): Promise<void> {
      try {
        clog({ args });
        const arg = z.array(z.string()).parse(args);
        const a = parseArgs(arg);
        const dir = a.path ?? await input(denops, {
          prompt: "Search directory: ",
          text: await fn.getcwd(denops),
          completion: "dir",
        });
        clog({ dir });
        let pattern = a._.length > 0 ? a._.join(" ") : "";
        if (pattern === "") {
          const userInput = await input(denops, {
            prompt: "Search for pattern: ",
          });
          if (userInput == null || userInput === "") {
            clog(`input is nothing ! so cancel !`);
            await echo(denops, `asyncsearch: cancel !`);
            return;
          }
          pattern = userInput;
        }
        const tool = a.tool ? tools.find((x) => x.name === a.tool) : def;
        clog({ pattern });
        clog({ tool });
        if (!tool) {
          console.warn(`Search tool [${a.tool}] is not found !`);
          return;
        }
        const userArg = arg.filter(
          (x) => ![...a._, `--tool=${tool.name}`, `--path=${dir}`].includes(x),
        );
        clog({ userArg });

        const toolArg = [...tool.arg, ...userArg];
        const cmdArgs = [...toolArg, pattern];
        clog(`pid: ${p?.pid}`);
        try {
          clog("kill process");
          abortController.abort();
          p.kill("SIGTERM");
        } catch (e) {
          clog(e);
        }
        abortController = new AbortController();
        const expandDir = path.resolve(z.string().parse(await fn.expand(denops, dir)));
        clog({ cmdArgs, expandDir });

        clog(`--- asyncsearch start ---`);

        p = new Deno.Command(tool.cmd, {
          args: cmdArgs,
          stdin: "null",
          stdout: "piped",
          stderr: "piped",
          cwd: expandDir,
        }).spawn();

        clog(`pid: ${p?.pid}`);
        await batch(denops, async (denops) => {
          await fn.setqflist(denops, [], " ", {
            title: `[Search results for ${pattern} on ${tool.cmd} path: ${expandDir}]`,
          });
          await denops.cmd("botright copen");
        });

        if (!p || p.stdout === null) {
          return;
        }
        for await (
          let line of abortable(
            iterLine(p.stdout),
            abortController.signal,
          )
        ) {
          clog({ line });
          line = line.trim();
          const lsp = line.split(":");
          if (!path.isAbsolute(lsp[0])) {
            const absolute = path.join(expandDir, lsp[0]);
            line = [absolute, ...lsp.slice(1)].join(":");
          }
          await fn.setqflist(denops, [], "a", { lines: [line] });
        }

        clog(`--- asyncsearch end ---`);

        const status = await p.status;
        if (!status.success) {
          for await (
            const line of abortable(
              iterLine(p.stderr),
              abortController.signal,
            )
          ) {
            clog({ line });
          }
        }
      } catch (e) {
        clog(e);
      }
    },
  };

  clog("asyncsearcher has loaded");
};
