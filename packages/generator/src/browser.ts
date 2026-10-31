import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

/**
 * Playwright launches only the Chromium build its own version was released with (chromium-1234 for
 * 1.62). Writers' sessions often have another build already installed and cannot download one, so
 * every `pnpm fc` command used to stop at "Executable doesn't exist". When that happens this retries
 * with an installed build instead: FC_CHROMIUM_PATH if set, else the newest Chromium in the
 * Playwright browser folders, else the system Chrome. Rendering is plain HTML/WebGL to PNG, which any
 * recent Chromium draws the same way.
 */

const EXE_NAMES = new Set(["chrome-headless-shell", "headless_shell", "chrome", "Chromium", "Google Chrome for Testing", "chrome.exe", "chrome-headless-shell.exe", "headless_shell.exe"]);

function browserRoots(): string[] {
  const home = os.homedir();
  return [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(home, "Library/Caches/ms-playwright"),
    path.join(home, ".cache/ms-playwright"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "ms-playwright"),
  ].filter((d): d is string => !!d && d !== "0" && fs.existsSync(d));
}

/** First executable named like a Chromium binary under dir (a few levels deep, app bundles included). */
function findExe(dir: string, depth = 5): string | null {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && EXE_NAMES.has(e.name)) {
      try { fs.accessSync(p, fs.constants.X_OK); return p; } catch { /* not executable */ }
    }
  }
  if (depth === 0) return null;
  for (const e of entries) {
    if (e.isDirectory() || e.isSymbolicLink()) {
      const hit = findExe(path.join(dir, e.name), depth - 1);
      if (hit) return hit;
    }
  }
  return null;
}

/** Installed Playwright Chromium builds, headless shell first, newest revision first. */
export function installedChromium(): string | null {
  const builds: { rev: number; shell: boolean; dir: string }[] = [];
  for (const root of browserRoots()) {
    for (const name of fs.readdirSync(root)) {
      const m = /^chromium(_headless_shell)?-(\d+)$/.exec(name);
      if (m) builds.push({ rev: Number(m[2]), shell: !!m[1], dir: path.join(root, name) });
    }
  }
  builds.sort((a, b) => Number(b.shell) - Number(a.shell) || b.rev - a.rev);
  for (const b of builds) {
    const exe = findExe(b.dir);
    if (exe) return exe;
  }
  return null;
}

type LaunchOptions = Parameters<typeof chromium.launch>[0];
const launch = chromium.launch.bind(chromium);

chromium.launch = async (options?: LaunchOptions) => {
  if (options?.executablePath || options?.channel) return launch(options);
  if (process.env.FC_CHROMIUM_PATH) return launch({ ...options, executablePath: process.env.FC_CHROMIUM_PATH });
  try {
    return await launch(options);
  } catch (err) {
    if (!/Executable doesn't exist/i.test(String((err as Error)?.message))) throw err;
    const exe = installedChromium();
    if (exe) {
      console.warn(`[browser] Playwright's own Chromium is not installed; using ${exe}`);
      return launch({ ...options, executablePath: exe });
    }
    try {
      const b = await launch({ ...options, channel: "chrome" });
      console.warn("[browser] Playwright's own Chromium is not installed; using the system Chrome");
      return b;
    } catch {
      throw new Error(
        "No Chromium found. Run `pnpm --filter @freshcalendars/generator exec playwright install chromium`, " +
          "or set FC_CHROMIUM_PATH to a Chrome or Chromium binary.",
        { cause: err },
      );
    }
  }
};
