/**
 * Original illustration library for /news/ heroes and printables. Everything is drawn here as SVG
 * (gradients, light, grain), so every image is ours: no stock art, no third-party marks, no AI models.
 *
 *   scene("halloween", { color, seed })   → full-bleed 1200×675 SVG body for a hero
 *   icon("pumpkin", color)                → small flat motif for printable headers (ink-light)
 *
 * Scenes keep their main shapes between x 560 and 1050 so the hero's text side stays clear and the
 * 4:3 and 1:1 crops (middle 900 px) still show the subject. A seed (the story slug) moves and recolors
 * the details, so two stories on one topic never get the same picture.
 */

export const SCENES = [
  "halloween", "halloween-party", "thanksgiving", "election", "winter-holidays", "night-sky", "time-change",
  "shopping", "school", "money", "puzzle", "fireworks", "spring", "autumn", "calendar", "gaming", "sports", "phone",
] as const;
export type SceneName = (typeof SCENES)[number];

/** Base color per scene, used when the story sets no `assets.color`. */
export const SCENE_COLOR: Record<SceneName, string> = {
  halloween: "#3b1d5e", "halloween-party": "#2e1065", thanksgiving: "#9a3412", election: "#1e3a8a", "winter-holidays": "#14532d", "night-sky": "#1e1b4b",
  "time-change": "#6d28d9", shopping: "#be123c", school: "#0f766e", money: "#166534", puzzle: "#4c1d95",
  fireworks: "#1e1b4b", spring: "#0e7490", autumn: "#9a3412", calendar: "#1e3a8a", gaming: "#312e81", sports: "#14532d", phone: "#1e293b",
};

/** Which scene a category gets when `assets.scene` is not set. */
export const CATEGORY_SCENE: Record<string, SceneName> = {
  holidays: "calendar", planning: "calendar", "retail-dates": "shopping", "school-calendars": "school",
  "sky-events": "night-sky", "time-change": "time-change", "uk-canada": "calendar", puzzles: "puzzle",
  elections: "election", "calendar-guides": "calendar", sports: "calendar",
  "money-benefits": "money", "gaming-tech": "gaming",
};

type Opts = { color: string; seed: string };
type Rng = () => number;

