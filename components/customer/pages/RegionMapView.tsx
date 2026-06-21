"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { groupByBand, type BandGroup } from "@/lib/menu";
import { NIHONSHU_BANDS } from "@/data/seed";
import { styleMeta } from "@/lib/format";
import { JAPAN_MAP_SVG } from "@/data/japan-map";
import s from "../customer.module.css";

// 사케 산지(한글) → JIS 현 코드 (geolonia 지도 data-code)
const REGION_CODE: Record<string, string> = {
  후쿠시마: "07",
  치바: "12",
  후쿠이: "18",
  미에: "24",
  효고: "28",
  돗토리: "31",
  에히메: "38",
  고치: "39",
  구마모토: "43",
  미야자키: "45",
  가고시마: "46",
  오키나와: "47",
};

const HILITE_DEFAULT = "#c8902f";

function JapanMap({ code, color }: { code: string | null; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<SVGGElement>("g.prefecture").forEach((g) => {
      g.style.fill = "#e7ddcb";
    });
    if (code) {
      const g = root.querySelector<SVGGElement>(`g.prefecture[data-code="${code}"]`);
      if (g) g.style.fill = color;
    }
  }, [code, color]);
  return (
    <div
      ref={ref}
      className={s.japanMap}
      // SVG는 신뢰된 정적 자산(geolonia, 빌드 시 인라인)
      dangerouslySetInnerHTML={{ __html: JAPAN_MAP_SVG }}
    />
  );
}

export function RegionMapView({ items }: { items: MenuItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const groups: BandGroup[] = useMemo(() => {
    const has = (it: MenuItem) =>
      it.status !== "closed" && !!it.region && !!REGION_CODE[it.region];
    const nihonshu = items
      .filter((it) => it.categoryKey === "nihonshu" && has(it))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const shochu = items
      .filter((it) => it.categoryKey === "shochu" && has(it))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const out = groupByBand(nihonshu, NIHONSHU_BANDS);
    if (shochu.length)
      out.push({ band: { key: "shochu", ja: "쇼츄", ko: "", note: "" }, items: shochu });
    return out;
  }, [items]);

  const selected = items.find((it) => it.id === selectedId) ?? null;
  const code = selected?.region ? REGION_CODE[selected.region] ?? null : null;
  const color = styleMeta(selected?.style)?.color ?? HILITE_DEFAULT;

  return (
    <div className={s.regionPage}>
      <div className={s.regionMapBox}>
        <JapanMap code={code} color={color} />
        <div className={s.regionSelCaption}>
          {selected ? (
            <>
              <span style={{ color }}>●</span> {selected.name}
              <span className={s.region}> · {selected.region}</span>
            </>
          ) : (
            "아래에서 술을 선택하면 산지가 지도에 표시됩니다"
          )}
        </div>
      </div>

      <div className={s.regionList}>
        {groups.map((g, gi) => (
          <div key={g.band?.key ?? `g-${gi}`}>
            {g.band && (
              <div className={s.bandHeader}>
                <span className={s.bandJa}>{g.band.ja}</span>
                {g.band.ko && <span className={s.bandKo}>{g.band.ko}</span>}
                {g.band.note && <span className={s.bandNote}>{g.band.note}</span>}
              </div>
            )}
            {g.items.map((it) => {
              const c = styleMeta(it.style)?.color ?? HILITE_DEFAULT;
              const active = it.id === selectedId;
              return (
                <button
                  key={it.id}
                  className={`${s.regionItem} ${active ? s.regionItemActive : ""}`}
                  style={active ? { borderColor: c } : undefined}
                  onClick={() => setSelectedId(it.id)}
                >
                  <span className={s.regionDot} style={{ background: c }} />
                  <span className={s.regionItemName}>{it.name}</span>
                  <span className={s.regionItemPlace}>{it.region}</span>
                  {it.status === "soldout" && (
                    <span className={s.regionItemTag}>품절</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
