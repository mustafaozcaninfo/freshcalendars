/**
 * Procedural 3D models for /news/ heroes, built only from three.js primitives, extrusions and
 * canvas textures we draw. No downloaded models, no brand shapes or marks (the game controller is
 * a generic pad, the ballot box carries no agency name). Units: about 10 cm; every group rests on
 * y = 0 and faces +z (the camera side).
 *
 * Each builder gets { THREE, r, color, accent, date, canvasTexture } and returns
 * { group, view?, fov?, zoom?, lift?, drop?, shadow?, ground?, lights? } (see stage.js).
 */
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const between = (r, a, b) => a + (b - a) * r();
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];

// ── materials ─────────────────────────────────────────────────────────────
function mats(THREE) {
  const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, ...o });
  return {
    phys,
    paper: (color = "#fbfaf6") => phys(color, { roughness: 0.88, sheen: 0.3, sheenRoughness: 0.8 }),
    plastic: (color) => phys(color, { roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    matte: (color) => phys(color, { roughness: 0.62, clearcoat: 0.15 }),
    metal: (color, rough = 0.22) => phys(color, { metalness: 1, roughness: rough }),
    glow: (color, intensity = 2.2) => phys(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4 }),
  };
}

function roundedRect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function starPath(ctx, cx, cy, ro, ri) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : ro;
    ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
}

function starShape(THREE, ro, ri) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : ro;
    i ? s.lineTo(rr * Math.cos(a), rr * Math.sin(a)) : s.moveTo(rr * Math.cos(a), rr * Math.sin(a));
  }
  return s;
}

/** A thin card: rounded box body with a textured face plane in front (texture may carry alpha corners). */
function card(THREE, w, h, d, faceTex, bodyMat, faceOpts = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h) * 0.04), bodyMat));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.995, h * 0.995), new THREE.MeshPhysicalMaterial({ map: faceTex, transparent: true, alphaTest: 0.02, roughness: 0.85, ...faceOpts }));
  face.position.z = d / 2 + 0.002;
  face.userData.noShadow = true;
  g.add(face);
  return g;
}

/** Leaf outline (maple-like), extruded thin. */
function leafGeo(THREE, s) {
  const sh = new THREE.Shape();
  const pts = [[0, 1], [0.18, 0.55], [0.55, 0.7], [0.42, 0.35], [0.8, 0.2], [0.35, 0], [0.45, -0.35], [0.1, -0.2], [0, -0.55], [-0.1, -0.2], [-0.45, -0.35], [-0.35, 0], [-0.8, 0.2], [-0.42, 0.35], [-0.55, 0.7], [-0.18, 0.55]];
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x * s, y * s) : sh.moveTo(x * s, y * s)));
  return new THREE.ExtrudeGeometry(sh, { depth: 0.012 * s, bevelEnabled: true, bevelThickness: 0.01 * s, bevelSize: 0.01 * s, bevelSegments: 2 });
}

// ── calendar: a desk calendar showing the story's real month with the date circled ─────────
function calendar({ THREE, r, color, accent, date, canvasTexture }) {
  const M = mats(THREE);
  const d = date ? new Date(`${date}T12:00:00Z`) : new Date(Date.UTC(2026, 10, 26));
  const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay(), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const W = 2.4, H = 2.7;
  const tex = canvasTexture(1200, 1350, (c, w, h) => {
    roundedRect(c, 0, 0, w, h, 40);
    c.fillStyle = "#fdfcf8";
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = color;
    c.fillRect(0, 0, w, 300);
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, "rgba(255,255,255,.18)");
    g.addColorStop(1, "rgba(0,0,0,.12)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, 300);
    c.restore();
    c.fillStyle = "#fff";
    c.textAlign = "center";
    c.font = "800 118px Sora";
    c.fillText(MONTHS[m].toUpperCase(), w / 2, 190);
    c.font = "700 54px Sora";
    c.globalAlpha = 0.8;
    c.fillText(String(y), w / 2, 262);
    c.globalAlpha = 1;
    const x0 = 95, cw = (w - 190) / 7, top = 400, rh = Math.min(150, (h - top - 60) / Math.ceil((first + days) / 7));
    c.font = "800 44px Sora";
    c.fillStyle = color;
    ["S", "M", "T", "W", "T", "F", "S"].forEach((t, i) => c.fillText(t, x0 + cw * (i + 0.5), top - 20));
    for (let i = 0; i < days; i++) {
      const cell = first + i, cx = x0 + cw * ((cell % 7) + 0.5), cy = top + 70 + Math.floor(cell / 7) * rh;
      if (i + 1 === day) {
        c.beginPath();
        c.arc(cx, cy - 18, 62, 0, Math.PI * 2);
        c.fillStyle = accent;
        c.fill();
        c.lineWidth = 8;
        c.strokeStyle = "rgba(0,0,0,.12)";
        c.stroke();
        c.fillStyle = "#1b1206";
        c.font = "800 62px Sora";
      } else {
        c.fillStyle = cell % 7 === 0 ? "#b91c1c" : "#334155";
        c.font = "700 54px Sora";
      }
      c.fillText(String(i + 1), cx, cy);
    }
  });
  const group = new THREE.Group();
  const lean = new THREE.Group();
  // Back pages give the pad its thickness.
  for (let i = 3; i >= 1; i--) {
    const p = new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.03, 3, 0.05), M.paper(i % 2 ? "#f1efe8" : "#f7f5ef"));
    p.position.set(0, H / 2, -i * 0.035);
    lean.add(p);
  }
  const front = card(THREE, W, H, 0.03, tex, M.paper());
  front.position.y = H / 2;
  lean.add(front);
  // Binding rings across the top edge.
  for (const x of [-0.75, -0.25, 0.25, 0.75]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 16, 48), M.metal("#d6d9de", 0.18));
    ring.rotation.y = Math.PI / 2;
    ring.position.set(x * W * 0.62, H + 0.02, -0.04);
    lean.add(ring);
  }
  lean.rotation.x = -0.2;
  lean.position.z = 0.15;
  group.add(lean);
  // A-frame back panel: its top meets the front page's top edge, its foot stands behind.
  const topY = H * Math.cos(0.2), topZ = 0.15 - H * Math.sin(0.2), tilt = 0.3, footZ = topZ - topY * Math.tan(tilt);
  const back = new THREE.Mesh(new RoundedBoxGeometry(W * 0.98, topY / Math.cos(tilt), 0.06, 3, 0.04), M.matte("#2b2f36"));
  back.position.set(0, topY / 2, (topZ + footZ) / 2 - 0.05);
  back.rotation.x = tilt;
  group.add(back);
  // A pen beside it.
  const pen = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 32), M.plastic(color));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 32), M.metal("#c9ced6", 0.25));
  tip.position.y = -0.85;
  tip.rotation.x = Math.PI;
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), M.metal("#e5e7eb", 0.2));
  clip.position.set(0, 0.45, 0.07);
  pen.add(body, tip, clip);
  pen.rotation.set(Math.PI / 2, 0, between(r, 0.6, 1.0));
  pen.position.set(W * 0.62, 0.06, 0.75);
  pen.userData.extra = true;
  group.add(pen);
  return { group, view: [between(r, -0.1, 0.12), 0.32, 1], fov: 26 };
}

