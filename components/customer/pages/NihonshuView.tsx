"use client";
import { useMemo, useState } from "react";
import type { MenuItem, RenderedPage, SakeStyle } from "@/lib/types";
import { STYLE_META } from "@/lib/format";
import { PriceUnitChip } from "../PriceUnitChip";
import s from "../customer.module.css";

const STYLE_ORDER: SakeStyle[] = ["kunshu", "soshu", "junshu", "jukushu"];
// 4색 칩의 2×2 사분면 위치
const QUADRANT: Record<SakeStyle, number> = { kunshu: 0, soshu: 1, junshu: 2, jukushu: 3 };

function flagsOf(it: MenuItem): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = [];
  if (it.status === "soldout") out.push({ text: "일시 품절", color: "#A39A8B" });
  if (it.flagNote === "여름 한정") out.push({ text: "여름 한정", color: "#1F8A8C" });
  else if (it.flagNote) out.push({ text: it.flagNote, color: "#8A7F6E" });
  if (it.heatable) out.push({ text: "♨ 데움 가능", color: "#C0560F" });
  return out;
}

function SakeRow({ item }: { item: MenuItem }) {
  const meta = STYLE_META[item.style ?? "kunshu"];
  const color = meta?.color ?? "#8b6f47";
  const flags = flagsOf(item);
  return (
    <div className={s.nrow}>
      <span className={s.nrowBar} style={{ background: color }} />
      <div className={s.nthumb}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          "보틀"
        )}
      </div>
      <div className={s.nbody}>
        <div className={s.nhead}>
          {item.featured && <span className={s.featuredStar}>★</span>}
          <span className={s.nname}>
            {item.featured ? <span className={s.nameHi}>{item.name}</span> : item.name}
          </span>
          {item.region && <span className={s.nregion}>({item.region})</span>}
          {item.badge === "NEW" && <span className={s.newSup}>NEW</span>}
        </div>
        <div className={s.nmetaRow}>
          {meta && (
            <span className={s.nstylePill} style={{ background: color }}>
              <span className={s.nstyleDot} />
              {meta.ko}
            </span>
          )}
          <span className={s.ngrade}>
            {[item.grade, item.brewery].filter(Boolean).join(" · ")}
          </span>
        </div>
        {item.description && <div className={s.ndesc}>{item.description}</div>}
      </div>
      <div className={s.nprice}>
        <div className={s.nchips}>
          <PriceUnitChip unit="glass" price={item.priceGlass} />
          <PriceUnitChip unit="tokkuri" price={item.priceTokkuri} />
          <PriceUnitChip unit="bottle" price={item.priceBottle} />
        </div>
        {flags.length > 0 && (
          <div className={s.nflags}>
            {flags.map((f) => (
              <span key={f.text} className={s.nflag} style={{ color: f.color, borderColor: f.color }}>
                {f.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NihonshuView({ rendered }: { rendered: RenderedPage }) {
  const [active, setActive] = useState<SakeStyle | null>(null);

  const ordered = useMemo(() => {
    const items = rendered.items ?? [];
    return [...items].sort((a, b) => {
      const sa = STYLE_ORDER.indexOf(a.style ?? "jukushu");
      const sb = STYLE_ORDER.indexOf(b.style ?? "jukushu");
      return sa - sb || a.sortOrder - b.sortOrder;
    });
  }, [rendered.items]);

  const shown = active ? ordered.filter((it) => it.style === active) : ordered;

  return (
    <div className={s.content}>
      <div className={s.nTitle}>
        <div className={s.nTitleMain}>
          <span className={s.nTitleRule} />
          日本酒
          <span className={s.nTitleRule} />
        </div>
        <div className={s.nTitleSub}>지역·등급으로 고르는 사케 · 모두 차게 제공</div>
        <div className={s.nTitleHint}>색으로 고르는 4가지 스타일</div>
      </div>

      <div className={s.nChipRow}>
        {STYLE_ORDER.map((st) => {
          const meta = STYLE_META[st];
          const on = active === st;
          return (
            <button
              key={st}
              className={`${s.nChip} ${on ? s.nChipOn : ""}`}
              style={{ background: meta.color, opacity: active && !on ? 0.4 : 1 }}
              onClick={() => setActive(on ? null : st)}
            >
              <span className={s.nChipQuad}>
                {[0, 1, 2, 3].map((q) => (
                  <span
                    key={q}
                    style={{
                      background: q === QUADRANT[st] ? "#fff" : "rgba(255,255,255,0.35)",
                    }}
                  />
                ))}
              </span>
              <span className={s.nChipLabel}>{meta.ko}</span>
              <span className={s.nChipHint}>{meta.hint}</span>
            </button>
          );
        })}
      </div>

      <div>
        {shown.map((item) => (
          <SakeRow key={item.id} item={item} />
        ))}
      </div>

      <div className={s.nFootNote}>
        ∗ 모든 사케는 차게 제공됩니다 · 데움(아츠캉)은 ♨ 표시 메뉴만 가능 ∗
      </div>
    </div>
  );
}
