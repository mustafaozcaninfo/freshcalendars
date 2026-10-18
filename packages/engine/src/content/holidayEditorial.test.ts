import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHoliday } from "../holidays/engine.js";
import { holidayDefBySlug } from "../holidays/rules.js";
import { getHolidayEditorial } from "./holidayEditorial.js";

const PRIORITY_SLUGS = [
  "april-fools-day",
  "ash-wednesday",
  "ca-boxing-day",
  "ca-labour-day",
  "ca-national-day-truth",
  "ca-thanksgiving",
  "daylight-savings",
  "fathers-day",
  "uk-early-may-bank-holiday",
  "uk-easter-monday",
  "uk-guy-fawkes-night",
  "uk-new-years-day",
  "uk-new-years-eve",
  "uk-remembrance-sunday",
  "uk-summer-bank-holiday",
  "juneteenth",
] as const;

describe("holidayEditorial (priority when-is pages)", () => {
  it("covers all 16 priority slugs with unique overview copy", () => {
    const overviews = new Set<string>();
    for (const slug of PRIORITY_SLUGS) {
      const def = holidayDefBySlug(slug);
      const ed = getHolidayEditorial(slug);
      assert.ok(def, `missing rule: ${slug}`);
      assert.ok(ed, `missing editorial: ${slug}`);
      const h = resolveHoliday(def, 2026);
      const overview = ed.overview(h).join("\n");
      assert.ok(overview.length > 280, `${slug} overview too thin (${overview.length})`);
      assert.ok(ed.meaning(h).join(" ").length > 120, `${slug} meaning too thin`);
      assert.ok(ed.planningTips(h).length >= 3, `${slug} needs planning tips`);
      assert.ok(ed.faq(h).length >= 2, `${slug} needs extra FAQ`);
      assert.ok(!overviews.has(overview), `duplicate overview: ${slug}`);
      overviews.add(overview);
    }
    assert.equal(overviews.size, PRIORITY_SLUGS.length);
  });

  it("meta descriptions mention the resolved year date", () => {
    for (const slug of PRIORITY_SLUGS) {
      const def = holidayDefBySlug(slug)!;
      const ed = getHolidayEditorial(slug)!;
      const h = resolveHoliday(def, 2027);
      const desc = ed.description(h);
      assert.ok(desc.includes("2027") || desc.includes(h.formatted), `${slug} desc missing year/date`);
      assert.ok(desc.length > 100 && desc.length < 320, `${slug} desc length ${desc.length}`);
    }
  });
});