/** Small deterministic PRNG (mulberry32) seeded from a string. */
export function rng(seed: string): Rng {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r: Rng, a: number, b: number) => a + (b - a) * r();
const pick = <T,>(r: Rng, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
const f1 = (n: number) => Math.round(n * 10) / 10;

/** #rrggbb mixed toward white (t>0) or black (t<0). */
export function tint(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => {
    const c = (n >> s) & 255;
    return Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  };
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// ── shared defs: light, shadow and film grain ─────────────────────────────
function defs(color: string): string {
  return `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tint(color, -0.15)}"/><stop offset=".55" stop-color="${tint(color, -0.45)}"/><stop offset="1" stop-color="${tint(color, -0.7)}"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".5" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="vig" cx=".62" cy=".45" r=".85"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-opacity=".35"/></filter>
  <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>
  </defs>`;
}

/** Bokeh-like soft light dots in the background. */
function bokeh(r: Rng, n: number, color = "#fff"): string {
  return Array.from({ length: n }, () => `<circle cx="${f1(between(r, 420, 1200))}" cy="${f1(between(r, 0, 675))}" r="${f1(between(r, 8, 46))}" fill="${color}" opacity="${f1(between(r, 0.03, 0.1) * 100) / 100}" filter="url(#blur)"/>`).join("");
}

function stars(r: Rng, n: number, y0 = 0, y1 = 420): string {
  return Array.from({ length: n }, () => {
    const x = f1(between(r, 380, 1200)), y = f1(between(r, y0, y1)), s = f1(between(r, 0.8, 2.6));
    return `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${f1(between(r, 0.35, 0.95) * 100) / 100}"/>`;
  }).join("");
}

function moon(x: number, y: number, rad: number, phase = 0): string {
  x = Math.round(x);
  const shadow = phase ? `<circle cx="${x + rad * phase}" cy="${y - rad * 0.15}" r="${rad * 0.98}" fill="#0b1026" opacity=".92"/>` : "";
  return `<g><circle cx="${x}" cy="${y}" r="${rad * 2.4}" fill="url(#glow)" opacity=".55"/>
  <radialGradient id="mn${x}" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fffbea"/><stop offset=".7" stop-color="#f6e7b4"/><stop offset="1" stop-color="#d9c58a"/></radialGradient>
  <circle cx="${x}" cy="${y}" r="${rad}" fill="url(#mn${x})"/>
  <circle cx="${x - rad * 0.3}" cy="${y - rad * 0.2}" r="${rad * 0.16}" fill="#d8c48d" opacity=".55"/><circle cx="${x + rad * 0.28}" cy="${y + rad * 0.25}" r="${rad * 0.22}" fill="#d8c48d" opacity=".45"/><circle cx="${x + rad * 0.1}" cy="${y - rad * 0.42}" r="${rad * 0.09}" fill="#d8c48d" opacity=".5"/>${shadow}</g>`;
}

// ── motifs ────────────────────────────────────────────────────────────────
function pumpkin(x: number, y: number, s: number, carved: boolean, id: string): string {
  const lobes = [-0.62, -0.32, 0.32, 0.62, 0].map((dx, i) => `<ellipse cx="${x + dx * 100 * s}" cy="${y}" rx="${(i === 4 ? 52 : 48) * s}" ry="${78 * s}" fill="url(#pk${id})" stroke="#8a3b06" stroke-opacity=".35" stroke-width="${2 * s}"/>`).join("");
  const face = carved
    ? `<g fill="#ffd36b"><path d="M${x - 58 * s} ${y - 18 * s} l${22 * s} ${-30 * s} l${22 * s} ${30 * s}z"/><path d="M${x + 14 * s} ${y - 18 * s} l${22 * s} ${-30 * s} l${22 * s} ${30 * s}z"/>
      <path d="M${x - 70 * s} ${y + 14 * s} q${70 * s} ${58 * s} ${140 * s} 0 l${-16 * s} ${4 * s} l${-10 * s} ${14 * s} l${-14 * s} ${-12 * s} l${-14 * s} ${14 * s} l${-14 * s} ${-14 * s} l${-14 * s} ${14 * s} l${-14 * s} ${-14 * s} l${-14 * s} ${12 * s} l${-10 * s} ${-14 * s}z"/></g>
      <ellipse cx="${x}" cy="${y + 4 * s}" rx="${120 * s}" ry="${70 * s}" fill="url(#warm)" opacity=".55"/>`
    : "";
  return `<g filter="url(#soft)"><radialGradient id="pk${id}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffb24a"/><stop offset=".6" stop-color="#f07d12"/><stop offset="1" stop-color="#b24f06"/></radialGradient>
  <path d="M${x - 6 * s} ${y - 70 * s} q${-4 * s} ${-26 * s} ${10 * s} ${-40 * s} l${10 * s} ${8 * s} q${-10 * s} ${12 * s} ${-4 * s} ${32 * s}z" fill="#4d6b2a"/>
  ${lobes}${face}</g>`;
}

/** Black cauldron with a glowing brew, rising bubbles and LED-style light (no fog: our stories say no dry ice). */
function cauldron(x: number, y: number, s: number, r: Rng): string {
  const bubbles = Array.from({ length: 16 }, () => {
    const bx = x + between(r, -120, 120) * s, by = y - between(r, 10, 230) * s, br = between(r, 5, 18) * s;
    return `<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(br)}" fill="#a3e635" fill-opacity="${f1(between(r, 0.25, 0.7) * 100) / 100}" stroke="#ecfccb" stroke-opacity=".7" stroke-width="2"/><circle cx="${f1(bx - br * 0.35)}" cy="${f1(by - br * 0.35)}" r="${f1(br * 0.25)}" fill="#fff" opacity=".8"/>`;
  }).join("");
  return `<g><ellipse cx="${x}" cy="${y - 40 * s}" rx="${260 * s}" ry="${200 * s}" fill="#84cc16" opacity=".22" filter="url(#blur)"/>
  <ellipse cx="${x}" cy="${y + 175 * s}" rx="${230 * s}" ry="${26 * s}" fill="#000" opacity=".45"/>
  ${[-120, 0, 120].map((dx) => `<path d="M${x + dx * s - 14 * s} ${y + 120 * s} l${8 * s} ${56 * s} h${12 * s} l${8 * s} ${-56 * s}z" fill="#111827"/>`).join("")}
  <radialGradient id="cz" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#4b5563"/><stop offset=".45" stop-color="#1f2937"/><stop offset="1" stop-color="#030712"/></radialGradient>
  <g filter="url(#soft)"><path d="M${x - 190 * s} ${y - 10 * s} q0 ${200 * s} ${190 * s} ${200 * s} q${190 * s} 0 ${190 * s} ${-200 * s}z" fill="url(#cz)"/>
  <path d="M${x - 150 * s} ${y + 40 * s} q${40 * s} ${110 * s} ${110 * s} ${125 * s}" stroke="#9ca3af" stroke-opacity=".35" stroke-width="${10 * s}" fill="none" stroke-linecap="round"/></g>
  <radialGradient id="brew" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#d9f99d"/><stop offset=".5" stop-color="#84cc16"/><stop offset="1" stop-color="#4d7c0f"/></radialGradient>
  <ellipse cx="${x}" cy="${y - 10 * s}" rx="${200 * s}" ry="${44 * s}" fill="#111827"/><ellipse cx="${x}" cy="${y - 14 * s}" rx="${176 * s}" ry="${32 * s}" fill="url(#brew)"/>
  <path d="M${x - 176 * s} ${y - 14 * s} q${30 * s} ${-26 * s} ${60 * s} 0 q${30 * s} ${-22 * s} ${60 * s} 0 q${30 * s} ${-30 * s} ${60 * s} 0 q${30 * s} ${-24 * s} ${60 * s} 0 q${30 * s} ${-28 * s} ${56 * s} 0" fill="#bef264" opacity=".85"/>
  <ellipse cx="${x}" cy="${y - 10 * s}" rx="${204 * s}" ry="${46 * s}" fill="none" stroke="#374151" stroke-width="${14 * s}"/>
  <g transform="rotate(24 ${x + 90 * s} ${y - 60 * s})"><rect x="${x + 80 * s}" y="${y - 210 * s}" width="${16 * s}" height="${190 * s}" rx="${8 * s}" fill="#a16207"/><rect x="${x + 82 * s}" y="${y - 210 * s}" width="${5 * s}" height="${190 * s}" rx="2" fill="#fde68a" opacity=".5"/></g>
  ${bubbles}</g>`;
}

function bat(x: number, y: number, s: number): string {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 q-14 -16 -40 -12 q10 6 8 16 q-12 -4 -22 4 q12 2 16 12 q14 -14 38 -6 q2 -6 0 -14 q-2 8 0 14 q24 -8 38 6 q4 -10 16 -12 q-10 -8 -22 -4 q-2 -10 8 -16 q-26 -4 -40 12z" fill="#0b0b16" opacity=".88"/>`;
}

function leaf(x: number, y: number, s: number, rot: number, color: string): string {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 100) / 100})"><path d="M0 -40 l9 18 l18 -8 l-4 20 l18 4 l-16 12 l8 16 l-20 -4 l-4 22 h-2 l-4 -22 l-20 4 l8 -16 l-16 -12 l18 -4 l-4 -20 l18 8z" fill="${color}"/><path d="M0 -34 V40" stroke="#5b2a0a" stroke-opacity=".45" stroke-width="2"/></g>`;
}

