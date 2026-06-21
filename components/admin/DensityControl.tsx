"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DensitySettings, MenuItem } from "@/lib/types";
import { fontScale, splitCount } from "@/lib/menu";
import { formatPrice } from "@/lib/format";
import { AdminShell, useToast } from "./AdminShell";
import s from "./admin.module.css";

export function DensityControl({
  initial,
  items,
}: {
  initial: DensitySettings;
  items: MenuItem[];
}) {
  const router = useRouter();
  const { show, node } = useToast();
  const [n, setN] = useState(initial.itemsPerPage);
  const [off, setOff] = useState(initial.fontScaleOffset);
  const [busy, setBusy] = useState(false);

  const scale = fontScale(n, off);
  const total = items.length;
  const pages = splitCount(total, n);
  const previewItems = items.slice(0, Math.min(n, total));
  const dirty = n !== initial.itemsPerPage || off !== initial.fontScaleOffset;

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/density", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemsPerPage: n, fontScaleOffset: off }),
    });
    setBusy(false);
    if (!res.ok) return show((await res.json()).error ?? "오류");
    show("저장되었습니다");
    router.refresh();
  }

  return (
    <AdminShell
      title="표시 밀도 · 글자 크기"
      banner={{
        main: "니혼슈 — 한 페이지에 몇 종을 담을지 정하세요",
        sub: "항목이 많을수록 글자가 자동으로 작아집니다",
      }}
    >
      <div className={s.controlCard}>
        <div className={s.sliderRow}>
          <div className={s.sliderTop}>
            <span className={s.sliderLabel}>페이지당 항목 수</span>
            <span className={s.sliderValue}>{n} 종</span>
          </div>
          <input
            className={s.range}
            type="range"
            min={2}
            max={10}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <div className={s.sliderCaption}>
            2 ~ 10종 · 현재 {total}종 → {pages}페이지로 자동 분할
          </div>
        </div>

        <div className={s.sliderRow}>
          <div className={s.sliderTop}>
            <span className={s.sliderLabel}>글자 크기 미세조정</span>
            <span className={s.sliderValue}>
              자동 {off > 0 ? `+${off}` : off === 0 ? "" : off}
            </span>
          </div>
          <input
            className={s.range}
            type="range"
            min={-2}
            max={2}
            step={1}
            value={off}
            onChange={(e) => setOff(Number(e.target.value))}
          />
          <div className={s.sliderCaption}>
            자동 비례값에서 살짝 키우거나 줄일 수 있어요
          </div>
        </div>
      </div>

      <div className={s.compareCaption}>같은 메뉴, 항목 수에 따라 글자가 자동 비례</div>

      <div className={s.previewWrap}>
        <div>
          <div className={s.previewCard}>
            <div className={s.previewHeader}>니혼슈</div>
            <div className={s.previewBody}>
              {previewItems.map((it) => (
                <div
                  key={it.id}
                  className={s.previewRow}
                  style={{ padding: `${6 * scale}px 0` }}
                >
                  <div
                    className={s.previewThumb}
                    style={{ width: 13 * scale, height: 32 * scale }}
                  />
                  <span className={s.previewName} style={{ fontSize: 15 * scale }}>
                    {it.name}
                  </span>
                  <span className={s.previewPrice} style={{ fontSize: 11.5 * scale }}>
                    {formatPrice(it.priceGlass)}
                  </span>
                </div>
              ))}
            </div>
            <div className={s.previewDots}>
              {Array.from({ length: pages }).map((_, i) => (
                <span
                  key={i}
                  className={`${s.previewDot} ${i === 0 ? s.previewDotActive : ""}`}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 11.5,
              fontWeight: 700,
              color: "var(--c-text)",
              marginTop: 8,
            }}
          >
            {n}종 / 페이지 · {scale >= 1 ? "큰" : "작은"} 글씨
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button
          className={s.saveBtn}
          style={{ maxWidth: 320 }}
          disabled={!dirty || busy}
          onClick={save}
        >
          {dirty ? "저장하기" : "저장됨"}
        </button>
      </div>
      {node}
    </AdminShell>
  );
}
