import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generate, type GenerateResult } from "./client.js";
import { ROOT } from "./config.js";
import { buildSystemBlocks, stageSettings, type StageName } from "./prompts.js";

/** Splits a stage reply into its `=== NAME ===` sections (keys lower-cased). */
export function sections(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /^=== *([A-Z][A-Z ]*?) *===\s*$/gm;
  const marks = [...text.matchAll(re)];
  marks.forEach((m, i) => {
    const from = m.index! + m[0].length;
    const to = i + 1 < marks.length ? marks[i + 1].index! : text.length;
    out[m[1].toLowerCase()] = text.slice(from, to).trim();
  });
  return out;
}

export interface Verdict {
  approved: boolean;
  score: number | null;
}

export function parseVerdict(text: string): Verdict {
  const v = sections(text)["verdict"] ?? "";
  const first = v.split("\n")[0].replace(/[*`]/g, "").trim();
  const score = v.match(/(\d{1,3})\s*\/\s*100/);
  return { approved: /^APPROVED\b/.test(first), score: score ? Number(score[1]) : null };
}

const oneLine = (s: string | undefined) => (s ?? "").replace(/[*`]/g, "").split("\n")[0].trim().replace(/^["“]|["”]$/g, "");

/** Headline, description and body of a stage reply. */
export function articleOf(text: string): { headline: string; description: string; body: string } {
  const s = sections(text);
  return { headline: oneLine(s["headline"]), description: oneLine(s["description"]), body: s["article"] ?? "" };
}

/**
 * Applies the chief's `<<<FIND / >>>REPLACE / <<<END` fixes. A fix whose text
 * is missing or occurs more than once is skipped and reported, never guessed.
 */
export function applyFixes(body: string, fixesBlock: string | undefined): { body: string; applied: number; failed: string[] } {
  const failed: string[] = [];
  let applied = 0;
  for (const m of (fixesBlock ?? "").matchAll(/<<<FIND\n([\s\S]*?)\n>>>REPLACE\n?([\s\S]*?)\n?<<<END/g)) {
    const [find, repl] = [m[1], m[2]];
    const n = body.split(find).length - 1;
    if (n !== 1) {
      failed.push(`fix not applied (${n === 0 ? "text not found" : `${n} matches`}): "${find.slice(0, 70)}"`);
      continue;
    }
    body = body.replace(find, () => repl);
    applied++;
  }
  return { body, applied, failed };
}

/** The checks `pnpm news:abbrev` runs, applied to the generated text. */
export async function houseChecks(a: { headline: string; description: string; body: string }): Promise<string[]> {
  const lib = (f: string) => import(pathToFileURL(resolve(ROOT, "scripts/lib", f)).href);
  const { writingProblems, BANNED_NEW } = await lib("writing-rules.mjs");
  const { unexpandedAbbrevs } = await lib("abbrev.mjs");
  const out: string[] = [];
  const h = a.headline.length;
  if (h < 40 || h > 70) out.push(`headline is ${h} characters (40-70)`);
  const d = a.description.length;
  if (d < 120 || d > 155) out.push(`description is ${d} characters (120-155)`);
  const all = `${a.description}\n\n${a.body}`;
  out.push(...(writingProblems(all) as string[]));
  const lower = all.toLowerCase();
  const newBanned = (BANNED_NEW as string[]).filter((w) => new RegExp(`\\b${w.replace(/[-']/g, ".")}\\b`).test(lower));
  if (newBanned.length) out.push(`banned in new stories (02-WRITING-NEW): ${newBanned.join(", ")}`);
  const ab = unexpandedAbbrevs(all) as unknown;
  const abList = Array.isArray(ab) ? ab : ab instanceof Set ? [...ab] : [];
  if (abList.length) out.push(`abbreviations not expanded on first use: ${abList.join(", ")}`);
  const words = a.body.split(/\s+/).filter(Boolean).length;
  if (words < 300) out.push(`body is ${words} words (300 minimum)`);
  return out;
}

interface StepLog {
  step: string;
  model: string;
  usage: GenerateResult["usage"];
  costUsd: number | null;
  seconds: number;
}

export interface PipelineResult {
  dir: string;
  verdict: Verdict;
  article: { headline: string; description: string; body: string };
  problems: string[];
  steps: StepLog[];
  costUsd: number;
}

/**
 * Writer -> SEO editor -> chief editor, passing each stage's full output on
 * (skill §10). If the chief returns REVISE, the editor gets one more pass
 * with the chief's report, then the chief judges again. Every reply and a
 * run.json land in `dir`; nothing is written into apps/news.
 */
export async function runPipeline(brief: string, dir: string, opts: { maxRevisions?: number; log?: (s: string) => void } = {}): Promise<PipelineResult> {
  const log = opts.log ?? ((s: string) => console.error(s));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "0-brief.md"), brief);
  const steps: StepLog[] = [];

  const call = async (stage: StageName, step: string, prompt: string): Promise<string> => {
    const { model, effort } = stageSettings(stage);
    log(`→ ${step} (${model}, effort ${effort})…`);
    const t = Date.now();
    const r = await generate({ system: await buildSystemBlocks(stage), prompt, model, effort, maxTokens: 64000 });
    const seconds = Math.round((Date.now() - t) / 1000);
    steps.push({ step, model: r.model, usage: r.usage, costUsd: r.costUsd, seconds });
    writeFileSync(resolve(dir, `${steps.length}-${step}.md`), r.text);
    log(`  done in ${seconds}s, in=${r.usage.input} out=${r.usage.output} cache r/w=${r.usage.cacheRead}/${r.usage.cacheWrite} ≈$${(r.costUsd ?? 0).toFixed(4)}`);
    return r.text;
  };

  const draft = await call("writer", "writer", `# Brief\n\n${brief}`);
  const draftS = sections(draft);
  const writerNotes = `# Sources used (from the writer)\n\n${draftS["sources"] ?? "(none listed)"}\n\n# Facts needed (from the writer)\n\n${draftS["facts needed"] ?? "(none listed)"}`;

  let edited = await call("editor", "editor", `# Brief\n\n${brief}\n\n# Stage 1 output (full)\n\n${draft}`);
  let final = await call(
    "chief",
    "chief",
    `# Brief\n\n${brief}\n\n${writerNotes}\n\n# Stage 2 output (full)\n\n${edited}`,
  );
  let verdict = parseVerdict(final);

  /** The editor's article with the chief's headline, description and fixes applied. */
  const merge = () => {
    const ed = articleOf(edited);
    const ch = articleOf(final);
    const fx = applyFixes(ed.body, sections(final)["fixes"]);
    log(`  chief: ${verdict.approved ? "APPROVED" : "REVISE"} (${verdict.score ?? "?"}/100), ${fx.applied} fixes applied${fx.failed.length ? `, ${fx.failed.length} failed` : ""}`);
    return { article: { headline: ch.headline || ed.headline, description: ch.description || ed.description, body: fx.body }, failed: fx.failed };
  };
  let merged = merge();

  for (let i = 0; !verdict.approved && i < (opts.maxRevisions ?? 1); i++) {
    const cs = sections(final);
    const a = merged.article;
    edited = await call(
      "editor",
      `editor-r${i + 1}`,
      `# Brief\n\n${brief}\n\n# Current article (chief's fixes applied; revise this version)\n\n` +
        `=== HEADLINE ===\n${a.headline}\n=== DESCRIPTION ===\n${a.description}\n=== ARTICLE ===\n${a.body}\n\n` +
        `# Fix every point in the chief editor's verdict and report\n\n${cs["verdict"] ?? ""}\n\n${cs["report"] ?? ""}`,
    );
    final = await call("chief", `chief-r${i + 1}`, `# Brief\n\n${brief}\n\n${writerNotes}\n\n# Stage 2 output (full)\n\n${edited}`);
    verdict = parseVerdict(final);
    merged = merge();
  }

  const fs = sections(final);
  const article = merged.article;
  const problems = [...merged.failed, ...(await houseChecks(article))];
  const costUsd = steps.reduce((s, x) => s + (x.costUsd ?? 0), 0);

  writeFileSync(
    resolve(dir, "final.md"),
    `# ${article.headline}\n\n> ${article.description}\n\n${article.body}\n`,
  );
  writeFileSync(resolve(dir, "run.json"), JSON.stringify({ verdict, problems, costUsd, steps, report: fs["report"] ?? null }, null, 2));
  return { dir, verdict, article, problems, steps, costUsd };
}
