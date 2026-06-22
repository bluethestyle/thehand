"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuPage, Sticker, StickerKind } from "@/lib/types";
import { stickerColor } from "@/lib/format";
import { StickerBody } from "@/components/customer/Sticker";
import { AdminFrame, useToast } from "./AdminFrame";
import s from "./admin.module.css";
import f from "./admin-v2.module.css";

let seq = 0;
const newId = () => `st-${Date.now().toString(36)}-${seq++}`;
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

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  return data.url as string;
}

export function StickerEditor({ page }: { page: MenuPage }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [stickers, setStickers] = useState<Sticker[]>(page.stickers ?? []);
  const [bgUrl, setBgUrl] = useState<string | null>(page.imageUrl ?? null);
  const [title, setTitle] = useState(page.title ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stickerFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; x0: number; y0: number } | null>(null);
  const xfRef = useRef<{
    id: string;
    mode: "resize" | "rotate";
    cx: number;
    cy: number;
    startDist: number;
    startScale: number;
    startAngle: number;
    startRot: number;
  } | null>(null);

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
  const addPrice = () =>
    add({ label: "가격", kind: "priceCard", text: "메뉴명 (산지)", lines: [{ label: "잔술 100㎖", value: "0,000" }] });
  const addText = () => add({ label: "텍스트", kind: "text", text: "직접 입력" });

  function remove(id: string) {
    setStickers((prev) => prev.filter((st) => st.id !== id));
    setSelected(null);
    setDirty(true);
  }

  // ── 이미지 스티커 업로드 ──
  async function onPickSticker(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBusy(true);
      try {
        const url = await uploadFile(file, "stickers");
        const st: Sticker = {
          id: newId(), kind: "image", text: url, subText: null, lines: null,
          color: null, xPct: 50, yPct: 45, rotation: 0, scale: 1, z: maxZ + 1,
        };
        setStickers((prev) => [...prev, st]);
        setSelected(st.id);
        setDirty(true);
      } catch (err) {
        show((err as Error).message);
      } finally {
        setBusy(false);
        if (stickerFileRef.current) stickerFileRef.current.value = "";
      }
    }
  }

  // ── 배경 이미지 업로드 → 페이지 imageUrl 저장 ──
  async function onPickBg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBusy(true);
      try {
        const url = await uploadFile(file, "pages");
        const res = await fetch("/api/admin/pages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", id: page.id, patch: { imageUrl: url } }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "저장 실패");
        setBgUrl(url);
        show("배경 이미지 적용됨");
        router.refresh();
      } catch (err) {
        show((err as Error).message);
      } finally {
        setBusy(false);
        if (bgFileRef.current) bgFileRef.current.value = "";
      }
    }
  }

  // ── 본체 드래그(이동) ──
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

  // ── 핸들(크기/회전) ──
  function onHandleDown(e: React.PointerEvent, st: Sticker, mode: "resize" | "rotate") {
    e.stopPropagation();
    e.preventDefault();
    setSelected(st.id);
    const wrap = (e.currentTarget as HTMLElement).closest("[data-stid]") as HTMLElement | null;
    const r = wrap?.getBoundingClientRect();
    if (!r) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    xfRef.current = {
      id: st.id, mode, cx, cy,
      startDist: Math.hypot(e.clientX - cx, e.clientY - cy),
      startScale: st.scale,
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      startRot: st.rotation,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: React.PointerEvent) {
    const x = xfRef.current;
    if (!x) return;
    if (x.mode === "resize") {
      const dist = Math.hypot(e.clientX - x.cx, e.clientY - x.cy);
      const scale = clamp((x.startScale * dist) / (x.startDist || 1), 0.3, 4);
      patch(x.id, { scale: Math.round(scale * 100) / 100 });
    } else {
      const ang = Math.atan2(e.clientY - x.cy, e.clientX - x.cx);
      const deg = x.startRot + ((ang - x.startAngle) * 180) / Math.PI;
      patch(x.id, { rotation: Math.round(deg) });
    }
  }
  function onHandleUp(e: React.PointerEvent) {
    xfRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  async function saveTitle() {
    if (title.trim() === (page.title ?? "")) return;
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: page.id, patch: { title: title.trim() } }),
    });
    show("페이지 이름 저장됨");
    router.refresh();
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
    <AdminFrame tab="notices">
      <div className={f.pageHead}>
        <div style={{ flex: 1 }}>
          <div className={f.pageSub}>공지 · 이벤트 › 페이지 편집</div>
          <input
            className={f.input}
            style={{ fontSize: 20, fontWeight: 800, marginTop: 4, maxWidth: 360 }}
            value={title}
            placeholder="페이지 이름 (예: 여름 한정주)"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
        </div>
        <div className={f.pageActions}>
          <button className={f.btn} onClick={() => router.push("/admin/notices")}>
            목록
          </button>
          <button className={`${f.btn} ${f.btnPrimary}`} onClick={save} disabled={busy || !dirty}>
            저장
          </button>
        </div>
      </div>
      <div className={s.editorCanvasWrap} ref={canvasRef} onPointerDown={() => setSelected(null)}>
        {bgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.editorBg} src={bgUrl} alt="" />
        ) : (
          <div className={s.editorDrop}>{page.title} 이미지 — 아래 ‘배경 이미지’로 업로드</div>
        )}
        {stickers.map((st) => {
          const isSel = selected === st.id;
          return (
            <div
              key={st.id}
              data-stid={st.id}
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
                filter:
                  st.kind === "priceCard"
                    ? "none"
                    : "drop-shadow(0 3px 4px rgba(26,26,46,.28))",
              }}
            >
              <StickerBody sticker={st} />
              {isSel && (
                <>
                  <span className={s.selBox} />
                  <span
                    className={s.rotateStalk}
                    style={{ transform: `translateX(-50%) scale(${1 / st.scale})`, transformOrigin: "bottom center" }}
                  />
                  <span
                    className={s.rotateHandle}
                    style={{ transform: `translateX(-50%) scale(${1 / st.scale})` }}
                    onPointerDown={(e) => onHandleDown(e, st, "rotate")}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                  >
                    ↻
                  </span>
                  <span
                    className={s.resizeHandle}
                    style={{ transform: `scale(${1 / st.scale})` }}
                    onPointerDown={(e) => onHandleDown(e, st, "resize")}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className={s.palette}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={s.paletteHint}>스티커 — 탭하면 추가, 끌어서 이동 · 모서리로 크기, ↻로 회전</span>
          <button className={s.doneBtn} style={{ marginLeft: "auto" }} onClick={save} disabled={busy || !dirty}>
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
                style={{ background: c.fill, color: c.text, border: c.border ? `1.4px solid ${c.border}` : "none" }}
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
            style={{ background: "none", color: "#9a8f80", border: "1.4px dashed #d8d0c4", borderRadius: 10 }}
            onClick={addText}
          >
            + 직접 입력
          </button>
          <input ref={stickerFileRef} type="file" accept="image/*" hidden onChange={onPickSticker} />
          <button
            className={s.palChip}
            style={{ background: "#111418", color: "#f3ede2", borderRadius: 10 }}
            disabled={busy}
            onClick={() => stickerFileRef.current?.click()}
          >
            🖼 이미지 스티커
          </button>
          <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={onPickBg} />
          <button
            className={s.palChip}
            style={{ background: "#fbf1dc", color: "#7a5a1e", border: "1.4px solid #f0e0be", borderRadius: 10 }}
            disabled={busy}
            onClick={() => bgFileRef.current?.click()}
          >
            ＋ 배경 이미지
          </button>
        </div>

        {sel && (
          <div className={s.selectedTools}>
            <span style={{ fontWeight: 700 }}>
              선택됨 · {Math.round(sel.scale * 100)}% · {sel.rotation}°
            </span>
            {sel.kind !== "image" && (
              <input
                className={s.formInput}
                style={{ height: 32, width: 160, fontSize: 13 }}
                value={sel.text}
                onChange={(e) => patch(sel.id, { text: e.target.value })}
                placeholder="문구"
              />
            )}
            <button className={s.delBtn} onClick={() => remove(sel.id)}>
              삭제
            </button>
          </div>
        )}
      </div>
      {node}
    </AdminFrame>
  );
}
