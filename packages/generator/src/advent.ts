/**
 * Advent calendar 2026 printables for /news/ (four independent Fresh Calendars templates).
 *
 *   1. advent-calendar-2026            — Dec. 1 to 24 countdown with weekdays and the four Advent Sundays
 *   2. activity-advent-calendar-2026   — 24 family activities, one per day, with a check box
 *   3. kindness-advent-calendar-2026   — 24 acts of kindness and giving (a "reverse" advent calendar)
 *   4. diy-advent-calendar-2026        — blank doors to fill with your own surprises or plans
 *
 * Advent 2026 begins Sunday, Nov. 29 (four Sundays before Christmas, Friday, Dec. 25).
 * Usage: pnpm fc news-advent
 */
import { LETTER, LETTER_LANDSCAPE, doc, fontFaces } from "./julian.js";
import { DOW3, renderPrintables, utc } from "./printables.js";

const SITE = "freshcalendars.com/news/advent-calendar-2026-dates-free-printable/";
const GREEN = "#14532d", RED = "#b91c1c", GOLD = "#ca8a04", CREAM = "#fffaf0";
const dow = (d: number) => DOW3[utc(2026, 11, d).getUTCDay()]!;
const SUNDAYS: Record<number, string> = { 6: "2nd Sunday of Advent", 13: "3rd Sunday of Advent", 20: "4th Sunday of Advent" };

const tree = (s: number) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,6 58,20 42,20" fill="${GOLD}"/><polygon points="50,14 80,52 20,52" fill="${GREEN}"/><polygon points="50,34 88,80 12,80" fill="${GREEN}"/><rect x="44" y="80" width="12" height="14" fill="#7c4a1e"/><circle cx="38" cy="46" r="4" fill="${RED}"/><circle cx="62" cy="64" r="4" fill="${GOLD}"/><circle cx="44" cy="70" r="4" fill="${RED}"/></svg>`;

