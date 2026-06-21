"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuPage, PageType } from "@/lib/types";
import { AdminShell, useToast } from "./AdminShell";
import { EyeIcon, EyeOffIcon, PencilIcon } from "./icons";
import s from "./admin.module.css";

const CATEGORY_COLOR: Record<string, string> = {
  nihonshu: "#C8902F",
  shochu: "#9B6FB0",
  yori: "#C0560F",
  drinks: "#9A8F80",
};

function badgeFor(page: MenuPage): { label: string; color: string } {
  if (page.isHidden) return { label: "숨김", color: "#9A8F80" };
  switch (page.type) {
    case "cover":
    case "notice":
      return { label: "고정", color: "#7A8590" };
    case "menu":
      return { label: "자동 분할", color: "#C8902F" };
    case "image":
      return { label: "이미지", color: "#1F8A5B" };
    case "event":
      return { label: "이벤트", color: "#C0392B" };
    case "map":
      return { label: "탐색", color: "#2A6FAF" };
  }
}

function Thumb({ page }: { page: MenuPage }) {
  const catColor = CATEGORY_COLOR[page.categoryKey ?? ""] ?? "#636E72";
  if (page.type === "cover") {
    return (
      <div className={s.pageThumb} style={{ background: "#111418" }}>
        <span className={s.pageThumbGlyph} style={{ color: "#E2A04F" }}>
          手
        </span>
      </div>
    );
  }
  if (page.type === "image" || page.type === "event") {
    const c = page.themeColor ?? "#1F8A5B";
    return (
      <div className={s.pageThumb} style={{ border: `1.5px dashed ${c}`, background: "#fff" }}>
        {page.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.imageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <span style={{ fontSize: 16, color: c }}>▦</span>
        )}
      </div>
    );
  }
  if (page.type === "map") {
    const c = page.mapKind === "taste" ? "#C45E86" : "#2A6FAF";
    return (
      <div className={s.pageThumb}>
        <svg width="34" height="48" viewBox="0 0 34 48">
          <line x1="17" y1="6" x2="17" y2="42" stroke="#EDE8E0" />
          <line x1="4" y1="24" x2="30" y2="24" stroke="#EDE8E0" />
          <circle cx="22" cy="16" r="3" fill={c} />
          <circle cx="12" cy="30" r="3" fill={c} />
        </svg>
      </div>
    );
  }
  return (
    <div className={s.pageThumb}>
      <span
        className={s.pageThumbBar}
        style={{ background: page.type === "notice" ? "#636E72" : catColor }}
      />
      <svg width="34" height="48" viewBox="0 0 34 48" style={{ marginLeft: 4 }}>
        {[8, 16, 24, 32, 40].map((y) => (
          <rect key={y} x="6" y={y} width={y % 16 === 0 ? 16 : 22} height="3" rx="1.5" fill="#D8D0C4" />
        ))}
      </svg>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M8 3.2 V12.8 M3.2 8 H12.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SortableCard({
  page,
  index,
  busy,
  href,
  subtext,
  onToggleHide,
  onEdit,
}: {
  page: MenuPage;
  index: number;
  busy: boolean;
  href: string | null;
  subtext: string;
  onToggleHide: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
    disabled: page.isFixed,
  });
  const badge = badgeFor(page);
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    position: "relative",
    boxShadow: isDragging ? "0 12px 28px rgba(26,26,46,0.22)" : undefined,
    opacity: isDragging ? 0.97 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={`${s.pageCard} ${page.isHidden ? s.pageCardHidden : ""}`}>
      <button
        type="button"
        className={s.handle}
        {...attributes}
        {...listeners}
        disabled={page.isFixed}
        aria-label="끌어서 순서 변경"
        title={page.isFixed ? "고정 페이지" : "끌어서 순서 변경"}
        style={page.isFixed ? { opacity: 0.3, cursor: "default" } : undefined}
      >
        ⠿
      </button>
      <span className={s.numBadge}>{index + 1}</span>
      <Thumb page={page} />
      <div className={s.pageMeta}>
        <div className={s.pageTitleRow}>
          <span className={s.pageTitleText}>{page.title}</span>
          <span className={s.typeBadge} style={{ background: `${badge.color}1A`, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <div className={s.pageSub}>{subtext}</div>
      </div>
      <div className={s.cardActions}>
        <button
          className={s.iconBtn}
          onClick={onToggleHide}
          disabled={busy}
          title={page.isHidden ? "표시하기" : "숨기기"}
          style={page.isHidden ? { color: "#9A8F80" } : undefined}
        >
          {page.isHidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <button
          className={s.iconBtn}
          disabled={!href}
          onClick={onEdit}
          title="편집"
          style={!href ? { opacity: 0.35 } : undefined}
        >
          <PencilIcon />
        </button>
      </div>
    </div>
  );
}

function normalizeFixed(arr: MenuPage[]): MenuPage[] {
  const cover = arr.find((p) => p.type === "cover");
  const notice = arr.find((p) => p.type === "notice");
  const mid = arr.filter((p) => p.type !== "cover" && p.type !== "notice");
  return [cover, ...mid, notice].filter(Boolean) as MenuPage[];
}

export function PageBoard({
  pages,
  itemCounts,
  soldoutCounts,
  visibleCount,
}: {
  pages: MenuPage[];
  itemCounts: Record<string, number>;
  soldoutCounts: Record<string, number>;
  visibleCount: number;
}) {
  const router = useRouter();
  const { show, node } = useToast();
  const [busy, setBusy] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [order, setOrder] = useState<MenuPage[]>(pages);

  useEffect(() => {
    setOrder(pages);
    setBusy(false);
  }, [pages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function subtext(page: MenuPage): string {
    switch (page.type) {
      case "cover":
        return "브랜드 표지";
      case "notice":
        return "법정 표기";
      case "menu": {
        const n = itemCounts[page.categoryKey ?? ""] ?? 0;
        const so = soldoutCounts[page.categoryKey ?? ""] ?? 0;
        return so > 0 ? `${n}종 · ${so} 품절` : `${n}종`;
      }
      case "image":
      case "event":
        return `스티커 ${page.stickers?.length ?? 0}개`;
      case "map":
        return page.subtitle ?? (page.mapKind === "taste" ? "취향 지도" : "산지 지도");
    }
  }

  async function reorder(ids: string[]) {
    setBusy(true);
    const res = await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", orderedIds: ids }),
    });
    if (!res.ok) {
      show((await res.json()).error ?? "오류");
    } else {
      show("순서 변경됨");
    }
    router.refresh();
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = order.findIndex((p) => p.id === active.id);
    const newI = order.findIndex((p) => p.id === over.id);
    if (oldI < 0 || newI < 0) return;
    const moved = normalizeFixed(arrayMove(order, oldI, newI));
    setOrder(moved); // 낙관적
    void reorder(moved.map((p) => p.id));
  }

  async function toggleHide(page: MenuPage) {
    setBusy(true);
    const res = await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "visibility", id: page.id, isHidden: !page.isHidden }),
    });
    if (!res.ok) {
      setBusy(false);
      return show((await res.json()).error ?? "오류");
    }
    show(page.isHidden ? "손님 화면에 표시" : "손님 화면에서 숨김");
    router.refresh();
  }

  async function doInsert(type: PageType) {
    const after = insertAt;
    setInsertAt(null);
    setBusy(true);
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, afterSortOrder: after }),
    });
    if (!res.ok) {
      setBusy(false);
      return show((await res.json()).error ?? "오류");
    }
    show("페이지 추가됨");
    router.refresh();
  }

  function editHref(page: MenuPage): string | null {
    if (page.type === "menu") return "/admin/items";
    if (page.type === "image" || page.type === "event") return `/admin/page/${page.id}/stickers`;
    return null;
  }

  const lastNonFixed = [...order].reverse().find((p) => !p.isFixed);
  const ids = order.map((p) => p.id);

  return (
    <AdminShell title="메뉴 페이지 관리">
      <div className={s.toolbar}>
        <div className={s.toolbarText}>
          <span className={s.bannerMain}>{order.length}개 페이지 · ⠿ 끌어서 순서 변경</span>
          <span className={s.bannerSub}>
            숨김 페이지는 손님 스와이프에서 빠집니다 (손님엔 {visibleCount}장 노출)
          </span>
        </div>
        <button
          className={s.insertBtn}
          disabled={busy}
          onClick={() => setInsertAt(lastNonFixed?.sortOrder ?? order.length)}
        >
          + 페이지 삽입
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {order.map((page, i) => (
            <div key={page.id}>
              <SortableCard
                page={page}
                index={i}
                busy={busy}
                href={editHref(page)}
                subtext={subtext(page)}
                onToggleHide={() => toggleHide(page)}
                onEdit={() => {
                  const h = editHref(page);
                  if (h) router.push(h);
                }}
              />
              {i < order.length - 1 && (
                <div className={s.insertDivider}>
                  <span className={s.insertLine} />
                  <button
                    type="button"
                    className={s.insertPlus}
                    onClick={() => setInsertAt(page.sortOrder)}
                    aria-label="여기에 페이지 삽입"
                    disabled={busy}
                  >
                    <PlusIcon />
                  </button>
                  <span className={s.insertLine} />
                </div>
              )}
            </div>
          ))}
        </SortableContext>
      </DndContext>

      {insertAt !== null && (
        <div
          onClick={() => setInsertAt(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,20,24,.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 22, width: 320 }}
          >
            <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>
              어떤 페이지를 삽입할까요?
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={s.insertBtn} style={{ flex: 1, margin: 0 }} onClick={() => doInsert("image")}>
                이미지 페이지
              </button>
              <button
                className={s.insertBtn}
                style={{ flex: 1, margin: 0, background: "#C0392B", color: "#fff" }}
                onClick={() => doInsert("event")}
              >
                이벤트 페이지
              </button>
            </div>
          </div>
        </div>
      )}
      {node}
    </AdminShell>
  );
}
