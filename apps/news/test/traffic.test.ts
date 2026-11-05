import assert from "node:assert/strict";
import { it } from "node:test";
import { authHeaders, collect, groupQuery, merge, pathFilter, report } from "../../../scripts/news-traffic.mjs";

it("authHeaders prefers the scoped token, falls back to email and key, else null", () => {
  assert.deepEqual(authHeaders({ CF_ANALYTICS_TOKEN: "t", CF_EMAIL: "a@b", CF_API_KEY: "k" }), { authorization: "Bearer t" });
  assert.deepEqual(authHeaders({ CF_EMAIL: "a@b", CF_API_KEY: "k" }), { "x-auth-email": "a@b", "x-auth-key": "k" });
  assert.equal(authHeaders({ CF_EMAIL: "a@b" }), null);
  assert.equal(authHeaders({}), null);
});

it("pathFilter and groupQuery scope the section and exclude bots", () => {
  assert.match(pathFilter("news"), /_like: "\/news\/%"/);
  assert.match(pathFilter("site"), /_notlike: "\/news\/%"/);
  assert.equal(pathFilter("all"), "");
  const q = groupQuery("clientCountryName", "news");
  assert.match(q, /dimensions \{ clientCountryName \}/);
  assert.match(q, /requestSource: "eyeball"/);
  assert.match(q, /userAgent_notlike: "%bot%"/);
});

it("merge adds the same key across days and ranks by count", () => {
  const day1 = [{ count: 5, dimensions: { p: "/a/" } }, { count: 2, dimensions: { p: "/b/" } }];
  const day2 = [{ count: 4, dimensions: { p: "/b/" } }, { count: 1, dimensions: { p: "" } }];
  assert.deepEqual(merge([day1, day2], "p"), [{ name: "/b/", count: 6 }, { name: "/a/", count: 5 }, { name: "(none)", count: 1 }]);
});

it("collect merges days, keeps going when one query fails and says so", async () => {
  let calls = 0;
  const fetchImpl = async (_url: string, init: { body: string }) => {
    calls++;
    const { query } = JSON.parse(init.body);
    if (query.includes("httpRequests1dGroups")) return { ok: true, status: 200, json: async () => ({ data: { viewer: { zones: [{ httpRequests1dGroups: [{ dimensions: { date: "2026-11-04" }, sum: { pageViews: 10, requests: 50 }, uniq: { uniques: 7 } }] }] } } }) };
    if (query.includes("clientCountryName")) return { ok: false, status: 400, json: async () => ({ errors: [{ message: "bad window" }] }) };
    return { ok: true, status: 200, json: async () => ({ data: { viewer: { zones: [{ httpRequestsAdaptiveGroups: [{ count: 3, dimensions: { clientRequestPath: "/news/x/", clientRefererHost: "", clientDeviceType: "mobile" } }] }] } } }) };
  };
  const data = await collect({ fetchImpl, headers: {}, zone: "z", days: 2, section: "all", now: new Date("2026-11-05T00:00:00Z") });
  assert.equal(calls, 4 * 2 + 1);
  assert.deepEqual(data.pages, [{ name: "/news/x/", count: 6 }]);
  assert.deepEqual(data.countries, []);
  assert.match(data.failed.join(" "), /countries 2026-11-04: 400 bad window/);
  const text = report({ days: 2, section: "all", ...data });
  assert.match(text, /visitors\s+7/);
  assert.match(text, /\/news\/x\//);
  assert.match(text, /Not loaded: countries/);
});
