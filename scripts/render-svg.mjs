import { chromium } from "playwright";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SRC = process.env.SVG_DIR || "svg";
const OUT = process.env.SVG_OUT || "design-reference/figma";
mkdirSync(OUT, { recursive: true });

async function launch() {
  for (const channel of ["msedge", "chrome", undefined]) {
    try {
      return await chromium.launch(channel ? { channel } : {});
    } catch {
      /* next */
    }
  }
  throw new Error("브라우저 없음");
}

const browser = await launch();
const files = readdirSync(SRC).filter((f) => f.endsWith(".svg"));
for (const file of files) {
  const raw = readFileSync(resolve(SRC, file), "utf8");
  const m = raw.match(/viewBox="0 0 (\d+) (\d+)"/);
  const w = m ? Number(m[1]) : 768;
  const h = m ? Number(m[2]) : 1024;
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#fff">${raw}</body></html>`,
    { waitUntil: "networkidle" }
  );
  const name = file.replace(/\.svg$/, ".png");
  await page.screenshot({ path: `${OUT}/${name}`, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`rendered ${name} (${w}x${h})`);
  await page.close();
}
await browser.close();
console.log("done");
