/**
 * `pnpm fc news-heroes`: what a writer checks before picking a hero. Lists the illustrated scenes
 * already taken (from <slug>.hero.json), the scenes still free, and hero pairs that are the same
 * picture. A new story must use a free scene or a licensed photo; see the news-visuals skill.
 */
import { SCENES } from "./art.js";
import { SCENES_3D } from "./news3d.js";
import { SAME_PICTURE, UNIQUE_SINCE, duplicateHeroes, storyHeroes } from "../../../scripts/lib/hero-hash.mjs";

export async function listHeroes(): Promise<void> {
  const stories = storyHeroes();
  const taken = new Map<string, string[]>();
  for (const s of stories) if (s.record?.kind === "scene" && s.record.scene) taken.set(s.record.scene, [...(taken.get(s.record.scene) ?? []), s.slug]);
  const kinds = stories.reduce<Record<string, number>>((n, s) => ((n[s.record?.kind ?? "unrecorded"] = (n[s.record?.kind ?? "unrecorded"] ?? 0) + 1), n), {});
  console.log(`${stories.length} story heroes: ${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(", ")}\n`);
  console.log("Scenes taken (recorded since the uniqueness rule):");
  for (const [scene, slugs] of taken) console.log(`  ${scene.padEnd(16)} ${slugs.join(", ")}`);
  const free = SCENES.filter((n) => !taken.has(n));
  console.log(`\nScenes still free: ${free.map((n) => `${n}${SCENES_3D[n] ? " (3D)" : " (2D)"}`).join(", ") || "none: use a photo or add a scene"}`);
  const pairs = await duplicateHeroes(stories);
  console.log(`\nSame picture (< ${SAME_PICTURE}/256 bits): ${pairs.length} pairs; stories from ${UNIQUE_SINCE} on may not be in one.`);
  for (const p of pairs.slice(0, 25)) console.log(`  ${String(p.d).padStart(3)}  ${p.a.slug} = ${p.b.slug}`);
}
