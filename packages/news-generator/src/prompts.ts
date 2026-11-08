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

/** The skill's three stages: Opus writes, Sonnet edits, Opus approves. */
export const STAGES: Record<StageName, StageDef> = {
  writer: { file: "1-writer.md", model: (c) => c.writerModel, effort: "high" },
  editor: { file: "2-seo-editor.md", model: (c) => c.editorModel, effort: "medium" },
  chief: { file: "3-chief-editor.md", model: (c) => c.chiefModel, effort: "high" },
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
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => vars[k] ?? m);
}

/** Core skill + house rules (sorted by file name) + the stage's role. */
export async function buildSystemPrompt(stage: StageName): Promise<string> {
  const core = read(resolve(SKILLS, "elite-english-content-engine/SKILL.md"));
  const houseDir = resolve(SKILLS, "house-rules");
  const house = readdirSync(houseDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => read(resolve(houseDir, f)));
  const role = read(resolve(SKILLS, "stages", STAGES[stage].file));

  const text = [
    core,
    "------------------------------------------------------------------------",
    "# HOUSE RULES (these override the content engine above where they disagree)",
    ...house,
    "------------------------------------------------------------------------",
    role,
  ].join("\n\n");
  return fillPlaceholders(text);
}

export function stageSettings(stage: StageName, cfg = getConfig()) {
  return { model: STAGES[stage].model(cfg), effort: STAGES[stage].effort };
}
