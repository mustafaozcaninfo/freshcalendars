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

/*
 * Second set of rules (owner decision Nov. 8, 2026, from an editor review of the stories, the
 * corpus counts and Wikipedia's "Signs of AI writing" plus Google's Sept. 2025 rater guidelines).
 * Errors apply to stories published on or after RULES_SINCE, so the 1,000+ older stories are not
 * locked; on older ones the same findings are warnings. Warnings never block a push or a build.
 */
export const RULES_SINCE = "2026-11-09";
/** Documented AI tells and press-release adjectives, rare on our pages today; banned in new stories. */
export const BANNED_NEW = ["additionally", "notably", "noteworthy", "boasts", "nestled", "multifaceted", "garner", "garnered", "indelible",
  "rich history", "rich heritage", "testament to", "serves as", "stands as", "plays a vital role", "plays a key role", "plays a crucial role",
  "plays a significant role", "bursting with", "mouth-watering", "mouthwatering", "must-have", "must-see", "perfect for", "irresistible",
  "indulgent", "delectable", "scrumptious", "to die for"];
/** The page talking about itself: "This story", "The table below". */
export const SELF_REF = /\b(this (story|page|guide|article|post)|the (table|list|chart|map|printable|calendar) (below|above))\b/gi;
export const MAX_SELF_REF = 2;
/** Hedge frames that read as a template when repeated ("our count", "our reading"). */
export const HEDGE_FRAMES = /\bour (count|reading|calculation|conversion|math|tally)\b|\bby our (count|reading|calculation|conversion)\b/gi;
export const MAX_HEDGE_FRAMES = 4;
/** The closing call to action every story used to end with. */
export const CTA = /\bmark (it|them|the [^.]{0,60}?) on (the|our|a) \[?[^.\]]{0,40}printable[^.\]]{0,20}calendar/gi;
/** Attribution verbs AP style replaces with "said". */
export const ATTRIBUTION = /\b(stated|pointed out)\b/gi;
/** Time words that go stale without a date. */
export const STALE_TIME = /\b(currently|right now|soon|recently|this week|next week)\b/gi;

const words = (s) => new Set((s.toLowerCase().match(/[a-z0-9$%.,']+/g) ?? []).map((w) => w.replace(/[.,]$/, "")).filter((w) => w.length > 2));
const jaccard = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return a.size + b.size - n ? n / (a.size + b.size - n) : 0; };

/** Frontmatter fields the rules need: publishedAt, category, description, FAQ pairs. */
export function storyMeta(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const get = (k) => { const v = new RegExp(`^${k}:\\s*(.*)$`, "m").exec(fm)?.[1]?.trim() ?? ""; try { return v.startsWith('"') ? JSON.parse(v) : v; } catch { return v.replace(/^"|"$/g, ""); } };
  const faq = [];
  for (const m of fm.matchAll(/^\s*- q:\s*(.*)\n\s+a:\s*(.*)$/gm)) {
    const un = (v) => { v = v.trim(); try { return v.startsWith('"') ? JSON.parse(v) : v; } catch { return v.replace(/^"|"$/g, ""); } };
    faq.push({ q: un(m[1]), a: un(m[2]) });
  }
  return { publishedAt: get("publishedAt"), category: get("category"), description: get("description"), faq };
}

/**
 * The second rule set on one story: `errors` block a push and fail the audit for a story published
 * from RULES_SINCE on (puzzle pages, which have their own rules, are left out); `warnings` are
 * reported for every story. `text` is the lede plus body as the reader sees it.
 */
export function storyRules(md, text) {
  const meta = storyMeta(md);
  const errors = [], warnings = [];
  if (/<p class="callout"><b>Last updated/i.test(md)) errors.push(`"Last updated" callout (updates are silent: change the facts and updatedAt, CLAUDE.md)`);
  if (meta.category === "puzzles") return { errors, warnings, gated: false };
  const gated = meta.publishedAt.slice(0, 10) >= RULES_SINCE;
  const lower = text.toLowerCase();
  const out = (msg) => (gated ? errors : warnings).push(msg);
  const banned = BANNED_NEW.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  if (banned.length) out(`AI tells or promotional words: ${banned.join(", ")}`);
  const self = text.match(SELF_REF) ?? [];
  if (self.length > MAX_SELF_REF) out(`the page talks about itself ${self.length} times ("${self.slice(0, 3).join('", "')}"), at most ${MAX_SELF_REF}: say the fact, not where it sits`);
  const lede = words(meta.description);
  for (const f of meta.faq) {
    const j = jaccard(words(f.a), lede);
    if (j >= 0.7) out(`FAQ answer repeats the description (${Math.round(j * 100)}% the same words): "${f.q}"; answer something the lede does not`);
  }
  const hedges = text.match(HEDGE_FRAMES) ?? [];
  if (hedges.length > MAX_HEDGE_FRAMES) warnings.push(`"our count"-style frames ${hedges.length} times (over ${MAX_HEDGE_FRAMES}): say how it was computed once, then give the numbers`);
  const cta = text.match(CTA) ?? [];
  if (cta.length > 1) warnings.push(`"Mark ... on the printable calendar" ${cta.length} times: once at most, in your own words`);
  const attr = lower.match(ATTRIBUTION) ?? [];
  if (attr.length) warnings.push(`attribution "${[...new Set(attr)].join('", "')}": AP style uses "said"`);
  const stale = lower.match(STALE_TIME) ?? [];
  if (stale.length) warnings.push(`time words that go stale without a date: ${[...new Set(stale)].join(", ")}`);
  return { errors, warnings, gated };
}

/** Sentences of seven or more words that appear in `min` or more stories (numbers ignored). */
export function crossStoryRepeats(texts, min = 5) {
  const seen = new Map();
  for (const [slug, text] of texts) {
    const ss = new Set(text.split(/(?<=[.!?])\s+/).map((s) => s.toLowerCase().replace(/\d+/g, "N").replace(/[^a-z N]/g, " ").replace(/\s+/g, " ").trim()).filter((s) => s.split(" ").length >= 7));
    for (const s of ss) (seen.get(s) ?? seen.set(s, []).get(s)).push(slug);
  }
  return [...seen].filter(([, l]) => l.length >= min).sort((a, b) => b[1].length - a[1].length);
}

/** The lede and body as the reader sees them: links reduced to their text, no images, URLs or code. */
export function storyText(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  const raw = fm?.[1].match(/^description:\s*(.*)$/m)?.[1].trim() ?? "";
  let lede = raw;
  if (raw.startsWith('"')) { try { lede = JSON.parse(raw); } catch { lede = raw.slice(1, -1); } }
  else if (raw.startsWith("'")) lede = raw.slice(1, -1).replaceAll("''", "'");
  const body = md.slice(fm ? fm[0].length : 0)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // alt text is not prose; the audit does not read it either
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  return `${lede} ${body}`.replace(/\s+/g, " ");
}

