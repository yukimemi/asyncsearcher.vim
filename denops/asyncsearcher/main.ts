// =============================================================================
// File        : main.ts
// Author      : yukimemi
// Last Change : 2024/10/13 18:39:04.
// =============================================================================

import * as _ from "jsr:@es-toolkit/es-toolkit@1.26.1";
import * as fn from "https://deno.land/x/denops_std@v6.5.1/function/mod.ts";
import * as fs from "https://deno.land/std@0.224.0/fs/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v6.5.1/helper/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import * as toml from "https://deno.land/std@0.224.0/toml/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v6.5.1/variable/mod.ts";
import type { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/mod.ts";
import { abortable } from "https://deno.land/std@0.224.0/async/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v6.5.1/batch/mod.ts";
import { parseArgs } from "jsr:@std/cli@1.0.6";
import { z } from "npm:zod@3.23.8";

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

export async function main(denops: Denops): Promise<void> {
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
        const dir = a.path ?? await helper.input(denops, {
          prompt: "Search directory: ",
          text: await fn.getcwd(denops),
          completion: "dir",
        });
        clog({ dir });
        let pattern = a._.length > 0 ? a._.join(" ") : "";
        if (pattern === "") {
          const userInput = await helper.input(denops, {
            prompt: "Search for pattern: ",
          });
          if (userInput == null || userInput === "") {
            clog(`input is nothing ! so cancel !`);
            await helper.echo(denops, `asyncsearch: cancel !`);
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
          const lsp = line.split("|");
          if (!path.isAbsolute(lsp[0])) {
            const absolute = path.join(expandDir, lsp[0]);
            line = [absolute, ...lsp.slice(1, -1)].join("|");
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

  await helper.execute(
    denops,
    `
    function! s:${denops.name}_notify(method, params) abort
      call denops#plugin#wait_async('${denops.name}', function('denops#notify', ['${denops.name}', a:method, a:params]))
    endfunction
    command! -nargs=* AsyncSearch call s:${denops.name}_notify('asyncsearch', [<f-args>])
  `,
  );

  clog("asyncsearcher has loaded");
}
