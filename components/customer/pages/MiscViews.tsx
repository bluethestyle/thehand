import type { MenuItem, MenuPage } from "@/lib/types";
import s from "../customer.module.css";

export function CoverView({ page }: { page: MenuPage }) {
  return (
    <div className={s.cover}>
      <div className={s.coverMark}>手</div>
      <div className={s.coverBrand}>THE HAND</div>
      <div className={s.coverRule} />
      <div className={s.coverSub}>{page.subtitle ?? "사케 바 · 디지털 메뉴판"}</div>
    </div>
  );
}

export function NoticeView() {
  return (
    <div className={s.content}>
      <div className={s.notice}>
        <h3>원산지 표기</h3>
        <ul>
          <li>니혼슈 · 쇼츄 — 원산지: 일본 (현별 표기는 각 메뉴 참조)</li>
          <li>모든 주류는 정식 수입 통관 제품입니다.</li>
          <li>쌀 · 누룩 등 원재료 원산지는 양조장 표기를 따릅니다.</li>
          <li>주류는 19세 미만 판매하지 않습니다.</li>
          <li>∗ 주류 필수 주문 ∗</li>
        </ul>
      </div>
    </div>
  );
}

export function RegionMapView({ items }: { items: MenuItem[] }) {
  const byRegion = new Map<string, MenuItem[]>();
  for (const it of items) {
    if (it.status === "closed" || !it.region) continue;
    const arr = byRegion.get(it.region) ?? [];
    arr.push(it);
    byRegion.set(it.region, arr);
  }
  const regions = [...byRegion.entries()];

  return (
    <div className={s.content}>
      <div className={s.regionGrid}>
        {regions.map(([region, list]) => (
          <div key={region} className={s.regionCard}>
            <div className={s.regionPref}>{region}</div>
            <div className={s.regionSake}>
              {list.map((it) => it.name).join(" · ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
