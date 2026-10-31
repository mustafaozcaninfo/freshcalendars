/**
 * Story similarity shared by related picks, topic hubs and their "start here" story. Each story
 * becomes a TF-IDF vector over weighted features: keyword words and whole keyword phrases count
 * most (writers pick them for the reader's query), then title words, the calendar pages the
 * story links (two stories that send readers to the same calendar are about the same dates),
 * the category, then description words. Rare features weigh more than ones every story shares
 * ("2026"). Cosine similarity compares two vectors. Pure for testing.
 */
export interface SimDoc {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  /** Calendar-site paths from internalLinks. */
  links: string[];
  publishedAt: Date;
}

/** Words that carry no topic on their own. */
const STOP = new Set(
  (
    "a about after again all also an and any are as at back be because been before being best both but by can come could " +
    "day days did do does each even every few first for from get go going good has have here how if in into is it its just " +
    "know last like list long make many may more most much new next no not now of off on one only or other our out over own " +
    "per same see should since so some still such take than that the their them then there these they this those through " +
    "time to today too under up us use using very vs want was way we well were what when where which while who why will " +
    "with within without would you your date dates free printable guide"
  ).split(" "),
);

/** Lowercase words without accents or punctuation; "holidays" and "holiday" share one stem. Numbers other than years carry no topic. */
export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w) && (!/^\d+$/.test(w) || /^(19|20)\d\d$/.test(w)))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

/** Adjacent word pairs: "world polio" and "world series" share a word but not a pair. */
const pairs = (ts: string[]) => ts.slice(1).map((t, i) => `bi:${ts[i]} ${t}`);

/** Keyword phrases and word pairs carry the subject; a single shared word ("world", "peak") is weak evidence. */
const W = { phrase: 5, pair: 3, keyword: 1, title: 2, link: 2, category: 1.5, description: 1 };

function features(d: SimDoc): Map<string, number> {
  const f = new Map<string, number>();
  const add = (k: string, w: number) => f.set(k, (f.get(k) ?? 0) + w);
  for (const k of d.keywords) {
    const ts = tokens(k);
    add(`kw:${ts.join(" ")}`, W.phrase);
    for (const t of ts) add(t, W.keyword);
    for (const t of pairs(ts)) add(t, W.pair);
  }
  const title = tokens(d.title);
  for (const t of [...title, ...pairs(title)]) add(t, W.title);
  for (const t of tokens(d.description)) add(t, W.description);
  for (const l of d.links) add(`link:${l}`, W.link);
  add(`cat:${d.category}`, W.category);
  return f;
}

export interface SimIndex {
  ids: string[];
  vec: Map<string, Map<string, number>>;
  docs: Map<string, SimDoc>;
}

export function buildIndex(docs: SimDoc[]): SimIndex {
  const raw = docs.map((d) => [d.id, features(d)] as const);
  const df = new Map<string, number>();
  for (const [, f] of raw) for (const k of f.keys()) df.set(k, (df.get(k) ?? 0) + 1);
  const n = docs.length;
  const vec = new Map<string, Map<string, number>>();
  for (const [id, f] of raw) {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [k, tf] of f) {
      // A feature only one story has links it to nothing; keep the vector small.
      if ((df.get(k) ?? 0) < 2) continue;
      const w = Math.log1p(tf) * Math.log(1 + n / df.get(k)!);
      v.set(k, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [k, w] of v) v.set(k, w / norm);
    vec.set(id, v);
  }
  return { ids: docs.map((d) => d.id), vec, docs: new Map(docs.map((d) => [d.id, d])) };
}

export function similarity(ix: SimIndex, a: string, b: string): number {
  const va = ix.vec.get(a), vb = ix.vec.get(b);
  if (!va || !vb || a === b) return 0;
  const [small, big] = va.size < vb.size ? [va, vb] : [vb, va];
  let s = 0;
  for (const [k, w] of small) s += w * (big.get(k) ?? 0);
  return s;
}

/**
 * Related stories: pinned ids first (the writer's `related`), then the most similar stories, with
 * a same-category bonus. A candidate that is a near-copy of one already picked (four state
 * sample ballots, two days of the same puzzle: similarity of NEAR_COPY or more) loses that
 * similarity from its score, so the slots show different angles; related-but-distinct stories score
 * well below NEAR_COPY and are never penalized. `bonus` adds outside evidence for a candidate
 * (a shared topic hub, lib/storygraph.ts). Ties go to the newer story.
 */
export const CATEGORY_BONUS = 0.12;
export const NEAR_COPY = 0.55;

export function related(ix: SimIndex, id: string, pinned: string[] = [], limit = 3, bonus: (c: string) => number = () => 0): string[] {
  const picked = [...new Set(pinned)].filter((p) => p !== id && ix.vec.has(p)).slice(0, limit);
  const cat = ix.docs.get(id)?.category;
  const pool = ix.ids
    .filter((c) => c !== id && !picked.includes(c))
    .map((c) => {
      const sim = similarity(ix, id, c);
      const extra = sim > 0 ? (ix.docs.get(c)!.category === cat ? CATEGORY_BONUS : 0) + bonus(c) : 0;
      return { c, s: sim + extra, t: ix.docs.get(c)!.publishedAt.getTime() };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.t - a.t);
  while (picked.length < limit && pool.length) {
    let best = 0, bestScore = -Infinity;
    for (const [i, x] of pool.entries()) {
      // The pool is sorted by s and the penalty only lowers a score, so nothing further down can
      // win: stop here instead of comparing every story of the site with the picks.
      if (x.s <= bestScore + 1e-9) break;
      const copy = Math.max(0, ...picked.map((p) => similarity(ix, x.c, p)));
      const score = x.s - (copy >= NEAR_COPY ? copy : 0);
      if (score > bestScore + 1e-9) { best = i; bestScore = score; }
    }
    picked.push(pool.splice(best, 1)[0]!.c);
  }
  // A brand-new story with no shared features still gets the newest stories, never an empty block.
  if (picked.length < limit) {
    const newest = ix.ids.filter((c) => c !== id && !picked.includes(c)).sort((a, b) => ix.docs.get(b)!.publishedAt.getTime() - ix.docs.get(a)!.publishedAt.getTime());
    picked.push(...newest.slice(0, limit - picked.length));
  }
  return picked;
}

/** The story most similar, on average, to the rest of a group: the best first read for a topic. */
export function centralId(ix: SimIndex, ids: string[]): string | undefined {
  let best: string | undefined, bestScore = -1;
  for (const a of ids) {
    const s = ids.reduce((sum, b) => sum + similarity(ix, a, b), 0);
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return best;
}
