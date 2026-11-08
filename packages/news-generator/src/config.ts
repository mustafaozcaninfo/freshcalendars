import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root (packages/news-generator/src -> ../../..). */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Reads the repo's `.env` (git-ignored) into process.env without overwriting
 * values already set, so a key exported in the shell or in CI wins.
 */
export function loadEnv(file = resolve(ROOT, ".env")): void {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, key, raw] = m;
    const value = raw.replace(/^(['"])(.*)\1$/, "$2");
    if (value && process.env[key] === undefined) process.env[key] = value;
  }
}

export interface GenConfig {
  apiKey: string | undefined;
  /** Default model for writing; override with NEWS_GEN_MODEL. */
  model: string;
  /** Cheaper model for research/extraction steps; override with NEWS_GEN_FAST_MODEL. */
  fastModel: string;
  /**
   * Stage models. Opus writes; Sonnet edits and judges (the chief returns a
   * verdict and find-and-replace fixes, not a rewrite). Measured Nov. 8, 2026:
   * Opus/Sonnet/Opus at high effort cost about $0.52 per story.
   */
  writerModel: string;
  editorModel: string;
  chiefModel: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  /**
   * Always the public API unless NEWS_GEN_BASE_URL says otherwise. We do not
   * read ANTHROPIC_BASE_URL on purpose: Claude Code sessions set it to their own
   * proxy, and the generator must not ride on that.
   */
  baseURL: string;
}

export function getConfig(): GenConfig {
  loadEnv();
  const effort = (process.env.NEWS_GEN_EFFORT ?? "medium") as GenConfig["effort"];
  const model = process.env.NEWS_GEN_MODEL ?? "claude-opus-5-5";
  return {
    apiKey: process.env.NEWS_GEN_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    model,
    fastModel: process.env.NEWS_GEN_FAST_MODEL ?? "claude-haiku-5-5",
    writerModel: process.env.NEWS_GEN_WRITER_MODEL ?? model,
    editorModel: process.env.NEWS_GEN_EDITOR_MODEL ?? "claude-sonnet-5-5",
    chiefModel: process.env.NEWS_GEN_CHIEF_MODEL ?? "claude-sonnet-5-5",
    effort,
    baseURL: process.env.NEWS_GEN_BASE_URL ?? "https://api.anthropic.com",
  };
}

/** USD per million tokens (input, output), for the cost line after each call. */
export const PRICES: Record<string, [number, number]> = {
  "claude-fable-5-1": [10, 50],
  "claude-opus-5-5": [4, 20],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};