// ── election: ballot box with a ballot going in ───────────────────────────
function election({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const BW = 2.6, BH = 1.9, BD = 1.7;
  const box = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 6, 0.09), M.plastic("#f4f6fa"));
  box.position.y = BH / 2;
  group.add(box);
  const band = canvasTexture(1300, 420, (c, w, h) => {
    c.fillStyle = "#1e3a8a";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#fff";
    for (let i = 0; i < 5; i++) {
      starPath(c, w * (0.14 + i * 0.18), h * 0.42, 62, 26);
      c.fill();
    }
    c.fillStyle = "#b91c1c";
    c.fillRect(0, h * 0.8, w, h * 0.2);
    c.fillStyle = "#fff";
    c.fillRect(0, h * 0.76, w, h * 0.04);
  });
  const bandMesh = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.96, BH * 0.34), new THREE.MeshPhysicalMaterial({ map: band, roughness: 0.4, clearcoat: 0.5 }));
  bandMesh.position.set(0, BH * 0.42, BD / 2 + 0.003);
  bandMesh.userData.noShadow = true;
  group.add(bandMesh);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.12, 0.16, BD + 0.12, 4, 0.06), M.plastic("#e3e8f0"));
  lid.position.y = BH + 0.06;
  group.add(lid);
  const slot = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.05, 0.16, 3, 0.02), M.matte("#1f2937"));
  slot.position.y = BH + 0.15;
  group.add(slot);
  const ballotTex = canvasTexture(700, 900, (c, w, h) => {
    c.fillStyle = "#fffefa";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#1e3a8a";
    c.fillRect(0, 0, w, 120);
    c.fillStyle = "#fff";
    c.font = "800 64px Sora";
    c.textAlign = "center";
    c.fillText("BALLOT", w / 2, 84);
    for (let i = 0; i < 4; i++) {
      const yy = 200 + i * 170;
      c.strokeStyle = "#1e3a8a";
      c.lineWidth = 8;
      c.strokeRect(70, yy, 90, 90);
      c.fillStyle = "#cbd5e1";
      roundedRect(c, 200, yy + 22, 400 - i * 40, 26, 13);
      c.fill();
      roundedRect(c, 200, yy + 62, 260 - i * 20, 18, 9);
      c.fill();
      if (i === 1 || i === 2) {
        c.strokeStyle = "#16a34a";
        c.lineWidth = 18;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(85, yy + 45);
        c.lineTo(110, yy + 75);
        c.lineTo(155, yy + 10);
        c.stroke();
      }
    }
  });
  const ballot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.42, 0.012), [M.paper(), M.paper(), M.paper(), M.paper(), new THREE.MeshPhysicalMaterial({ map: ballotTex, roughness: 0.85 }), M.paper()]);
  ballot.position.set(0.05, BH + 0.62, 0);
  ballot.castShadow = true;
  ballot.rotation.set(-0.06, 0.18, -0.08);
  group.add(ballot);
  // Gold stars scattered on the table.
  const starGeo = new THREE.ExtrudeGeometry(starShape(THREE, 0.2, 0.085), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 });
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(starGeo, i % 3 ? M.metal("#e8b931", 0.28) : M.plastic("#2563eb"));
    const a = between(r, 0, Math.PI * 2), rad = between(r, 1.8, 2.6);
    s.position.set(Math.cos(a) * rad, 0.03, Math.abs(Math.sin(a)) * rad * 0.7 + 0.3);
    s.rotation.set(-Math.PI / 2, 0, between(r, 0, Math.PI));
    s.scale.setScalar(between(r, 0.7, 1.2));
    s.userData.extra = true;
    group.add(s);
  }
  return { group, view: [between(r, -0.35, -0.15), 0.38, 1], fov: 26 };
}

