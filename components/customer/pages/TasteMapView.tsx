"use client";
import { useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { styleMeta } from "@/lib/format";
import s from "../customer.module.css";

const HILITE_DEFAULT = "#8b6f47";

export function TasteMapView({ items }: { items: MenuItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapped = useMemo(
    () =>
      items
        .filter((it) => it.mapX != null && it.mapY != null && it.status !== "closed")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const selected = mapped.find((it) => it.id === selectedId) ?? null;

  return (
    <div className={s.regionPage}>
      <div className={s.regionMapBox}>
        <div className={s.plotCard}>
          <div className={s.plot}>
            <span className={`${s.axis} ${s.axisTop}`}>향이 화려·프레시 ▲</span>
            <span className={`${s.axis} ${s.axisBottom}`}>▼ 향이 은은·안정적</span>
            <span className={`${s.axis} ${s.axisLeft}`}>◀ 맛이 달콤</span>
            <span className={`${s.axis} ${s.axisRight}`}>맛이 깔끔 ▶</span>
            {mapped.map((it, i) => {
              const meta = styleMeta(it.style);
              const color = meta?.color ?? HILITE_DEFAULT;
              const soldout = it.status === "soldout";
              const active = it.id === selectedId;
              const dim = selectedId != null && !active;
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
                    transform: `translate(-50%, -50%) scale(${active ? 1.5 : 1})`,
                    opacity: dim ? 0.28 : 1,
                    boxShadow: active ? `0 0 0 5px ${color}33` : undefined,
                    zIndex: active ? 6 : 1,
                    transition: "transform .15s, opacity .15s, box-shadow .15s",
                  }}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </div>
        <div className={s.regionSelCaption}>
          {selected ? (
            <>
              <span style={{ color: styleMeta(selected.style)?.color ?? HILITE_DEFAULT }}>●</span>{" "}
              {selected.name}
              {selected.region && <span className={s.region}> · {selected.region}</span>}
            </>
          ) : (
            "아래에서 술을 선택하면 취향 좌표가 강조됩니다"
          )}
        </div>
      </div>

      <div className={s.regionList}>
        {mapped.map((it, i) => {
          const color = styleMeta(it.style)?.color ?? HILITE_DEFAULT;
          const active = it.id === selectedId;
          const soldout = it.status === "soldout";
          return (
            <button
              key={it.id}
              className={`${s.regionItem} ${active ? s.regionItemActive : ""}`}
              style={active ? { borderColor: color } : undefined}
              onClick={() => setSelectedId(active ? null : it.id)}
            >
              <span
                className={`${s.legendNum} ${soldout ? s.nodeOut : ""}`}
                style={{ background: color, borderColor: color, color: soldout ? color : "#fff" }}
              >
                {i + 1}
              </span>
              <span className={s.regionItemName}>{it.name}</span>
              {it.region && <span className={s.regionItemPlace}>{it.region}</span>}
              {soldout && <span className={s.regionItemTag}>품절</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
