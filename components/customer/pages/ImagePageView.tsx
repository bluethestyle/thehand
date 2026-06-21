import type { MenuPage } from "@/lib/types";
import { StickerView } from "../Sticker";
import { ImagePlaceholderIcon } from "../icons";
import s from "../customer.module.css";

export function ImagePageView({ page }: { page: MenuPage }) {
  const stickers = page.stickers ?? [];
  return (
    <div className={s.contentFlush}>
      <div className={s.imageStage}>
        {page.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.imageReal} src={page.imageUrl} alt={page.title ?? ""} />
        ) : (
          <div className={s.imageDrop}>
            <ImagePlaceholderIcon size={84} />
            <span>{page.title} 이미지</span>
          </div>
        )}
        <div className={s.stickerLayer}>
          {stickers.map((st) => (
            <StickerView key={st.id} sticker={st} />
          ))}
        </div>
      </div>
    </div>
  );
}
