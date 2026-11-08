import Anthropic from "@anthropic-ai/sdk";
import { getConfig, PRICES, type GenConfig } from "./config.js";

export interface GenerateOptions {
  system?: string;
  prompt: string;
  model?: string;
  effort?: GenConfig["effort"];
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  stopReason: string | null;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
  costUsd: number | null;
}

export class MissingKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. Put it in the repo's .env (git-ignored) or export it: " +
        "ANTHROPIC_API_KEY=sk-ant-... (NEWS_GEN_ANTHROPIC_API_KEY takes precedence if both are set).",
    );
  }
}

let cached: Anthropic | undefined;

export function getClient(cfg = getConfig()): Anthropic {
  if (!cfg.apiKey) throw new MissingKeyError();
  cached ??= new Anthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, maxRetries: 3 });
  return cached;
}

/**
 * One text generation. Streams under the hood (long stories would otherwise
 * hit HTTP timeouts) and returns the final message. A policy decline on the
 * main model is retried server-side on a fallback model (`fallbacks: "default"`).
 */
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const cfg = getConfig();
  const client = getClient(cfg);
  const model = opts.model ?? cfg.model;

  const stream = client.beta.messages.stream({
    model,
    max_tokens: opts.maxTokens ?? 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort ?? cfg.effort },
    // The skill prompt is large and identical across stories: cache it.
    ...(opts.system
      ? { system: [{ type: "text" as const, text: opts.system, cache_control: { type: "ephemeral" as const } }] }
      : {}),
    messages: [{ role: "user", content: opts.prompt }],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    const d = msg.stop_details;
    throw new Error(`Model declined (${d?.category ?? "no category"}): ${d?.explanation ?? ""}`);
  }

  const text = msg.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const u = msg.usage;
  const usage = {
    input: u.input_tokens,
    output: u.output_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
  };
  const price = PRICES[msg.model];
  const costUsd = price
    ? ((usage.input + usage.cacheWrite * 1.25 + usage.cacheRead * 0.1) * price[0] + usage.output * price[1]) / 1e6
    : null;

  return { text, model: msg.model, stopReason: msg.stop_reason, usage, costUsd };
}
