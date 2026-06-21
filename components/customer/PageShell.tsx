import type { Branding, MenuPage } from "@/lib/types";
import s from "./customer.module.css";

export interface DeckTab {
  id: string;
  label: string;
  index: number; // 이 섹션의 첫 렌더 페이지 인덱스
}

export interface DeckNav {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
  tabs: DeckTab[];
  activeTabId?: string;
}

export function PageShell({
  page,
  nav,
  branding,
  showTitleBand,
  children,
}: {
  page: MenuPage;
  nav: DeckNav;
  branding?: Branding;
  showTitleBand?: boolean;
  children: React.ReactNode;
}) {
  // 표지는 크롬 없이 풀블리드 — 탭/화살표로 다음(메뉴)으로
  if (page.type === "cover") {
    return (
      <div
        className={s.frame}
        style={{ position: "relative", cursor: "pointer" }}
        onClick={nav.onNext}
      >
        {children}
        {nav.index < nav.total - 1 && (
          <button
            className={`${s.arrow} ${s.arrowRight}`}
            onClick={(e) => {
              e.stopPropagation();
              nav.onNext();
            }}
            aria-label="다음 페이지"
          >
            ›
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={s.frame} style={{ position: "relative" }}>
      <header className={s.header}>
        {branding?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.logoImg} src={branding.logoUrl} alt="THE HAND" />
        ) : (
          <div className={s.logoMark}>手</div>
        )}
        <div className={s.logoText}>
          <span className={s.brand}>THE HAND</span>
          <span className={s.brandSub}>사케 바 · 디지털 메뉴판</span>
        </div>
        {page.sectionTag && <span className={s.sectionTag}>{page.sectionTag}</span>}
      </header>

      {nav.tabs.length > 1 && (
        <nav className={s.tabBar} aria-label="메뉴 섹션">
          {nav.tabs.map((t) => (
            <button
              key={t.id}
              className={`${s.tab} ${t.id === nav.activeTabId ? s.tabActive : ""}`}
              onClick={() => nav.onDot(t.index)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

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
