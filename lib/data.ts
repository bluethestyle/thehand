import "server-only";
import { BANDS, DEFAULT_DENSITY, SEED_ITEMS, SEED_PAGES } from "@/data/seed";
import { serverAnonClient, supabaseConfigured } from "@/lib/supabase";
import type {
  DensitySettings,
  MenuData,
  MenuItem,
  MenuPage,
  Sticker,
} from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function num(v: any): number | null {
  return v === null || v === undefined ? null : Number(v);
}

function rowToItem(r: any): MenuItem {
  return {
    id: r.id,
    categoryKey: r.category_key,
    bandKey: r.band_key,
    name: r.name,
    brewery: r.brewery,
    grade: r.grade,
    region: r.region,
    style: r.style,
    description: r.description,
    polish: num(r.polish),
    smv: r.smv,
    acidity: r.acidity,
    abv: num(r.abv),
    priceGlass: num(r.price_glass),
    priceTokkuri: num(r.price_tokkuri),
    priceBottle: num(r.price_bottle),
    status: r.status,
    badge: r.badge,
    featured: !!r.featured,
    heatable: !!r.heatable,
    flagNote: r.flag_note,
    imageUrl: r.image_url,
    mapX: num(r.map_x),
    mapY: num(r.map_y),
    sortOrder: r.sort_order ?? 0,
    closedAt: r.closed_at,
  };
}

function rowToSticker(r: any): Sticker {
  return {
    id: r.id,
    kind: r.kind,
    text: r.text ?? "",
    subText: r.sub_text,
    lines: r.lines ?? null,
    color: r.color,
    xPct: Number(r.x_pct),
    yPct: Number(r.y_pct),
    rotation: Number(r.rotation),
    scale: Number(r.scale),
    z: r.z ?? 1,
  };
}

function rowToPage(r: any, stickers: Sticker[]): MenuPage {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    sectionTag: r.section_tag,
    categoryKey: r.category_key,
    mapKind: r.map_kind,
    themeColor: r.theme_color,
    imageUrl: r.image_url,
    stickers: stickers.length ? stickers : undefined,
    isHidden: !!r.is_hidden,
    isFixed: !!r.is_fixed,
    sortOrder: r.sort_order ?? 0,
  };
}

/** DB의 density 값을 안전 범위로 정규화(손으로 넣은 잘못된 값 방어). */
function normalizeDensity(value: unknown): DensitySettings {
  const raw = (value ?? {}) as Partial<DensitySettings>;
  const ipp = Math.round(Number(raw.itemsPerPage));
  const off = Math.round(Number(raw.fontScaleOffset));
  return {
    itemsPerPage:
      Number.isFinite(ipp) && ipp >= 2 && ipp <= 10
        ? ipp
        : DEFAULT_DENSITY.itemsPerPage,
    fontScaleOffset: Number.isFinite(off) ? Math.max(-2, Math.min(2, off)) : 0,
  };
}

const seedData = (): MenuData => ({
  pages: SEED_PAGES,
  items: SEED_ITEMS,
  bands: BANDS,
  density: DEFAULT_DENSITY,
  branding: { logoUrl: null },
});

/**
 * 손님 화면 데이터. Supabase 설정 시 DB에서, 아니면 시드.
 * 어떤 이유로든 실패하면 시드로 안전하게 폴백.
 */
export async function getMenuData(): Promise<MenuData> {
  if (!supabaseConfigured) return seedData();

  try {
    const sb = serverAnonClient();
    const [pagesRes, itemsRes, stickersRes, settingsRes] = await Promise.all([
      sb.from("thehand_pages").select("*").order("sort_order", { ascending: true }),
      sb.from("thehand_items").select("*").order("sort_order", { ascending: true }),
      sb.from("thehand_stickers").select("*").order("z", { ascending: true }),
      sb.from("thehand_settings").select("key, value").in("key", ["density", "branding"]),
    ]);

    if (pagesRes.error) throw pagesRes.error;
    if (itemsRes.error) throw itemsRes.error;

    const stickersByPage = new Map<string, Sticker[]>();
    for (const s of stickersRes.data ?? []) {
      const sticker = rowToSticker(s);
      const arr = stickersByPage.get(s.page_id) ?? [];
      arr.push(sticker);
      stickersByPage.set(s.page_id, arr);
    }

    const pages = (pagesRes.data ?? []).map((r) =>
      rowToPage(r, stickersByPage.get(r.id) ?? [])
    );
    const items = (itemsRes.data ?? []).map(rowToItem);
    const settings = new Map(
      (settingsRes.data ?? []).map((r) => [r.key as string, r.value])
    );
    const density = normalizeDensity(settings.get("density"));
    const branding = {
      logoUrl:
        (settings.get("branding") as { logoUrl?: string } | undefined)?.logoUrl ?? null,
    };

    // DB가 비어있으면(마이그레이션만 하고 시드 안 한 경우) 시드로 보완
    if (pages.length === 0 && items.length === 0) return seedData();

    return { pages, items, bands: BANDS, density, branding };
  } catch (err) {
    console.error("[getMenuData] Supabase 실패, 시드로 폴백:", err);
    return seedData();
  }
}
