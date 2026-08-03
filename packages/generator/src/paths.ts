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