// ── halloween: pumpkins, one carved and glowing ───────────────────────────
function pumpkinGeo(THREE, rad, lobes = 10, squash = 0.78) {
  const g = new THREE.SphereGeometry(rad, 128, 96);
  const p = g.attributes.position, col = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const phi = Math.atan2(v.z, v.x);
    const k = Math.pow(Math.abs(Math.cos((lobes * phi) / 2)), 0.55);
    const s = 1 - 0.075 * (1 - k);
    const rr = Math.hypot(v.x, v.z) / rad;
    v.x *= s;
    v.z *= s;
    v.y *= squash;
    v.y -= Math.sign(v.y) * 0.16 * rad * Math.exp(-rr * rr * 10);
    p.setXYZ(i, v.x, v.y, v.z);
    const t = 0.55 + 0.45 * k;
    col.push(t, t, t);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function pumpkin(THREE, M, rad, { carved = false, hue = "#f07d12", canvasTexture, lobes = 10 }) {
  const g = new THREE.Group();
  let mat;
  if (carved) {
    const face = (fill, bg) => canvasTexture(1024, 512, (c, w, h) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      c.fillStyle = fill;
      // Sphere u = 0.25 faces +z (the camera). The face spans about a quarter of the turn.
      const cx = w * 0.25, cy = h * 0.5;
      c.translate(cx, cy);
      c.scale(1.7, 1.45);
      c.translate(-cx, -cy);
      // eyes
      for (const dx of [-60, 60]) {
        c.beginPath();
        c.moveTo(cx + dx - 34, cy - 30);
        c.lineTo(cx + dx, cy - 92);
        c.lineTo(cx + dx + 34, cy - 30);
        c.closePath();
        c.fill();
      }
      c.beginPath();
      c.moveTo(cx - 14, cy - 10);
      c.lineTo(cx, cy - 34);
      c.lineTo(cx + 14, cy - 10);
      c.closePath();
      c.fill();
      // mouth
      c.beginPath();
      c.moveTo(cx - 100, cy + 18);
      c.quadraticCurveTo(cx, cy + 120, cx + 100, cy + 18);
      for (let i = 0; i <= 6; i++) c.lineTo(cx + 100 - i * 33, cy + 18 + (i % 2 ? 26 : 0) + Math.sin((i / 6) * Math.PI) * 22);
      c.closePath();
      c.fill();
    });
    mat = M.phys("#ffffff", { map: face(hue === "#f07d12" ? "#3a1702" : "#3a1702", hue), emissiveMap: face("#ffffff", "#000000"), emissive: "#ffb21f", emissiveIntensity: 3.2, roughness: 0.55, clearcoat: 0.25, vertexColors: true });
  } else {
    mat = M.phys(hue, { roughness: 0.55, clearcoat: 0.25, vertexColors: true });
  }
  const body = new THREE.Mesh(pumpkinGeo(THREE, rad, lobes), mat);
  body.position.y = rad * 0.78;
  g.add(body);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.02 * rad, 0.28 * rad, 0), new THREE.Vector3(0.14 * rad, 0.36 * rad, 0.02 * rad));
  const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.075 * rad, 10), M.matte("#5b6b2a"));
  stem.position.y = rad * 0.78 * 2 - rad * 0.2;
  g.add(stem);
  if (carved) {
    const inner = new THREE.PointLight("#ffae2b", 6, rad * 6, 2);
    inner.position.set(0, rad * 0.8, rad * 1.4);
    inner.castShadow = false;
    g.add(inner);
  }
  return g;
}

function halloween({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const big = pumpkin(THREE, M, 1.15, { carved: true, canvasTexture });
  big.rotation.y = between(r, -0.15, 0.1);
  group.add(big);
  const mid = pumpkin(THREE, M, 0.78, { carved: r() > 0.5, canvasTexture, hue: "#e8730f", lobes: 9 });
  mid.position.set(1.85, 0, 0.5);
  mid.rotation.y = -0.5;
  group.add(mid);
  const small = pumpkin(THREE, M, 0.48, { hue: "#d9a066", canvasTexture, lobes: 8 });
  small.position.set(-1.55, 0, 0.75);
  group.add(small);
  const lg = leafGeo(THREE, 0.32);
  for (let i = 0; i < 7; i++) {
    const l = new THREE.Mesh(lg, M.matte(pick(r, ["#b45309", "#9a3412", "#ca8a04", "#7c2d12"])));
    l.position.set(between(r, -2.4, 2.8), 0.02, between(r, 0.9, 2.0));
    l.rotation.set(-Math.PI / 2 + between(r, -0.2, 0.2), 0, between(r, 0, Math.PI * 2));
    l.userData.extra = true;
    group.add(l);
  }
  return { group, view: [0.05, 0.3, 1], fov: 26, shadow: 0.42, zoom: 1.12 };
}

// ── gaming: a generic game pad (no console maker's shape or button symbols) ─────────
function gaming({ THREE, r, color, accent }) {
  const M = mats(THREE);
  const s = new THREE.Shape();
  s.moveTo(-1.0, 0.72);
  s.lineTo(1.0, 0.72);
  s.bezierCurveTo(1.5, 0.72, 1.78, 0.52, 1.88, 0.02);
  s.bezierCurveTo(2.02, -0.6, 1.92, -1.22, 1.5, -1.27);
  s.bezierCurveTo(1.14, -1.31, 0.98, -0.9, 0.74, -0.56);
  s.lineTo(-0.74, -0.56);
  s.bezierCurveTo(-0.98, -0.9, -1.14, -1.31, -1.5, -1.27);
  s.bezierCurveTo(-1.92, -1.22, -2.02, -0.6, -1.88, 0.02);
  s.bezierCurveTo(-1.78, 0.52, -1.5, 0.72, -1.0, 0.72);
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.14, bevelSegments: 10, curveSegments: 64 });
  bodyGeo.translate(0, 0, -0.17);
  const pad = new THREE.Group();
  const shell = pick(r, ["#1c2230", "#f2f4f8", color]);
  pad.add(new THREE.Mesh(bodyGeo, M.plastic(shell)));
  const top = 0.34 / 2 + 0.16;
  const dark = M.matte("#11151d");
  // D-pad
  for (const rot of [0, Math.PI / 2]) {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.17, 0.08, 3, 0.03), dark);
    arm.rotation.z = rot;
    arm.position.set(-1.12, 0.12, top + 0.02);
    pad.add(arm);
  }
  // Face buttons: plain colored dots.
  const btn = new THREE.CylinderGeometry(0.11, 0.11, 0.07, 32);
  [[0, 0.24, "#ef6461"], [0.24, 0, "#f4c95d"], [-0.24, 0, "#5fb8e8"], [0, -0.24, "#7bd389"]].forEach(([dx, dy, c]) => {
    const b = new THREE.Mesh(btn, M.plastic(c));
    b.rotation.x = Math.PI / 2;
    b.position.set(1.12 + dx, 0.12 + dy, top + 0.03);
    pad.add(b);
  });
  // Thumbsticks
  for (const x of [-0.5, 0.5]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 40), dark);
    base.rotation.x = Math.PI / 2;
    base.position.set(x, -0.38, top + 0.02);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.14, 40), M.matte("#252b36"));
    cap.rotation.x = Math.PI / 2;
    cap.position.set(x, -0.38, top + 0.12);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 12, 40), M.matte("#353d4a"));
    rim.position.set(x, -0.38, top + 0.19);
    pad.add(base, cap, rim);
  }
  // Light strip in the accent color.
  const strip = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.06, 0.05, 2, 0.02), M.glow(accent, 2.6));
  strip.position.set(0, 0.5, top + 0.01);
  pad.add(strip);
  pad.rotation.set(-1.05, 0, between(r, -0.25, 0.25));
  const holder = new THREE.Group();
  holder.add(pad);
  const box = new THREE.Box3().setFromObject(pad);
  pad.position.y = -box.min.y;
  holder.add(pad);
  return { group: holder, view: [0, 0.75, 1], fov: 26 };
}

