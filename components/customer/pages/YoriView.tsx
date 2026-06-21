import type { CategoryBand, MenuItem, RenderedPage } from "@/lib/types";
import { groupByBand } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { ClassicHeader } from "./ClassicHeader";
import s from "./yori.module.css";

type Pill = { label: string; bg: string; color: string };

function pillOf(item: MenuItem): Pill | null {
  if (item.badge === "NEW") return { label: "NEW", bg: "#f39c12", color: "#2d3436" };
  if (item.badge === "계절한정") return { label: "계절", bg: "#e2f1ee", color: "#1f7a6e" };
  if (item.badge === "추천" || item.featured) return { label: "추천", bg: "#fbf1dc", color: "#a9761c" };
  return null;
}

function YoriRow({ item }: { item: MenuItem }) {
  const pill = pillOf(item);
  return (
    <div className={s.row}>
      <div className={s.body}>
        <div className={s.nameRow}>
          <span className={s.name}>{item.name}</span>
          {item.originNote && <span className={s.origin}>({item.originNote})</span>}
          {pill && (
            <span className={s.pill} style={{ background: pill.bg, color: pill.color }}>
              {pill.label}
            </span>
          )}
        </div>
        {item.description && <div className={s.desc}>{item.description}</div>}
      </div>
      <div className={s.priceWrap}>
        <div className={s.price}>{formatPrice(item.priceGlass)}</div>
        {item.halfPrice != null && (
          <div className={s.half}>½ 하프 {formatPrice(item.halfPrice)}</div>
        )}
      </div>
    </div>
  );
}

export function YoriView({
  rendered,
  bands,
}: {
  rendered: RenderedPage;
  bands?: CategoryBand[];
}) {
  const page = rendered.source;
  const groups = groupByBand(rendered.items ?? [], bands);
  const isYori = page.categoryKey === "yori";

  return (
    <>
      <ClassicHeader ja={page.sectionTag} ko={page.title ?? "요리"} subtitle={page.subtitle} />
      <div className={s.wrap}>
        {groups.map((g, gi) => (
          <div key={g.band?.key ?? `orphan-${gi}`}>
            {g.band && <div className={s.band}>{g.band.ja || g.band.ko}</div>}
            {g.band && <div className={s.bandRule} />}
            {g.items.map((item) => (
              <YoriRow key={item.id} item={item} />
            ))}
          </div>
        ))}
        {isYori && (
          <>
            <div className={s.allergyBox}>알레르기가 있으시면 주문 전 직원에게 꼭 문의해 주세요</div>
            <div className={s.footNote}>
              ∗ 자세한 원산지 표기는 메뉴판 마지막 「원산지 표기」 페이지를 확인해 주세요 ∗
            </div>
          </>
        )}
      </div>
    </>
  );
}
