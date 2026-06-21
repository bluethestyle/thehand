"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "./admin.module.css";

export function AdminShell({
  title,
  banner,
  children,
}: {
  title: string;
  banner?: { main: string; sub?: string };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }

  const nav = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <div className={s.root}>
      <header className={s.topbar}>
        <div className={s.logoMark}>手</div>
        <div className={s.titleBlock}>
          <span className={s.mode}>관리자 모드</span>
          <span className={s.title}>{title}</span>
        </div>
        <div className={s.topActions}>
          <button className={s.doneBtn} onClick={() => (window.location.href = "/")}>
            완료 ✓
          </button>
          <button
            className={s.moreBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="더보기"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className={s.menu} onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => nav("/admin")}>페이지 보드</button>
              <button onClick={() => nav("/admin/items")}>메뉴 항목 관리</button>
              <button onClick={() => nav("/admin/density")}>표시 밀도 · 글자 크기</button>
              <button onClick={() => nav("/admin/branding")}>로고 · 브랜딩</button>
              <button onClick={() => nav("/admin/password")}>비밀번호 변경</button>
              <button onClick={() => (window.location.href = "/")}>손님 화면 보기</button>
              <button onClick={logout}>로그아웃</button>
            </div>
          )}
        </div>
      </header>

      {banner && (
        <div className={s.banner}>
          <span className={s.bannerMain}>{banner.main}</span>
          {banner.sub && <span className={s.bannerSub}>{banner.sub}</span>}
        </div>
      )}

      <div className={s.scroll}>
        <div className={s.scrollWrap}>{children}</div>
      </div>
    </div>
  );
}

/** 간단 토스트 훅 */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 1800);
  };
  const node = msg ? <div className={s.toast}>{msg}</div> : null;
  return { show, node };
}
