import type { CategoryBand, MenuItem, RenderedPage } from "@/lib/types";
import { groupByBand } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { ClassicHeader } from "./ClassicHeader";
import s from "./nihonshu.module.css";

function specLine(it: MenuItem): string {
  const parts: string[] = [];
  if (it.polish != null) parts.push(`정미보합 ${it.polish}%`);
  if (it.smv) parts.push(`일본주도 ${it.smv}`);
  if (it.acidity) parts.push(`산도 ${it.acidity}`);
  if (it.abv != null) parts.push(`도수 ${it.abv}%`);
  return parts.join(" · ");
}

function PriceCol({ label, vol, value }: { label: string; vol: string; value: number | null | undefined }) {
  return (
    <div className={s.priceCol}>
      <div className={s.pLabel}>{label}</div>
      <div className={s.pVol}>{vol}</div>
      <div className={`${s.pVal} ${value == null ? s.pNone : ""}`}>{formatPrice(value)}</div>
    </div>
  );
}

function SakeRow({ item }: { item: MenuItem }) {
  const soldout = item.status === "soldout";
  const spec = specLine(item);
  return (
    <div className={`${s.row} ${soldout ? s.rowSoldout : ""}`}>
      <div className={s.thumb}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} />
        ) : (
          "보틀"
        )}
      </div>

      <div className={s.body}>
        <div className={s.nameRow}>
          {item.featured && <span className={s.star}>★</span>}
          <span className={`${s.name} ${item.featured ? s.nameHl : ""}`}>{item.name}</span>
          {item.region && <span className={s.region}>({item.region})</span>}
          {item.badge === "NEW" && <span className={s.newBadge}>NEW</span>}
          {soldout && <span className={s.soldoutPill}>일시 품절</span>}
        </div>
        {item.brewery && <div className={s.brewery}>{item.brewery}</div>}
        {item.description && <div className={s.desc}>{item.description}</div>}
        {item.sommelier && (
          <div className={s.somm}>
            <span className={s.sommTag}>소믈리에</span>
            <span className={s.sommText}>{item.sommelier}</span>
          </div>
        )}
        {item.pairing && (
          <div className={s.pairing}>
            <span className={s.pairingLabel}>추천 페어링</span>
            {item.pairing}
          </div>
        )}
        {spec && <div className={s.spec}>{spec}</div>}
      </div>

      <div className={s.priceWrap}>
        <div className={s.price}>
          <PriceCol label="잔술" vol="100㎖" value={item.priceGlass} />
          <PriceCol label="도쿠리" vol="300㎖" value={item.priceTokkuri} />
          <PriceCol label="보틀" vol="720㎖" value={item.priceBottle} />
        </div>
        <div className={s.flags}>
          {item.flagNote && item.flagNote !== "여름 한정" && (
            <span className={`${s.flag} ${s.flagMuted}`}>{item.flagNote}</span>
          )}
          {item.heatable && <span className={`${s.flag} ${s.flagHeat}`}>♨ 데움(아츠캉) 가능</span>}
          {item.flagNote === "여름 한정" && (
            <span className={`${s.flag} ${s.flagSeason}`}>여름 한정</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NihonshuView({
  rendered,
  bands,
}: {
  rendered: RenderedPage;
  bands?: CategoryBand[];
}) {
  const page = rendered.source;
  const groups = groupByBand(rendered.items ?? [], bands);

  return (
    <>
      <ClassicHeader ja={page.sectionTag} ko={page.title ?? "니혼슈"} subtitle={page.subtitle} />
      <div className={s.wrap}>
        {groups.map((g, gi) => (
          <div key={g.band?.key ?? `orphan-${gi}`}>
            {g.band && (
              <div className={s.band}>
                <span className={s.bandKo}>{g.band.ko}</span>
                <span className={s.bandJa}>{g.band.ja}</span>
                <span className={s.bandNote}>{g.band.note}</span>
              </div>
            )}
            {g.band && <div className={s.bandRule} />}
            {g.items.map((item) => (
              <SakeRow key={item.id} item={item} />
            ))}
          </div>
        ))}
        <div className={s.footNote}>
          ∗ 모든 사케는 차게 제공됩니다 · 데움(아츠캉)은 ♨ 표시 메뉴만 가능 ∗
        </div>
      </div>
    </>
  );
}
