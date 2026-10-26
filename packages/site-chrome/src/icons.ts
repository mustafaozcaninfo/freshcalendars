/** One stroke system for the reference's compact navigation and controls. */
const paths: Record<string, string> = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h3m4 0h3m-10 3h3"/>',
  year: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18M7 15h2m3 0h2m3 0h1M7 18h2m3 0h2m3 0h1"/>',
  holiday: '<path d="M6 3v18M6 4h13l-3 4 3 4H6"/>',
  planner: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4m-4 5h4m5-10h5m-5 4h5m-5 4h3"/>',
  school: '<path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7c4 3 8 3 12 0v-7m4-2v9"/>',
  news: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8m-8 4h8m-8 4h3m2 0h3m-8 3h8"/>',
  tools: '<path d="M4 4h5v5H4zm11 0h5v5h-5zM4 15h5v5H4zm11 0h5v5h-5z"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
  pdf: '<path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8m-8 4h6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
  moon: '<path d="M20 13A8 8 0 0 1 11 4a9 9 0 1 0 9 9Z"/>',
  heart: '<path d="M20 5c-2-2-6-1-8 2-2-3-6-4-8-2-4 4 1 9 8 15 7-6 12-11 8-15Z"/>',
  share: '<path d="M12 16V3m-5 5 5-5 5 5M5 12v9h14v-9"/>',
  print: '<path d="M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7z"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export function iconHtml(name: string, cls = ""): string {
  return `<svg class="ui-icon ${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.calendar}</svg>`;
}
