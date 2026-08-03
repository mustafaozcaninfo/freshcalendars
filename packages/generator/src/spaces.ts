import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DIST_ASSETS, DIST_OG, DIST_SITE, ROOT } from "./paths.js";

function loadEnvFile(): void {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

export function spacesConfig() {
  loadEnvFile();
  const key = process.env.DO_SPACES_KEY;
  const secret = process.env.DO_SPACES_SECRET;
  const bucket = process.env.DO_SPACES_BUCKET || "freshcalendars";
  const region = process.env.DO_SPACES_REGION || "nyc3";
  const endpoint = process.env.DO_SPACES_ENDPOINT || `https://${region}.digitaloceanspaces.com`;
  const cdnOrigin = (process.env.CDN_ORIGIN || "https://cdn.freshcalendars.com").replace(/\/$/, "");
  const cdnEndpointId =
    process.env.DO_CDN_ENDPOINT_ID || "fb3b07cf-83cb-4b09-aca0-b681c6b050d9";
  if (!key || !secret) throw new Error("DO_SPACES_KEY / DO_SPACES_SECRET missing in .env");
  return { key, secret, bucket, region, endpoint, cdnOrigin, cdnEndpointId };
}

function client() {
  const c = spacesConfig();
  return new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    credentials: { accessKeyId: c.key, secretAccessKey: c.secret },
    forcePathStyle: false,
  });
}

function contentType(file: string): string {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".pdf")) return "application/pdf";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".woff2")) return "font/woff2";
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".css")) return "text/css";
  if (file.endsWith(".js")) return "application/javascript";
  if (file.endsWith(".html")) return "text/html";
  if (file.endsWith(".xml")) return "application/xml";
  if (file.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries: fs.Dirent[];
    try {
      entries = await fsp.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else out.push(full);
    }
  }
  await walk(dir);
  return out;
}

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

type SyncManifest = Record<string, string>;

function manifestPath(): string {
  return path.join(DIST_SITE, ".cdn-sync-manifest.json");
}

async function loadSyncManifest(): Promise<SyncManifest> {
  try {
    return JSON.parse(await fsp.readFile(manifestPath(), "utf8")) as SyncManifest;
  } catch {
    return {};
  }
}

async function saveSyncManifest(m: SyncManifest): Promise<void> {
  await fsp.mkdir(path.dirname(manifestPath()), { recursive: true });
  await fsp.writeFile(manifestPath(), JSON.stringify(m, null, 2) + "\n", "utf8");
}

async function putFile(localPath: string, key: string): Promise<void> {
  const c = spacesConfig();
  const body = await fsp.readFile(localPath);
  const s3 = client();
  await s3.send(
    new PutObjectCommand({
      Bucket: c.bucket,
      Key: key,
      Body: body,
      ACL: "public-read",
      ContentType: contentType(localPath),
      CacheControl: "public, max-age=604800, immutable",
    }),
  );
}

export async function syncDirToSpaces(
  localDir: string,
  prefix: string,
  opts?: { manifest?: SyncManifest; dedupe?: boolean },
): Promise<{ uploaded: number; skipped: number }> {
  const files = await walkFiles(localDir);
  const manifest = opts?.manifest ?? {};
  const dedupe = opts?.dedupe ?? true;
  let uploaded = 0;
  let skipped = 0;
  const seenKeys = new Set<string>();

  for (const file of files) {
    const rel = path.relative(localDir, file).split(path.sep).join("/");
    const key = `${prefix.replace(/\/$/, "")}/${rel}`.replace(/^\//, "");
    if (seenKeys.has(key)) {
      skipped++;
      continue;
    }
    seenKeys.add(key);

    const body = await fsp.readFile(file);
    const hash = sha256(body);
    if (dedupe && manifest[key] === hash) {
      skipped++;
      continue;
    }
    await putFile(file, key);
    manifest[key] = hash;
    uploaded++;
    if ((uploaded + skipped) % 25 === 0) {
      console.log(`  progress ${uploaded + skipped}/${files.length} (uploaded ${uploaded}, skipped ${skipped})`);
    }
  }
  return { uploaded, skipped };
}

export async function syncCdnAssets(): Promise<void> {
  const c = spacesConfig();
  console.log(`Syncing to s3://${c.bucket} → ${c.cdnOrigin}`);
  const manifest = await loadSyncManifest();
  const a = await syncDirToSpaces(DIST_ASSETS, "assets", { manifest, dedupe: true });
  const o = await syncDirToSpaces(DIST_OG, "og", { manifest, dedupe: true });
  await saveSyncManifest(manifest);
  console.log(
    `Done — assets uploaded=${a.uploaded} skipped=${a.skipped}; og uploaded=${o.uploaded} skipped=${o.skipped}`,
  );
}

export async function purgeDoCdn(files?: string[]): Promise<void> {
  loadEnvFile();
  const token = process.env.DIGITALOCEAN_ACCESS_TOKEN || process.env.DO_API_TOKEN;
  if (!token) throw new Error("DIGITALOCEAN_ACCESS_TOKEN missing");
  const { cdnEndpointId, cdnOrigin } = spacesConfig();
  const body = files?.length
    ? { files: files.map((f) => (f.startsWith("/") ? f : `/${f}`)) }
    : undefined;
  const payload = body ?? {
    files: ["/assets/*", "/og/*"],
  };
  const res = await fetch(`https://api.digitalocean.com/v2/cdn/endpoints/${cdnEndpointId}/cache`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CDN purge failed ${res.status}: ${text}`);
  console.log(`CDN purged on ${cdnOrigin}:`, text.slice(0, 200));
}
