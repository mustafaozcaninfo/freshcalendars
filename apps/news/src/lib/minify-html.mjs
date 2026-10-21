/**
 * Post-build minifier for dist/news HTML. Astro's compressHTML leaves alone anything set with
 * set:html (the site-chrome header and footer, rendered Markdown) and inline scripts, which
 * left hundreds of blank lines per story. Rules that cannot change rendering:
 * - <pre> and <textarea> are kept byte for byte;
 * - every other whitespace run becomes one space (what white-space:normal renders anyway);
 * - whitespace is dropped entirely only where browsers ignore it: inside <head> and around
 *   table structure tags;
 * - inline JavaScript goes through esbuild with no module format, so global names
 *   (gtag, adsbygoogle) survive; JSON-LD and speculation rules are re-serialized compactly;
 *   inline CSS is minified by esbuild.
 * The shared site-chrome stylesheet (the same block on every page, mostly calendar-site rules)
 * is then trimmed for /news/: a rule goes only when it names a class or id that no /news/ page
 * and no inline script mentions (see purgeSharedCss).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const TABLE = "table|caption|colgroup|col|thead|tbody|tfoot|tr|td|th";
const AROUND_TABLE = new RegExp(`\\s*(<\\/?(?:${TABLE})\\b[^>]*>)\\s*`, "g");

async function minifyScript(attrs, body) {
  const type = /\btype="([^"]+)"/.exec(attrs)?.[1] ?? "";
  if (/json|speculationrules/.test(type)) return JSON.stringify(JSON.parse(body)).replace(/<\//g, "<\\/");
  if (type && type !== "text/javascript" && type !== "module") return body.trim();
  const { code } = await transform(body, { loader: "js", minify: true, target: "es2019" });
  return code.trim().replace(/<\/script/gi, "<\\/script");
}

async function minifyCss(body) {
  const { code } = await transform(body, { loader: "css", minify: true });
  return code.trim();
}

export async function minifyHtml(html) {
  const kept = [];
  const keep = (s) => `\u0000${kept.push(s) - 1}\u0000`;
  const jobs = [];
  // Raw-text and preformatted elements are cut out first and put back after the whitespace pass.
  let out = html.replace(/<(script|style|pre|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (all, tag, attrs, body) => {
    const t = tag.toLowerCase();
    if (t === "pre" || t === "textarea" || !body.trim()) return keep(all);
    const i = kept.push(all) - 1;
    jobs.push((t === "script" ? minifyScript(attrs, body) : minifyCss(body)).then((m) => { kept[i] = `<${tag}${attrs}>${m}</${tag}>`; }));
    return `\u0000${i}\u0000`;
  });
  out = out.replace(/\s+/g, " ").replace(AROUND_TABLE, "$1");
  out = out.replace(/<head>[\s\S]*?<\/head>/i, (h) => h.replace(/>\s+</g, "><").replace(/<head> /, "<head>"));
  out = out.replace(/^\s+|\s+$/g, "").replace(/(<!doctype html>)\s+/i, "$1");
  await Promise.all(jobs);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

/** Classes AdSense adds at run time; their rules must stay even though no page names them. */
const RUNTIME = /^(google-|adsbygoogle|goog-|gsc-)/;

/** Splits a minified stylesheet into top-level blocks: [prelude, body] with body undefined for ";" statements. */
function blocks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i), semi = css.indexOf(";", i);
    if (open < 0 || (semi >= 0 && semi < open && css[i] === "@")) {
      const end = semi < 0 ? css.length : semi + 1;
      out.push([css.slice(i, end), undefined]);
      i = end;
      continue;
    }
    let depth = 1, j = open + 1, q = "";
    for (; j < css.length && depth; j++) {
      const ch = css[j];
      if (q) { if (ch === "\\") j++; else if (ch === q) q = ""; }
      else if (ch === '"' || ch === "'") q = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    out.push([css.slice(i, open).trim(), css.slice(open + 1, j - 1)]);
    i = j;
  }
  return out;
}

/** True when every class and id the selector requires exists in the used set. */
function selectorUsed(sel, used) {
  // Contents of :not() and friends never make a selector need a class; attribute values are not classes.
  const bare = sel.replace(/:(?:not|is|where|has)\((?:[^()]|\([^()]*\))*\)/g, "").replace(/\[[^\]]*\]/g, "");
  for (const m of bare.matchAll(/[.#](-?[_a-zA-Z][\w-]*)/g)) {
    if (!used.has(m[1]) && !RUNTIME.test(m[1])) return false;
  }
  return true;
}

export function purgeSharedCss(css, used) {
  return blocks(css).map(([prelude, body]) => {
    if (body === undefined) return prelude;
    if (prelude.startsWith("@media") || prelude.startsWith("@supports") || prelude.startsWith("@layer") || prelude.startsWith("@container")) {
      const inner = purgeSharedCss(body, used);
      return inner ? `${prelude}{${inner}}` : "";
    }
    if (prelude.startsWith("@")) return `${prelude}{${body}}`;
    const keep = prelude.split(/,(?![^()]*\))/).filter((sel) => selectorUsed(sel, used));
    return keep.length ? `${keep.join(",")}{${body}}` : "";
  }).join("");
}

/** Class names, ids and every word inside inline scripts across all pages. */
function usedTokens(pages) {
  const used = new Set();
  for (const html of pages) {
    for (const m of html.matchAll(/\s(?:class|id)="([^"]*)"/g)) for (const t of m[1].split(/\s+/)) if (t) used.add(t);
    for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) for (const t of m[1].matchAll(/[A-Za-z_][\w-]*/g)) used.add(t[0]);
  }
  return used;
}

async function htmlFiles(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await htmlFiles(p)));
    else if (e.name.endsWith(".html")) files.push(p);
  }
  return files;
}

/** Minifies every .html file under dir in place; returns [files, bytes before, bytes after]. */
export async function minifyHtmlDir(dir) {
  let before = 0, after = 0;
  const files = await htmlFiles(dir);
  const pages = await Promise.all(files.map((f) => readFile(f, "utf8")));
  const min = await Promise.all(pages.map(minifyHtml));
  // The shared stylesheet is the first <style> of each page and starts with the font faces.
  const first = (h) => /<style>(@font-face[\s\S]*?)<\/style>/.exec(h)?.[1];
  const shared = first(min[0]);
  const trimmed = shared && purgeSharedCss(shared, usedTokens(min));
  for (const [i, f] of files.entries()) {
    const out = shared && first(min[i]) === shared ? min[i].replace(`<style>${shared}</style>`, () => `<style>${trimmed}</style>`) : min[i];
    before += Buffer.byteLength(pages[i]);
    after += Buffer.byteLength(out);
    await writeFile(f, out);
  }
  return [files.length, before, after];
}
