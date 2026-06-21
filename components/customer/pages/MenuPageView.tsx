import type { CategoryBand, MenuItem, RenderedPage } from "@/lib/types";
import { groupByBand } from "@/lib/menu";
import { PriceUnitChip } from "../PriceUnitChip";
import s from "../customer.module.css";

function rightNote(item: MenuItem): { text: string; color: string } | null {
  if (item.heatable) return { text: "♨ 데움 가능", color: "#c0560f" };
  if (item.flagNote === "여름 한정") return { text: "여름 한정", color: "#1f8a8c" };
  if (item.flagNote) return { text: item.flagNote, color: "#8a7f6e" };
  return null;
}

function SakeRow({ item }: { item: MenuItem }) {
  const note = rightNote(item);
  return (
    <div className={s.row}>
      <div className={s.thumb}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          "보틀"
        )}
      </div>
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
      <div className={s.prices}>
        <PriceUnitChip unit="glass" price={item.priceGlass} />
        <PriceUnitChip unit="tokkuri" price={item.priceTokkuri} />
        <PriceUnitChip unit="bottle" price={item.priceBottle} />
      </div>
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
            <SakeRow key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}
