import type { MenuPage } from "@/lib/types";
import s from "./customer.module.css";

export interface DeckNav {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}

export function PageShell({
  page,
  nav,
  showTitleBand,
  children,
}: {
  page: MenuPage;
  nav: DeckNav;
  showTitleBand?: boolean;
  children: React.ReactNode;
}) {
  // 표지는 크롬 없이 풀블리드
  if (page.type === "cover") {
    return <div className={s.frame}>{children}</div>;
  }

  return (
    <div className={s.frame} style={{ position: "relative" }}>
      <header className={s.header}>
        <div className={s.logoMark}>手</div>
        <div className={s.logoText}>
          <span className={s.brand}>THE HAND</span>
          <span className={s.brandSub}>사케 바 · 디지털 메뉴판</span>
        </div>
        {page.sectionTag && <span className={s.sectionTag}>{page.sectionTag}</span>}
      </header>

      {showTitleBand && (page.title || page.subtitle) && (
        <div className={s.titleBand}>
          {page.title && <h2>{page.title}</h2>}
          {page.subtitle && <p>{page.subtitle}</p>}
        </div>
      )}

      {children}

      <button
        className={`${s.arrow} ${s.arrowLeft}`}
        onClick={nav.onPrev}
        disabled={nav.index === 0}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      <button
        className={`${s.arrow} ${s.arrowRight}`}
        onClick={nav.onNext}
        disabled={nav.index === nav.total - 1}
        aria-label="다음 페이지"
      >
        ›
      </button>

      <footer className={s.pager}>
        <span className={s.pagerHint}>← 좌우로 넘기기</span>
        <div className={s.dots}>
          {Array.from({ length: nav.total }).map((_, i) => (
            <button
              key={i}
              className={`${s.dot} ${i === nav.index ? s.dotActive : ""}`}
              onClick={() => nav.onDot(i)}
              aria-label={`${i + 1}번째 페이지`}
            />
          ))}
        </div>
        <span className={s.counter}>
          {nav.index + 1} / {nav.total}
        </span>
      </footer>
    </div>
  );
}
