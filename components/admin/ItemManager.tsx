"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ItemStatus, MenuItem } from "@/lib/types";
import { AdminShell, useToast } from "./AdminShell";
import s from "./admin.module.css";

const STATUS_COLOR: Record<ItemStatus, string> = {
  selling: "#1F8A5B",
  soldout: "#C84B31",
  closed: "#6B6258",
};
const SEGMENTS: { key: ItemStatus; label: string }[] = [
  { key: "selling", label: "판매중" },
  { key: "soldout", label: "일시품절" },
  { key: "closed", label: "닫힘" },
];

export function ItemManager({ items }: { items: MenuItem[] }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [busy, setBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<string | null>(null);

  const selling = items.filter((it) => it.status !== "closed");
  const archived = items.filter((it) => it.status === "closed");

  function pickImage(itemId: string) {
    targetRef.current = itemId;
    fileRef.current?.click();
  }
  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = targetRef.current;
    if (!file || !id) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "items");
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await up.json();
      if (!up.ok) {
        show(data.error ?? "업로드 실패");
        return;
      }
      const res = await fetch("/api/admin/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch: { imageUrl: data.url } }),
      });
      if (!res.ok) {
        show((await res.json()).error ?? "저장 실패");
        return;
      }
      show("보틀 이미지 적용됨");
      router.refresh();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      targetRef.current = null;
    }
  }

  async function setStatus(item: MenuItem, status: ItemStatus) {
    if (item.status === status) return;
    setBusy(true);
    const res = await fetch("/api/admin/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, patch: { status } }),
    });
    setBusy(false);
    if (!res.ok) return show((await res.json()).error ?? "오류");
    show(
      status === "closed"
        ? "보관함으로 닫힘"
        : status === "soldout"
          ? "일시 품절 표시"
          : "판매중으로 변경"
    );
    router.refresh();
  }

  return (
    <AdminShell
      title="메뉴 항목 관리"
      banner={{
        main: "품절은 표시만, 안 받는 메뉴는 닫아서 손님 화면에서 숨겨요",
        sub: "닫아도 삭제되지 않아요 — 보관함에 남아 재입고 시 한 번에 되살립니다",
      }}
    >
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImageFile} />

      <div className={s.sectionHeader}>
        <span className={s.sectionTitle}>판매 중</span>
        <span className={s.sectionMeta}>{selling.length}종</span>
      </div>

      {selling.map((item) => (
        <div className={s.itemCard} key={item.id}>
          <button
            className={s.itemThumbBtn}
            onClick={() => pickImage(item.id)}
            disabled={busy}
            title="보틀 이미지 업로드"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" />
            ) : (
              <span>📷</span>
            )}
          </button>
          <div className={s.itemBody}>
            <div>
              <span className={s.itemName}>{item.name}</span>
              {item.status === "soldout" && (
                <span className={s.itemInlineBadge}>일시 품절</span>
              )}
            </div>
            <div className={s.itemMeta}>
              {[item.region, item.grade].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className={s.segment}>
            {SEGMENTS.map((seg) => {
              const active = item.status === seg.key;
              return (
                <button
                  key={seg.key}
                  className={`${s.segBtn} ${active ? s.segActive : ""}`}
                  style={active ? { background: STATUS_COLOR[seg.key] } : undefined}
                  disabled={busy}
                  onClick={() => setStatus(item, seg.key)}
                >
                  {seg.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className={s.sectionHeader} style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#9A8F80" }} />
        <span className={s.sectionTitle}>닫힌 메뉴 · 보관함</span>
        <span className={s.countPill}>{archived.length}</span>
        <span className={s.sectionMeta}>손님 화면 비노출</span>
      </div>

      {archived.length === 0 && (
        <div style={{ color: "var(--c-muted-2)", fontSize: 13, padding: "8px 2px" }}>
          닫힌 메뉴가 없습니다.
        </div>
      )}
      {archived.map((item) => (
        <div className={s.archiveCard} key={item.id}>
          <div className={s.archiveThumb} />
          <div className={s.archiveBody}>
            <div className={s.archiveName}>
              {item.name}
              {item.region ? ` (${item.region})` : ""}
            </div>
            <div className={s.archiveMeta}>
              {[item.grade, item.closedAt ? `닫은 날 ${item.closedAt}` : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <button
            className={s.restoreBtn}
            disabled={busy}
            onClick={() => setStatus(item, "selling")}
          >
            ↺ 다시 판매하기
          </button>
        </div>
      ))}

      <div className={s.preserveStrip}>
        ✓ 가격·설명·산지·사진 그대로 보관 — 재입력 없이 복원됩니다
      </div>
      {node}
    </AdminShell>
  );
}
