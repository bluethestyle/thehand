"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { AdminFrame, Toggle, useToast } from "./AdminFrame";
import f from "./admin-v2.module.css";
import s from "./menu-manager.module.css";

const CATS: { key: string; label: string }[] = [
  { key: "nihonshu", label: "니혼슈" },
  { key: "yori", label: "요리" },
  { key: "shochu", label: "쇼츄" },
  { key: "drinks", label: "음료" },
];

type Unit = { key: "priceGlass" | "priceTokkuri" | "priceBottle"; vol: string };
function unitsFor(cat: string): Unit[] {
  if (cat === "shochu")
    return [
      { key: "priceGlass", vol: "80㎖" },
      { key: "priceBottle", vol: "720㎖" },
    ];
  if (cat === "nihonshu")
    return [
      { key: "priceGlass", vol: "100㎖" },
      { key: "priceTokkuri", vol: "300㎖" },
      { key: "priceBottle", vol: "720㎖" },
    ];
  return [{ key: "priceGlass", vol: "가격" }]; // 요리·음료: 단일 가격
}

function chipOf(it: MenuItem): string | null {
  if (it.status === "soldout") return "품절";
  if (it.badge === "NEW") return "NEW";
  if (it.badge === "추천" || it.featured) return "★추천";
  if (it.badge === "계절한정") return "여름";
  if (it.heatable) return "♨";
  return null;
}

async function patchItem(id: string, patch: Record<string, unknown>) {
  const res = await fetch("/api/admin/items", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, patch }),
  });
  return res.ok;
}

