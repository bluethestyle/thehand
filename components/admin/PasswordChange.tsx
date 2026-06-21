"use client";
import { useState } from "react";
import { AdminShell, useToast } from "./AdminShell";
import s from "./admin.module.css";

export function PasswordChange() {
  const { show, node } = useToast();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: "", ok: false });
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMsg({ text: "", ok: false });
    if (next.length < 4) return setMsg({ text: "새 비밀번호는 4자 이상이어야 합니다.", ok: false });
    if (next !== conf) return setMsg({ text: "새 비밀번호가 일치하지 않습니다.", ok: false });
    setBusy(true);
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: cur, next }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) return setMsg({ text: data.error ?? "오류", ok: false });
    setCur("");
    setNext("");
    setConf("");
    setMsg({ text: "비밀번호가 변경되었습니다.", ok: true });
    show("변경 완료");
  }

  return (
    <AdminShell title="비밀번호 변경">
      <div className={s.formCard}>
        <label className={s.formField}>
          <span>현재 비밀번호</span>
          <input
            className={s.formInput}
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
          />
        </label>
        <label className={s.formField}>
          <span>새 비밀번호 (4자 이상)</span>
          <input
            className={s.formInput}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className={s.formField}>
          <span>새 비밀번호 확인</span>
          <input
            className={s.formInput}
            type="password"
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>
        <div
          className={s.formMsg}
          style={{ color: msg.ok ? "var(--c-success)" : "var(--c-error)" }}
        >
          {msg.text}
        </div>
        <button className={s.saveBtn} onClick={submit} disabled={busy}>
          비밀번호 변경
        </button>
      </div>
      {node}
    </AdminShell>
  );
}
