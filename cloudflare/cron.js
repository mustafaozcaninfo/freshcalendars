// Starts the site's timed GitHub Actions jobs from a Cloudflare cron trigger (every 5 minutes,
// wrangler.jsonc). GitHub's own schedule starts runs late and skips many, so the workflows only
// listen for workflow_dispatch and this decides when to call them:
//   - a story whose publishedAt has come (deploy.sh writes the next one to news/next-due) starts
//     scheduled.yml, which rebuilds the deployed commit with it;
//   - the calendar jobs start at the times the VPS crontab used (UTC).
// A job is marked done in the STATE bucket only after GitHub accepts the call, so a failed call or
// a missed tick is retried on the next tick. Needs the secret GH_DISPATCH_TOKEN (a fine-grained
// token with Actions: write on this repository only).

const REPO = "mustafaozcaninfo/freshcalendars";
const CATCH_UP = 3 * 3600_000; // a calendar job missed for longer than this waits for its next day
const STORY_RETRY = 30 * 60_000; // a due story still not built is asked for again after this

/** Calendar jobs, as in .github/workflows/calendar.yml. `on` gets the UTC date. */
const CALENDAR = [
  { job: "refresh-meta", h: 5, m: 25, on: () => true },
  { job: "refresh", h: 6, m: 30, on: (d) => d.getUTCDate() === 1 && d.getUTCMonth() !== 0 },
  { job: "generate-next", h: 8, m: 45, on: (d) => d.getUTCDate() === 1 && d.getUTCMonth() === 8 },
  { job: "rollover", h: 6, m: 30, on: (d) => d.getUTCDate() === 1 && d.getUTCMonth() === 0 },
  { job: "health", h: 7, m: 15, on: (d) => d.getUTCDay() === 1 },
];

export async function scheduled(controller, env) {
  if (!env.GH_DISPATCH_TOKEN) {
    console.warn("cron: GH_DISPATCH_TOKEN is not set; nothing started");
    return;
  }
  const now = controller.scheduledTime;
  await stories(env, now);
  await calendar(env, now);
}

async function stories(env, now) {
  const next = Number(await read(env, "news/next-due")) * 1000;
  if (!next || now < next) return;
  const [forNext, at] = ((await read(env, "cron/stories")) || "0 0").split(" ").map(Number);
  if (forNext === next && now - at < STORY_RETRY) return;
  if (await dispatch(env, "scheduled.yml")) {
    await env.STATE.put("cron/stories", `${next} ${now}`);
    console.log(`cron: story due ${new Date(next).toISOString()}, started scheduled.yml`);
  }
}

async function calendar(env, now) {
  const day = new Date(now);
  const date = day.toISOString().slice(0, 10);
  for (const c of CALENDAR) {
    const at = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), c.h, c.m);
    if (!c.on(day) || now < at || now - at > CATCH_UP) continue;
    const key = `cron/calendar/${c.job}/${date}`;
    if (await env.STATE.head(key)) continue;
    if (await dispatch(env, "calendar.yml", { job: c.job })) {
      await env.STATE.put(key, new Date(now).toISOString());
      console.log(`cron: started calendar.yml ${c.job}`);
    }
  }
}

async function dispatch(env, workflow, inputs) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "freshcalendars-cron",
    },
    body: JSON.stringify({ ref: "main", ...(inputs ? { inputs } : {}) }),
  });
  if (res.status === 204) return true;
  console.error(`cron: ${workflow} dispatch failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return false;
}

async function read(env, key) {
  const o = await env.STATE.get(key);
  return o ? (await o.text()).trim() : "";
}
