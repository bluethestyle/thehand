import type { Sticker } from "@/lib/types";
import { stickerColor } from "@/lib/format";
import s from "./customer.module.css";

/** 스티커 비주얼(모양/색/내용)만. 위치/회전/그림자는 감싸는 쪽에서. */
export function StickerBody({ sticker }: { sticker: Sticker }) {
  const c = stickerColor(sticker.color);
  switch (sticker.kind) {
    case "ribbon":
      return (
        <div className={s.stRibbon} style={{ background: c.fill, color: c.text }}>
          {sticker.text}
        </div>
      );
    case "pill":
      return (
        <div
          className={s.stPill}
          style={{ background: c.fill, color: c.text, borderColor: c.border ?? "transparent" }}
        >
          {sticker.text}
        </div>
      );
    case "badge":
      return (
        <div className={s.stBadge} style={{ background: c.fill, color: c.text }}>
          {sticker.text}
        </div>
      );
    case "circle":
      return (
        <div className={s.stCircle} style={{ background: c.fill, color: c.text }}>
          <div>
            <div className={s.stCircleTop}>{sticker.text}</div>
            {sticker.subText && <div className={s.stCircleBig}>{sticker.subText}</div>}
          </div>
        </div>
      );
    case "priceCard":
      return (
        <div className={s.stPriceCard}>
          <div className={s.stPriceTitle}>{sticker.text}</div>
          {sticker.subText && <div className={s.stPriceSub}>{sticker.subText}</div>}
          {sticker.lines?.map((ln, i) => (
            <div key={i} className={s.stPriceLine}>
              <span>{ln.label}</span>
              <span>{ln.value}</span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className={s.stBadge} style={{ background: "#fff", color: "var(--c-text)" }}>
          {sticker.text}
        </div>
      );
  }
}

/** 위치/회전/크기까지 적용된 손님 화면용 스티커. */
export function StickerView({ sticker }: { sticker: Sticker }) {
  const isCard = sticker.kind === "priceCard";
  return (
    <div
      className={s.sticker}
      style={{
        left: `${sticker.xPct}%`,
        top: `${sticker.yPct}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        zIndex: sticker.z,
        filter: isCard ? "none" : undefined,
      }}
    >
      <StickerBody sticker={sticker} />
    </div>
  );
}
