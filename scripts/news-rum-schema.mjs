#!/usr/bin/env node
// One-off helper: prints the GraphQL schema of Cloudflare Web Analytics (RUM) datasets the
// read-only CF_AE_TOKEN can see, so scripts/news-traffic.mjs can query the right fields.
//   CF_AE_TOKEN=... CF_ACCOUNT_ID=... node scripts/news-rum-schema.mjs
const token = process.env.CF_AE_TOKEN;
if (!token) { console.log("rum-schema: no CF_AE_TOKEN"); process.exit(0); }
const q = async (query, variables = {}) => {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
  return res.json();
};
const typeOf = (t) => (t.ofType ? typeOf(t.ofType) : t.name);
const fields = async (name) => (await q(`query($n:String!){__type(name:$n){fields{name type{name kind ofType{name kind ofType{name kind ofType{name}}}} args{name type{name kind ofType{name kind ofType{name}}}}}}}`, { n: name })).data?.__type?.fields ?? [];
const inputFields = async (name) => (await q(`query($n:String!){__type(name:$n){inputFields{name}}}`, { n: name })).data?.__type?.inputFields?.map((f) => f.name) ?? [];
const acct = await fields("account");
const rum = acct.filter((f) => /^rum/i.test(f.name));
console.log("account fields starting with rum:", rum.map((f) => f.name).join(", ") || "(none)");
for (const f of rum) {
  const t = typeOf(f.type);
  const filterArg = f.args.find((a) => a.name === "filter");
  const fType = filterArg ? typeOf(filterArg.type) : null;
  console.log(`\n== ${f.name} -> ${t}`);
  if (fType) console.log(`filter (${fType}):`, (await inputFields(fType)).join(", "));
  for (const sub of await fields(t)) {
    const st = typeOf(sub.type);
    const inner = await fields(st);
    console.log(`  ${sub.name}: ${inner.map((x) => x.name).join(", ") || st}`);
  }
}
const site = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/rum/site_info/list`, { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json()).catch((e) => ({ error: e.message }));
console.log("\nsite_info/list:", JSON.stringify(site).slice(0, 600));
