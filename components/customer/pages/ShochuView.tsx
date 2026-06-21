import type { MenuItem, RenderedPage } from "@/lib/types";
import { formatPrice, ingredientColor } from "@/lib/format";
import { ClassicHeader } from "./ClassicHeader";
import s from "./shochu.module.css";

function ShochuRow({ item }: { item: MenuItem }) {
  const soldout = item.status === "soldout";
  const color = ingredientColor(item.ingredient);
  const meta = [item.region, item.brewery].filter(Boolean).join(" · ");
  return (
    <div className={`${s.row} ${soldout ? s.rowSoldout : ""}`}>
      <span className={s.bar} style={{ background: color }} />
      <div className={s.body}>
        <div className={s.name}>{item.name}</div>
        <div className={s.metaRow}>
          {item.ingredient && (
            <span className={s.pill} style={{ background: color }}>
              <span className={s.pillDot} />
              {item.ingredient}
            </span>
          )}
          {meta && <span className={s.meta}>{meta}</span>}
        </div>
        {item.description && <div className={s.desc}>{item.description}</div>}
        {item.flagNote && <div className={s.flag}>{item.flagNote}</div>}
      </div>
      <div className={s.price}>
        <div className={s.priceCol}>
          <div className={s.pLabel}>잔 80㎖</div>
          <div className={`${s.pVal} ${item.priceGlass == null ? s.pNone : ""}`}>
            {formatPrice(item.priceGlass)}
          </div>
        </div>
        <div className={`${s.priceCol} ${s.priceColDivide}`}>
          <div className={s.pLabel}>보틀</div>
          <div className={`${s.pVal} ${item.priceBottle == null ? s.pNone : ""}`}>
            {formatPrice(item.priceBottle)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShochuView({ rendered }: { rendered: RenderedPage }) {
  const page = rendered.source;
  const items = rendered.items ?? [];
  return (
    <>
      <ClassicHeader ja={page.sectionTag} ko={page.title ?? "쇼츄"} subtitle={page.subtitle} />
      <div className={s.wrap}>
        {items.map((item) => (
          <ShochuRow key={item.id} item={item} />
        ))}
        <div className={s.footNote}>
          ∗ 얼음·탄산수·따뜻한 물 등 취향껏 즐기세요 ∗
        </div>
      </div>
    </>
  );
}
