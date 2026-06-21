import Link from "next/link";
import { getMenuData } from "@/lib/data";
import { AdminFrame } from "@/components/admin/AdminFrame";
import f from "@/components/admin/admin-v2.module.css";

export const dynamic = "force-dynamic";

export default async function AdminNotices() {
  const data = await getMenuData();
  const pages = data.pages
    .filter((p) => p.type === "image" || p.type === "event")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AdminFrame tab="notices">
      <div className={f.pageHead}>
        <div>
          <div className={f.pageTitle}>공지 · 이벤트</div>
          <div className={f.pageSub}>한정주 · 이벤트 등 스티커 페이지 · 새 페이지는 ‘페이지·순서’에서 추가</div>
        </div>
      </div>
      {pages.length === 0 && (
        <div className={f.card}>
          <div className={f.pageSub}>아직 이미지·이벤트 페이지가 없습니다. ‘페이지·순서’ 탭에서 추가하세요.</div>
        </div>
      )}
      {pages.map((p) => (
        <Link
          key={p.id}
          href={`/admin/page/${p.id}/stickers`}
          className={f.card}
          style={{ display: "block", textDecoration: "none" }}
        >
          <div className={f.cardTitle} style={{ margin: 0 }}>
            {p.title}
            {p.isHidden ? " · (숨김)" : ""}
          </div>
          <div className={f.pageSub}>
            {p.type === "event" ? "이벤트" : "이미지"} · 스티커 {p.stickers?.length ?? 0}개 · 탭하여 편집
          </div>
        </Link>
      ))}
    </AdminFrame>
  );
}