function turkeyRoast(x: number, y: number, s: number): string {
  return `<g filter="url(#soft)"><radialGradient id="rst" cx=".42" cy=".32" r=".8"><stop offset="0" stop-color="#f6c071"/><stop offset=".55" stop-color="#c9761f"/><stop offset="1" stop-color="#7a3d0c"/></radialGradient>
  <ellipse cx="${x}" cy="${y + 70 * s}" rx="${230 * s}" ry="${54 * s}" fill="#e9edf2"/><ellipse cx="${x}" cy="${y + 64 * s}" rx="${200 * s}" ry="${40 * s}" fill="#f8fafc"/>
  <circle cx="${x - 160 * s}" cy="${y + 52 * s}" r="${14 * s}" fill="#5a8f2e"/><circle cx="${x - 140 * s}" cy="${y + 62 * s}" r="${12 * s}" fill="#b91c1c"/><circle cx="${x + 150 * s}" cy="${y + 56 * s}" r="${13 * s}" fill="#5a8f2e"/><circle cx="${x + 170 * s}" cy="${y + 64 * s}" r="${11 * s}" fill="#d97706"/>
  <ellipse cx="${x}" cy="${y}" rx="${150 * s}" ry="${92 * s}" fill="url(#rst)"/>
  <path d="M${x - 120 * s} ${y - 30 * s} q${120 * s} ${-70 * s} ${240 * s} 0" stroke="#ffe0a8" stroke-opacity=".45" stroke-width="${10 * s}" fill="none" stroke-linecap="round"/>
  <g><ellipse cx="${x - 150 * s}" cy="${y - 40 * s}" rx="${44 * s}" ry="${30 * s}" transform="rotate(-35 ${x - 150 * s} ${y - 40 * s})" fill="url(#rst)"/><rect x="${x - 205 * s}" y="${y - 92 * s}" width="${16 * s}" height="${34 * s}" rx="${6 * s}" transform="rotate(-35 ${x - 197 * s} ${y - 75 * s})" fill="#fff"/></g>
  <g><ellipse cx="${x + 150 * s}" cy="${y - 40 * s}" rx="${44 * s}" ry="${30 * s}" transform="rotate(35 ${x + 150 * s} ${y - 40 * s})" fill="url(#rst)"/><rect x="${x + 189 * s}" y="${y - 92 * s}" width="${16 * s}" height="${34 * s}" rx="${6 * s}" transform="rotate(35 ${x + 197 * s} ${y - 75 * s})" fill="#fff"/></g></g>`;
}

function pie(x: number, y: number, s: number): string {
  return `<g filter="url(#soft)"><ellipse cx="${x}" cy="${y + 10 * s}" rx="${90 * s}" ry="${30 * s}" fill="#e5e7eb"/><ellipse cx="${x}" cy="${y}" rx="${80 * s}" ry="${26 * s}" fill="#c2621a"/><ellipse cx="${x}" cy="${y - 4 * s}" rx="${66 * s}" ry="${19 * s}" fill="#e08a2e"/><path d="M${x - 80 * s} ${y} q${80 * s} ${40 * s} ${160 * s} 0" stroke="#f3c27a" stroke-width="${8 * s}" fill="none"/><ellipse cx="${x + 10 * s}" cy="${y - 8 * s}" rx="${18 * s}" ry="${7 * s}" fill="#fff"/></g>`;
}

