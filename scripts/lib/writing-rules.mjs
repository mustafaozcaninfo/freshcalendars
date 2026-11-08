/**
 * The writing rules the SEO audit checks on built pages (scripts/news-seo-audit.mjs, 02-*), kept in
 * one place so the 1-second pre-push check (scripts/news-abbrev-check.mjs) runs the same lists on a
 * story's Markdown before it reaches CI. A desk pull request that failed CI on a banned word or a
 * superiority claim (Nov. 7-8, 2026) now stops on the writer's machine instead.
 */
// §02 B l.603 verbatim list (+ obvious inflections).
export const BANNED_EN = ["delve", "tapestry", "testament", "interplay", "intricate", "meticulous", "meticulously", "pivotal", "crucial", "underscore", "underscores",
  "showcase", "showcases", "align", "aligns", "valuable", "realm", "nuanced", "robust", "seamless", "seamlessly", "leverage", "leveraging", "foster",
  "navigate", "navigating", "elevate", "embark", "unleash", "unlock", "harness", "bustling", "vibrant", "ever-evolving", "game-changer", "cutting-edge",
  "dive in", "dive into", "in today's digital world", "it's important to note", "it is important to note", "when it comes to", "in conclusion", "moreover", "furthermore"];
/**
 * Banned words in text as written: in lowercase anywhere, or capitalized at the start of a sentence
 * ("Moreover, ..."). A capitalized word inside a sentence is a name ("Jodie Foster", a quoted
 * official title) and passes; the audit used to lowercase the page first and flagged such names.
 */
export const bannedIn = (text) => BANNED_EN.filter((w) => {
  const p = w.replace(/[-']/g, ".");
  const cap = p.charAt(0).toUpperCase() + p.slice(1);
  return new RegExp(`\\b${p}\\b`).test(text) || new RegExp(`(^|[.!?:]["”’)]?\\s+)${cap}\\b`).test(text);
});
// §02 B l.606.
export const NOT_X_BUT_Y = /\b(it'?s|is|isn't) not (just|only|merely)\b[^.]{0,60}\b(but|it'?s)\b|\bnot just\b[^.]{0,60}\bbut\b/;
// §02 B l.607.
export const WRAP_UP = /\b(in summary|to sum up|all in all|in conclusion)\b|(^|[.!?:]\s+)(ultimately|overall|in short|in the end),/;
// §F R036, §06 l.1611: claims about ourselves or a product; "the best time to watch" is advice.
export const SUPERLATIVE = /\b(the best (calendar|site|source|resource|website|place to)|#1|number one|leading provider|ultimate guide|most trusted|world-class|unbeatable)\b/i;
export const MAX_EM_DASHES = 2;

/** Every rule a story's own text breaks, as short messages (empty when clean). */
export function writingProblems(text) {
  const lower = text.toLowerCase();
  const out = [];
  const banned = bannedIn(text);
  if (banned.length) out.push(`banned words (02-BANNED-WORDS): ${banned.join(", ")}`);
  const nx = lower.match(NOT_X_BUT_Y);
  if (nx) out.push(`"not X but Y" (02-NOT-X-BUT-Y): "${nx[0].slice(0, 60)}"`);
  if (WRAP_UP.test(lower)) out.push(`formulaic wrap-up (02-ENDINGS)`);
  const sup = text.match(SUPERLATIVE);
  if (sup) out.push(`superiority claim (02-SUPERLATIVES): "${sup[0]}"`);
  const dashes = (text.match(/—/g) ?? []).length;
  if (dashes > MAX_EM_DASHES) out.push(`${dashes} em dashes (02-EMDASH, at most ${MAX_EM_DASHES})`);
  return out;
}
