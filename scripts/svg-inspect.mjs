// SVG 구조 분석기 — outline 패스 SVG에서 레이아웃 골격을 추출한다.
// 사용: node scripts/svg-inspect.mjs svg/v2-nihonshu.svg
import { parse } from "svgson";
import { svgPathBbox } from "svg-path-bbox";
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/svg-inspect.mjs <file.svg>");
  process.exit(1);
}
const raw = readFileSync(file, "utf8");
const root = await parse(raw);

const shapes = []; // 비-텍스트 도형 (rect/line/circle/ellipse/text)
const glyphs = []; // outline 텍스트 패스 (fill, bbox)

function round(n) {
  return Math.round(Number(n) * 10) / 10;
}
function walk(node) {
  const a = node.attributes || {};
  const fill = a.fill && a.fill !== "none" ? a.fill : null;
  const stroke = a.stroke && a.stroke !== "none" ? a.stroke : null;
  switch (node.name) {
    case "rect":
      shapes.push({
        t: "rect",
        x: round(a.x || 0),
        y: round(a.y || 0),
        w: round(a.width || 0),
        h: round(a.height || 0),
        rx: a.rx ? round(a.rx) : 0,
        fill,
        stroke,
        sw: a["stroke-width"] || null,
      });
      break;
    case "line":
      shapes.push({
        t: "line",
        x1: round(a.x1 || 0),
        y1: round(a.y1 || 0),
        x2: round(a.x2 || 0),
        y2: round(a.y2 || 0),
        stroke,
        sw: a["stroke-width"] || null,
        dash: a["stroke-dasharray"] || null,
      });
      break;
    case "circle":
      shapes.push({ t: "circle", cx: round(a.cx || 0), cy: round(a.cy || 0), r: round(a.r || 0), fill, stroke });
      break;
    case "ellipse":
      shapes.push({ t: "ellipse", cx: round(a.cx || 0), cy: round(a.cy || 0), rx: round(a.rx || 0), ry: round(a.ry || 0), fill, stroke });
      break;
    case "text":
      shapes.push({ t: "text", x: round(a.x || 0), y: round(a.y || 0), fill, content: (node.children || []).map((c) => c.value).join("") });
      break;
    case "path": {
      if (a.d) {
        try {
          const [x0, y0, x1, y1] = svgPathBbox(a.d);
          // 배경 풀블리드 패스(거의 화면 전체)는 제외
          glyphs.push({ x: round(x0), y: round(y0), w: round(x1 - x0), h: round(y1 - y0), fill });
        } catch {
          /* skip */
        }
      }
      break;
    }
    default:
      break;
  }
  (node.children || []).forEach(walk);
}
walk(root);

// 색상 사용 빈도
const colorCount = {};
for (const s of [...shapes, ...glyphs]) {
  if (s.fill) colorCount[s.fill] = (colorCount[s.fill] || 0) + 1;
  if (s.stroke) colorCount["stroke:" + s.stroke] = (colorCount["stroke:" + s.stroke] || 0) + 1;
}

// 글리프(텍스트)를 y밴드로 클러스터 → 텍스트 "행" 추정 (색상/높이/ x범위)
const sorted = [...glyphs].sort((a, b) => a.y - b.y || a.x - b.x);
const rows = [];
for (const g of sorted) {
  const last = rows[rows.length - 1];
  // 같은 행: y 중심이 글자 높이의 60% 이내
  if (last && Math.abs(g.y - last.y) <= Math.max(6, last.hMax * 0.6) && g.fill === last.fill) {
    last.x2 = Math.max(last.x2, g.x + g.w);
    last.x1 = Math.min(last.x1, g.x);
    last.hMax = Math.max(last.hMax, g.h);
    last.n++;
  } else {
    rows.push({ y: g.y, x1: g.x, x2: g.x + g.w, hMax: g.h, fill: g.fill, n: 1 });
  }
}

console.log("=== " + file + " ===");
const vb = raw.match(/viewBox="([^"]+)"/);
console.log("viewBox:", vb ? vb[1] : "?");
console.log("\n-- colors (count) --");
console.log(
  Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}:${n}`)
    .join("  ")
);
console.log("\n-- shapes (rect/line/circle/text), y-sorted --");
for (const s of shapes.sort((a, b) => (a.y ?? a.y1 ?? a.cy ?? 0) - (b.y ?? b.y1 ?? b.cy ?? 0))) {
  console.log(JSON.stringify(s));
}
console.log("\n-- text rows (outline glyph clusters): y | font≈h | x-range | color | glyphs --");
for (const r of rows) {
  console.log(`y=${round(r.y)}  h≈${round(r.hMax)}  x:${round(r.x1)}–${round(r.x2)}  ${r.fill || "?"}  (${r.n})`);
}
