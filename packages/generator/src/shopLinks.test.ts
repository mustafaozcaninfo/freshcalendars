import assert from "node:assert/strict";
import { test } from "node:test";
import { SHOP_BOX_KEYS, shopBoxHref, shopBoxHtml } from "./shopLinks.js";

test("a page without a match gets no shop box", () => {
  assert.equal(shopBoxHtml("when-is:groundhog-day"), "");
  assert.equal(shopBoxHtml(""), "");
});

test("every shop box links the shop over https and carries the disclosure", () => {
  for (const key of SHOP_BOX_KEYS) {
    const html = shopBoxHtml(key);
    assert.match(shopBoxHref(key)!, /^https:\/\/shop\.freshcalendars\.com\/[a-z0-9/-]+$/);
    assert.equal((html.match(/<a /g) ?? []).length, 1);
    assert.match(html, /earns a commission/);
    assert.doesNotMatch(html, /[—!]/);
  }
});