// ── winter holidays: wrapped gifts and glass ornaments ───────────────────
function giftBox(THREE, M, w, h, d, body, ribbon) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, 0.03), M.matte(body));
  box.position.y = h / 2;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(w * 1.05, h * 0.18, d * 1.05, 4, 0.03), M.matte(body));
  lid.position.y = h * 0.93;
  g.add(box, lid);
  const rib = M.phys(ribbon, { roughness: 0.3, clearcoat: 0.8, sheen: 0.6 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 1.03, d * 1.07), rib);
  a.position.y = h / 2 + 0.005;
  const b = new THREE.Mesh(new THREE.BoxGeometry(w * 1.07, h * 1.03, d * 0.16), rib);
  b.position.y = h / 2 + 0.005;
  g.add(a, b);
  for (const s of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(w * 0.14, w * 0.035, 16, 40), rib);
    loop.scale.set(1, 0.62, 1);
    loop.rotation.set(0.2, s * 0.75, s * 0.5);
    loop.position.set(s * w * 0.12, h * 1.08, 0);
    g.add(loop);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(w * 0.06, 24, 16), rib);
  knot.position.y = h * 1.06;
  g.add(knot);
  return g;
}

function ornament(THREE, M, rad, color) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(rad, 64, 48), M.phys(color, { metalness: 0.9, roughness: 0.12, clearcoat: 1 }));
  ball.position.y = rad;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.22, rad * 0.24, rad * 0.22, 24), M.metal("#d4af37", 0.25));
  cap.position.y = rad * 2.02;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.12, rad * 0.025, 8, 24), M.metal("#d4af37", 0.25));
  hook.position.y = rad * 2.22;
  g.add(ball, cap, hook);
  return g;
}

function winterHolidays({ THREE, r }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const palette = [["#b91c1c", "#facc15"], ["#1d4ed8", "#f8fafc"], ["#15803d", "#fca5a5"], ["#f8fafc", "#b91c1c"]];
  const order = palette.slice().sort(() => r() - 0.5);
  const big = giftBox(THREE, M, 1.5, 1.2, 1.3, ...order[0]);
  big.rotation.y = between(r, -0.3, 0.1);
  const mid = giftBox(THREE, M, 1.0, 0.85, 1.0, ...order[1]);
  mid.position.set(1.45, 0, 0.45);
  mid.rotation.y = between(r, 0.2, 0.6);
  const top = giftBox(THREE, M, 0.75, 0.6, 0.75, ...order[2]);
  top.position.set(-0.05, 1.44, 0.05);
  top.rotation.y = between(r, 0.3, 0.8);
  const low = giftBox(THREE, M, 0.8, 0.55, 0.8, ...order[3]);
  low.position.set(-1.35, 0, 0.55);
  low.rotation.y = -0.4;
  group.add(big, mid, top, low);
  [["#dc2626", 0.28, 2.15, 0.9], ["#d4af37", 0.24, -2.1, 1.2], ["#1d4ed8", 0.2, 0.75, 1.45]].forEach(([c, rad, x, z]) => {
    const o = ornament(THREE, M, rad, c);
    o.position.set(x, 0, z);
    o.rotation.z = 1.35;
    o.position.y = rad * 0.95;
    o.userData.extra = true;
    group.add(o);
  });
  return { group, view: [0.1, 0.36, 1], fov: 26 };
}

// ── shopping: paper bags and a price tag ──────────────────────────────────
function bag(THREE, M, w, h, d, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.02), M.paper(color));
  body.position.y = h / 2;
  const fold = new THREE.Mesh(new RoundedBoxGeometry(w * 1.005, h * 0.08, d * 1.005, 2, 0.015), M.paper(color));
  fold.position.y = h * 0.96;
  g.add(body, fold);
  const handle = M.matte("#1f2937");
  for (const z of [-d * 0.22, d * 0.22]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(w * 0.2, 0.025, 12, 40, Math.PI), handle);
    t.position.set(0, h * 0.97, z);
    g.add(t);
  }
  return g;
}

