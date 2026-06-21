"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuData, RenderedPage } from "@/lib/types";
import { buildRenderedPages, fontScale } from "@/lib/menu";
import { browserClient } from "@/lib/supabase";
import { PageShell, type DeckNav } from "./PageShell";
import { MenuPageView } from "./pages/MenuPageView";
import { ImagePageView } from "./pages/ImagePageView";
import { TasteMapView } from "./pages/TasteMapView";
import { CoverView, NoticeView, RegionMapView } from "./pages/MiscViews";
import { AdminGate } from "./AdminGate";
import s from "./customer.module.css";

const SWIPE_THRESHOLD = 60;

export function MenuDeck({
  initial,
  realtime,
}: {
  initial: MenuData;
  realtime: boolean;
}) {
  const [data, setData] = useState<MenuData>(initial);
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [deckW, setDeckW] = useState(0);

  const deckRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; axis: null | "x" | "y" }>({
    startX: 0,
    startY: 0,
    axis: null,
  });

  const pages: RenderedPage[] = useMemo(() => buildRenderedPages(data), [data]);
  const total = pages.length;
  const scale = fontScale(data.density.itemsPerPage, data.density.fontScaleOffset);
  // 렌더 단계에서 파생 → realtime 갱신/total 감소 시 한 프레임 어긋남 방지
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, total - 1));

  // index 상태를 범위 안으로 동기화(파생값은 safeIndex가 이미 보호)
  useEffect(() => {
    if (index !== safeIndex) setIndex(safeIndex);
  }, [index, safeIndex]);

  // deck 실제 폭 추적 (회전/리사이즈 대응)
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    setDeckW(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setDeckW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(total - 1, i))),
    [total]
  );
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // ── Realtime 구독 ──
  useEffect(() => {
    if (!realtime) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/menu", { cache: "no-store" });
          if (res.ok) setData(await res.json());
        } catch {
          /* ignore */
        }
      }, 250);
    };
    let channel: ReturnType<ReturnType<typeof browserClient>["channel"]> | null = null;
    try {
      const sb = browserClient();
      channel = sb
        .channel("thehand-menu")
        .on("postgres_changes", { event: "*", schema: "public", table: "thehand_items" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "thehand_pages" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "thehand_stickers" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "thehand_settings" }, refresh)
        .subscribe();
    } catch {
      /* supabase 미설정 */
    }
    return () => {
      if (timer) clearTimeout(timer);
      channel?.unsubscribe();
    };
  }, [realtime]);

  // ── 포인터 스와이프 ──
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a")) return;
    drag.current = { startX: e.clientX, startY: e.clientY, axis: null };
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (drag.current.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (drag.current.axis === "x") {
      e.preventDefault();
      const w = deckW || 1;
      let d = dx;
      if ((safeIndex === 0 && dx > 0) || (safeIndex === total - 1 && dx < 0)) d = dx * 0.35;
      setDragX(Math.max(-w, Math.min(w, d)));
    }
  };
  const endDrag = (e?: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    if (drag.current.axis === "x") {
      if (dragX <= -SWIPE_THRESHOLD) next();
      else if (dragX >= SWIPE_THRESHOLD) prev();
    }
    setDragX(0);
    drag.current.axis = null;
  };

  const nav: DeckNav = { index: safeIndex, total, onPrev: prev, onNext: next, onDot: go };

  const trackStyle: React.CSSProperties = {
    transform: `translateX(${-safeIndex * deckW + dragX}px)`,
  };

  return (
    <div className={s.app}>
      <div className={s.deck} ref={deckRef}>
        <div
          className={`${s.track} ${dragging ? s.dragging : ""}`}
          style={trackStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {pages.map((rp) => (
            <div
              className={s.panel}
              key={rp.key}
              style={{ "--row-scale": scale } as React.CSSProperties}
            >
              <PageShell
                page={rp.source}
                nav={nav}
                showTitleBand={
                  rp.source.type === "menu" ||
                  rp.source.type === "map" ||
                  rp.source.type === "notice"
                }
              >
                <PageBody rp={rp} data={data} />
              </PageShell>
            </div>
          ))}
        </div>
        <AdminGate />
      </div>
    </div>
  );
}

function PageBody({ rp, data }: { rp: RenderedPage; data: MenuData }) {
  const page = rp.source;
  switch (page.type) {
    case "cover":
      return <CoverView page={page} />;
    case "menu":
      return (
        <MenuPageView
          rendered={rp}
          bands={page.categoryKey ? data.bands[page.categoryKey] : undefined}
        />
      );
    case "image":
    case "event":
      return <ImagePageView page={page} />;
    case "map":
      return page.mapKind === "region" ? (
        <RegionMapView items={data.items} />
      ) : (
        <TasteMapView items={data.items} />
      );
    case "notice":
      return <NoticeView />;
    default:
      return null;
  }
}
