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
  deviceScaleFactor: Number(process.env.SHOOT_DSF || 1),
});
const page = await ctx.newPage();
const PW = process.env.SHOOT_LOGIN_PW;
if (PW) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async (pw) => {
    const j = { "content-type": "application/json" };
    let r = await fetch("/api/admin/setup", { method: "POST", headers: j, body: JSON.stringify({ password: pw }) });
    if (!r.ok) await fetch("/api/admin/login", { method: "POST", headers: j, body: JSON.stringify({ password: pw }) });
  }, PW);
}
await page.goto(BASE + PATHNAME, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1600);

// 단일 샷: 특정 페이지로 이동 후 텍스트 클릭(상호작용 캡처용)
const NAV = Number(process.env.SHOOT_NAV || 0);
for (let k = 0; k < NAV; k++) {
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(450);
}
if (process.env.SHOOT_CLICK_TEXT) {
  try {
    await page
      .locator("button")
      .filter({ hasText: process.env.SHOOT_CLICK_TEXT })
      .first()
      .click({ timeout: 4000 });
    await page.waitForTimeout(600);
  } catch {
    console.log("click text not found:", process.env.SHOOT_CLICK_TEXT);
  }
}

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
