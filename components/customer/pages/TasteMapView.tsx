import type { MenuItem } from "@/lib/types";
import { styleMeta } from "@/lib/format";
import s from "../customer.module.css";

export function TasteMapView({ items }: { items: MenuItem[] }) {
  const mapped = items
    .filter((it) => it.mapX != null && it.mapY != null && it.status !== "closed")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={s.content}>
      <div className={s.mapWrap}>
        <div className={s.plotCard}>
          <div className={s.plot}>
            <span className={`${s.axis} ${s.axisTop}`}>향이 화려·프레시 ▲</span>
            <span className={`${s.axis} ${s.axisBottom}`}>▼ 향이 은은·안정적</span>
            <span className={`${s.axis} ${s.axisLeft}`}>◀ 맛이 달콤</span>
            <span className={`${s.axis} ${s.axisRight}`}>맛이 깔끔 ▶</span>
            {mapped.map((it, i) => {
              const meta = styleMeta(it.style);
              const color = meta?.color ?? "#8b6f47";
              const soldout = it.status === "soldout";
              return (
                <span
                  key={it.id}
                  className={`${s.node} ${soldout ? s.nodeOut : ""}`}
                  style={{
                    left: `${it.mapX}%`,
                    top: `${100 - (it.mapY ?? 0)}%`,
                    background: color,
                    borderColor: color,
                    color: soldout ? color : "#fff",
                  }}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </div>

        <div className={s.legend}>
          <p className={s.legendTitle}>번호로 찾기</p>
          {mapped.map((it, i) => {
            const meta = styleMeta(it.style);
            const color = meta?.color ?? "#8b6f47";
            const soldout = it.status === "soldout";
            return (
              <div key={it.id} className={s.legendRow}>
                <span
                  className={`${s.legendNum} ${soldout ? s.nodeOut : ""}`}
                  style={{
                    background: color,
                    borderColor: color,
                    color: soldout ? color : "#fff",
                  }}
                >
                  {i + 1}
                </span>
                <span className={s.legendName}>{it.name}</span>
                {it.region && <span className={s.legendRegion}>({it.region})</span>}
                {soldout && <span className={s.legendTag}>품절</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
