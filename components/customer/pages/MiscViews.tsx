import type { MenuPage } from "@/lib/types";
import s from "../customer.module.css";

export function CoverView({
  page,
  logoUrl,
}: {
  page: MenuPage;
  logoUrl?: string | null;
}) {
  return (
    <div className={s.cover}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.coverLogoImg} src={logoUrl} alt="THE HAND" />
      ) : (
        <div className={s.coverMark}>手</div>
      )}
      <div className={s.coverBrand}>THE HAND</div>
      <div className={s.coverRule} />
      <div className={s.coverSub}>{page.subtitle ?? "사케 바 · 디지털 메뉴판"}</div>
      <div className={s.coverHint}>화면을 넘기거나 탭해서 메뉴 보기 →</div>
    </div>
  );
}

// 원산지 표기 (식품위생법 의무 표기) — 원본 디자인(admin-03-wonsanji) 기준
const ORIGINS: { ingredient: string; origin: string }[] = [
  { ingredient: "쌀", origin: "국내산" },
  { ingredient: "광어", origin: "국내산(양식)" },
  { ingredient: "한치", origin: "국내산" },
  { ingredient: "소고기(와규)", origin: "호주산" },
  { ingredient: "새우", origin: "베트남산" },
  { ingredient: "메밀", origin: "중국산" },
  { ingredient: "배추김치", origin: "배추 국내산 · 고춧가루 중국산" },
  { ingredient: "가지", origin: "국내산" },
];

export function NoticeView() {
  return (
    <div className={s.content}>
      <div className={s.originTable}>
        <div className={`${s.originRow} ${s.originHead}`}>
          <span className={s.originName}>재료</span>
          <span className={s.originPlace}>원산지</span>
        </div>
        {ORIGINS.map((o) => (
          <div key={o.ingredient} className={s.originRow}>
            <span className={s.originName}>{o.ingredient}</span>
            <span className={s.originPlace}>{o.origin}</span>
          </div>
        ))}
      </div>
      <p className={s.originNote}>
        ∗ 수급 상황에 따라 원산지가 변경될 수 있으며, 변경 시 즉시 수정 표기합니다 ∗
      </p>
      <p className={s.originFoot}>∗ 주류 필수 주문 ∗</p>
    </div>
  );
}
