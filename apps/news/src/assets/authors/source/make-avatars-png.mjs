// Renders the SVGs that make-avatars.py writes into the 1024x1024 PNGs the author pages use.
// Usage: python3 make-avatars.py . && node make-avatars-png.mjs  (from this folder)
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
for (const id of ["christina-gerland", "aaron-kessler", "jessica-hartwell", "news-desk"]) {
  await sharp(readFileSync(path.join(HERE, `${id}.svg`))).png().toFile(path.join(HERE, "..", `${id}.png`));
}
