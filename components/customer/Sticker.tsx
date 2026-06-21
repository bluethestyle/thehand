import type { Sticker } from "@/lib/types";
import { stickerColor } from "@/lib/format";
import s from "./customer.module.css";

export function StickerView({ sticker }: { sticker: Sticker }) {
  const c = stickerColor(sticker.color);
  const pos: React.CSSProperties = {
    left: `${sticker.xPct}%`,
    top: `${sticker.yPct}%`,
    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
    zIndex: sticker.z,
  };

  switch (sticker.kind) {
    case "ribbon":
      return (
        <div
          className={`${s.sticker} ${s.stRibbon}`}
          style={{ ...pos, background: c.fill, color: c.text }}
        >
          {sticker.text}
        </div>
      );
    case "pill":
      return (
        <div
          className={`${s.sticker} ${s.stPill}`}
          style={{
            ...pos,
            background: c.fill,
            color: c.text,
            borderColor: c.border ?? "transparent",
          }}
        >
          {sticker.text}
        </div>
      );
    case "badge":
      return (
        <div
          className={`${s.sticker} ${s.stBadge}`}
          style={{ ...pos, background: c.fill, color: c.text }}
        >
          {sticker.text}
        </div>
      );
    case "circle":
      return (
        <div
          className={`${s.sticker} ${s.stCircle}`}
          style={{ ...pos, background: c.fill, color: c.text }}
        >
          <div>
            <div className={s.stCircleTop}>{sticker.text}</div>
            {sticker.subText && (
              <div className={s.stCircleBig}>{sticker.subText}</div>
            )}
          </div>
        </div>
      );
    case "priceCard":
      return (
        <div className={`${s.sticker} ${s.stPriceCard}`} style={pos}>
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
        <div
          className={`${s.sticker} ${s.stBadge}`}
          style={{ ...pos, background: "#fff", color: "var(--c-text)" }}
        >
          {sticker.text}
        </div>
      );
  }
}
