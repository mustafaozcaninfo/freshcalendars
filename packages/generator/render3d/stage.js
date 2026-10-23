/**
 * Browser side of the 3D hero renderer (runs in headless Chromium, loaded by src/news3d.ts).
 * One physically based scene per hero: image-based light from a studio room (PMREM), a warm key
 * light with soft variance shadows, a colored rim light, neutral PBR tone mapping, and a shadow catcher
 * so objects sit on the page background instead of floating. The canvas is transparent: the
 * gradient, glow and bokeh behind it are HTML, and the text is drawn later on top of the graded
 * image. Models are built from primitives in models.js, so every picture is ours.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MODELS } from "./models.js";

/** Small deterministic PRNG (mulberry32), same as src/art.ts, so a slug always draws the same picture. */
export function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) (h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)), (h = (h << 13) | (h >>> 19));
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A canvas-drawn texture in sRGB. */
export function canvasTexture(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * opts: { scene, color, accent, seed, date, width, height, frame }
 * frame: where the subject sits, as the horizontal center (0..1) and the share of the height it fills.
 */
export async function render(opts) {
  // Canvas text only uses a font that is already loaded; data-URI faces load on demand.
  await Promise.all(["700 40px Sora", "800 40px Sora", "700 40px Manrope"].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const { width: W, height: H } = opts;
  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral (Khronos PBR Neutral) keeps product colors true; ACES desaturates brights toward pastel.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const r = rng(`${opts.scene}:${opts.seed}`);
  const accent = new THREE.Color(opts.accent || "#ffd27a");
  const built = MODELS[opts.scene]({ THREE, r, color: opts.color, accent: opts.accent || "#ffd27a", date: opts.date, canvasTexture });
  const group = built.group;
  group.traverse((o) => {
    if (o.isMesh) {
      // Printed faces (labels, calendar pages) neither cast nor take shadows: VSM light bleed would smear them.
      o.castShadow = !o.userData.noShadow;
      o.receiveShadow = !o.userData.noShadow;
    }
  });
  scene.add(group);
  group.updateMatrixWorld(true);

  // Frame the subject (scattered extras such as confetti or leaves do not count), then shift the
  // frame so the subject sits right of center.
  const box = new THREE.Box3();
  group.traverse((o) => {
    if (!o.isMesh) return;
    let extra = false;
    for (let p = o; p; p = p.parent) if (p.userData.extra) extra = true;
    if (!extra) box.expandByObject(o);
  });
  const full = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = built.fov ?? 28;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 200);
  const dir = new THREE.Vector3(...(built.view ?? [0.15, 0.42, 1])).normalize();
  const fill = (opts.frame?.fill ?? 0.98) * (built.zoom ?? 1);
  // Fit the height, and the width too: the subject sits off center, so it only has the room
  // between its center and the nearer side edge (minus a margin).
  const cxFit = opts.frame?.x ?? 0.68;
  const tanH = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (W / H);
  const dist = Math.max(
    sphere.radius / Math.sin(THREE.MathUtils.degToRad(fov / 2)) / fill,
    sphere.radius / (2 * tanH * (Math.min(cxFit, 1 - cxFit) - 0.08)),
  );
  const target = sphere.center.clone().add(new THREE.Vector3(0, built.lift ?? 0, 0));
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.lookAt(target);
  const cx = opts.frame?.x ?? 0.68;
  camera.setViewOffset(W, H, -(cx - 0.5) * W, -(built.drop ?? 0.02) * H, W, H);
  camera.updateProjectionMatrix();

  // Lights: warm key from upper left (soft shadow), cool fill, colored rim from behind.
  const R = Math.max(sphere.radius, 1);
  const key = new THREE.DirectionalLight(0xfff0dc, 2.4);
  key.position.copy(sphere.center).add(new THREE.Vector3(-0.9 * R * 3, 2.6 * R * 3, 1.4 * R * 3));
  key.target.position.copy(sphere.center);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 10;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -R * 2.2;
  sc.right = sc.top = R * 2.2;
  sc.near = 0.1;
  sc.far = R * 20;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(accent, 1.6);
  rim.position.copy(sphere.center).add(new THREE.Vector3(R * 3, R * 1.5, -R * 4));
  rim.target.position.copy(sphere.center);
  scene.add(rim, rim.target);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a1d10, 0.35));
  for (const l of built.lights ?? []) scene.add(l);

  // Shadow catcher: only the shadow shows, on top of the HTML background.
  if (built.ground !== false) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(R * 30, R * 30), new THREE.ShadowMaterial({ opacity: built.shadow ?? 0.34 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = full.min.y + 0.001;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  renderer.render(scene, camera);
  // Where the subject landed on screen, for the page's glow.
  const p = sphere.center.clone().project(camera);
  window.__subject = { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
  window.__rendered = true;
}
