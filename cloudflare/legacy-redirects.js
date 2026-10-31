// Permanent redirects for old calendar-site URLs, ported from the Apache .htaccess the VPS served
// (packages/generator: htaccessContent). Patterns match the path without its leading slash, as
// Apache's RewriteRule did, and the query string is carried over as Apache did. The Worker only
// sees paths that no deployed file answers, which matches the one rule Apache guarded with !-f;
// cloudflare/assemble.mjs fails the build if any other rule would shadow a deployed page.
const ORIGIN = "https://freshcalendars.com";
const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
const HOLIDAY_PAGES =
  "april-fools-day|ash-wednesday|black-friday|christmas-day|christmas-eve|cinco-de-mayo|columbus-day|cyber-monday|earth-day|easter|fathers-day|flag-day|good-friday|groundhogs-day|halloween|independence-day|juneteenth|labor-day|martin-luther-king-day|memorial-day|mothers-day|new-years-day|new-years-eve|palm-sunday|patriot-day|presidents-day|st-patricks-day|thanksgiving|valentines-day|veterans-day";
const OBSERVANCES =
  "armed-forces-day|constitution-day|day-of-the-dead|dia-de-los-muertos|indigenous-peoples-day|international-womens-day|native-americans-day|samhain|star-wars-day|world-environment-day|world-teachers-day";

/** [pattern, target] in the .htaccess order; the first match wins. */
export const LEGACY_RULES = [
  [/^printable-calendar\.html$/, "/printable-calendars.html"],
  [/^([a-z]+)-calendar\.html$/, "/$1-calendars.html"],
  [/^blank-calendar\.html$/, "/blank-calendars.html"],
  [/^([0-9]{4})-calendar\.html$/, "/printable-calendars.html"],
  [/^year\/([0-9]{4})\/?$/, "/printable-calendars.html"],
  [/^printable-calendars-([0-9]{4})\.html$/, "/printable-calendars.html"],
  [/^printable-calendar-([0-9]{4})\.html$/, "/printable-calendars.html"],
  [/^([a-z]+)-calendars-([0-9]{4})\.html$/, "/$1-calendars.html"],
  [/^printable-([a-z]+)-([0-9]{4})-calendar\.html$/, "/$1-calendars.html"],
  [/^([0-9]{4})-holidays\.html$/, "/holidays/"],
  [/^when-is\/easter-([0-9]{4})\.html$/, "/when-is/easter/"],
  [/^when-is\/([a-z0-9-]+)-([0-9]{4})\.html$/, "/when-is/$1/"],
  [new RegExp(`^printable-(${MONTHS})-calendar\\.html$`), "/$1-calendars.html"],
  [/^printable-blank-calendar\.html$/, "/blank-calendars.html"],
  [/^weekly-calendars\.html$/, "/printable-weekly-calendar.html"],
  [/^school-calendars\.html$/, "/printable-school-calendar.html"],
  [/^monday-start-calendars\.html$/, "/printable-monday-start-calendar.html"],
  [/^yearly-calendars\.html$/, "/printable-yearly-calendar.html"],
  [/^calendar\.html$/, "/printable-calendars.html"],
  [/^holidays\.html$/, "/holidays/"],
  [/^australia-holidays\/?$/, "/holidays/"],
  [/^india-holidays\/?$/, "/holidays/"],
  [/^when-is\/([a-z0-9-]+)\.html$/, "/when-is/$1/"],
  [/^about\/?$/, "/page/about/"],
  [/^contact\/?$/, "/page/contact/"],
  [/^page\/privacy\/?$/, "/page/privacy-policy/"],
  [/^page\/terms\/?$/, "/page/terms-of-use/"],
  [/^page\/contact\.html$/, "/page/contact/"],
  [/^page\/privacy-policy\.html$/, "/page/privacy-policy/"],
  [/^page\/terms-of-use\.html$/, "/page/terms-of-use/"],
  [new RegExp(`^page\\/(${HOLIDAY_PAGES})\\/?$`), "/when-is/$1/"],
  [new RegExp(`^page\\/(${OBSERVANCES})\\/?$`), "/holidays/"],
  [/^editor(\/.*)?$/, "/blank-calendars.html"],
  [new RegExp(`^printable\\/monthly\\/[0-9]{4}\\/(${MONTHS})\\/`), "/$1-calendars.html"],
];

/** The absolute redirect target for a path ("/foo.html") and query ("?a=1" or ""), or null. */
export function legacyRedirect(pathname, search = "") {
  const rel = pathname.replace(/^\//, "");
  for (const [re, to] of LEGACY_RULES) {
    const m = re.exec(rel);
    if (m) return ORIGIN + to.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? "") + search;
  }
  return null;
}
