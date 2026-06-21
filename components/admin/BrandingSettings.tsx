"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, useToast } from "./AdminShell";
import s from "./admin.module.css";

export function BrandingSettings({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveBranding(url: string | null) {
    const res = await fetch("/api/admin/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: url }),
    });
    if (!res.ok) {
      show((await res.json()).error ?? "오류");
      return false;
    }
    return true;
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "logo");
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await up.json();
      if (!up.ok) {
        show(data.error ?? "업로드 실패");
        return;
      }
      if (await saveBranding(data.url)) {
        setLogoUrl(data.url);
        show("로고가 변경되었습니다");
        router.refresh();
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function reset() {
    setBusy(true);
    if (await saveBranding(null)) {
      setLogoUrl(null);
      show("기본 로고로 복원");
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <AdminShell
      title="로고 · 브랜딩"
      banner={{
        main: "손님 화면 상단·표지의 로고를 교체합니다",
        sub: "권장: 정사각 PNG(투명 배경) · 5MB 이하 · 변경 즉시 모든 태블릿 반영",
      }}
    >
      <div className={s.formCard} style={{ textAlign: "center" }}>
        <div
          style={{
            width: 120,
            height: 120,
            margin: "8px auto 18px",
            borderRadius: 20,
            display: "grid",
            placeItems: "center",
            background: logoUrl
              ? "#fff"
              : "linear-gradient(135deg, var(--c-gold-a), var(--c-gold-b))",
            border: "1px solid var(--c-border)",
            overflow: "hidden",
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="현재 로고"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 56,
                fontWeight: 700,
                color: "#1e1e36",
              }}
            >
              手
            </span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--c-muted)", margin: "0 0 18px" }}>
          {logoUrl ? "업로드된 로고 사용 중" : "기본 手 마크 사용 중"}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPick}
        />
        <button
          className={s.saveBtn}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "업로드 중…" : "이미지 선택해 로고 교체"}
        </button>
        {logoUrl && (
          <button
            className={s.restoreBtn}
            style={{ marginTop: 12, width: "100%", height: 44 }}
            disabled={busy}
            onClick={reset}
          >
            기본 로고로 복원
          </button>
        )}
      </div>
      {node}
    </AdminShell>
  );
}