function shopping({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const cols = ["#be123c", "#1d4ed8", "#0f766e", "#f59e0b", "#7c3aed"].sort(() => r() - 0.5);
  const a = bag(THREE, M, 1.3, 1.7, 0.6, cols[0]);
  a.rotation.y = 0.25;
  const b = bag(THREE, M, 1.6, 2.1, 0.7, cols[1]);
  b.position.set(1.25, 0, -0.45);
  b.rotation.y = -0.2;
  const c = bag(THREE, M, 1.05, 1.3, 0.5, cols[2]);
  c.position.set(-1.25, 0, 0.45);
  c.rotation.y = 0.45;
  group.add(a, b, c);
  const tex = canvasTexture(800, 400, (ctx, w, h) => {
    ctx.fillStyle = "#fde047";
    roundedRect(ctx, 0, 0, w, h, 40);
    ctx.fill();
    ctx.fillStyle = "#7c2d12";
    ctx.font = "800 190px Sora";
    ctx.textAlign = "center";
    ctx.fillText("SALE", w / 2 - 30, h / 2 + 68);
    ctx.beginPath();
    ctx.arc(w - 80, h / 2, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#a16207";
    ctx.fill();
  });
  const tag = card(THREE, 1.1, 0.55, 0.03, tex, M.matte("#facc15"));
  tag.position.set(0.55, 0.35, 0.75);
  tag.rotation.set(-1.1, 0, 0.35);
  tag.userData.extra = true;
  group.add(tag);
  return { group, view: [0.05, 0.3, 1], fov: 26 };
}

// ── time change: an alarm clock with a "fall back" arrow ──────────────────
function timeChange({ THREE, r, accent, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const R = 1.2;
  const face = canvasTexture(1024, 1024, (c, w) => {
    const cx = w / 2;
    c.fillStyle = "#fbfaf7";
    c.beginPath();
    c.arc(cx, cx, cx, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#1f2937";
    c.lineCap = "round";
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI) / 30, big = i % 5 === 0, r1 = cx * (big ? 0.78 : 0.86), r2 = cx * 0.92;
      c.lineWidth = big ? 16 : 5;
      c.beginPath();
      c.moveTo(cx + r1 * Math.sin(a), cx - r1 * Math.cos(a));
      c.lineTo(cx + r2 * Math.sin(a), cx - r2 * Math.cos(a));
      c.stroke();
    }
    c.fillStyle = "#1f2937";
    c.font = "800 92px Sora";
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (let n = 1; n <= 12; n++) {
      const a = (n * Math.PI) / 6;
      c.fillText(String(n), cx + cx * 0.62 * Math.sin(a), cx - cx * 0.62 * Math.cos(a) + 4);
    }
  });
  const clock = new THREE.Group();
  const caseMat = M.plastic(accent === "#ffd27a" ? "#c2410c" : "#c2410c");
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.55, 96), [caseMat, new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.6 }), caseMat]);
  body.rotation.x = Math.PI / 2;
  body.children;
  clock.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 64, 16, 0, Math.PI * 2, 0, 0.42), M.phys("#ffffff", { transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1 }));
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 0.02;
  glass.userData.noShadow = true;
  clock.add(glass);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(R * 1.12, 0.07, 24, 96), M.metal("#e5e7eb", 0.18));
  bezel.position.z = 0.28;
  clock.add(bezel);
  const hand = (len, wid, ang) => {
    const h = new THREE.Mesh(new RoundedBoxGeometry(wid, len, 0.04, 2, wid * 0.4), M.matte("#111827"));
    h.geometry.translate(0, len / 2 - 0.08, 0);
    h.rotation.z = -ang;
    h.position.z = 0.31;
    clock.add(h);
  };
  hand(R * 0.55, 0.11, (1 * Math.PI) / 6);
  hand(R * 0.8, 0.07, 0);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 24), M.metal("#dc2626", 0.3));
  pin.rotation.x = Math.PI / 2;
  pin.position.z = 0.34;
  clock.add(pin);
  for (const s of [-1, 1]) {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.metal("#e5e7eb", 0.15));
    bell.position.set(s * 0.72, R * 1.0, 0);
    bell.rotation.z = -s * 0.5;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 16), M.metal("#cbd5e1", 0.25));
    leg.position.set(s * 0.75, -R * 1.12, 0);
    leg.rotation.z = s * 0.45;
    clock.add(bell, leg);
  }
  clock.position.y = R * 1.12 + 0.3;
  group.add(clock);
  // "Fall back": an arrow arcing counterclockwise around the clock.
  const arc = new THREE.Curve();
  const AR = R * 1.62, a0 = Math.PI * 0.15, a1 = Math.PI * 0.95;
  arc.getPoint = (t) => {
    const a = a0 + (a1 - a0) * t;
    return new THREE.Vector3(AR * Math.cos(a), R * 1.42 + AR * Math.sin(a), 0.15);
  };
  const arrowMat = M.phys("#fde047", { roughness: 0.25, clearcoat: 1, emissive: "#fde047", emissiveIntensity: 0.25 });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(arc, 64, 0.08, 16), arrowMat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 24), arrowMat);
  const end = arc.getPoint(1), tangent = arc.getPoint(1).sub(arc.getPoint(0.97)).normalize();
  head.position.copy(end);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  group.add(tube, head);
  return { group, view: [between(r, 0.05, 0.25), 0.18, 1], fov: 26 };
}

// ── money: coin stacks and an envelope with a check ───────────────────────
function money({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const face = canvasTexture(512, 512, (c, w) => {
    c.fillStyle = "#808080";
    c.fillRect(0, 0, w, w);
    c.strokeStyle = "#c0c0c0";
    c.lineWidth = 18;
    c.beginPath();
    c.arc(w / 2, w / 2, w * 0.42, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#d0d0d0";
    c.font = "800 300px Sora";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("$", w / 2, w / 2 + 10);
  }, { srgb: false });
  const gold = M.phys("#e7b53c", { metalness: 1, roughness: 0.28, bumpMap: face, bumpScale: 2.5 });
  const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.09, 72);
  const stack = (x, z, n) => {
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(coinGeo, gold);
      c.position.set(x + between(r, -0.03, 0.03), 0.045 + i * 0.092, z + between(r, -0.03, 0.03));
      c.rotation.y = between(r, 0, Math.PI);
      group.add(c);
    }
  };
  stack(0, 0, 9);
  stack(1.1, 0.25, 6);
  stack(-1.05, 0.35, 4);
  const lean = new THREE.Mesh(coinGeo, gold);
  lean.rotation.set(Math.PI / 2 - 0.25, 0, 0.1);
  lean.position.set(0.55, 0.5, 0.95);
  group.add(lean);
  const env = new THREE.Group();
  const paper = new THREE.Mesh(new RoundedBoxGeometry(2.4, 1.4, 0.04, 3, 0.04), M.paper("#f8fafc"));
  const checkTex = canvasTexture(900, 380, (c, w, h) => {
    c.fillStyle = "#ecfccb";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#a3c76b";
    roundedRect(c, 40, 50, 380, 26, 13);
    c.fill();
    roundedRect(c, 40, 270, 520, 16, 8);
    c.fill();
    c.strokeStyle = "#65a30d";
    c.lineWidth = 10;
    c.beginPath();
    c.arc(w - 140, h / 2, 82, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#4d7c0f";
    c.font = "800 110px Sora";
    c.textAlign = "center";
    c.fillText("$", w - 140, h / 2 + 40);
  });
  const check = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.88, 0.01), [M.paper(), M.paper(), M.paper(), M.paper(), new THREE.MeshPhysicalMaterial({ map: checkTex, roughness: 0.8 }), M.paper()]);
  check.position.set(0.15, 0.55, 0.04);
  check.rotation.z = 0.06;
  env.add(paper, check);
  env.rotation.set(-0.35, 0, -0.06);
  env.position.set(-0.2, 0.7, -1.0);
  group.add(env);
  return { group, view: [0.05, 0.42, 1], fov: 26 };
}

