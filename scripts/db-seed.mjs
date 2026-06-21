/**
 * seed.ts(단일 소스) → 라이브 Supabase DB upsert.
 * 실행: npm run db:seed  (= node --env-file=.env.local scripts/db-seed.mjs)
 * REST + service_role 사용(스키마는 이미 적용되어 있어야 함).
 */
import { SEED_ITEMS, SEED_PAGES, DEFAULT_DENSITY, SEED_ORIGINS } from "../data/seed.ts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요(.env.local)");
  process.exit(1);
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const n = (v) => (v === undefined ? null : v);

const itemRow = (it) => ({
  id: it.id, category_key: it.categoryKey, band_key: n(it.bandKey), name: it.name,
  brewery: n(it.brewery), grade: n(it.grade), region: n(it.region), style: n(it.style),
  description: n(it.description), ingredient: n(it.ingredient), sommelier: n(it.sommelier),
  pairing: n(it.pairing), origin_note: n(it.originNote), half_price: n(it.halfPrice),
  polish: n(it.polish), smv: n(it.smv), acidity: n(it.acidity),
  abv: n(it.abv), price_glass: n(it.priceGlass), price_tokkuri: n(it.priceTokkuri),
  price_bottle: n(it.priceBottle), status: it.status, badge: n(it.badge),
  featured: !!it.featured, heatable: !!it.heatable, flag_note: n(it.flagNote),
  image_url: n(it.imageUrl), map_x: n(it.mapX), map_y: n(it.mapY),
  sort_order: it.sortOrder, closed_at: n(it.closedAt),
});
const pageRow = (p) => ({
  id: p.id, type: p.type, title: n(p.title), subtitle: n(p.subtitle), section_tag: n(p.sectionTag),
  category_key: n(p.categoryKey), map_kind: n(p.mapKind), theme_color: n(p.themeColor),
  image_url: n(p.imageUrl), is_hidden: !!p.isHidden, is_fixed: !!p.isFixed, sort_order: p.sortOrder,
});
const stickerRows = (p) =>
  (p.stickers ?? []).map((st) => ({
    id: st.id, page_id: p.id, kind: st.kind, text: st.text ?? "", sub_text: n(st.subText),
    lines: st.lines ?? null, color: n(st.color), x_pct: st.xPct, y_pct: st.yPct,
    rotation: st.rotation, scale: st.scale, z: st.z,
  }));

async function upsert(table, rows, onConflict = "id") {
  if (!rows.length) return;
  const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`❌ ${table} 실패 ${res.status}:`, await res.text());
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows.length}건`);
}

await upsert("thehand_items", SEED_ITEMS.map(itemRow));
await upsert("thehand_pages", SEED_PAGES.map(pageRow));
await upsert("thehand_stickers", SEED_PAGES.flatMap(stickerRows));
await upsert(
  "thehand_settings",
  [
    { key: "density", value: DEFAULT_DENSITY },
    { key: "origins", value: SEED_ORIGINS },
  ],
  "key"
);
console.log("✅ 시드 → 라이브 DB 동기화 완료");
