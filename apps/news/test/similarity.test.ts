import assert from "node:assert/strict";
import { it } from "node:test";
import { buildIndex, centralId, related, similarity, tokens } from "../src/lib/similarity.ts";
import { MIN_TOPIC_STORIES, TOPICS, inTopic, matchTier, startId, topicMembers } from "../src/lib/topics.ts";
import { googleCalendarUrl, icsCalendar } from "../src/lib/ics.ts";
import { calendarDatesFor, upcomingFor } from "../src/lib/keydates.ts";

const doc = (id: string, title: string, keywords: string[], category = "planning", links: string[] = [], day = 1) => ({
  id, title, description: title, keywords, category, links, publishedAt: new Date(Date.UTC(2026, 9, day)),
});

const pool = [
  doc("ohio-ballot", "Ohio sample ballot 2026", ["Ohio sample ballot 2026", "sample ballot by zip code"], "planning", ["/november-calendars.html"], 1),
  doc("nj-ballot", "New Jersey sample ballot 2026", ["New Jersey sample ballot 2026", "sample ballot by zip code"], "planning", ["/november-calendars.html"], 2),
  doc("nc-ballot", "North Carolina sample ballot 2026", ["North Carolina sample ballot 2026", "sample ballot by zip code"], "planning", ["/november-calendars.html"], 3),
  doc("polls-close", "What time do polls close on Election Day 2026", ["what time do polls close", "election day 2026"], "planning", ["/november-calendars.html"], 4),
  doc("turkey", "When to thaw a Thanksgiving turkey", ["thaw turkey", "Thanksgiving 2026"], "holidays", ["/thanksgiving.html"], 5),
  doc("tv", "Thanksgiving 2026 TV schedule", ["Thanksgiving 2026 TV schedule", "Macy's parade"], "holidays", ["/thanksgiving.html"], 6),
  doc("wordle", "Wordle hint today", ["Wordle hint today"], "puzzles", [], 7),
];
const ix = buildIndex(pool);

it("tokens drop stop words and plurals", () => {
  assert.deepEqual(tokens("When are the Holidays? Día de los Muertos"), ["holiday", "dia", "de", "los", "muerto"]);
});

it("scores same-subject stories above unrelated ones", () => {
  assert.ok(similarity(ix, "ohio-ballot", "nj-ballot") > similarity(ix, "ohio-ballot", "turkey"));
  assert.equal(similarity(ix, "ohio-ballot", "ohio-ballot"), 0);
});

it("related keeps pins first and skips near-copies", () => {
  const r = related(ix, "ohio-ballot", ["turkey"], 3);
  assert.equal(r[0], "turkey");
  assert.equal(r.length, 3);
  // The second state ballot is a near-copy of the first, so the polls story takes the next slot.
  const two = related(ix, "ohio-ballot", [], 2);
  assert.ok(["nj-ballot", "nc-ballot"].includes(two[0]!));
  assert.equal(two[1], "polls-close");
  // Outside evidence (a shared topic) can lift a candidate.
  assert.equal(related(ix, "ohio-ballot", [], 1, (c) => (c === "polls-close" ? 1 : 0))[0], "polls-close");
});

it("related falls back to the newest stories", () => {
  assert.deepEqual(related(ix, "wordle", [], 2), ["tv", "turkey"]);
});

it("central story of a group", () => {
  assert.ok(["ohio-ballot", "nj-ballot", "nc-ballot"].includes(centralId(ix, ["ohio-ballot", "nj-ballot", "nc-ballot", "polls-close"])!));
});

it("topics match whole words and need enough stories", () => {
  const election = TOPICS.find((t) => t.slug === "election-2026")!;
  assert.ok(inTopic(election, { id: "polls-close", title: "What time do polls close", keywords: [] }));
  assert.ok(!inTopic(election, { id: "x", title: "Selection Sunday", keywords: [] }));
  const sat = TOPICS.find((t) => t.slug === "test-dates-2026-27")!;
  assert.ok(!inTopic(sat, { id: "small-business-saturday", title: "Small Business Saturday", keywords: [] }));
  const stories = pool.map((d) => ({ id: d.id, title: d.title, keywords: d.keywords }));
  const live = topicMembers(stories);
  assert.deepEqual(live.map((t) => t.topic.slug), ["election-2026"]);
  assert.ok(live[0]!.items.length >= MIN_TOPIC_STORIES);
});