// ── puzzle: word-game tiles ───────────────────────────────────────────────
function puzzle({ THREE, r }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const cols = ["#6aaa64", "#c9b458", "#787c7e"];
  const geo = new RoundedBoxGeometry(0.9, 0.9, 0.22, 4, 0.08);
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 5; c++) {
      const color = row === 2 ? "#6aaa64" : pick(r, cols);
      const t = new THREE.Mesh(geo, M.plastic(color));
      t.position.set((c - 2) * 1.0, 0.11, (row - 1) * 1.0);
      t.rotation.x = -Math.PI / 2;
      t.position.y = 0.11 + (row === 2 ? 0 : between(r, 0, 0.04));
      group.add(t);
    }
  }
  group.rotation.y = between(r, -0.25, 0.25);
  return { group, view: [0, 0.95, 0.85], fov: 26 };
}

// ── school: books, an apple and a pencil ──────────────────────────────────
function book(THREE, M, w, h, d, color) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, 0.03), M.plastic(color));
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.82, d * 0.95), M.paper("#f5f0e1"));
  pages.position.x = 0.02;
  g.add(cover, pages);
  return g;
}

function apple(THREE, M, rad) {
  const geo = new THREE.SphereGeometry(rad, 96, 64);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const rr = Math.hypot(v.x, v.z) / rad;
    v.y *= 0.92;
    v.y -= Math.sign(v.y) * 0.22 * rad * Math.exp(-rr * rr * 14);
    v.x *= 1 + 0.06 * (v.y / rad);
    v.z *= 1 + 0.06 * (v.y / rad);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo, M.phys("#c81e1e", { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 }));
  body.position.y = rad * 0.92;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, rad * 0.5, 12), M.matte("#5b3a1a"));
  stem.position.set(0.02, rad * 1.85, 0);
  stem.rotation.z = -0.25;
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(rad * 0.35, rad * 0.25, rad * 0.7, 0);
  leafShape.quadraticCurveTo(rad * 0.35, -rad * 0.2, 0, 0);
  const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(leafShape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), M.matte("#3f8f2b"));
  leaf.position.set(0.06, rad * 1.95, 0);
  leaf.rotation.set(0.3, -0.4, 0.5);
  g.add(body, stem, leaf);
  return g;
}

function school({ THREE, r }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const cols = ["#2563eb", "#dc2626", "#059669", "#f59e0b", "#7c3aed"].sort(() => r() - 0.5);
  let y = 0;
  [[2.6, 0.32, 1.8], [2.4, 0.28, 1.7], [2.5, 0.3, 1.75], [2.2, 0.26, 1.6]].forEach(([w, h, d], i) => {
    const b = book(THREE, M, w, h, d, cols[i]);
    b.position.set(between(r, -0.12, 0.12), y + h / 2, between(r, -0.08, 0.08));
    b.rotation.y = between(r, -0.12, 0.12);
    group.add(b);
    y += h;
  });
  const a = apple(THREE, M, 0.55);
  a.position.set(0.25, y, 0.1);
  group.add(a);
  const pencil = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), M.plastic("#facc15"));
  const wood = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 6), M.matte("#e8c48e"));
  wood.position.y = -1.24;
  wood.rotation.x = Math.PI;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 12), M.matte("#1f2937"));
  lead.position.y = -1.36;
  lead.rotation.x = Math.PI;
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.16, 24), M.metal("#cbd5e1", 0.3));
  ferrule.position.y = 1.18;
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.16, 24), M.matte("#f472b6"));
  eraser.position.y = 1.34;
  pencil.add(shaft, wood, lead, ferrule, eraser);
  pencil.rotation.set(Math.PI / 2, 0, 1.25);
  pencil.position.set(0.3, 0.09, 1.3);
  pencil.userData.extra = true;
  group.add(pencil);
  return { group, view: [0.12, 0.3, 1], fov: 26 };
}

// ── night sky: the moon over a small telescope ────────────────────────────
function nightSky({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const craters = canvasTexture(1024, 512, (c, w, h) => {
    c.fillStyle = "#b8b4a8";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = h * 0.15 + r() * h * 0.7, s = 10 + r() * 70;
      c.fillStyle = `rgba(70,66,60,${0.15 + r() * 0.3})`;
      c.beginPath();
      c.ellipse(x, y, s * 1.6, s, 0, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 160; i++) {
      const x = r() * w, y = r() * h, s = 2 + r() * 10;
      c.strokeStyle = `rgba(255,255,255,${0.1 + r() * 0.2})`;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y, s * 1.6, s, 0, 0, Math.PI * 2);
      c.stroke();
    }
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 128, 96), M.phys("#ffffff", { map: craters, bumpMap: craters, bumpScale: 3, roughness: 0.95, emissive: "#3a3830", emissiveIntensity: 0.35 }));
  moon.position.set(0.9, 3.4, -2.5);
  moon.userData.noShadow = true;
  group.add(moon);
  const scope = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 48), M.plastic("#e5e7eb"));
  const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 48), M.matte("#1f2937"));
  ring1.position.y = 1.15;
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 24), M.matte("#1f2937"));
  eye.position.set(0, -1.25, 0.12);
  eye.rotation.x = 0.6;
  scope.add(tube, ring1, eye);
  scope.rotation.set(0.15, 0, -0.95);
  scope.position.set(-0.6, 2.15, 0);
  const legs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.1, 12), M.metal("#9ca3af", 0.35));
    leg.position.set(Math.cos(a) * 0.38, 1.0, Math.sin(a) * 0.38);
    leg.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32);
    legs.add(leg);
  }
  legs.position.x = -0.6;
  group.add(scope, legs);
  return { group, view: [0.1, 0.12, 1], fov: 28, ground: true, shadow: 0.25 };
}

