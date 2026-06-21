import Link from "next/link";
import { AdminFrame } from "@/components/admin/AdminFrame";
import f from "@/components/admin/admin-v2.module.css";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin/branding", title: "로고 · 브랜딩", sub: "메뉴판 로고 마크 교체" },
  { href: "/admin/password", title: "PIN · 비밀번호", sub: "관리자 접속 비밀번호 변경" },
  { href: "/admin/density", title: "표시 밀도 · 글자 크기", sub: "한 화면 항목 수 / 글자 비율" },
];

export default function AdminSettings() {
  return (
    <AdminFrame tab="settings">
      <div className={f.pageHead}>
        <div>
          <div className={f.pageTitle}>영업 정보</div>
          <div className={f.pageSub}>로고 · 비밀번호 · 표시 설정</div>
        </div>
      </div>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={f.card} style={{ display: "block", textDecoration: "none" }}>
          <div className={f.cardTitle} style={{ margin: 0 }}>
            {l.title}
          </div>
          <div className={f.pageSub}>{l.sub}</div>
        </Link>
      ))}
    </AdminFrame>
  );
}
