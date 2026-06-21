/**
 * 메뉴 페이지 파생 로직 — 자동 분할 + 글자크기 자동 비례.
 * 순수 함수. 서버/클라이언트 공용.
 */
import type {
  CategoryBand,
  DensitySettings,
  MenuData,
  MenuItem,
  MenuPage,
  RenderedPage,
} from "@/lib/types";

/** 손님 화면에서 보이는 항목인가 (닫힘 제외, 일시품절은 표시). */
export function isCustomerVisible(item: MenuItem): boolean {
  return item.status !== "closed";
}

/**
 * 글자크기 자동 비례 배수.
 * 항목이 많을수록 작아짐. page-1(8종)을 기준 1.0으로 보정.
 * offset: 미세조정 단계(각 단계 ±4%).
 */
export function fontScale(itemsPerPage: number, offset = 0): number {
  const base = clamp(Math.sqrt(8 / Math.max(1, itemsPerPage)), 0.85, 1.35);
  return Math.round(base * (1 + offset * 0.04) * 1000) / 1000;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** ceil(총 종수 / 페이지당) — 자동 분할 페이지 수 */
export function splitCount(total: number, itemsPerPage: number): number {
  if (total === 0) return 1;
  return Math.ceil(total / Math.max(1, itemsPerPage));
}

/** N개씩 묶기 */
function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * 페이지 보드(MenuPage[])를 손님이 실제로 넘기는 장(RenderedPage[])으로 전개.
 *  - 숨김 페이지 제외, sortOrder 정렬
 *  - menu 타입은 항목 수가 itemsPerPage 초과 시 자동 분할(각 장에 해당 밴드 헤더 재출력)
 *  - 닫힌 항목 제외
 */
export function buildRenderedPages(data: MenuData): RenderedPage[] {
  const { pages, items, density } = data;
  const visiblePages = pages
    .filter((p) => !p.isHidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const rendered: RenderedPage[] = [];

  for (const page of visiblePages) {
    if (page.type !== "menu") {
      rendered.push({ key: page.id, source: page });
      continue;
    }

    const catItems = items
      .filter((it) => it.categoryKey === page.categoryKey && isCustomerVisible(it))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (catItems.length === 0) {
      // 빈 메뉴 페이지도 한 장은 보여줌(준비 중 상태)
      rendered.push({ key: page.id, source: page, items: [] });
      continue;
    }

    const groups = chunk(catItems, density.itemsPerPage);
    groups.forEach((groupItems, idx) => {
      rendered.push({
        key: groups.length > 1 ? `${page.id}--${idx + 1}` : page.id,
        source: page,
        items: groupItems,
        splitIndex: groups.length > 1 ? idx + 1 : undefined,
        splitTotal: groups.length > 1 ? groups.length : undefined,
      });
    });
  }

  return rendered;
}

/**
 * 한 장의 항목들을 밴드(등급)별로 묶어 렌더 순서대로 반환.
 * 밴드 헤더는 그 장에 실제로 존재하는 밴드만 출력.
 */
export interface BandGroup {
  band: CategoryBand | null;
  items: MenuItem[];
}

export function groupByBand(
  items: MenuItem[],
  bands: CategoryBand[] | undefined
): BandGroup[] {
  if (!bands || bands.length === 0) {
    return [{ band: null, items }];
  }
  const out: BandGroup[] = [];
  for (const band of bands) {
    const inBand = items.filter((it) => it.bandKey === band.key);
    if (inBand.length > 0) out.push({ band, items: inBand });
  }
  // 밴드 미지정 항목은 마지막에
  const orphan = items.filter((it) => !it.bandKey);
  if (orphan.length > 0) out.push({ band: null, items: orphan });
  return out;
}

/** 보관함(닫힘) 항목 */
export function archivedItems(items: MenuItem[]): MenuItem[] {
  return items
    .filter((it) => it.status === "closed")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
