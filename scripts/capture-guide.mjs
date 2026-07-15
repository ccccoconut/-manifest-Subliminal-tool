/**
 * Capture guide screenshots for「使用步骤说明」.
 * Usage (dev server must be running):
 *   GUIDE_BASE_URL=http://localhost:3001 npm run capture:guide
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.GUIDE_BASE_URL || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "public", "guide");

const STEPS = [
  { file: "01-input.png", jump: "input", waitMs: 800 },
  { file: "02-affirmation.png", jump: "affirmation", waitMs: 900 },
  { file: "03-record.png", jump: "record", waitMs: 900 },
  { file: "04-background.png", jump: "background", waitMs: 1000 },
  { file: "05-mixconsole.png", jump: "mixconsole", waitMs: 1400 },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await page.goto(`${BASE}/?capture=1`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => typeof window.__yxrDevJump === "function", {
    timeout: 20000,
  });

  for (const step of STEPS) {
    await page.evaluate(async (target) => {
      await window.__yxrDevJump(target);
    }, step.jump);
    await new Promise((r) => setTimeout(r, step.waitMs));
    const dest = path.join(OUT, step.file);
    await page.screenshot({ path: dest, type: "png" });
    console.log("saved", dest);
  }

  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