function ItemRow({
  item,
  units,
  onPrice,
  onToggle,
  onEdit,
  busy,
}: {
  item: MenuItem;
  units: Unit[];
  onPrice: (id: string, key: string, val: number | null) => void;
  onToggle: (item: MenuItem, on: boolean) => void;
  onEdit: (id: string) => void;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const chip = chipOf(item);
  const visible = item.status !== "closed";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${s.row} ${item.status === "soldout" ? s.rowSoldout : ""}`}
    >
      <span className={s.handle} {...attributes} {...listeners}>
        ≡
      </span>
      <div className={s.main}>
        <div className={s.nameRow}>
          <span className={s.name}>{item.name}</span>
          {chip && <span className={s.chip}>{chip}</span>}
        </div>
        <div className={s.meta}>{[item.grade, item.region].filter(Boolean).join(" · ")}</div>
      </div>
      <div className={s.prices}>
        {units.map((u) => (
          <div key={u.key} className={s.priceCell}>
            <input
              className={s.priceInput}
              defaultValue={item[u.key] != null ? formatPrice(item[u.key]) : ""}
              placeholder="—"
              inputMode="numeric"
              disabled={busy}
              onBlur={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                const val = raw === "" ? null : Number(raw);
                if (val !== (item[u.key] ?? null)) onPrice(item.id, u.key, val);
                e.target.value = val != null ? formatPrice(val) : "";
              }}
            />
            <div className={s.priceVol}>{u.vol}</div>
          </div>
        ))}
      </div>
      <Toggle on={visible} onChange={(on) => onToggle(item, on)} disabled={busy} />
      <button className={s.editBtn} onClick={() => onEdit(item.id)}>
        수정
      </button>
    </div>
  );
}

export function MenuManager({ items: initial }: { items: MenuItem[] }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState("nihonshu");
  const [items, setItems] = useState<MenuItem[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) if (it.status !== "closed") m[it.categoryKey] = (m[it.categoryKey] ?? 0) + 1;
    return m;
  }, [items]);

  const rows = useMemo(
    () =>
      items
        .filter((it) => it.categoryKey === cat)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items, cat]
  );

  async function onPrice(id: string, key: string, val: number | null) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: val } : it)));
    const okres = await patchItem(id, { [key]: val });
    if (okres) show("가격 저장됨");
    else show("저장 실패");
  }

  async function onToggle(item: MenuItem, on: boolean) {
    const status = on ? "selling" : "closed";
    setBusy(true);
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status } : it)));
    const okres = await patchItem(item.id, { status });
    setBusy(false);
    show(on ? "메뉴판에 표시" : "메뉴판에서 숨김");
    if (!okres) router.refresh();
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = rows.map((r) => r.id);
    const oldI = ids.indexOf(active.id as string);
    const newI = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, oldI, newI);
    // 로컬 sortOrder 재배치 (해당 카테고리 내)
    setItems((prev) => {
      const order = new Map(newIds.map((id, i) => [id, i + 1]));
      return prev.map((it) => (order.has(it.id) ? { ...it, sortOrder: order.get(it.id)! } : it));
    });
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", orderedIds: newIds }),
    });
    show(res.ok ? "순서 변경됨" : "순서 저장 실패");
  }

  async function addItem() {
    setBusy(true);
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryKey: cat, name: "새 메뉴" }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) router.push(`/admin/items/${data.id}`);
    else show(data.error ?? "추가 실패");
  }

  async function bulk(kind: "unsoldout" | "price" | "untag" | "volume") {
    const target = rows;
    if (kind === "volume") return show("용량은 각 메뉴 ‘수정’의 판매 단위에서 변경합니다");
    if (kind === "price") {
      const pct = Number(window.prompt("가격 일괄 조정 (%) — 예: 10 = +10%, -5 = -5%", "0"));
      if (!Number.isFinite(pct) || pct === 0) return;
      setBusy(true);
      for (const it of target) {
        const adj = (n: number | null | undefined) =>
          n == null ? null : Math.max(0, Math.round((n * (100 + pct)) / 100 / 100) * 100);
        const patch = {
          priceGlass: adj(it.priceGlass),
          priceTokkuri: adj(it.priceTokkuri),
          priceBottle: adj(it.priceBottle),
        };
        await patchItem(it.id, patch);
      }
      setBusy(false);
      show(`${target.length}개 가격 ${pct > 0 ? "+" : ""}${pct}% 조정`);
      router.refresh();
      return;
    }
    if (kind === "unsoldout") {
      const sold = target.filter((it) => it.status === "soldout");
      if (sold.length === 0) return show("품절 메뉴가 없습니다");
      setBusy(true);
      for (const it of sold) await patchItem(it.id, { status: "selling" });
      setBusy(false);
      setItems((prev) =>
        prev.map((it) => (it.status === "soldout" && it.categoryKey === cat ? { ...it, status: "selling" } : it))
      );
      show(`${sold.length}개 품절 해제`);
      return;
    }
    if (kind === "untag") {
      if (!window.confirm(`${CATS.find((c) => c.key === cat)?.label} 전체의 태그(추천/NEW/♨/플래그)를 제거할까요?`))
        return;
      setBusy(true);
      for (const it of target)
        await patchItem(it.id, { badge: null, featured: false, heatable: false, flagNote: null });
      setBusy(false);
      show("태그 제거됨");
      router.refresh();
    }
  }

  return (
    <AdminFrame tab="menu">
      {/* 일괄 조정 */}
      <div className={f.card}>
        <div className={s.bulkHead}>
          <span className={s.bulkTitle}>일괄 조정</span>
          <span className={s.bulkScope}>
            적용 범위
            <span className={s.bulkScopeSel}>{CATS.find((c) => c.key === cat)?.label} 전체</span>
          </span>
        </div>
        <div className={s.bulkBtns}>
          <button className={s.bulkBtn} onClick={() => bulk("price")} disabled={busy}>
            가격 일괄 조정 %
          </button>
          <button className={s.bulkBtn} onClick={() => bulk("unsoldout")} disabled={busy}>
            품절 모두 해제
          </button>
          <button className={s.bulkBtn} onClick={() => bulk("untag")} disabled={busy}>
            태그 일괄 제거
          </button>
          <button className={s.bulkBtn} onClick={() => bulk("volume")} disabled={busy}>
            용량 일괄 변경 ㎖
          </button>
          <span className={s.bulkHint}>미리보기 후 적용</span>
        </div>
      </div>

      {/* 카테고리 + 새 메뉴 */}
      <div className={s.subtabs}>
        {CATS.map((c) => (
          <button
            key={c.key}
            className={`${s.subtab} ${c.key === cat ? s.subtabActive : ""}`}
            onClick={() => setCat(c.key)}
          >
            {c.label} {counts[c.key] ?? 0}
          </button>
        ))}
        <button className={s.newBtn} onClick={addItem} disabled={busy}>
          + 새 메뉴 추가
        </button>
      </div>
      <div className={s.listHint}>행을 끌어 순서 변경 · 가격은 칸에서 바로 수정</div>

      <DndContext id="dnd-menu" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          {rows.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              units={unitsFor(cat)}
              onPrice={onPrice}
              onToggle={onToggle}
              onEdit={(id) => router.push(`/admin/items/${id}`)}
              busy={busy}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button className={s.addFooter} onClick={addItem} disabled={busy}>
        + 새 메뉴 추가 (사진·설명·코멘트는 추가 후 수정 화면에서)
      </button>
      <div className={s.note}>모든 변경은 저장 즉시 손님 메뉴판에 반영됩니다</div>
      {node}
    </AdminFrame>
  );
}
