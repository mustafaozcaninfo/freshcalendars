import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, getConfig, type GenConfig } from "./config.js";

const SKILLS = resolve(ROOT, "packages/news-generator/skills");

export type StageName = "writer" | "editor" | "chief";

interface StageDef {
  file: string;
  /** Which config model runs this stage. */
  model: (c: GenConfig) => string;
  effort: GenConfig["effort"];
}

/** The skill's three stages. Effort per stage: NEWS_GEN_<STAGE>_EFFORT. */
export const STAGES: Record<StageName, StageDef> = {
  writer: { file: "1-writer.md", model: (c) => c.writerModel, effort: "medium" },
  editor: { file: "2-seo-editor.md", model: (c) => c.editorModel, effort: "medium" },
  chief: { file: "3-chief-editor.md", model: (c) => c.chiefModel, effort: "medium" },
};

export function isStage(s: string | undefined): s is StageName {
  return !!s && s in STAGES;
}

const read = (p: string) => readFileSync(p, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();

/**
 * Fills {{BANNED_EN}} etc. from the same module the SEO audit uses, so the
 * prompt and the check never drift apart.
 */
async function fillPlaceholders(text: string): Promise<string> {
  const rules = (await import(pathToFileURL(resolve(ROOT, "scripts/lib/writing-rules.mjs")).href)) as {
    BANNED_EN: string[];
    BANNED_NEW: string[];
    MAX_EM_DASHES: number;
  };
  const vars: Record<string, string> = {
    BANNED_EN: rules.BANNED_EN.join(", "),
    BANNED_NEW: rules.BANNED_NEW.join(", "),
    MAX_EM_DASHES: String(rules.MAX_EM_DASHES),
    OUTPUT_FORMAT:
      "Output format: start each section with its marker on a line of its own, exactly as written " +
      "(for example `=== ARTICLE ===`), and nothing before the first marker. Markdown headings inside " +
      "the article are fine; the markers are what separate the sections.",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => vars[k] ?? m);
}

/**
 * Core skill + house rules (sorted by file name), then the stage's role, as two
 * blocks: the first is the same for every stage, so it is the cache breakpoint
 * and stages on the same model (writer and chief) read it from the cache.
 */
export async function buildSystemBlocks(stage: StageName): Promise<[string, string]> {
  const core = read(resolve(SKILLS, "elite-english-content-engine/SKILL.md"));
  const houseDir = resolve(SKILLS, "house-rules");
  const house = readdirSync(houseDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => read(resolve(houseDir, f)));
  const shared = [
    core,
    "------------------------------------------------------------------------",
    "# HOUSE RULES (these override the content engine above where they disagree)",
    ...house,
  ].join("\n\n");
  const role = ["------------------------------------------------------------------------", read(resolve(SKILLS, "stages", STAGES[stage].file))].join("\n\n");
  return [await fillPlaceholders(shared), await fillPlaceholders(role)];
}

export async function buildSystemPrompt(stage: StageName): Promise<string> {
  return (await buildSystemBlocks(stage)).join("\n\n");
}

export function stageSettings(stage: StageName, cfg = getConfig()) {
  const env = process.env[`NEWS_GEN_${stage.toUpperCase()}_EFFORT`] as GenConfig["effort"] | undefined;
  return { model: STAGES[stage].model(cfg), effort: env || STAGES[stage].effort };
}