it("cohesion drops a story that only mentions the topic in passing", () => {
  const extra = [
    ...pool,
    doc("shutdown", "Funding runs out Dec. 11: five weeks after the midterms", ["government shutdown deadline", "continuing resolution"], "planning", ["/december-calendars.html"], 8),
    doc("is-election-day-a-holiday", "Is Election Day a holiday? What's open", ["is election day a holiday", "election day 2026"], "holidays", ["/november-calendars.html"], 9),
  ];
  const ix2 = buildIndex(extra);
  const live = topicMembers(extra.map((d) => ({ id: d.id, title: d.title, keywords: d.keywords })), (a, b) => similarity(ix2, a, b));
  const ids = live.find((t) => t.topic.slug === "election-2026")!.items.map((x) => x.id);
  assert.ok(ids.includes("is-election-day-a-holiday"));
  assert.ok(!ids.includes("shutdown"));
});

it("a dated topic demotes a title that names only another year", () => {
  const xmas = TOPICS.find((t) => t.slug === "christmas-and-winter-holidays-2026")!;
  assert.equal(matchTier(xmas, { id: "a", title: "Christmas Eve store hours 2026", keywords: [] }), "core");
  assert.equal(matchTier(xmas, { id: "b", title: "Canada holidays 2027 and when Christmas hits a weekend", keywords: [] }), "weak");
  // A phrase after the colon names the topic in passing.
  assert.equal(matchTier(xmas, { id: "c", title: "Costco closures 2026: closed on Christmas", keywords: [] }), "weak");
});

it("start here: the pillar when it is a member, else the central core story", () => {
  const t = { slug: "x", name: "X", description: "", match: ["ballot"], start: "nj-ballot" };
  const items = pool.slice(0, 4).map((d) => ({ id: d.id, title: d.title, keywords: d.keywords }));
  assert.equal(startId(t, items, () => "fallback"), "nj-ballot");
  assert.equal(startId({ ...t, start: "gone" }, items, (ids) => (ids.includes("polls-close") ? "wrong" : ids[0])), "ohio-ballot");
});

it("topic descriptions fit the meta description limits", () => {
  for (const t of TOPICS) assert.ok(t.description.length >= 120 && t.description.length <= 160, `${t.slug}: ${t.description.length}`);
});

it("ics: all-day events, escaped, folded, stable", () => {
  const ev = { date: "2026-11-03", title: "Election Day; polls, open", url: "https://freshcalendars.com/news/x/", uid: "2026-11-03-election-day" };
  const s = icsCalendar("Election 2026 key dates", [ev], new Date("2026-10-23T12:00:00Z"));
  assert.match(s, /DTSTART;VALUE=DATE:20261103\r\nDTEND;VALUE=DATE:20261104/);
  assert.ok(s.includes("SUMMARY:Election Day\\; polls\\, open"));
  assert.ok(s.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
  assert.equal(s, icsCalendar("Election 2026 key dates", [ev], new Date("2026-10-23T12:00:00Z")));
  assert.match(googleCalendarUrl(ev), /dates=20261103%2F20261104/);
});

it("upcomingFor keeps a story's own future dates, soonest first", () => {
  const got = upcomingFor(new Set(["usps-holiday-shipping-deadlines-2026"]), new Date("2026-12-10T12:00:00Z"));
  assert.deepEqual(got.map((k) => k.date), ["2026-12-17"]);
  assert.equal(got[0]!.days, 7);
});

it("calendarDatesFor falls back to every past date once none is upcoming", () => {
  const slug = "usps-holiday-shipping-deadlines-2026";
  const later = calendarDatesFor(new Set([slug]), new Date("2027-06-01T12:00:00Z"));
  assert.ok(later.length > 0);
  assert.deepEqual(later.map((k) => k.date), [...later.map((k) => k.date)].sort());
  assert.equal(calendarDatesFor(new Set(["no-such-story"]), new Date("2027-06-01T12:00:00Z")).length, 0);
});
