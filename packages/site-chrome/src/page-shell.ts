import { iconHtml } from "./icons.js";
import { resolvePlanningYear } from "@freshcalendars/engine";
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

export function sectionRailHtml(current: string, today: Date, section = "planning"): string {
  const year = resolvePlanningYear(today);
  const groups = section === "company" ? [
    ["About Fresh Calendars", [["news", "About us", "/page/about/"], ["share", "Contact", "/page/contact/"], ["check", "Privacy policy", "/page/privacy-policy/"], ["pdf", "Terms of use", "/page/terms-of-use/"], ["news", "Advertising", "/page/advertising/"], ["check", "Disclosure", "/page/disclosure/"]]],
    ["Explore", [["calendar", "Calendar library", "/calendars/"], ["news", "News & guides", "/news/"], ["tools", "Calendar tools", "/calendar-tools/"]]],
  ] : [
    ["Calendars", [["tools", "All calendars", "/calendars/"], ["calendar", "Monthly calendars", "/monthly-calendars/"], ["year", "Yearly calendars", "/printable-calendars.html"], ["planner", "Weekly planners", "/printable-weekly-calendar.html"], ["calendar", "Blank calendars", "/blank-calendars.html"], ["school", "School calendars", "/printable-school-calendar.html"]]],
    ["Dates & holidays", [["holiday", "US holidays", "/holidays/"], ["holiday", "UK holidays", "/uk-holidays/"], ["holiday", "Canada holidays", "/canada-holidays/"], ["tools", "Date calculators", "/calendar-tools/"]]],
    ["Planning guides", [["print", "Printing guide", "/print-guide.html"], ["calendar", "Monday-start guide", "/guides/monday-start-calendar.html"], ["school", "Classroom planning", "/guides/classroom-printable-calendars.html"], ["year", "Fiscal-year planning", "/guides/fiscal-year-calendar.html"]]],
  ];
  return `<aside class="section-rail" aria-label="${section === "company" ? "About and policies" : "Planning navigation"}">${groups.map(([label, links]) => `<section><h2>${label}</h2><nav>${(links as string[][]).map(([icon, title, href]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${iconHtml(icon!)}<span>${title}</span></a>`).join("")}</nav></section>`).join("")}<div class="rail-help"><strong>Plan brighter days</strong><p>Find a printable for ${year}, or start with a blank page.</p><a href="/news/printables/">Explore free printables →</a></div></aside>`;
}

/** Visible breadcrumb drawn from the page's BreadcrumbList items, so the two never disagree. */
export function breadcrumbNavHtml(crumbs: { name: string; url: string }[], lastAttrs = ""): string {
  const last = crumbs.length - 1;
  return `<nav class="concept-breadcrumb" aria-label="Breadcrumb">${crumbs.map((c, i) => i < last ? `<a href="${escape(new URL(c.url, "https://freshcalendars.com").pathname)}">${escape(c.name)}</a><span>›</span>` : `<span${lastAttrs} aria-current="page">${escape(c.name)}</span>`).join("")}</nav>`;
}

export function pageWorkspaceHtml(body: string, crumbs: { name: string; url: string }[], path: string, today: Date, family: string): string {
  const hero = /^\s*<section class="hero">([\s\S]*?)<\/section>/.exec(body);
  if (!hero) return body;
  let remaining = body.slice(hero[0].length);
  const topAd = /^\s*(<div class="wrap ad-band">[\s\S]*?<\/aside>\s*<\/div>)/.exec(remaining);
  if (topAd) remaining = remaining.slice(topAd[0].length) + topAd[1];
  const items: { id: string; label: string }[] = [];
  let headingIndex = 0;
  const asideAt = remaining.indexOf('<aside class="sidebar"');
  remaining = remaining.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (match, attrs, label, offset) => {
    if (asideAt >= 0 && offset > asideAt) return match;
    const text = label.replace(/<[^>]*>/g, "").trim();
    const existing = /\bid="([^"]+)"/.exec(attrs);
    const id = existing?.[1] ?? `section-${++headingIndex}`;
    if (items.length < 8) items.push({ id, label: text });
    return existing ? match : `<h2${attrs} id="${id}">${label}</h2>`;
  });
  const section = family === "policy" || family === "contact" ? "company" : "planning";
  const crumb = breadcrumbNavHtml(crumbs);
  const heading = hero[1]!.replace('<div class="hero-inner">', `<div class="workspace-heading-inner">${crumb}`);
  return `<div class="concept-wrap page-workspace" data-workspace="${family}">${sectionRailHtml(path, today, section)}<div class="workspace-main"><header class="workspace-heading">${heading}</header>${items.length > 1 ? `<nav class="section-jumps" aria-label="On this page">${items.map(x => `<a href="#${x.id}">${x.label}</a>`).join("")}</nav>` : ""}${remaining}</div></div>`;
}
