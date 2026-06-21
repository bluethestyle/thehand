"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import type { OriginRow } from "@/lib/types";
import { AdminFrame, useToast } from "./AdminFrame";
import f from "./admin-v2.module.css";
import s from "./origin-manager.module.css";

let uid = 0;
const newRow = (): OriginRow => ({
  id: `or-new-${uid++}-${Math.round(performance.now())}`,
  ingredient: "",
  origin: "",
  sortOrder: 0,
});

function Row({
  row,
  onChange,
  onDelete,
}: {
  row: OriginRow;
  onChange: (patch: Partial<OriginRow>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={s.row}>
      <span className={s.handle} {...attributes} {...listeners}>
        ≡
      </span>
      <div className={s.ing}>
        <input
          className={s.input}
          value={row.ingredient}
          placeholder="재료"
          onChange={(e) => onChange({ ingredient: e.target.value })}
        />
      </div>
      <div className={s.origin}>
        <input
          className={s.input}
          value={row.origin}
          placeholder="원산지"
          onChange={(e) => onChange({ origin: e.target.value })}
        />
      </div>
      <button className={s.quick} onClick={() => onChange({ origin: "국내산" })}>
        국내산
      </button>
      <button className={s.del} onClick={onDelete} aria-label="삭제">
        ×
      </button>
    </div>
  );
}

export function OriginManager({ origins }: { origins: OriginRow[] }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [rows, setRows] = useState<OriginRow[]>(
    origins.length ? origins.slice().sort((a, b) => a.sortOrder - b.sortOrder) : [newRow()]
  );
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const oldI = prev.findIndex((r) => r.id === active.id);
      const newI = prev.findIndex((r) => r.id === over.id);
      return arrayMove(prev, oldI, newI);
    });
  }

  function deleteRow(row: OriginRow) {
    if (row.required && !window.confirm(`‘${row.ingredient}’은(는) 법정 의무 표기 항목입니다. 삭제할까요?`))
      return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  async function save() {
    setBusy(true);
    const payload = rows.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    const res = await fetch("/api/admin/origins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origins: payload }),
    });
    setBusy(false);
    if (res.ok) {
      show("저장됨 — 손님 화면 반영");
      router.refresh();
    } else show((await res.json()).error ?? "저장 실패");
  }

  return (
    <AdminFrame tab="origins">
      <div className={f.pageHead}>
        <div>
          <div className={f.pageTitle}>원산지 표기</div>
          <div className={f.pageSub}>손님 메뉴판 맨 마지막 페이지에 표시됩니다 · 변경 즉시 반영</div>
        </div>
        <div className={f.pageActions}>
          <button className={f.btn} onClick={() => window.open("/", "_blank")}>
            미리보기
          </button>
          <button className={`${f.btn} ${f.btnPrimary}`} disabled={busy} onClick={save}>
            저장
          </button>
        </div>
      </div>

      <div className={f.card}>
        <div className={s.tableHead}>
          <span className={s.thHandle} />
          <span className={s.thIng}>재료</span>
          <span className={s.thOrigin}>원산지</span>
        </div>
        <DndContext id="dnd-origin" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                onChange={(patch) =>
                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)))
                }
                onDelete={() => deleteRow(row)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className={s.addLine}>
          <button className={s.addRow} onClick={() => setRows((prev) => [...prev, newRow()])}>
            + 행 추가
          </button>
          <span className={s.addHint}>행을 끌어 표시 순서 변경</span>
        </div>
      </div>

      <div className={f.card}>
        <div className={f.cardTitle}>하단 각주 문구</div>
        <input
          className={f.input}
          defaultValue="∗ 수급 상황에 따라 원산지가 변경될 수 있으며, 변경 시 즉시 수정 표기합니다 ∗"
          disabled
        />
        <div className={s.warn}>
          <span className={s.req}>법정 의무 표기</span> 항목(쌀·김치류·축산물 등)은 삭제 시 경고가 표시됩니다
        </div>
      </div>
      {node}
    </AdminFrame>
  );
}
