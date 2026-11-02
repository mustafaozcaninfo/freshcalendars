// Monogram avatars for the editors: initials on the beat colour, with the grain the old drawn
// portraits used. We have no photos of the editors, so we draw no faces.
// Usage: node apps/news/src/assets/authors/source/make-monograms.mjs  (writes the SVGs and PNGs)
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDITORS = [
  { id: "christina-gerland", initials: "CG", bg: "#f3ead8", ring: "#4f8a8b", ink: "#1f3352", dot: "#e0a33a" },
  { id: "aaron-kessler", initials: "AK", bg: "#f6ece6", ring: "#b8574a", ink: "#3b2a4a", dot: "#4f8a8b" },
  { id: "jessica-hartwell", initials: "JH", bg: "#e9f2f8", ring: "#2f7d7a", ink: "#3a3f45", dot: "#e98a3b" },
];

const svg = (e) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<defs><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
<rect width="1024" height="1024" fill="${e.bg}"/>
<circle cx="512" cy="512" r="400" fill="none" stroke="${e.ring}" stroke-width="10" opacity=".55"/>
<circle cx="512" cy="512" r="330" fill="none" stroke="${e.ring}" stroke-width="4" opacity=".4" stroke-dasharray="14 18"/>
<circle cx="820" cy="230" r="44" fill="${e.dot}" opacity=".85"/>
<text x="512" y="512" dy=".35em" text-anchor="middle" font-family="Sora, Manrope, Helvetica, Arial, sans-serif" font-weight="700" font-size="300" letter-spacing="8" fill="${e.ink}">${e.initials}</text>
<rect width="1024" height="1024" fill="#000" filter="url(#g)"/></svg>`;

for (const e of EDITORS) {
  const text = svg(e);
  writeFileSync(path.join(HERE, `${e.id}.svg`), text);
  await sharp(Buffer.from(text)).png().toFile(path.join(HERE, "..", `${e.id}.png`));
}