function ballotBox(x: number, y: number, s: number): string {
  const check = (cx: number, cy: number) => `<rect x="${cx}" y="${cy}" width="${18 * s}" height="${18 * s}" rx="${3 * s}" fill="none" stroke="#1e3a8a" stroke-width="${2.5 * s}"/><path d="M${cx + 3 * s} ${cy + 9 * s} l${5 * s} ${6 * s} l${10 * s} ${-14 * s}" stroke="#16a34a" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>`;
  return `<g filter="url(#soft)"><linearGradient id="bbx" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient>
  <g transform="rotate(-8 ${x} ${y - 120 * s})"><rect x="${x - 70 * s}" y="${y - 220 * s}" width="${140 * s}" height="${170 * s}" rx="${6 * s}" fill="#fff"/>
  ${[0, 1, 2].map((i) => `${check(x - 50 * s, y - (190 - i * 44) * s)}<rect x="${x - 22 * s}" y="${y - (186 - i * 44) * s}" width="${(70 - i * 12) * s}" height="${8 * s}" rx="${4 * s}" fill="#cbd5e1"/>`).join("")}</g>
  <path d="M${x - 170 * s} ${y - 60 * s} h${340 * s} l${-24 * s} ${220 * s} h${-292 * s}z" fill="url(#bbx)"/>
  <rect x="${x - 182 * s}" y="${y - 78 * s}" width="${364 * s}" height="${30 * s}" rx="${8 * s}" fill="#e2e8f0"/><rect x="${x - 90 * s}" y="${y - 68 * s}" width="${180 * s}" height="${10 * s}" rx="${5 * s}" fill="#334155"/>
  <rect x="${x - 146 * s}" y="${y + 10 * s}" width="${292 * s}" height="${58 * s}" fill="#1e3a8a"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${x - 100 * s + i * 50 * s} ${y + 39 * s}) scale(${s})" d="M0 -14 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10z" fill="#fff"/>`).join("")}
  <rect x="${x - 146 * s}" y="${y + 68 * s}" width="${292 * s}" height="${12 * s}" fill="#b91c1c"/></g>`;
}

function clock(x: number, y: number, rad: number, h: number, m: number): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6, r1 = rad * (i % 3 ? 0.84 : 0.78), r2 = rad * 0.9;
    return `<line x1="${f1(x + r1 * Math.sin(a))}" y1="${f1(y - r1 * Math.cos(a))}" x2="${f1(x + r2 * Math.sin(a))}" y2="${f1(y - r2 * Math.cos(a))}" stroke="#1f2937" stroke-width="${i % 3 ? 3 : 7}" stroke-linecap="round"/>`;
  }).join("");
  const ha = ((h % 12) + m / 60) * (Math.PI / 6), ma = m * (Math.PI / 30);
  return `<g filter="url(#soft)"><circle cx="${x}" cy="${y}" r="${rad * 1.12}" fill="#1f2937"/><radialGradient id="cf" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e2e8f0"/></radialGradient><circle cx="${x}" cy="${y}" r="${rad}" fill="url(#cf)"/>${ticks}
  <line x1="${x}" y1="${y}" x2="${f1(x + rad * 0.5 * Math.sin(ha))}" y2="${f1(y - rad * 0.5 * Math.cos(ha))}" stroke="#111827" stroke-width="12" stroke-linecap="round"/>
  <line x1="${x}" y1="${y}" x2="${f1(x + rad * 0.76 * Math.sin(ma))}" y2="${f1(y - rad * 0.76 * Math.cos(ma))}" stroke="#111827" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="10" fill="#dc2626"/></g>`;
}

/** Curved arrow around a point; dir -1 = counterclockwise ("fall back"). */
function arcArrow(x: number, y: number, rad: number, dir: 1 | -1, color: string): string {
  const a0 = dir < 0 ? -0.25 : -2.6, a1 = dir < 0 ? -2.6 : -0.25;
  const p = (a: number) => `${f1(x + rad * Math.cos(a))} ${f1(y + rad * Math.sin(a))}`;
  const tip = a1, tx = x + rad * Math.cos(tip), ty = y + rad * Math.sin(tip), tang = tip + (dir < 0 ? -Math.PI / 2 : Math.PI / 2);
  const hx = (o: number) => f1(tx + 26 * Math.cos(tang + Math.PI + o)), hy = (o: number) => f1(ty + 26 * Math.sin(tang + Math.PI + o));
  return `<path d="M${p(a0)} A${rad} ${rad} 0 0 ${dir < 0 ? 0 : 1} ${p(a1)}" stroke="${color}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${f1(tx)} ${f1(ty)} L${hx(0.5)} ${hy(0.5)} M${f1(tx)} ${f1(ty)} L${hx(-0.5)} ${hy(-0.5)}" stroke="${color}" stroke-width="12" stroke-linecap="round"/>`;
}

function tree(x: number, y: number, s: number, r: Rng): string {
  const tiers = [0, 1, 2, 3].map((i) => `<path d="M${x} ${y - (300 - i * 62) * s} l${(70 + i * 30) * s} ${110 * s} h${-(140 + i * 60) * s}z" fill="${i % 2 ? "#166534" : "#15803d"}"/>`).join("");
  const lights = Array.from({ length: 22 }, () => {
    const t = between(r, 0.05, 1), yy = y - 300 * s + t * 330 * s, half = (20 + t * 160) * s;
    return `<circle cx="${f1(x + between(r, -half, half) * 0.8)}" cy="${f1(yy)}" r="${f1(5 * s)}" fill="${pick(r, ["#fde047", "#f87171", "#93c5fd", "#fdba74", "#f9a8d4"])}"/>`;
  }).join("");
  return `<g filter="url(#soft)"><rect x="${x - 16 * s}" y="${y + 30 * s}" width="${32 * s}" height="${40 * s}" fill="#78350f"/>${tiers}${lights}<path transform="translate(${x} ${y - 312 * s}) scale(${1.6 * s})" d="M0 -14 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10z" fill="#facc15"/></g>`;
}

function gift(x: number, y: number, w: number, h: number, c: string, ribbon: string): string {
  return `<g filter="url(#soft)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}"/><rect x="${x - 6}" y="${y - 18}" width="${w + 12}" height="24" rx="6" fill="${tint(c, 0.12)}"/><rect x="${x + w / 2 - 9}" y="${y - 18}" width="18" height="${h + 18}" fill="${ribbon}"/><path d="M${x + w / 2} ${y - 18} q-30 -34 -44 -6 q14 14 44 6 q30 -34 44 -6 q-14 14 -44 6" fill="${ribbon}"/></g>`;
}

