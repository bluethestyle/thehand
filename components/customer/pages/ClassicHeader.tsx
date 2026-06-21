import h from "./classic-header.module.css";

/**
 * 피그마 v2 공통 클래식 헤더.
 * THE HAND / [한자 + 한글 병기] (좌우 괘선) / 부제
 */
export function ClassicHeader({
  ja,
  ko,
  subtitle,
}: {
  ja?: string | null; // 日本酒 (없으면 한글만 크게)
  ko: string; // 니혼슈
  subtitle?: string | null;
}) {
  return (
    <header className={h.head}>
      <div className={h.brand}>THE HAND</div>
      <div className={h.titleRow}>
        <span className={h.rule} />
        <h2 className={h.title}>
          {ja ? (
            <>
              <span className={h.ja}>{ja}</span>
              <span className={h.ko}>{ko}</span>
            </>
          ) : (
            <span className={h.jaSolo}>{ko}</span>
          )}
        </h2>
        <span className={h.rule} />
      </div>
      {subtitle && <p className={h.sub}>{subtitle}</p>}
    </header>
  );
}
