"use client";
import { useState } from "react";
import s from "./customer.module.css";

type Mode = "loading" | "setup" | "login" | "unconfigured";

export function AdminGate() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("loading");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function openGate() {
    setOpen(true);
    setMode("loading");
    setPw("");
    setPw2("");
    setErr("");
    try {
      const res = await fetch("/api/admin/status", { cache: "no-store" });
      const data = await res.json();
      if (!data.configured) setMode("unconfigured");
      else setMode(data.passwordSet ? "login" : "setup");
    } catch {
      setMode("unconfigured");
    }
  }

  function close() {
    setOpen(false);
  }

  async function submit() {
    setErr("");
    if (mode === "setup") {
      if (pw.length < 4) return setErr("비밀번호는 4자 이상이어야 합니다.");
      if (pw !== pw2) return setErr("비밀번호가 일치하지 않습니다.");
    } else if (mode === "login") {
      if (!pw) return setErr("비밀번호를 입력하세요.");
    }
    setBusy(true);
    try {
      const path = mode === "setup" ? "/api/admin/setup" : "/api/admin/login";
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "오류가 발생했습니다.");
        setBusy(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setErr("네트워크 오류. 다시 시도하세요.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={s.adminFab}
        onClick={openGate}
        aria-label="관리자 모드"
        title="관리자 모드"
      >
        ⚙
      </button>

      {open && (
        <div className={s.modalBackdrop} onClick={close}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            {mode === "loading" && <p className={s.modalSub}>확인 중…</p>}

            {mode === "unconfigured" && (
              <>
                <h3 className={s.modalTitle}>관리자 모드</h3>
                <p className={s.modalSub}>
                  Supabase가 아직 연결되지 않았습니다. 환경변수(.env.local) 설정 후
                  비밀번호로 보호되는 관리자 기능을 사용할 수 있어요. 지금은 데모로
                  화면만 둘러볼 수 있습니다(저장은 되지 않음).
                </p>
                <div className={s.modalActions}>
                  <button className={`${s.btn} ${s.btnGhost}`} onClick={close}>
                    닫기
                  </button>
                  <button
                    className={`${s.btn} ${s.btnPrimary}`}
                    onClick={() => (window.location.href = "/admin")}
                  >
                    데모 둘러보기
                  </button>
                </div>
              </>
            )}

            {(mode === "setup" || mode === "login") && (
              <>
                <h3 className={s.modalTitle}>
                  {mode === "setup" ? "관리자 비밀번호 설정" : "관리자 모드"}
                </h3>
                <p className={s.modalSub}>
                  {mode === "setup"
                    ? "처음이시네요. 사용할 관리자 비밀번호를 정하세요."
                    : "관리자 비밀번호를 입력하세요."}
                </p>
                <label className={s.field}>
                  <span>비밀번호</span>
                  <input
                    className={s.input}
                    type="password"
                    value={pw}
                    autoFocus
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && mode === "login" && submit()}
                  />
                </label>
                {mode === "setup" && (
                  <label className={s.field}>
                    <span>비밀번호 확인</span>
                    <input
                      className={s.input}
                      type="password"
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                    />
                  </label>
                )}
                <div className={s.modalErr}>{err}</div>
                <div className={s.modalActions}>
                  <button className={`${s.btn} ${s.btnGhost}`} onClick={close}>
                    취소
                  </button>
                  <button
                    className={`${s.btn} ${s.btnPrimary}`}
                    onClick={submit}
                    disabled={busy}
                  >
                    {mode === "setup" ? "설정하고 입장" : "입장"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