function snowflake(x: number, y: number, s: number, o: number): string {
  const arm = `<path d="M0 0 V-20 M0 -12 l-6 -6 M0 -12 l6 -6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})" opacity="${o}">${[0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a})">${arm}</g>`).join("")}</g>`;
}

function bag(x: number, y: number, w: number, h: number, c: string): string {
  return `<g filter="url(#soft)"><path d="M${x + w * 0.28} ${y} q0 ${-h * 0.32} ${w * 0.22} ${-h * 0.32} q${w * 0.22} 0 ${w * 0.22} ${h * 0.32}" stroke="${tint(c, -0.35)}" stroke-width="10" fill="none"/><path d="M${x} ${y} h${w} l${w * 0.06} ${h} h${-w * 1.12}z" fill="${c}"/><path d="M${x} ${y} h${w} l${w * 0.02} ${h * 0.14} h${-w * 1.04}z" fill="${tint(c, -0.12)}"/></g>`;
}

function tag(x: number, y: number, s: number, text: string): string {
  return `<g transform="translate(${x} ${y}) rotate(-14) scale(${s})" filter="url(#soft)"><path d="M0 0 h120 l34 34 l-34 34 h-120z" fill="#fde047"/><circle cx="128" cy="34" r="7" fill="#78350f"/><text x="58" y="47" font-family="Sora" font-size="34" font-weight="800" fill="#7c2d12" text-anchor="middle">${text}</text></g>`;
}

function books(x: number, y: number, s: number): string {
  const b = (dy: number, w: number, c: string, dx: number) => `<rect x="${x - w / 2 + dx}" y="${y + dy}" width="${w}" height="${34 * s}" rx="${5 * s}" fill="${c}"/><rect x="${x - w / 2 + dx + 8 * s}" y="${y + dy + 6 * s}" width="${w - 16 * s}" height="${4 * s}" rx="2" fill="#fff" opacity=".5"/>`;
  return `<g filter="url(#soft)">${b(0, 260 * s, "#2563eb", 0)}${b(-36 * s, 230 * s, "#dc2626", 14 * s)}${b(-72 * s, 250 * s, "#059669", -8 * s)}${b(-108 * s, 210 * s, "#f59e0b", 10 * s)}
  <g transform="translate(${x + 40 * s} ${y - 150 * s})"><radialGradient id="ap" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#f87171"/><stop offset="1" stop-color="#991b1b"/></radialGradient><path d="M0 ${10 * s} c${-60 * s} ${-40 * s} ${-70 * s} ${50 * s} ${-20 * s} ${70 * s} q${20 * s} ${8 * s} ${20 * s} 0 q0 ${8 * s} ${20 * s} 0 c${50 * s} ${-20 * s} ${40 * s} ${-110 * s} ${-20 * s} ${-70 * s}z" fill="url(#ap)"/><path d="M0 ${8 * s} q${4 * s} ${-20 * s} ${12 * s} ${-28 * s}" stroke="#78350f" stroke-width="${5 * s}" fill="none"/><path d="M${4 * s} ${-6 * s} q${24 * s} ${-26 * s} ${44 * s} ${-8 * s} q${-22 * s} ${16 * s} ${-44 * s} ${8 * s}" fill="#16a34a"/></g>
  <g transform="translate(${x - 150 * s} ${y + 50 * s}) rotate(-20)"><rect width="${220 * s}" height="${18 * s}" rx="3" fill="#facc15"/><path d="M${220 * s} 0 l${30 * s} ${9 * s} l${-30 * s} ${9 * s}z" fill="#fde68a"/><path d="M${242 * s} ${6.6 * s} l${8 * s} ${2.4 * s} l${-8 * s} ${2.4 * s}z" fill="#111"/><rect x="${-20 * s}" width="${22 * s}" height="${18 * s}" rx="3" fill="#f472b6"/></g></g>`;
}

function envelope(x: number, y: number, s: number): string {
  return `<g filter="url(#soft)" transform="rotate(-6 ${x} ${y})"><rect x="${x - 160 * s}" y="${y - 100 * s}" width="${320 * s}" height="${200 * s}" rx="${10 * s}" fill="#f8fafc"/><path d="M${x - 160 * s} ${y - 90 * s} l${160 * s} ${110 * s} l${160 * s} ${-110 * s}" stroke="#cbd5e1" stroke-width="${6 * s}" fill="none"/>
  <rect x="${x + 70 * s}" y="${y - 80 * s}" width="${60 * s}" height="${70 * s}" rx="4" fill="#bfdbfe" stroke="#1d4ed8" stroke-dasharray="4 3" stroke-width="2"/><path transform="translate(${x + 100 * s} ${y - 45 * s}) scale(${1.4 * s})" d="M0 -14 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10z" fill="#1d4ed8"/></g>
  <g filter="url(#soft)" transform="rotate(8 ${x + 60 * s} ${y + 120 * s})"><rect x="${x - 120 * s}" y="${y + 70 * s}" width="${340 * s}" height="${130 * s}" rx="${8 * s}" fill="#ecfccb"/><rect x="${x - 100 * s}" y="${y + 92 * s}" width="${140 * s}" height="${10 * s}" rx="5" fill="#a3c76b"/><rect x="${x - 100 * s}" y="${y + 160 * s}" width="${200 * s}" height="${6 * s}" rx="3" fill="#a3c76b"/><circle cx="${x + 160 * s}" cy="${y + 128 * s}" r="${30 * s}" fill="none" stroke="#65a30d" stroke-width="${5 * s}"/><text x="${x + 160 * s}" y="${y + 141 * s}" font-family="Sora" font-size="${36 * s}" font-weight="800" fill="#4d7c0f" text-anchor="middle">$</text></g>`;
}

function tiles(x: number, y: number, s: number, r: Rng): string {
  const cols = ["#6aaa64", "#c9b458", "#787c7e"];
  let out = "";
  for (let row = 0; row < 3; row++) for (let c = 0; c < 5; c++) {
    const fill = row === 2 ? "#6aaa64" : pick(r, cols);
    out += `<rect x="${x + (c - 2.5) * 74 * s}" y="${y + (row - 1.5) * 74 * s}" width="${66 * s}" height="${66 * s}" rx="${6 * s}" fill="${fill}"/>`;
  }
  return `<g filter="url(#soft)" transform="rotate(-5 ${x} ${y})">${out}</g>`;
}

function firework(x: number, y: number, rad: number, c: string): string {
  return `<g opacity=".95"><circle cx="${x}" cy="${y}" r="${rad * 1.3}" fill="${c}" opacity=".12" filter="url(#blur)"/>${Array.from({ length: 18 }, (_, i) => {
    const a = (i * Math.PI * 2) / 18;
    return `<line x1="${f1(x + rad * 0.25 * Math.cos(a))}" y1="${f1(y + rad * 0.25 * Math.sin(a))}" x2="${f1(x + rad * Math.cos(a))}" y2="${f1(y + rad * Math.sin(a))}" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="${f1(x + rad * 1.08 * Math.cos(a))}" cy="${f1(y + rad * 1.08 * Math.sin(a))}" r="4" fill="#fff"/>`;
  }).join("")}</g>`;
}

function flower(x: number, y: number, s: number, c: string): string {
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})"><path d="M0 0 V120" stroke="#15803d" stroke-width="6"/><path d="M0 70 q30 -24 46 -6 q-24 18 -46 6" fill="#16a34a"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-26" rx="16" ry="28" fill="${c}" transform="rotate(${a})"/>`).join("")}<circle r="14" fill="#facc15"/></g>`;
}

/** A desk calendar page in perspective, the house motif for date stories. */
function calendarPage(x: number, y: number, s: number, color: string, r: Rng): string {
  const marked = Math.floor(between(r, 8, 27));
  let cells = "";
  for (let i = 0; i < 35; i++) {
    const cx = x - 150 * s + (i % 7) * 50 * s, cy = y - 40 * s + Math.floor(i / 7) * 42 * s, d = i - 2;
    if (d < 1 || d > 30) continue;
    cells += d === marked
      ? `<circle cx="${cx + 4 * s}" cy="${cy - 6 * s}" r="${19 * s}" fill="${color}"/><text x="${cx + 4 * s}" y="${cy}" font-family="Sora" font-size="${17 * s}" font-weight="800" fill="#fff" text-anchor="middle">${d}</text>`
      : `<text x="${cx + 4 * s}" y="${cy}" font-family="Sora" font-size="${16 * s}" font-weight="700" fill="#475569" text-anchor="middle">${d}</text>`;
  }
  return `<g filter="url(#soft)" transform="rotate(-6 ${x} ${y})"><rect x="${x - 190 * s}" y="${y - 150 * s}" width="${380 * s}" height="${330 * s}" rx="${18 * s}" fill="#fff"/><rect x="${x - 190 * s}" y="${y - 150 * s}" width="${380 * s}" height="${70 * s}" rx="${18 * s}" fill="${color}"/><rect x="${x - 190 * s}" y="${y - 100 * s}" width="${380 * s}" height="${20 * s}" fill="${color}"/>
  ${[-110, -40, 40, 110].map((dx) => `<rect x="${x + dx * s - 7 * s}" y="${y - 170 * s}" width="${14 * s}" height="${40 * s}" rx="${7 * s}" fill="#94a3b8"/>`).join("")}
  ${["S", "M", "T", "W", "T", "F", "S"].map((d, i) => `<text x="${x - 146 * s + i * 50 * s}" y="${y - 62 * s}" font-family="Sora" font-size="${13 * s}" font-weight="800" fill="${color}" text-anchor="middle">${d}</text>`).join("")}${cells}</g>`;
}

function ground(color: string, y = 560): string {
  return `<path d="M0 ${y + 14} Q190 ${y + 22} 380 ${y} q260 -40 520 -8 t420 -12 V675 H0z" fill="${color}"/>`;
}

// ── scenes ────────────────────────────────────────────────────────────────
const BUILDERS: Record<SceneName, (r: Rng, c: string) => string> = {
  halloween: (r) => `<rect width="1200" height="675" fill="#1a1033" opacity=".55"/>${stars(r, 60)}${moon(between(r, 900, 1010), between(r, 120, 170), 74)}
    <path d="M560 470 l60 -70 l60 70 v-10 h40 v-60 l70 -60 l70 60 v130 h-300z" fill="#0c0a1a"/>${[[600, 445], [650, 445], [760, 420], [800, 420]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="26" fill="#fbbf24" opacity=".9"/>`).join("")}
    ${ground("#120d22", 500)}${bat(between(r, 640, 720), between(r, 120, 180), 1.1)}${bat(between(r, 760, 840), between(r, 200, 250), 0.8)}${bat(between(r, 980, 1060), between(r, 270, 310), 0.7)}
    ${pumpkin(between(r, 700, 740), 548, 1.15, true, "a")}${pumpkin(between(r, 900, 940), 578, 0.85, r() > 0.4, "b")}${pumpkin(1040, 600, 0.6, false, "c")}`,
  "halloween-party": (r) => `<rect width="1200" height="675" fill="#1a0b2e" opacity=".5"/>${stars(r, 50, 0, 300)}${moon(between(r, 1000, 1060), 110, 52)}
    ${bat(between(r, 600, 660), between(r, 90, 140), 0.9)}${bat(between(r, 820, 880), between(r, 60, 100), 0.7)}
    <rect y="560" width="1200" height="115" fill="#120a1f"/><rect y="556" width="1200" height="6" fill="#4c1d95" opacity=".6"/>
    ${cauldron(820, 400, 1.05, r)}${pumpkin(between(r, 1030, 1050), 578, 0.56, true, "p")}${pumpkin(1122, 596, 0.38, false, "q")}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${560 + i * 72}" cy="${f1(150 + Math.sin(i) * 14)}" r="6" fill="${["#a855f7", "#fb923c", "#a3e635"][i % 3]}" opacity=".9"/><circle cx="${560 + i * 72}" cy="${f1(150 + Math.sin(i) * 14)}" r="16" fill="${["#a855f7", "#fb923c", "#a3e635"][i % 3]}" opacity=".18"/>`).join("")}
    <path d="M520 140 ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `L${560 + i * 72} ${f1(150 + Math.sin(i) * 14)}`).join(" ")} L1140 140" stroke="#1f2937" stroke-width="2" fill="none"/>`,
  thanksgiving: (r) => `${bokeh(r, 14, "#ffd27a")}<rect y="470" width="1200" height="205" fill="#5b3413" opacity=".55"/>
    ${turkeyRoast(810, 430, 1.05)}${pie(between(r, 560, 600), 590, 0.9)}${pie(1030, 600, 0.75)}
    ${Array.from({ length: 9 }, () => leaf(between(r, 520, 1150), between(r, 60, 300), between(r, 0.6, 1.1), between(r, -40, 40), pick(r, ["#d97706", "#b45309", "#dc2626", "#ca8a04"]))).join("")}`,
  election: (r) => `${bokeh(r, 12)}${Array.from({ length: 7 }, (_, i) => `<rect y="${i * 96}" width="1200" height="48" fill="#fff" opacity=".035"/>`).join("")}
    ${ballotBox(820, 450, 1.05)}${Array.from({ length: 14 }, () => `<path transform="translate(${f1(between(r, 480, 1160))} ${f1(between(r, 40, 220))}) scale(${f1(between(r, 0.6, 1.4) * 10) / 10})" d="M0 -14 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10z" fill="#fff" opacity="${f1(between(r, 0.2, 0.6) * 10) / 10}"/>`).join("")}`,
  "winter-holidays": (r) => `${Array.from({ length: 40 }, () => snowflake(between(r, 420, 1190), between(r, 10, 520), between(r, 0.4, 1.2), f1(between(r, 0.35, 0.9) * 10) / 10)).join("")}${ground("#e2e8f0", 540)}
    ${tree(between(r, 790, 830), 470, 1.05, r)}${gift(600, 520, 120, 90, "#dc2626", "#facc15")}${gift(940, 540, 100, 74, "#2563eb", "#f8fafc")}${gift(1050, 556, 76, 60, "#16a34a", "#fca5a5")}`,
  "night-sky": (r) => `<rect width="1200" height="675" fill="#070b1e" opacity=".55"/>${stars(r, 140, 0, 520)}${moon(between(r, 980, 1060), 130, 56, r() > 0.5 ? 0.6 : 0)}
    ${Array.from({ length: 5 }, () => { const x = between(r, 560, 1000), y = between(r, 60, 300), l = between(r, 90, 170); return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - l)}" y2="${f1(y + l * 0.55)}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><circle cx="${f1(x)}" cy="${f1(y)}" r="4" fill="#fff"/>`; }).join("")}
    <path d="M0 590 l200 -50 l180 20 l150 -120 l90 70 l140 -150 l120 110 l90 -60 l230 160 V675 H0z" fill="#0b1229"/><path d="M0 630 l250 -40 l130 10 l220 -90 l160 60 l170 -80 l270 110 V675 H0z" fill="#050816"/>`,
  "time-change": (r, c) => `${bokeh(r, 10)}${clock(820, 340, 190, 1, 0)}${arcArrow(820, 340, 250, -1, "#fde68a")}<text x="820" y="${340 + 190 * 0.52}" font-family="Sora" font-size="30" font-weight="800" fill="${c}" text-anchor="middle">1 HOUR</text>`,
  shopping: (r) => `${bokeh(r, 16, "#fde68a")}${bag(560, 360, 180, 230, "#be123c")}${bag(760, 300, 220, 290, "#1d4ed8")}${bag(990, 380, 150, 200, "#0f766e")}${tag(680, 220, 1.1, "SALE")}`,
  school: (r) => `${bokeh(r, 10)}<rect x="560" y="150" width="480" height="290" rx="16" fill="#14532d" stroke="#a16207" stroke-width="16"/><path d="M600 220 q60 -30 120 0 t120 0" stroke="#fff" stroke-opacity=".6" stroke-width="4" fill="none"/><text x="610" y="320" font-family="Sora" font-size="44" font-weight="800" fill="#fff" opacity=".75">A+ 1 2 3</text>${books(820, 590, 1)}`,
  money: (r) => `${bokeh(r, 12, "#bbf7d0")}${envelope(800, 300, 1.05)}`,
  puzzle: (r) => `${bokeh(r, 12)}${tiles(810, 340, 1.1, r)}`,
  fireworks: (r) => `<rect width="1200" height="675" fill="#070b1e" opacity=".5"/>${stars(r, 50)}${firework(between(r, 640, 700), 200, 110, "#f87171")}${firework(between(r, 860, 920), 150, 130, "#93c5fd")}${firework(1040, 300, 90, "#fde047")}<path d="M0 610 q300 -24 600 -6 t600 -8 V675 H0z" fill="#050816"/>`,
  spring: (r) => `${bokeh(r, 14, "#fef9c3")}${ground("#4d7c0f", 560)}${Array.from({ length: 7 }, (_, i) => flower(560 + i * 80 + between(r, -14, 14), between(r, 400, 470), between(r, 0.8, 1.2), pick(r, ["#f472b6", "#fb7185", "#c084fc", "#fbbf24", "#f8fafc"]))).join("")}`,
  autumn: (r) => `${bokeh(r, 14, "#fed7aa")}${Array.from({ length: 22 }, () => leaf(between(r, 480, 1180), between(r, 40, 640), between(r, 0.7, 1.6), between(r, -60, 60), pick(r, ["#d97706", "#b45309", "#dc2626", "#ca8a04", "#9a3412"]))).join("")}`,
  calendar: (r, c) => `${bokeh(r, 14)}${calendarPage(820, 360, 1.12, c, r)}`,
  // 3D-first scenes (render3d/); with `render: 2d` they fall back to the calendar page.
  gaming: (r, c) => `${bokeh(r, 16, "#c4b5fd")}${calendarPage(820, 360, 1.12, c, r)}`,
  sports: (r, c) => `${bokeh(r, 14)}${calendarPage(820, 360, 1.12, c, r)}`,
  phone: (r, c) => `${bokeh(r, 14, "#bfdbfe")}${calendarPage(820, 360, 1.12, c, r)}`,
};

