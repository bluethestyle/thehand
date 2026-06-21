import type { MenuPage, OriginRow } from "@/lib/types";
import { ClassicHeader } from "./ClassicHeader";
import s from "./origin-notice.module.css";

export function OriginNoticeView({
  page,
  origins,
}: {
  page: MenuPage;
  origins?: OriginRow[];
}) {
  const rows = (origins ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <>
      <ClassicHeader ko={page.title ?? "원산지 표기"} subtitle={page.subtitle} />
      <div className={s.wrap}>
        <div className={s.list}>
          {rows.map((r) => (
            <div key={r.id} className={s.row}>
              <span className={s.ing}>{r.ingredient}</span>
              <span className={s.leader} />
              <span className={s.origin}>{r.origin}</span>
            </div>
          ))}
        </div>
        <div className={s.footNote}>
          ∗ 수급 상황에 따라 원산지가 변경될 수 있으며, 변경 시 즉시 수정 표기합니다 ∗
        </div>
      </div>
    </>
  );
}
