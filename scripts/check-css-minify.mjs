#!/usr/bin/env node
/**
 * Proves the inline-CSS minifier in packages/site-chrome is lossless: the original template CSS
 * and minifyCss() output are both run through esbuild's CSS minifier, and the results must match.
 * Usage: node scripts/check-css-minify.mjs
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(path.join(ROOT, "packages/site-chrome/src/index.ts"), "utf8");
const pnpm = path.join(ROOT, "node_modules/.pnpm");
const dir = readdirSync(pnpm).filter((d) => /^esbuild@\d/.test(d)).sort().pop();
const esbuild = await import(pathToFileURL(path.join(pnpm, dir, "node_modules/esbuild/lib/main.js")).href);
const body = src.match(/export function minifyCss\(css: string\): string \{([\s\S]*?)\n\}/)[1];
const minifyCss = new Function("css", body);
let fail = 0;
for (const name of ["FONTS_CSS", "CSS"]) {
  const raw = src.match(new RegExp(`export const ${name} = minifyCss\\(\`([\\s\\S]*?)\`\\);`))[1];
  const mine = minifyCss(raw);
  const a = (await esbuild.transform(raw, { loader: "css", minify: true })).code;
  const b = (await esbuild.transform(mine, { loader: "css", minify: true })).code;
  const ok = a === b;
  if (!ok) fail++;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}: ${raw.length} → ${mine.length} bytes (${Math.round((1 - mine.length / raw.length) * 100)}% smaller)${ok ? "" : "\n  esbuild outputs differ"}`);
}
process.exit(fail ? 1 : 0);
