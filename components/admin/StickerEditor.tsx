"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuPage, Sticker, StickerKind } from "@/lib/types";
import { stickerColor } from "@/lib/format";
import { StickerBody } from "@/components/customer/Sticker";
import { AdminShell, useToast } from "./AdminShell";
import s from "./admin.module.css";

let seq = 0;
function newId() {
  return `st-${Date.now().toString(36)}-${seq++}`;
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type PalItem = {
  label: string;
  kind: StickerKind;
  color?: string;
  text?: string;
  subText?: string;
  lines?: { label: string; value: string }[];
};

const BADGE_PALETTE: PalItem[] = [
  { label: "계절 한정주", kind: "ribbon", color: "season" },
  { label: "잔술만 가능", kind: "pill", color: "outline" },
  { label: "일시 품절", kind: "badge", color: "soldout" },
  { label: "NEW", kind: "badge", color: "accent" },
  { label: "추천", kind: "badge", color: "reco" },
  { label: "한정 수량", kind: "circle", color: "soldout", text: "한정", subText: "00병" },
];

export function StickerEditor({ page }: { page: MenuPage }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [stickers, setStickers] = useState<Sticker[]>(page.stickers ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; x0: number; y0: number } | null>(
    null
  );

  const sel = stickers.find((st) => st.id === selected) ?? null;
  const maxZ = stickers.reduce((m, st) => Math.max(m, st.z), 0);

  function patch(id: string, p: Partial<Sticker>) {
    setStickers((prev) => prev.map((st) => (st.id === id ? { ...st, ...p } : st)));
    setDirty(true);
  }

  function add(item: PalItem) {
    const st: Sticker = {
      id: newId(),
      kind: item.kind,
      text: item.text ?? item.label,
      subText: item.subText ?? null,
      lines: item.lines ?? null,
      color: item.color ?? null,
      xPct: 50,
      yPct: 45,
      rotation: 0,
      scale: 1,
      z: maxZ + 1,
    };
    setStickers((prev) => [...prev, st]);
    setSelected(st.id);
    setDirty(true);
  }

  function addPrice() {
    add({
      label: "가격",
      kind: "priceCard",
      text: "메뉴명 (산지)",
      lines: [{ label: "잔술 100㎖", value: "0,000" }],
    });
  }
  function addText() {
    add({ label: "텍스트", kind: "text", text: "직접 입력" });
  }
  function remove(id: string) {
    setStickers((prev) => prev.filter((st) => st.id !== id));
    setSelected(null);
    setDirty(true);
  }

  function onStickerDown(e: React.PointerEvent, st: Sticker) {
    e.stopPropagation();
    e.preventDefault();
    setSelected(st.id);
    dragRef.current = { id: st.id, sx: e.clientX, sy: e.clientY, x0: st.xPct, y0: st.yPct };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onStickerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = ((e.clientX - d.sx) / rect.width) * 100;
    const dy = ((e.clientY - d.sy) / rect.height) * 100;
    patch(d.id, { xPct: clamp(d.x0 + dx, 2, 98), yPct: clamp(d.y0 + dy, 3, 97) });
  }
  function onStickerUp(e: React.PointerEvent) {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/stickers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, stickers }),
    });
    setBusy(false);
    if (!res.ok) return show((await res.json()).error ?? "오류");
    setDirty(false);
    show("저장되었습니다");
    router.refresh();
  }

  return (
    <AdminShell title="이미지 페이지 편집 · 스티커">
      <div
        className={s.editorCanvasWrap}
        ref={canvasRef}
        onPointerDown={() => setSelected(null)}
      >
        {!page.imageUrl && (
          <div className={s.editorDrop}>{page.title} 이미지 — 업로드는 추후(Storage)</div>
        )}
        {stickers.map((st) => (
          <div
            key={st.id}
            onPointerDown={(e) => onStickerDown(e, st)}
            onPointerMove={onStickerMove}
            onPointerUp={onStickerUp}
            style={{
              position: "absolute",
              left: `${st.xPct}%`,
              top: `${st.yPct}%`,
              transform: `translate(-50%, -50%) rotate(${st.rotation}deg) scale(${st.scale})`,
              zIndex: st.z,
              cursor: "grab",
              whiteSpace: "nowrap",
              touchAction: "none",
              filter: st.kind === "priceCard" ? "none" : "drop-shadow(0 3px 4px rgba(26,26,46,.28))",
              outline: selected === st.id ? "2px dashed #F39C12" : "none",
              outlineOffset: 4,
              borderRadius: 6,
            }}
          >
            <StickerBody sticker={st} />
          </div>
        ))}
      </div>

      <div className={s.palette}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={s.paletteHint}>스티커 — 탭하면 추가, 끌어서 위치 이동</span>
          <button
            className={s.doneBtn}
            style={{ marginLeft: "auto" }}
            onClick={save}
            disabled={busy || !dirty}
          >
            저장 ✓
          </button>
        </div>
        <div className={s.paletteRow}>
          {BADGE_PALETTE.map((item) => {
            const c = stickerColor(item.color);
            return (
              <button
                key={item.label}
                className={s.palChip}
                style={{
                  background: c.fill,
                  color: c.text,
                  border: c.border ? `1.4px solid ${c.border}` : "none",
                }}
                onClick={() => add(item)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className={s.paletteRow}>
          <button
            className={s.palChip}
            style={{ background: "#fff", color: "#2d3436", border: "1.4px solid #d8d0c4", borderRadius: 10 }}
            onClick={addPrice}
          >
            ＄ 가격 스티커
          </button>
          <button
            className={s.palChip}
            style={{
              background: "none",
              color: "#9a8f80",
              border: "1.4px dashed #d8d0c4",
              borderRadius: 10,
            }}
            onClick={addText}
          >
            + 직접 입력
          </button>
        </div>

        {sel && (
          <div className={s.selectedTools}>
            <label>
              회전
              <input
                type="range"
                min={-25}
                max={25}
                value={sel.rotation}
                onChange={(e) => patch(sel.id, { rotation: Number(e.target.value) })}
              />
            </label>
            <label>
              크기
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.05}
                value={sel.scale}
                onChange={(e) => patch(sel.id, { scale: Number(e.target.value) })}
              />
            </label>
            <input
              className={s.formInput}
              style={{ height: 32, width: 160, fontSize: 13 }}
              value={sel.text}
              onChange={(e) => patch(sel.id, { text: e.target.value })}
              placeholder="문구"
            />
            <button className={s.delBtn} onClick={() => remove(sel.id)}>
              삭제
            </button>
          </div>
        )}
      </div>
      {node}
    </AdminShell>
  );
}
