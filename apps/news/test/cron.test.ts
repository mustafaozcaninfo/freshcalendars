import assert from "node:assert/strict";
import { it } from "node:test";
import { scheduled } from "../../../cloudflare/cron.js";

/** The Worker's cron tick against a fake bucket and a fake GitHub: which workflows it starts, and when. */
function world() {
  const store = new Map<string, string>();
  const calls: string[] = [];
  const env = {
    GH_DISPATCH_TOKEN: "x",
    STATE: {
      get: async (k: string) => (store.has(k) ? { text: async () => store.get(k)! } : null),
      head: async (k: string) => (store.has(k) ? {} : null),
      put: async (k: string, v: string) => { store.set(k, v); },
    },
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => { calls.push(url.split("/workflows/")[1]!); return { status: 204, text: async () => "" }; }) as unknown as typeof fetch;
  return { env, calls, store, restore: () => { globalThis.fetch = realFetch; } };
}
const tick = (h: number, m: number, d = 4) => ({ scheduledTime: Date.UTC(2026, 10, d, h, m) });

it("starts the Search Console read once a day after 09:10 UTC", async () => {
  const w = world();
  try {
    await scheduled(tick(9, 5), w.env);
    assert.ok(!w.calls.some((c) => c.startsWith("search-console")), "before 09:10 nothing starts");
    await scheduled(tick(9, 12), w.env);
    assert.equal(w.calls.filter((c) => c.startsWith("search-console.yml")).length, 1);
    await scheduled(tick(9, 17), w.env);
    assert.equal(w.calls.filter((c) => c.startsWith("search-console.yml")).length, 1, "marked done: no second start");
    await scheduled(tick(9, 12, 5), w.env);
    assert.equal(w.calls.filter((c) => c.startsWith("search-console.yml")).length, 2, "the next day starts it again");
  } finally { w.restore(); }
});

it("does not start a Search Console read more than 3 hours late", async () => {
  const w = world();
  try {
    await scheduled(tick(14, 0), w.env);
    assert.ok(!w.calls.some((c) => c.startsWith("search-console")));
  } finally { w.restore(); }
});

it("a failed dispatch is retried on the next tick", async () => {
  const w = world();
  const ok = globalThis.fetch;
  try {
    globalThis.fetch = (async () => ({ status: 500, text: async () => "boom" })) as unknown as typeof fetch;
    await scheduled(tick(9, 12), w.env);
    assert.equal(w.store.size, 0, "nothing marked done after a failed call");
    globalThis.fetch = ok;
    await scheduled(tick(9, 17), w.env);
    assert.ok(w.calls.some((c) => c.startsWith("search-console.yml")), "the next tick starts it");
  } finally { w.restore(); }
});
