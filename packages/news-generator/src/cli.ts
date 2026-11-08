#!/usr/bin/env tsx
/**
 * News generator CLI (`pnpm news-gen <cmd>`). Kept apart from
 * packages/generator: this package talks to the Claude API, the other draws
 * pages, heroes and PDFs offline.
 *
 *   pnpm news-gen config            show the resolved settings (no API call)
 *   pnpm news-gen ping              one short request to prove the key works
 *   pnpm news-gen prompt <stage>    print the composed skill prompt for a stage
 *                                   (writer | editor | chief), no API call
 *   pnpm news-gen ask "<prompt>"    free-form prompt, prints text + usage
 *     --stage writer|editor|chief   use that stage's skill prompt and model
 *     --model <id>  --effort low|medium|high|xhigh|max  --system "<text>"
 *     --file <brief.md>             read the prompt from a file
 */
import Anthropic from "@anthropic-ai/sdk";
import { generate, MissingKeyError } from "./client.js";
import { readFileSync } from "node:fs";
import { getConfig } from "./config.js";
import { buildSystemPrompt, isStage, stageSettings, STAGES } from "./prompts.js";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

function printUsage(r: Awaited<ReturnType<typeof generate>>): void {
  const cost = r.costUsd === null ? "?" : `$${r.costUsd.toFixed(5)}`;
  console.error(
    `\n[${r.model}] stop=${r.stopReason} in=${r.usage.input} out=${r.usage.output} ` +
      `cache r/w=${r.usage.cacheRead}/${r.usage.cacheWrite} cost≈${cost}`,
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args.shift();

  switch (cmd) {
    case "config": {
      const c = getConfig();
      console.log({ ...c, apiKey: c.apiKey ? `${c.apiKey.slice(0, 10)}…` : "(not set)" });
      return;
    }
    case "ping": {
      const r = await generate({
        prompt: "Reply with exactly: pong",
        effort: "low",
        maxTokens: 2000,
      });
      console.log(r.text.trim());
      printUsage(r);
      return;
    }
    case "prompt": {
      const stage = args[0];
      if (!isStage(stage)) throw new Error(`Usage: pnpm news-gen prompt <${Object.keys(STAGES).join("|")}>`);
      const text = await buildSystemPrompt(stage);
      console.log(text);
      console.error(`\n[${stage}] ${stageSettings(stage).model}, ${text.length} chars (~${Math.round(text.length / 4)} tokens)`);
      return;
    }
    case "ask": {
      const stage = flag(args, "stage");
      if (stage !== undefined && !isStage(stage)) throw new Error(`Unknown stage "${stage}"`);
      const file = flag(args, "file");
      const st = stage ? stageSettings(stage) : undefined;
      const model = flag(args, "model") ?? st?.model;
      const effort = (flag(args, "effort") ?? st?.effort) as Parameters<typeof generate>[0]["effort"];
      const system = flag(args, "system") ?? (stage ? await buildSystemPrompt(stage) : undefined);
      const prompt = (file ? readFileSync(file, "utf8") : args.join(" ")).trim();
      if (!prompt) throw new Error('Usage: pnpm news-gen ask "<prompt>" (or --file brief.md)');
      const r = await generate({ prompt, model, effort, system });
      console.log(r.text);
      printUsage(r);
      return;
    }
    default:
      console.log("Commands: config | ping | prompt <stage> | ask \"<prompt>\" [--stage s] [--file f] [--model id] [--effort level] [--system text]");
      if (cmd) process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  if (err instanceof MissingKeyError) {
    console.error(err.message);
  } else if (err instanceof Anthropic.AuthenticationError) {
    console.error("The API rejected the key (401). Check ANTHROPIC_API_KEY.");
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error("Rate limited (429). Try again shortly.");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`API error ${err.status}: ${err.message}`);
  } else {
    console.error(err instanceof Error ? err.message : err);
  }
  process.exitCode = 1;
});
