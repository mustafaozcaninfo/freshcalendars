import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holidaysForMonth } from "../holidays/engine.js";
import { buildMetaForEntry } from "../seo/buildMeta.js";
import { buildMonthlyFaq, getMonthEditorial } from "./monthlyEditorial.js";

describe("monthly editorial uniqueness", () => {
  it("has distinct leads and FAQ questions across 12 months", () => {
    const leads = new Set<string>();
    const firstFaq = new Set<string>();
    for (let m = 1; m <= 12; m++) {
      const ed = getMonthEditorial(m);
      const lead = ed.lead(2026);
      assert.ok(lead.length > 40, `month ${m} lead too short`);
      assert.equal(leads.has(lead), false, `duplicate lead month ${m}`);
      leads.add(lead);

      const faq = buildMonthlyFaq(2026, m, holidaysForMonth(2026, m));
      assert.ok(faq.length >= 4, `month ${m} needs ≥4 FAQs`);
      const q0 = faq[0]!.q;
      assert.equal(firstFaq.has(q0), false, `duplicate FAQ q month ${m}`);
      firstFaq.add(q0);

      const overs = ed.overview(2026).join("\n");
      for (let other = 1; other < m; other++) {
        const otherOver = getMonthEditorial(other).overview(2026).join("\n");
        assert.notEqual(overs, otherOver, `overview collision ${m} vs ${other}`);
      }
    }
  });

  it("monthly meta includes 6 CDN variants", () => {
    const meta = buildMetaForEntry(
      {
        kind: "monthly-evergreen",
        pageId: "month-august-evergreen",
        path: "/printable-august-calendar.html",
        month: "august",
      },
      { year: 2026, month: 8 },
    );
    assert.equal(meta.variants?.length, 6);
    assert.ok(meta.variants?.some((v) => v.id === "monday-start"));
    assert.ok(meta.download.png.includes("/classic-bw/"));
    assert.ok(meta.download.png.startsWith("https://cdn."));
    assert.ok(meta.faq.some((f) => f.q.includes("August 2026")));
  });
});