// ── thanksgiving: pie on a plate, small pumpkins and leaves ───────────────
function thanksgiving({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.25, 0.1, 96), M.phys("#f8fafc", { roughness: 0.15, clearcoat: 1 }));
  plate.position.y = 0.05;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 16, 96), M.phys("#f1f5f9", { roughness: 0.15, clearcoat: 1 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.11;
  group.add(plate, rim);
  const crust = M.phys("#d69a4a", { roughness: 0.75, sheen: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 0.98, 0.3, 96), crust);
  base.position.y = 0.25;
  const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 96), M.phys("#c2620f", { roughness: 0.35, clearcoat: 0.5 }));
  filling.position.y = 0.38;
  const edge = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.11, 18, 96), crust);
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.4;
  group.add(base, filling, edge);
  const cream = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.42, 12, 1), M.phys("#fffdf5", { roughness: 0.5, sheen: 1 }));
  cream.position.set(0.15, 0.6, 0.15);
  cream.rotation.y = 0.3;
  group.add(cream);
  const p1 = pumpkin(THREE, M, 0.55, { canvasTexture, hue: "#e8730f", lobes: 9 });
  p1.position.set(-2.1, 0, -0.3);
  const p2 = pumpkin(THREE, M, 0.4, { canvasTexture, hue: "#efe3c8", lobes: 8 });
  p2.position.set(2.05, 0, -0.1);
  group.add(p1, p2);
  const lg = leafGeo(THREE, 0.34);
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(lg, M.matte(pick(r, ["#b45309", "#9a3412", "#ca8a04", "#dc2626"])));
    l.position.set(between(r, -2.6, 2.6), 0.02, between(r, 0.6, 1.8));
    l.rotation.set(-Math.PI / 2, 0, between(r, 0, Math.PI * 2));
    l.userData.extra = true;
    group.add(l);
  }
  return { group, view: [0, 0.6, 1], fov: 26 };
}

// ── halloween party: a cauldron with a glowing brew ───────────────────────
function halloweenParty({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    prof.push(new THREE.Vector2(Math.sin(Math.PI * (0.08 + t * 0.84)) * 1.4 + 0.05, t * 1.9));
  }
  const pot = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), M.phys("#1f2328", { metalness: 0.6, roughness: 0.42, side: THREE.DoubleSide }));
  pot.position.y = 0.35;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.1, 18, 96), M.phys("#2b3036", { metalness: 0.7, roughness: 0.35 }));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.35 + 1.9;
  const brew = new THREE.Mesh(new THREE.CircleGeometry(0.9, 64), M.glow("#84cc16", 1.6));
  brew.rotation.x = -Math.PI / 2;
  brew.position.y = 0.35 + 1.78;
  group.add(pot, lip, brew);
  for (const a of [0.5, 2.6, 4.7]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.5, 12), M.matte("#111827"));
    leg.position.set(Math.cos(a) * 0.8, 0.22, Math.sin(a) * 0.8);
    group.add(leg);
  }
  const bub = M.phys("#bef264", { emissive: "#a3e635", emissiveIntensity: 1.4, transparent: true, opacity: 0.75, roughness: 0.1, clearcoat: 1 });
  for (let i = 0; i < 12; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(between(r, 0.06, 0.16), 24, 16), bub);
    b.position.set(between(r, -0.6, 0.6), 2.25 + between(r, 0, 1.2), between(r, -0.5, 0.5));
    b.userData.noShadow = true;
    group.add(b);
  }
  const glow = new THREE.PointLight("#a3e635", 8, 6, 2);
  glow.position.set(0, 2.7, 0.3);
  const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 12), M.matte("#92400e"));
  spoon.position.set(0.45, 2.6, -0.1);
  spoon.rotation.z = -0.45;
  group.add(spoon);
  const p = pumpkin(THREE, M, 0.55, { carved: true, canvasTexture });
  p.position.set(1.9, 0, 0.6);
  p.rotation.y = -0.4;
  group.add(p);
  return { group, view: [0, 0.35, 1], fov: 26, lights: [glow], shadow: 0.42 };
}

