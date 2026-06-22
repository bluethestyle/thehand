"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "./admin-v2.module.css";

export type AdminTab = "menu" | "pages" | "origins" | "notices" | "settings";

const TABS: { key: AdminTab; label: string; href: string }[] = [
  { key: "menu", label: "메뉴 관리", href: "/admin/items" },
  { key: "pages", label: "페이지·순서", href: "/admin" },
  { key: "origins", label: "원산지", href: "/admin/origins" },
  { key: "notices", label: "공지·이벤트", href: "/admin/notices" },
  { key: "settings", label: "영업 정보", href: "/admin/settings" },
];

export function AdminFrame({
  tab,
  breadcrumb,
  logoUrl,
  children,
}: {
  tab?: AdminTab;
  breadcrumb?: string; // 수정 서브페이지: 탭 대신 브레드크럼
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className={s.root}>
      <header className={s.topbar}>
        <div className={s.logoMark}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            "手"
          )}
        </div>
        <span className={s.brand}>더핸드 관리</span>
        <div className={s.topRight}>
          <button onClick={() => router.push("/admin/password")}>비밀번호 변경</button>
          <span>·</span>
          <button onClick={logout}>로그아웃</button>
        </div>
      </header>

      {breadcrumb ? (
        <div className={s.breadcrumb}>{breadcrumb}</div>
      ) : (
        <nav className={s.tabs} aria-label="관리 영역">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`${s.tab} ${t.key === tab ? s.tabActive : ""}`}
              onClick={() => router.push(t.href)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <div className={s.content}>{children}</div>
    </div>
  );
}

/** 토스트 훅 (v2) */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 1800);
  };
  const node = msg ? <div className={s.toast}>{msg}</div> : null;
  return { show, node };
}

/** 토글 스위치 (v2) */
export function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${s.toggle} ${on ? s.toggleOn : ""}`}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
    >
      <span className={s.toggleKnob} />
    </button>
  );
}
