/**
 * "Add to calendar" for key dates: an iCalendar file (RFC 5545) of all-day events and a Google
 * Calendar link per date. Output depends only on the input, so an unchanged story rebuilds to
 * an identical file and the deploy does not re-upload it. Pure for testing.
 */
export interface CalEvent {
  /** YYYY-MM-DD, the day in Eastern Time. */
  date: string;
  title: string;
  /** Absolute URL of the story that reports the date. */
  url: string;
}

const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** Lines longer than 75 octets fold onto continuation lines that start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ""; }
    cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const compact = (d: string) => d.replaceAll("-", "");

function nextDay(d: string): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

/** uid: a stable id per event, so re-importing the file updates events instead of duplicating them. */
export function icsCalendar(name: string, events: (CalEvent & { uid: string })[], stamp: Date): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fresh Calendars//News key dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}@freshcalendars.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(`Details: ${e.url}`)}`,
      `URL:${e.url}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Google Calendar "create event" link for one all-day date. */
export function googleCalendarUrl(e: CalEvent): string {
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${compact(e.date)}/${compact(nextDay(e.date))}`, details: `Details: ${e.url}` });
  return `https://calendar.google.com/calendar/render?${q}`;
}