// ── sports: an American football on turf ─────────────────────────────────
function sports({ THREE, r, canvasTexture }) {
  const M = mats(THREE);
  const group = new THREE.Group();
  const L = 3.0, R = 0.95, pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    pts.push(new THREE.Vector2(Math.max(0.001, R * Math.pow(Math.sin(Math.PI * t), 0.82)), (t - 0.5) * L));
  }
  const pebble = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = "#808080";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.12)`;
      c.beginPath();
      c.arc(r() * w, r() * h, 1 + r() * 2.5, 0, Math.PI * 2);
      c.fill();
    }
  }, { srgb: false });
  pebble.wrapS = pebble.wrapT = THREE.RepeatWrapping;
  pebble.repeat.set(4, 4);
  const ball = new THREE.Group();
  ball.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), M.phys("#7a3b17", { roughness: 0.62, bumpMap: pebble, bumpScale: 1.2, sheen: 0.4, sheenColor: "#c58a5a" })));
  const radAt = (y) => R * Math.pow(Math.sin(Math.PI * (y / L + 0.5)), 0.82);
  for (const y of [-L * 0.33, L * 0.33]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(radAt(y + 0.06) + 0.004, radAt(y - 0.06) + 0.004, 0.12, 96, 1, true), M.matte("#f8fafc"));
    band.position.y = y;
    ball.add(band);
  }
  const lace = M.matte("#f8fafc");
  const seam = new THREE.Mesh(new RoundedBoxGeometry(0.06, L * 0.36, 0.05, 2, 0.02), lace);
  seam.position.set(0, 0, R * 0.99);
  ball.add(seam);
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.06, 0.05, 2, 0.02), lace);
    s.position.set(0, (i - 3.5) * 0.12, R * 1.0);
    ball.add(s);
  }
  ball.rotation.set(0.1, -0.5, Math.PI / 2 - 0.35);
  const box = new THREE.Box3().setFromObject(ball);
  ball.position.y = -box.min.y;
  group.add(ball);
  const turfTex = canvasTexture(1024, 1024, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(46,125,50,1)");
    g.addColorStop(0.7, "rgba(36,104,42,0.85)");
    g.addColorStop(1, "rgba(30,90,36,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,.8)";
    c.lineWidth = 10;
    for (const x of [w * 0.3, w * 0.62]) {
      c.beginPath();
      c.moveTo(x, h * 0.1);
      c.lineTo(x, h * 0.9);
      c.stroke();
    }
  });
  const turf = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshPhysicalMaterial({ map: turfTex, transparent: true, roughness: 0.9 }));
  turf.rotation.x = -Math.PI / 2;
  turf.position.y = 0.002;
  turf.userData.extra = true;
  turf.castShadow = false;
  group.add(turf);
  return { group, view: [0.1, 0.42, 1], fov: 26 };
}

// ── phone: a generic book-style foldable, half open, beside a store bag (no brand shapes) ────
function phone({ THREE, r, color, accent, date, canvasTexture }) {
  const M = mats(THREE);
  const d = date ? new Date(`${date}T12:00:00Z`) : new Date(Date.UTC(2026, 9, 24));
  const W = 1.05, H = 2.3, D = 0.055, open = 0.42;
  const frame = M.metal(pick(r, ["#d9d6cf", "#2b2f36"]), 0.28);
  const glass = { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, emissive: "#ffffff", emissiveIntensity: 0.55 };
  // Inner screen drawn as one canvas and split across the two halves, so the picture runs over the fold.
  const screen = (half) => canvasTexture(560, 1200, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w * 2, h);
    g.addColorStop(0, "#4f46e5");
    g.addColorStop(0.55, "#0891b2");
    g.addColorStop(1, "#059669");
    c.fillStyle = "#000";
    c.fillRect(0, 0, w, h);
    roundedRect(c, half ? -60 : 0, 0, w + 60, h, 46);
    c.save();
    c.clip();
    c.translate(-half * w, 0);
    c.fillStyle = g;
    c.fillRect(0, 0, w * 2, h);
    // Date widget on the left page.
    c.fillStyle = "rgba(255,255,255,.94)";
    roundedRect(c, 60, 110, 440, 400, 48);
    c.fill();
    c.fillStyle = "#dc2626";
    c.font = "800 52px Sora";
    c.textAlign = "center";
    c.fillText(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][d.getUTCDay()], 280, 200);
    c.fillStyle = "#111827";
    c.font = "800 210px Sora";
    c.fillText(String(d.getUTCDate()), 280, 420);
    c.font = "700 44px Sora";
    c.fillStyle = "#6b7280";
    c.fillText(MONTHS[d.getUTCMonth()], 280, 485);
    // Plain app tiles (colored squares, no icons).
    const cols = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#14b8a6", "#8b5cf6", "#ef4444"];
    for (let i = 0; i < 16; i++) {
      const x = 70 + (i % 4) * 120, y = 600 + Math.floor(i / 4) * 140;
      c.fillStyle = cols[(i * 3) % cols.length];
      roundedRect(c, x, y, 92, 92, 24);
      c.fill();
    }
    // Right page: a pickup ticket card and a check mark.
    c.fillStyle = "rgba(255,255,255,.94)";
    roundedRect(c, w + 50, 110, 450, 520, 48);
    c.fill();
    c.fillStyle = accent;
    c.beginPath();
    c.arc(w + 275, 280, 100, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#fff";
    c.lineWidth = 26;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(w + 228, 282);
    c.lineTo(w + 264, 320);
    c.lineTo(w + 328, 245);
    c.stroke();
    c.fillStyle = "#111827";
    c.font = "800 64px Sora";
    c.fillText("Pickup", w + 275, 470);
    c.fillStyle = "#9ca3af";
    for (let i = 0; i < 2; i++) {
      roundedRect(c, w + 110, 515 + i * 50, 330 - i * 90, 24, 12);
      c.fill();
    }
    for (let i = 0; i < 12; i++) {
      const x = w + 70 + (i % 4) * 120, y = 740 + Math.floor(i / 4) * 140;
      c.fillStyle = cols[(i * 5 + 1) % cols.length];
      roundedRect(c, x, y, 92, 92, 24);
      c.fill();
    }
    c.restore();
  });
  const leaf = (side) => {
    const pivot = new THREE.Group();
    const half = new THREE.Group();
    half.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.05), frame));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.96, H * 0.975), new THREE.MeshPhysicalMaterial({ map: screen(side > 0 ? 1 : 0), emissiveMap: screen(side > 0 ? 1 : 0), ...glass }));
    face.position.set(side * -0.018, 0, D / 2 + 0.002);
    face.userData.noShadow = true;
    half.add(face);
    half.position.x = side * (W / 2 + 0.002);
    pivot.add(half);
    pivot.rotation.y = -side * open;
    return pivot;
  };
  const device = new THREE.Group();
  device.add(leaf(-1), leaf(1));
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, H * 0.995, 24), frame);
  hinge.position.z = -0.03;
  device.add(hinge);
  device.position.y = H / 2;
  device.rotation.y = between(r, -0.12, 0.12);
  const group = new THREE.Group();
  group.add(device);
  const b = bag(THREE, M, 1.2, 1.55, 0.55, pick(r, ["#f8fafc", "#e5e7eb"]));
  b.position.set(1.25, 0, -0.95);
  b.rotation.y = -0.45;
  b.userData.extra = true;
  group.add(b);
  return { group, view: [0.05, 0.22, 1], fov: 26 };
}

export const MODELS = {
  calendar, election, halloween, gaming,
  "winter-holidays": winterHolidays, shopping, "time-change": timeChange, money, puzzle, school,
  "night-sky": nightSky, thanksgiving, "halloween-party": halloweenParty, sports, phone,
};
