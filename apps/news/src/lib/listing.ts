/** Pagination for /news/, category and author lists. Pure for testing. */
/** NEWS_PER_PAGE overrides the page size (pagination checks with few articles). */
export const PER_PAGE = Number(process.env.NEWS_PER_PAGE) || 20;

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
  /** Site-relative path of this page, trailing slash. */
  path: string;
  prevPath?: string;
  nextPath?: string;
}

/** Page 1 lives at `base`, later pages at `${base}page/N/` (never /page/1/). */
export function pagePath(base: string, page: number): string {
  return page <= 1 ? base : `${base}page/${page}/`;
}

export function paginate<T>(items: T[], base: string, perPage = PER_PAGE): Page<T>[] {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  return Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return {
      items: items.slice(i * perPage, page * perPage),
      page,
      totalPages,
      path: pagePath(base, page),
      prevPath: page > 1 ? pagePath(base, page - 1) : undefined,
      nextPath: page < totalPages ? pagePath(base, page + 1) : undefined,
    };
  });
}

/** "Holidays News – Page 2 | Fresh Calendars" */
export function pagedTitle(name: string, page: number, suffix = "Fresh Calendars"): string {
  return `${name}${page > 1 ? ` – Page ${page}` : ""} | ${suffix}`;
}