function countdown(fonts: string): string {
  // Doors in shuffled order, like a real advent calendar, on a 6 × 4 grid.
  const order = [7, 15, 2, 21, 11, 24, 4, 18, 9, 1, 13, 22, 16, 6, 20, 3, 12, 23, 8, 17, 5, 14, 19, 10];
  const doors = order.map((d) => `<div class="door${d === 24 ? " eve" : ""}${SUNDAYS[d] ? " sun" : ""}"><b>${d}</b><span>${dow(d)}, Dec. ${d}</span>${SUNDAYS[d] ? `<em>${SUNDAYS[d]}</em>` : d === 24 ? "<em>Christmas Eve</em>" : ""}</div>`).join("");
  const css = `
  .a1{padding:30px 34px 0;background:${CREAM}}
  .a1 header{display:flex;align-items:center;gap:14px;margin-bottom:12px}
  .a1 h1{font-family:Sora;font-weight:800;font-size:38px;margin:0;color:${RED};line-height:1}
  .a1 h1 span{color:${GREEN}}
  .a1 .sub{margin:4px 0 0;font-size:12px;color:#5b4636}
  .a1 .grid{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:118px;gap:8px}
  .a1 .door{position:relative;border:2px dashed #d6c3a5;border-radius:12px;background:#fff;padding:8px 10px}
  .a1 .door b{display:block;font-family:Sora;font-weight:800;font-size:40px;color:${GREEN};line-height:1}
  .a1 .door span{display:block;font-size:10.5px;color:#7a6250;margin-top:4px}
  .a1 .door em{display:block;font-style:normal;font-size:10px;font-weight:700;color:${RED};margin-top:6px;line-height:1.2}
  .a1 .door.sun{border-color:${GOLD};background:#fff8e1}
  .a1 .door.eve{border:2px solid ${RED};background:${RED}}.a1 .door.eve *{color:#fff!important}
  .a1 .keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
  .a1 .keys div{background:#fff;border-radius:10px;padding:8px 10px;border-left:4px solid ${GREEN};font-size:11px}
  .a1 .keys b{display:block;font-family:Sora;font-size:10px;color:${GREEN}}
  .a1 .note{margin-top:10px;font-size:10px;color:#6b5240}`;
  const page = `<section class="page a1">
    <header>${tree(60)}<div><h1>Advent Calendar <span>2026</span></h1><p class="sub">Color in or cross off one door each day from Tuesday, Dec. 1 to Christmas Eve, Thursday, Dec. 24</p></div></header>
    <div class="grid">${doors}</div>
    <div class="keys"><div><b>1st Sunday of Advent</b>Nov. 29, 2026</div><div><b>Gaudete Sunday</b>Dec. 13 (3rd Sunday)</div><div><b>Christmas Eve</b>Thursday, Dec. 24</div><div><b>Christmas Day</b>Friday, Dec. 25</div></div>
    <p class="note">Gold doors are Advent Sundays. Doors are shuffled like a real advent calendar: find today's number.</p>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

const ACTIVITIES = [
  "Put up the tree or decorations", "Write a letter to Santa", "Make paper snowflakes", "Watch a holiday movie together",
  "Bake cookies", "Drive or walk to see holiday lights", "Make a homemade ornament", "Drink hot chocolate by candlelight",
  "Read a Christmas story at bedtime", "Make a card for a neighbor", "Donate a toy or coat", "Have a holiday pajama night",
  "Build a gingerbread house", "Sing carols", "Make a paper chain", "Call a grandparent",
  "Wrap presents together", "Have a winter picnic indoors", "Do a holiday puzzle", "Make reindeer food for the yard",
  "Visit a holiday market or event", "Write down your favorite moment of the year", "Leave a treat for the mail carrier", "Set out cookies for Santa",
];
const KINDNESS = [
  "Donate canned food to a food bank", "Write a thank-you note to a teacher", "Shovel or sweep a neighbor's walk", "Give a coat or blanket to a shelter",
  "Call someone who lives alone", "Leave a kind note in a library book", "Donate a new toy to a toy drive", "Bake for a neighbor",
  "Pay a sincere compliment", "Send a card to a service member or veteran", "Help with dinner without being asked", "Pick up litter in your neighborhood",
  "Donate books you have outgrown", "Bring treats to a fire or police station", "Make a bird feeder", "Give a generous tip",
  "Let someone go ahead of you in line", "Send a holiday card to a nursing home", "Donate pet food to an animal shelter", "Thank a delivery driver",
  "Volunteer for an hour", "Share a favorite memory with family", "Forgive someone, or say sorry", "Tell your family why you are grateful for them",
];
function checklist(fonts: string, title: string, sub: string, items: string[], accent: string): string {
  const rows = items.map((t, i) => { const d = i + 1; return `<li><span class="n">${d}</span><span class="d">${dow(d)}</span><span class="t">${t}</span><i></i></li>`; });
  const css = `
  .a2{padding:34px 38px 0;background:${CREAM}}
  .a2 header{display:flex;align-items:center;gap:14px;border-bottom:4px solid ${accent};padding-bottom:10px;margin-bottom:12px}
  .a2 h1{font-family:Sora;font-weight:800;font-size:32px;margin:0;color:${accent};line-height:1.05}
  .a2 .sub{margin:4px 0 0;font-size:12px;color:#5b4636}
  .a2 ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}
  .a2 li{display:grid;grid-template-columns:34px 32px 1fr 20px;gap:8px;align-items:center;background:#fff;border-radius:10px;padding:8px 10px;min-height:70px;border:1px solid #eadcc6}
  .a2 .n{font-family:Sora;font-weight:800;font-size:20px;color:${accent};text-align:center}
  .a2 .d{font-size:10px;color:#7a6250;text-transform:uppercase;letter-spacing:.05em}
  .a2 .t{font-size:12.5px;line-height:1.3;color:#2b1d14}
  .a2 i{width:18px;height:18px;border:2px solid ${accent};border-radius:5px}`;
  const page = `<section class="page a2">
    <header>${tree(54)}<div><h1>${title}</h1><p class="sub">${sub}</p></div></header>
    <ol>${rows.join("")}</ol>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER, css, [page]);
}

function diy(fonts: string): string {
  const doors = Array.from({ length: 24 }, (_, i) => `<div class="door"><b>${i + 1}</b><span>${dow(i + 1)}</span><div class="lines"><i></i><i></i></div></div>`).join("");
  const css = `
  .a4{padding:30px 34px 0}
  .a4 h1{font-family:Sora;font-weight:800;font-size:34px;margin:0 0 4px;color:${GREEN}}
  .a4 .sub{margin:0 0 12px;font-size:12px;color:#5b4636}
  .a4 .grid{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:136px;gap:8px}
  .a4 .door{border:2px solid #cfe0d4;border-radius:12px;padding:8px 10px;background:#fbfdfb}
  .a4 .door b{font-family:Sora;font-weight:800;font-size:28px;color:${RED}}
  .a4 .door span{font-size:10px;color:#6b7c70;margin-left:6px;text-transform:uppercase}
  .a4 .lines i{display:block;border-bottom:1px solid #cfe0d4;height:28px}`;
  const page = `<section class="page a4">
    <h1>DIY Advent Calendar 2026</h1>
    <p class="sub">Write a surprise, a treat, a Bible verse or a family plan in each door · Dec. 1 to 24, 2026 · cut out the doors or keep the sheet whole</p>
    <div class="grid">${doors}</div>
    <div class="foot">Free printable from Fresh Calendars · ${SITE}</div>
  </section>`;
  return doc(fonts, LETTER_LANDSCAPE, css, [page]);
}

export async function buildAdventDownloads(): Promise<void> {
  const fonts = await fontFaces();
  await renderPrintables("advent-calendar-2026", [
    { slug: "advent-calendar-2026", size: LETTER_LANDSCAPE, html: countdown(fonts) },
    { slug: "activity-advent-calendar-2026", size: LETTER, html: checklist(fonts, "Activity Advent Calendar 2026", "24 family activities for Dec. 1 to 24, 2026 · tick each one off as you go", ACTIVITIES, GREEN) },
    { slug: "kindness-advent-calendar-2026", size: LETTER, html: checklist(fonts, "Kindness Advent Calendar 2026", "24 acts of kindness and giving, one a day from Dec. 1 to Christmas Eve", KINDNESS, RED) },
    { slug: "diy-advent-calendar-2026", size: LETTER_LANDSCAPE, html: diy(fonts) },
  ]);
}
