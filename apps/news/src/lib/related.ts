/** Related posts: same category first, then shared keywords, then recency. Pure for testing. */
export interface RelatedCandidate {
  id: string;
  category: string;
  keywords: string[];
  publishedAt: Date;
}

export function pickRelated<T extends RelatedCandidate>(current: T, pool: T[], pinned: string[] = [], limit = 3): T[] {
  const kw = new Set(current.keywords.map((k) => k.toLowerCase()));
  const score = (c: T) =>
    (c.category === current.category ? 10 : 0) + c.keywords.filter((k) => kw.has(k.toLowerCase())).length;
  const byId = new Map(pool.map((c) => [c.id, c]));
  const picked: T[] = pinned.map((id) => byId.get(id)).filter((c): c is T => !!c && c.id !== current.id);
  const rest = pool
    .filter((c) => c.id !== current.id && !picked.includes(c))
    .sort((a, b) => score(b) - score(a) || b.publishedAt.getTime() - a.publishedAt.getTime());
  return [...picked, ...rest].slice(0, limit);
}
