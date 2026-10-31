import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { archiveMonths, archivePath } from "../src/lib/archive.ts";

describe("archiveMonths", () => {
  const at = (iso: string) => ({ id: iso, d: new Date(iso) });
  it("groups by Eastern Time month, newest month first, keeping input order", () => {
    // 01:30 UTC on Nov. 1 is still Oct. 31 in New York.
    const items = [at("2026-11-02T12:00:00-05:00"), at("2026-11-01T01:30:00Z"), at("2026-10-15T09:00:00-04:00"), at("2025-12-31T23:00:00-05:00")];
    const months = archiveMonths(items, (x) => x.d);
    assert.deepEqual(months.map((m) => [m.name, m.path, m.items.map((x) => x.id)]), [
      ["November 2026", "/news/archive/2026/11/", ["2026-11-02T12:00:00-05:00"]],
      ["October 2026", "/news/archive/2026/10/", ["2026-11-01T01:30:00Z", "2026-10-15T09:00:00-04:00"]],
      ["December 2025", "/news/archive/2025/12/", ["2025-12-31T23:00:00-05:00"]],
    ]);
  });
  it("lists every story exactly once", () => {
    const items = Array.from({ length: 500 }, (_, i) => at(new Date(Date.UTC(2026, 0, 1) + i * 86400e3 * 0.9).toISOString()));
    const months = archiveMonths(items, (x) => x.d);
    assert.equal(months.reduce((n, m) => n + m.items.length, 0), 500);
    assert.equal(new Set(months.map((m) => m.path)).size, months.length);
  });
  it("pads the month", () => assert.equal(archivePath(2027, 3), "/news/archive/2027/03/"));
});
