import type { CategoryBand, MenuItem, RenderedPage } from "@/lib/types";
import { groupByBand } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { PriceUnitChip } from "../PriceUnitChip";
import s from "../customer.module.css";

type Unit = "glass" | "tokkuri" | "bottle";

// 카테고리별 가격 표시 방식
const UNIT_SETS: Record<string, Unit[]> = {
  nihonshu: ["glass", "tokkuri", "bottle"],
  shochu: ["glass", "bottle"], // 쇼츄: 잔 + 보틀(키핑)
};
const SINGLE_PRICE_CATEGORIES = new Set(["yori", "drinks"]); // 요리·음료: 단일가

function rightNote(item: MenuItem): { text: string; color: string } | null {
  if (item.heatable) return { text: "♨ 데움 가능", color: "#c0560f" };
  if (item.flagNote === "여름 한정") return { text: "여름 한정", color: "#1f8a8c" };
  if (item.flagNote) return { text: item.flagNote, color: "#8a7f6e" };
  return null;
}

function SakeRow({
  item,
  single,
  units,
}: {
  item: MenuItem;
  single: boolean;
  units: Unit[];
}) {
  const note = rightNote(item);
  return (
    <div className={s.row}>
      {!single && (
        <div className={s.thumb}>
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} />
          ) : (
            "보틀"
          )}
        </div>
      )}
      <div className={s.rowBody}>
        <div className={s.rowHead}>
          {item.featured && <span className={s.featuredStar}>★</span>}
          <span className={s.name}>
            {item.featured ? <span className={s.nameHi}>{item.name}</span> : item.name}
          </span>
          {item.region && <span className={s.region}>({item.region})</span>}
          {item.badge === "NEW" && <span className={s.newSup}>NEW</span>}
          {item.status === "soldout" && (
            <span className={s.soldoutPill}>일시 품절</span>
          )}
        </div>
        {item.brewery && <div className={s.brewery}>{item.brewery}</div>}
        {item.description && <div className={s.desc}>{item.description}</div>}
        {note && (
          <div
            className={s.flagNote}
            style={{ color: note.color, textAlign: "right" }}
          >
            {note.text}
          </div>
        )}
      </div>
      {single ? (
        <div className={s.singlePrice}>{formatPrice(item.priceGlass)}</div>
      ) : (
        <div className={s.prices}>
          {units.includes("glass") && (
            <PriceUnitChip unit="glass" price={item.priceGlass} />
          )}
          {units.includes("tokkuri") && (
            <PriceUnitChip unit="tokkuri" price={item.priceTokkuri} />
          )}
          {units.includes("bottle") && (
            <PriceUnitChip unit="bottle" price={item.priceBottle} />
          )}
        </div>
      )}
    </div>
  );
}

export function MenuPageView({
  rendered,
  bands,
}: {
  rendered: RenderedPage;
  bands: CategoryBand[] | undefined;
}) {
  const items = rendered.items ?? [];
  const cat = rendered.source.categoryKey ?? "";
  const single = SINGLE_PRICE_CATEGORIES.has(cat);
  const units = UNIT_SETS[cat] ?? ["glass", "tokkuri", "bottle"];

  if (items.length === 0) {
    return (
      <div className={s.emptyMenu}>
        <div style={{ fontSize: 26 }}>🗒️</div>
        <div>메뉴 준비 중</div>
        <div style={{ fontSize: 12, color: "var(--c-faint)" }}>
          관리자 화면에서 항목을 추가하세요
        </div>
      </div>
    );
  }

  const groups = groupByBand(items, bands);

  return (
    <div className={s.content}>
      {groups.map((g, i) => (
        <div key={g.band?.key ?? `g-${i}`}>
          {g.band && (
            <div className={s.bandHeader}>
              <span className={s.bandJa}>{g.band.ja}</span>
              <span className={s.bandKo}>{g.band.ko}</span>
              <span className={s.bandNote}>{g.band.note}</span>
            </div>
          )}
          {g.items.map((item) => (
            <SakeRow key={item.id} item={item} single={single} units={units} />
          ))}
        </div>
      ))}
    </div>
  );
}