/** Full hero background: gradient, the scene, a left scrim for text, vignette and film grain. */
export function scene(name: SceneName, o: Opts): string {
  const r = rng(`${name}:${o.seed}`);
  return `${defs(o.color)}<rect width="1200" height="675" fill="url(#bg)"/>${BUILDERS[name](r, o.color)}
  <rect width="1200" height="675" fill="url(#scrim)"/><rect width="1200" height="675" fill="url(#vig)"/><rect width="1200" height="675" filter="url(#grain)"/>`;
}

/** Flat two-tone header icons for printables: light on ink, readable in grayscale. */
const ICONS: Record<string, (c: string) => string> = {
  cauldron: (c) => `<path d="M7 16 q0 20 15 20 q15 0 15 -20z" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M5 16 h34" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/><circle cx="17" cy="10" r="2.6" fill="none" stroke="${c}" stroke-width="1.8"/><circle cx="26" cy="7" r="2" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M12 36 l-2 4 M32 36 l2 4" stroke="${c}" stroke-width="2.2"/>`,
  pumpkin: (c) => `<ellipse cx="22" cy="26" rx="18" ry="14" fill="none" stroke="${c}" stroke-width="2.4"/><ellipse cx="22" cy="26" rx="7" ry="14" fill="none" stroke="${c}" stroke-width="2"/><path d="M22 12 q0 -6 5 -8" stroke="${c}" stroke-width="2.4" fill="none"/>`,
  turkey: (c) => `<ellipse cx="22" cy="28" rx="16" ry="10" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M6 36 h32" stroke="${c}" stroke-width="2.4"/><path d="M8 22 l-4 -6 M36 22 l4 -6" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
  ballot: (c) => `<rect x="6" y="18" width="32" height="20" rx="2" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M14 18 v-12 h16 v12" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M17 12 l3 3 l6 -6" stroke="${c}" stroke-width="2.4" fill="none"/>`,
  star: (c) => `<path transform="translate(22 24) scale(1.3)" d="M0 -14 l4 9 h10 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 h10z" fill="none" stroke="${c}" stroke-width="1.8"/>`,
  clock: (c) => `<circle cx="22" cy="22" r="16" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M22 12 v10 l7 5" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  moon: (c) => `<path d="M28 6 a17 17 0 1 0 10 28 a13 13 0 1 1 -10 -28z" fill="none" stroke="${c}" stroke-width="2.4"/>`,
  gift: (c) => `<rect x="7" y="18" width="30" height="20" fill="none" stroke="${c}" stroke-width="2.4"/><rect x="5" y="12" width="34" height="7" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M22 12 v26 M22 12 q-10 -10 -12 -2 M22 12 q10 -10 12 -2" stroke="${c}" stroke-width="2.2" fill="none"/>`,
  bag: (c) => `<path d="M8 16 h28 l2 22 h-32z" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M15 16 q0 -10 7 -10 q7 0 7 10" fill="none" stroke="${c}" stroke-width="2.4"/>`,
  book: (c) => `<path d="M6 10 h14 q2 0 2 2 v26 q0 -2 -2 -2 h-14z M38 10 h-14 q-2 0 -2 2 v26 q0 -2 2 -2 h14z" fill="none" stroke="${c}" stroke-width="2.2"/>`,
  calendar: (c) => `<rect x="6" y="9" width="32" height="29" rx="3" fill="none" stroke="${c}" stroke-width="2.4"/><path d="M6 17 h32 M14 5 v8 M30 5 v8" stroke="${c}" stroke-width="2.4"/><circle cx="28" cy="29" r="3.2" fill="${c}"/>`,
  leaf: (c) => `<path d="M8 36 q0 -28 28 -28 q0 28 -28 28z M8 36 l18 -18" fill="none" stroke="${c}" stroke-width="2.4"/>`,
  snowflake: (c) => `<path d="M22 4 v36 M6 13 l32 18 M6 31 l32 -18" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`,
  money: (c) => `<rect x="4" y="12" width="36" height="22" rx="3" fill="none" stroke="${c}" stroke-width="2.4"/><circle cx="22" cy="23" r="6" fill="none" stroke="${c}" stroke-width="2.2"/>`,
};
export const SCENE_ICON: Record<SceneName, string> = {
  halloween: "pumpkin", "halloween-party": "cauldron", thanksgiving: "turkey", election: "ballot", "winter-holidays": "gift", "night-sky": "moon",
  "time-change": "clock", shopping: "bag", school: "book", money: "money", puzzle: "star", fireworks: "star",
  spring: "leaf", autumn: "leaf", calendar: "calendar", gaming: "star", sports: "star", phone: "bag",
};
export function icon(name: string, color: string, size = 44): string {
  const draw = ICONS[name] ?? ICONS.calendar!;
  return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" aria-hidden="true">${draw(color)}</svg>`;
}
