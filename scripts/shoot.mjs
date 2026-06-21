import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_BASE || "http://localhost:3100";
const OUT = process.env.SHOOT_OUT || "design-reference/shots";
const PAGES = Number(process.env.SHOOT_PAGES || 10);
const PATHNAME = process.env.SHOOT_PATH || "/";
const PREFIX = process.env.SHOOT_PREFIX || "cust";
const CLICKS = process.env.SHOOT_CLICKS !== "0";

mkdirSync(OUT, { recursive: true });

async function launch() {
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch {
      /* try next */
    }
  }
  throw new Error("브라우저를 찾을 수 없습니다 (msedge/chrome/chromium).");
}

const browser = await launch();
const ctx = await browser.newContext({
  viewport: { width: 768, height: 1024 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(BASE + PATHNAME, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);

const FULL = process.env.SHOOT_FULL === "1";
const n = CLICKS ? PAGES : 1;
for (let i = 0; i < n; i++) {
  await page.screenshot({ path: `${OUT}/${PREFIX}-${i}.png`, fullPage: FULL });
  console.log(`shot ${PREFIX}-${i}.png`);
  if (i < n - 1) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(550);
  }
}

await browser.close();
console.log("done");
