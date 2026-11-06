// Desk scope rule (scripts/desk-scope.mjs): what a desk pull request may and may not change.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DESK_PR, outOfScope } from "./desk-scope.mjs";

test("desk titles", () => {
  for (const t of ["[W1] 2 new: x", "[U] 1 update: y", "Puzzles Nov 7-9"]) assert.ok(DESK_PR.test(t), t);
  for (const t of ["fix(watchdog): x", "W1 story", "puzzles lower", "feat: [W1] inside"]) assert.ok(!DESK_PR.test(t), t);
});

test("story, queue and generator files stay allowed", () => {
  assert.deepEqual(outOfScope([
    "apps/news/src/content/articles/2026/11/x.md",
    "apps/news/src/assets/news/x/hero.jpg",
    "apps/news/public/downloads/x/x.pdf",
    "apps/news/key-dates/x.json",
    "apps/news/src/content/puzzles/wordle/2026-11-07.json",
    "docs/desk/w1.md",
    "docs/desk/research-log.md",
    "packages/generator/src/heroes5.ts",
    "packages/generator/src/gta6.ts",
  ]), []);
});

test("code, CI, manifests and agent settings are refused", () => {
  const bad = [
    ".github/workflows/ci.yml", ".github/actions/setup/action.yml", ".githooks/pre-push",
    ".claude/agents/news-writer.md", "scripts/desk-watchdog.mjs", "cloudflare/deploy.sh",
    "package.json", "packages/generator/package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
    ".npmrc", "wrangler.jsonc", "CLAUDE.md",
  ];
  assert.deepEqual(outOfScope(bad), bad);
});
