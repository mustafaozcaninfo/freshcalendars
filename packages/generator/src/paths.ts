import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../../..");
export const DIST = path.join(ROOT, "dist");
export const DIST_SITE = path.join(DIST, "site");
export const DIST_ASSETS = path.join(DIST, "assets");
export const DIST_META = path.join(DIST, "meta");
export const DIST_OG = path.join(DIST, "og");
export const TEMPLATES = path.join(ROOT, "packages/templates");

/** Zoom viewer for calendar previews, self-hosted under a versioned path so a 30-day cache never
 *  serves an old copy (gen.ts copies it; sitePages.ts LIGHTBOX_JS loads it). Keep equal to the
 *  photoswipe version pinned in package.json; gen.ts fails the build if they differ. */
export const PHOTOSWIPE_VERSION = "5.4.4";
export const PHOTOSWIPE_PATH = `/lib/photoswipe-${PHOTOSWIPE_VERSION}/`;
